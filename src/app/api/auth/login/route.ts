import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { z, ZodError } from "zod";
import { connectDB } from "@/lib/db";
import User from "@/models/user.model";
import { ensureOfficeGate } from "@/lib/ip";

export const runtime = "nodejs";

const LoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

const ALLOWED_ROLES = ["admin", "hr"];

const MAX_AGE = 60 * 60 * 8;

export async function POST(req: Request) {
  try {
    const gate = ensureOfficeGate(req.headers);
    if (!gate.ok) {
      return NextResponse.json(
        {
          message: "Access restricted",
          details: "Login is only available from the office network",
          ip: gate.ip,
          reason: gate.reason,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { email, password } = LoginSchema.parse(body);

    await connectDB();

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("+password +role");
    if (!user) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (!ALLOWED_ROLES.includes(user.role)) {
      return NextResponse.json(
        {
          message: "Access denied",
          details: "Dashboard access is restricted to Admin and HR staff only",
        },
        { status: 403 }
      );
    }

    const ok = await user.comparePassword(password);
    if (!ok) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      return NextResponse.json(
        { message: "Server configuration error" },
        { status: 500 }
      );
    }

    const userId = String(user._id ?? user.id);

    const token = jwt.sign(
      {
        sub: userId,
        email: user.email ?? "",
        name: user.name ?? "",
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: MAX_AGE } // seconds
    );

    const res = NextResponse.json({
      ok: true,
      user: {
        id: userId,
        name: user.name ?? "",
        email: user.email ?? "",
        role: user.role,
      },
      token,
      message: "Login successful",
    });

    res.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: MAX_AGE,
    });

    if (process.env.NODE_ENV !== "production") {
      res.headers.set("x-dev-token", token);
    }

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
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
