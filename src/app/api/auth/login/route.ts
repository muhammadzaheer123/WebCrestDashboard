import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z, ZodError } from "zod";
import { connectDB } from "@/lib/db";
import User from "@/models/user.model";

export const runtime = "nodejs";

const LoginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

const MAX_AGE = 60 * 60 * 8;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = LoginSchema.parse(body);

    const normalizedEmail = email.toLowerCase().trim();

    await connectDB();

    // IMPORTANT: if password is select:false in schema, you MUST select it
    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password +role +name +email",
    );

    if (!user || !user.password) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 },
      );
    }

    console.log("LOGIN:", {
      email: normalizedEmail,
      hasUser: !!user,
      hasPasswordField: !!user?.password,
      role: user?.role,
    });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 },
      );
    }

    // role gate
    if (user.role !== "admin" && user.role !== "hr") {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

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
      { expiresIn: MAX_AGE },
    );

    const res = NextResponse.json(
      {
        ok: true,
        user: {
          id: userId,
          name: user.name ?? "",
          email: user.email ?? "",
          role: user.role,
        },
        message: "Login successful",
      },
      { status: 200 },
    );

    // IMPORTANT: secure true breaks cookies on localhost
    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: MAX_AGE,
    });

    res.headers.set("Cache-Control", "no-store");

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

    console.error("Login error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
