import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { z, ZodError } from "zod";
import { connectDB } from "@/lib/db";
import { ensureOfficeGate } from "@/lib/ip";
import User from "@/models/user.model";

export const runtime = "nodejs";

export const RoleEnum = z.enum(["admin", "hr"]);
export type Role = z.infer<typeof RoleEnum>;

export const SignupSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: RoleEnum,
  invite: z.string().optional(),
});

const MAX_AGE = 60 * 60 * 8; // 8 hours

export async function POST(req: NextRequest) {
  try {
    // Office gate
    const gate = ensureOfficeGate(req.headers);
    if (!gate.ok) {
      return NextResponse.json(
        {
          message: "Access restricted",
          details: "Signup is only available from the office network",
          ip: gate.ip,
          reason: gate.reason,
        },
        { status: 403 }
      );
    }

    // Validate body
    const body = await req.json();
    const parsed = SignupSchema.parse(body);

    const name = parsed.name.trim();
    const email = parsed.email.toLowerCase().trim();
    const password = parsed.password;
    const role = parsed.role; // already "admin" | "hr" from z.enum
    const invite = parsed.invite;

    // Optional invite code enforcement
    const INVITE_KEY = process.env.ADMIN_HR_INVITE_KEY;
    if (INVITE_KEY && invite !== INVITE_KEY) {
      return NextResponse.json(
        { message: "Invalid or missing invite code" },
        { status: 403 }
      );
    }

    await connectDB();

    // Duplicate check
    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 409 }
      );
    }

    // Create user (pre('save') will hash password)
    const user = await User.create({ name, email, password, role });

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      return NextResponse.json(
        { message: "Server configuration error" },
        { status: 500 }
      );
    }

    const userId = String(user._id ?? user.id);
    const token = jwt.sign(
      { sub: userId, email: user.email ?? "", name: user.name ?? "", role },
      JWT_SECRET,
      { expiresIn: MAX_AGE }
    );

    const res = NextResponse.json(
      {
        ok: true,
        user: {
          id: userId,
          name: user.name ?? "",
          email: user.email ?? "",
          role,
        },
        message: "Registration successful",
      },
      { status: 201 }
    );

    res.cookies.set("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: MAX_AGE,
    });

    return res;
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: err.issues.map((i) => ({
            field: i.path.join(".") || "unknown",
            message: i.message,
          })),
        },
        { status: 400 }
      );
    }

    if ((err as any)?.code === 11000) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 409 }
      );
    }

    console.error("❌ Signup error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
