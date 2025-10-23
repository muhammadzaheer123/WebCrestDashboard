import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../lib/db";
import Attendance from "../../../../models/attendance.model";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: "Employee ID is required" },
        { status: 400 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employeeId: employeeId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    if (!attendance) {
      return NextResponse.json({
        success: true,
        message: "No attendance record found for today",
        data: {
          status: "Not Checked In",
          checkInTime: null,
          checkOutTime: null,
          totalHours: 0,
          breakDuration: 0,
          breaks: [],
          overtime: 0,
        },
      });
    }

    let totalHours = 0;
    if (attendance.checkIn && attendance.checkOut) {
      totalHours =
        (attendance.checkOut.getTime() - attendance.checkIn.getTime()) /
        (1000 * 60 * 60);
      totalHours = Math.round(totalHours * 100) / 100;
    }

    const totalBreakDuration = attendance.breaks.reduce(
      (total: number, breakRecord: any) => total + (breakRecord.duration || 0),
      0
    );

    const overtime = totalHours > 8 ? totalHours - 8 : 0;

    let currentStatus = "Checked Out";
    if (attendance.checkIn && !attendance.checkOut) {
      currentStatus = "Checked In";

      const activeBreak = attendance.breaks.find(
        (breakRecord: any) => !breakRecord.breakOut
      );
      if (activeBreak) {
        currentStatus = "On Break";
      }
    }

    return NextResponse.json({
      success: true,
      message: "Today's attendance fetched successfully",
      data: {
        status: currentStatus,
        checkInTime: attendance.checkIn,
        checkOutTime: attendance.checkOut,
        totalHours,
        breakDuration: totalBreakDuration,
        breaks: attendance.breaks,
        overtime: Math.round(overtime * 100) / 100,
        netWorkingHours:
          Math.round((totalHours - totalBreakDuration / 60) * 100) / 100,
      },
    });
  } catch (error: any) {
    console.error("Error fetching today's attendance:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch today's attendance",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
