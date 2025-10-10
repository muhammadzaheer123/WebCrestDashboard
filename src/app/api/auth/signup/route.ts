import { NextResponse } from "next/server";
import type { NextRequest } from "next/server"; // ✅ type-only
import jwt from "jsonwebtoken";
import { z, ZodError } from "zod";
import { connectDB } from "@/lib/db";
import { getClientIp, isOfficeNetwork } from "@/lib/ip-utils";
import User from "@/models/user.model";

export const runtime = "nodejs";

const SignupSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must be less than 50 characters")
      .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),
    email: z.string().email("Invalid email address").min(5).max(255),
    password: z.string().min(6).max(100),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const allowed = isOfficeNetwork(clientIp);
    console.log("Signup IP check:", { clientIp, allowed });

    if (!allowed) {
      return NextResponse.json(
        { message: "Access restricted to office network" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, email, password } = SignupSchema.parse(body);

    await connectDB();

    const normalizedEmail = email.trim().toLowerCase();
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 }
      );
    }

    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password,
    });
    await user.save();

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error("❌ JWT_SECRET not configured");
      return NextResponse.json(
        { message: "Server configuration error" },
        { status: 500 }
      );
    }

    const userId = user.id;

    const token = jwt.sign(
      {
        sub: userId,
        email: user.email ?? "",
        name: user.name ?? "",
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return NextResponse.json(
      {
        token,
        user: {
          id: userId,
          name: user.name,
          email: user.email,
        },
        message: "Registration successful",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Signup error:", err);

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
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: "Server error",
        ...(process.env.NODE_ENV !== "production" && {
          error: err instanceof Error ? err.message : String(err),
        }),
      },
      { status: 500 }
    );
  }
}
