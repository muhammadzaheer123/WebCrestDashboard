import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { z, ZodError } from "zod";
import { connectDB } from "@/lib/db";
import Employee from "@/models/Employee";

export const runtime = "nodejs";

const RoleEnum = z.enum(["admin", "hr"]);

const SignupSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: RoleEnum,
});

const MAX_AGE = 60 * 60 * 8;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, role } = SignupSchema.parse(body);

    const normalizedEmail = email.toLowerCase().trim();

    await connectDB();

    const existing = await Employee.findOne({ email: normalizedEmail });

    if (existing) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 409 },
      );
    }

    const user = await Employee.create({
      employeeId: `ADM${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      password,
      role,
      phone: "0000000000",
      department: "Administration",
      designation: role === "admin" ? "Administrator" : "HR Manager",
      shift: "Morning",
      qrCode: `QR_ADMIN_${Date.now()}`,
      isActive: true,
    });

    const JWT_SECRET = process.env.JWT_SECRET;

    if (!JWT_SECRET) {
      return NextResponse.json(
        { message: "Server configuration error" },
        { status: 500 },
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
      {
        expiresIn: MAX_AGE,
        algorithm: "HS256",
      },
    );

    const res = NextResponse.json(
      {
        ok: true,
        message: "Registration successful",
        user: {
          id: userId,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 },
    );

    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
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
        { status: 400 },
      );
    }

    if ((err as any)?.code === 11000) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 409 },
      );
    }

    console.error("Signup error:", err);

    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
