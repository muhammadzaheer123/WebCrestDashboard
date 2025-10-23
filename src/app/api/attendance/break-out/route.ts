import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../lib/db";
import Attendance from "../../../../models/attendance.model";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { employeeId } = await request.json();

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: "Employee ID is required" },
        { status: 400 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({
      employeeId: employeeId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    if (!attendance) {
      return NextResponse.json(
        { success: false, error: "No attendance record found for today" },
        { status: 400 }
      );
    }

    const activeBreakIndex = attendance.breaks.findIndex(
      (breakRecord: any) => !breakRecord.breakOut
    );

    if (activeBreakIndex === -1) {
      return NextResponse.json(
        { success: false, error: "No active break found to end" },
        { status: 400 }
      );
    }

    const breakOutTime = new Date();
    const breakInTime = attendance.breaks[activeBreakIndex].breakIn;
    const breakDuration = Math.round(
      (breakOutTime.getTime() - breakInTime.getTime()) / (1000 * 60)
    ); // in minutes

    attendance.breaks[activeBreakIndex].breakOut = breakOutTime;
    attendance.breaks[activeBreakIndex].duration = breakDuration;

    attendance.status = "present";

    await attendance.save();

    return NextResponse.json({
      success: true,
      message: "Break ended successfully",
      data: {
        breakOutTime,
        breakDuration: `${breakDuration} minutes`,
        employeeId,
      },
    });
  } catch (error: any) {
    console.error("Error ending break:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to end break",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
