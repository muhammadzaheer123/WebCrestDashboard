import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Attendance from "@/models/attendance.model";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function GET() {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
    const employeeId =
      decoded?.sub ?? decoded?.userId ?? decoded?.id ?? decoded?._id;

    if (!employeeId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const records = await Attendance.find({
      employeeId: String(employeeId),
      date: { $gte: last30Days },
    }).sort({ date: -1 });

    return NextResponse.json({
      success: true,
      data: records,
    });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
