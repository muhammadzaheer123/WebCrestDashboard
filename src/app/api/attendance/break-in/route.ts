import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Attendance from "@/models/attendance.model";
import { getUserFromToken } from "@/lib/middlewares/auth";

const AttendanceModel = Attendance;

export async function POST() {
  try {
    await connectDB();

    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await AttendanceModel.findOne({
      employeeId: user.id,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 86400000),
      },
    });

    if (!attendance) {
      return NextResponse.json(
        { error: "No attendance record found" },
        { status: 400 },
      );
    }

    if (!attendance.checkIn || attendance.checkOut) {
      return NextResponse.json(
        { error: "You must check in first" },
        { status: 400 },
      );
    }

    if (!attendance.breaks) attendance.breaks = [];

    const activeBreak = attendance.breaks.find((b: any) => !b.breakOut);

    if (activeBreak) {
      return NextResponse.json(
        { error: "Break already active" },
        { status: 400 },
      );
    }

    attendance.breaks.push({
      breakIn: new Date(),
    });

    await attendance.save();

    return NextResponse.json({
      success: true,
      message: "Break started",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to start break" },
      { status: 500 },
    );
  }
}
