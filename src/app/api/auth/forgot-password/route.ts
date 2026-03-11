import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { sendResetEmail } from "@/lib/mailer";
import Employee from "@/models/Employee";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  await connectDB();

  const user = await Employee.findOne({ email }).select(
    "+resetOtp +resetOtpExpire",
  );

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  user.resetOtp = otp.trim();
  user.resetOtpExpire = Date.now() + 10 * 60 * 1000;
  await user.save();

  await sendResetEmail(email, otp);

  return NextResponse.json({ message: "OTP sent to email" });
}
