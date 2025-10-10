import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { z, ZodError } from "zod";
import { connectDB } from "@/lib/db";
import User from "@/models/user.model";
import { getClientIp, isIpAllowed } from "@/lib/clientIp";

export const runtime = "nodejs";

const ALLOW = (process.env.ALLOWED_IPS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const LoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    console.log("🔐 Login attempt from IP:", ip);

    if (!isIpAllowed(ip, ALLOW)) {
      console.log("🚫 Office network access denied for IP:", ip);
      return NextResponse.json(
        {
          message: "Access restricted",
          details: "Login is only available from office network",
          ip,
        },
        { status: 403 }
      );
    }

    console.log("✅ Office network access granted for IP:", ip);

    const body = await req.json();
    const { email, password } = LoginSchema.parse(body);

    await connectDB();

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("+password");

    if (!user) {
      console.log("❌ User not found:", email);
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log("❌ Invalid password for user:", email);
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error("❌ JWT_SECRET not configured");
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
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return NextResponse.json({
      token,
      user: {
        id: userId,
        name: user.name ?? "",
        email: user.email ?? "",
      },
      message: "Login successful",
    });
  } catch (err) {
    if (err instanceof ZodError) {
      console.log("❌ Validation error:", err.issues);
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

    console.error("❌ Login error:", err);
    return NextResponse.json(
      {
        message: "Server error",
        ...(process.env.NODE_ENV === "development" && {
          error: err instanceof Error ? err.message : "Unknown error",
        }),
      },
      { status: 500 }
    );
  }
}
