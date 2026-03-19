import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Attendance from "@/models/attendance.model";
import { getUserFromToken } from "@/lib/middlewares/auth";

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
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { start, end } = getDayRange();

    const attendance = await Attendance.findOne({
      employeeId: String(user.id),
      date: {
        $gte: start,
        $lt: end,
      },
    });

    if (!attendance) {
      return NextResponse.json(
        { error: "No attendance found" },
        { status: 400 },
      );
    }

    if (!attendance.checkIn || attendance.checkOut) {
      return NextResponse.json(
        { error: "You must check in first" },
        { status: 400 },
      );
    }

    const activeBreak = attendance.breaks.find((b: any) => !b.breakOut);

    if (!activeBreak) {
      return NextResponse.json({ error: "No active break" }, { status: 400 });
    }

    activeBreak.breakOut = new Date();

    const breakMinutes = Math.round(
      (activeBreak.breakOut.getTime() - activeBreak.breakIn.getTime()) / 60000,
    );

    activeBreak.duration = breakMinutes;

    const totalBreakMinutes = (attendance.breaks || []).reduce(
      (sum: number, b: any) => {
        return sum + (typeof b.duration === "number" ? b.duration : 0);
      },
      0,
    );

    attendance.totalBreakTime = totalBreakMinutes;
    attendance.status = "present";

    await attendance.save();

    return NextResponse.json({
      success: true,
      message: "Break ended",
      breakMinutes,
      totalBreakMinutes,
    });
  } catch {
    return NextResponse.json({ error: "Failed to end break" }, { status: 500 });
  }
}
