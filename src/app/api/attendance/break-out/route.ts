import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Attendance from "@/models/attendance.model";
import { getUserFromToken } from "@/lib/middlewares/auth";

export async function POST() {
  try {
    await connectDB();

    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employeeId: user.id,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 86400000),
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

    activeBreak.duration = Math.round(
      (activeBreak.breakOut.getTime() - activeBreak.breakIn.getTime()) / 60000,
    );

    await attendance.save();

    return NextResponse.json({
      success: true,
      message: "Break ended",
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to end break" }, { status: 500 });
  }
}
