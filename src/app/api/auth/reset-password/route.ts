import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { z, ZodError } from "zod";
import { sendResetEmail } from "@/lib/mailer";

export const runtime = "nodejs";

/** ----- Schemas ----- */
const RequestSchema = z.object({
  action: z.literal("request"),
  email: z.string().email("Invalid email address"),
});

const DoResetSchema = z
  .object({
    action: z.literal("reset"),
    token: z.string().min(1, "Token is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const BodySchema = z.union([RequestSchema, DoResetSchema]);

/** ----- Utils ----- */
function getResetSecret(): string {
  const secret = process.env.RESET_JWT_SECRET ?? process.env.JWT_SECRET;
  if (!secret) throw new Error("RESET_JWT_SECRET/JWT_SECRET not configured");
  return secret;
}

async function readJson(req: NextRequest) {
  const ct = req.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    return NextResponse.json(
      { message: "Unsupported Content-Type (use application/json)" },
      { status: 415 }
    );
  }
  try {
    return await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const parsed = await readJson(req);
    if (parsed instanceof NextResponse) return parsed;
    const data = BodySchema.parse(parsed);

    const { connectDB } = await import("@/lib/db");
    const User = await import("@/models/user.model").then((m) => m.default);
    await connectDB();

    if (data.action === "request") {
      const email = data.email.toLowerCase().trim();
      const user = await User.findOne({ email });

      const genericOk = (extra?: Record<string, unknown>) =>
        NextResponse.json({
          message: "If the email exists, a reset link has been sent",
          ...(extra ?? {}),
        });

      if (!user) return genericOk();

      const resetToken = jwt.sign(
        {
          sub: user.id,
          email: user.email,
          purpose: "password_reset",
        },
        getResetSecret(),
        { expiresIn: "1h" }
      );

      const appUrl = process.env.APP_URL ?? "http://localhost:3000";
      const resetLink = `${appUrl}/reset-password?token=${encodeURIComponent(
        resetToken
      )}`;

      try {
        const { success, messageId, error } = await sendResetEmail(
          user.email,
          resetLink
        );

        if (process.env.NODE_ENV !== "production") {
          return NextResponse.json({
            message: "If the email exists, a reset link has been sent",
            emailSent: success,
            messageId,
            error, // 👈 see why it failed in dev
            resetLink, // 👈 helpful for manual testing
          });
        }
      } catch (mailErr) {
        console.error("sendResetEmail error (unexpected):", mailErr);
        if (process.env.NODE_ENV !== "production") {
          return NextResponse.json({
            message: "If the email exists, a reset link has been sent",
            emailSent: false,
            error: String(mailErr),
            resetLink,
          });
        }
      }
      return genericOk();
    }

    // 4) Perform the reset
    const { token, password } = data;

    let decoded: any;
    try {
      decoded = jwt.verify(token, getResetSecret());
    } catch {
      return NextResponse.json(
        { message: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    if (decoded?.purpose !== "password_reset" || !decoded?.sub) {
      return NextResponse.json(
        { message: "Invalid reset token" },
        { status: 400 }
      );
    }

    const user = await User.findById(decoded.sub);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    user.password = password;
    await user.save();

    return NextResponse.json({ message: "Password reset successfully" });
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

    console.error("reset-password error:", err);
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
