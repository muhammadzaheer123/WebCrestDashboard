import { NextResponse, type NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { z, ZodError } from "zod";
import { connectDB } from "@/lib/db";
// import { ensureOfficeGate } from "@/lib/ip";
import User from "@/models/user.model";
import { RoleEnum } from "../signup/route";

export const runtime = "nodejs";

const LoginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

const MAX_AGE = 60 * 60 * 8; // 8 hours
const ALLOWED_ROLES = RoleEnum.options; // ["admin", "hr"]

// small delay to reduce timing attacks (user enumeration)
const softDelay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: NextRequest) {
  try {
    // const gate = ensureOfficeGate(req.headers);
    // if (!gate.ok) {
    //   return NextResponse.json(
    //     {
    //       message: "Access restricted",
    //       details: "Login is only available from the office network",
    //       ip: gate.ip,
    //       reason: gate.reason,
    //     },
    //     { status: 403 }
    //   );
    // }

    // Parse and validate body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { email, password } = LoginSchema.parse(body);
    const normalizedEmail = email.toLowerCase().trim();

    // DB connect
    await connectDB();

    // Fetch user with password + role
    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password +role +name +email"
    );
    if (!user) {
      await softDelay(); // preserve similar timing for invalid creds
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Role gate (admin/hr only)
    if (!ALLOWED_ROLES.includes(user.role)) {
      await softDelay(); // keep timing similar
      return NextResponse.json(
        {
          message: "Access denied",
          details: "Dashboard access is restricted to Admin and HR staff only",
        },
        { status: 403 }
      );
    }

    // Compare password (your User model should expose comparePassword)
    let ok = false;
    try {
      ok = await user.comparePassword(password);
    } catch (e) {
      // fallback to generic invalid creds on compare errors
      await softDelay();
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (!ok) {
      await softDelay();
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

    // Create JWT
    let token: string;
    try {
      token = jwt.sign(
        {
          sub: userId,
          email: user.email ?? "",
          name: user.name ?? "",
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: MAX_AGE } // seconds
      );
    } catch {
      return NextResponse.json(
        { message: "Server error while creating token" },
        { status: 500 }
      );
    }

    // Build response
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
      { status: 200 }
    );

    // Important: use the SAME cookie key as your signup route ("token")
    res.cookies.set("token", token, {
      httpOnly: true,
      secure: true, // keep like your signup route (always secure)
      sameSite: "lax",
      path: "/",
      maxAge: MAX_AGE,
    });

    // Optional: dev convenience header (comment if you don't want it)
    if (process.env.NODE_ENV !== "production") {
      res.headers.set("x-dev-token", token);
    }

    // No-cache headers are generally good for auth endpoints
    res.headers.set("Cache-Control", "no-store");
    res.headers.set("Pragma", "no-cache");

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

    // Handle Mongo duplicate key, just in case (not typical for login)
    if ((err as any)?.code === 11000) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 409 }
      );
    }

    console.error("❌ Login error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
