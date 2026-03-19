import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Attendance from "@/models/attendance.model";
import { getUserFromToken } from "@/lib/middlewares/auth";

const AttendanceModel = Attendance;

function getDayRange(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

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

    const { start, end } = getDayRange();

    const attendance = await AttendanceModel.findOne({
      employeeId: String(user.id),
      date: {
        $gte: start,
        $lt: end,
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
      duration: 0,
    });

    attendance.status = "on-break";

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
