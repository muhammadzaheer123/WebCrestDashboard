import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { z, ZodError } from "zod";
import { connectDB } from "@/lib/db";
import Employee from "@/models/Employee";

export const runtime = "nodejs";

const RoleEnum = z.enum(["admin", "hr"]);
const EmploymentTypeEnum = z.enum(["full-time", "part-time"]);

const SignupSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: RoleEnum,
  salary: z.coerce.number().min(0, "Salary must be 0 or greater"),
  employmentType: EmploymentTypeEnum,
});

const MAX_AGE = 60 * 60 * 8;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Signup request body:", body);

    const parsed = SignupSchema.parse(body);
    console.log("Parsed signup data:", parsed);

    const { name, email, password, role, salary, employmentType } = parsed;

    const normalizedEmail = email.toLowerCase().trim();

    await connectDB();

    const existing = await Employee.findOne({ email: normalizedEmail });

    if (existing) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 409 },
      );
    }

    const createPayload = {
      employeeId: `ADM${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      password,
      role,
      salary,
      employmentType,
      phone: "0000000000",
      department: "Administration",
      designation: role === "admin" ? "Administrator" : "HR Manager",
      shift: "Morning",
      qrCode: `QR_ADMIN_${Date.now()}`,
      isActive: true,
    };

    console.log("Employee create payload:", createPayload);

    const user = await Employee.create(createPayload);

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
          salary: user.salary,
          employmentType: user.employmentType,
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
    console.log("Signup route error:", err);

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

    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
