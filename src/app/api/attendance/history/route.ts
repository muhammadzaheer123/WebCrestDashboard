import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Attendance from "@/models/attendance.model";
import { getUserFromToken } from "@/lib/middlewares/auth";

export async function GET() {
  try {
    await connectDB();

    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const records = await Attendance.find({
      employeeId: user.id,
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
