import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import Employee from "@/models/Employee";

export async function POST(req: NextRequest) {
  const { email, otp, password } = await req.json();

  await connectDB();

  const user = await Employee.findOne({ email });

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  if (String(user.resetOtp).trim() !== String(otp).trim()) {
    return NextResponse.json({ message: "Invalid OTP" }, { status: 400 });
  }

  if (user.resetOtpExpire < Date.now()) {
    return NextResponse.json({ message: "OTP expired" }, { status: 400 });
  }

  user.password = await bcrypt.hash(password, 10);
  user.resetOtp = undefined;
  user.resetOtpExpire = undefined;

  await user.save();

  return NextResponse.json({
    message: "Password updated successfully",
  });
}
