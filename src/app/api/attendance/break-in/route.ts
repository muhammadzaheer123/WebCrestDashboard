import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Attendance from "../../../../models/attendance.model";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { employeeId } = await request.json();

    // Validate input
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
        {
          success: false,
          error: "Please check in first before taking a break",
        },
        { status: 400 }
      );
    }

    const activeBreak = attendance.breaks.find(
      (breakRecord: any) => !breakRecord.breakOut
    );

    if (activeBreak) {
      return NextResponse.json(
        { success: false, error: "You are already on a break" },
        { status: 400 }
      );
    }

    attendance.breaks.push({
      breakIn: new Date(),
      breakOut: null,
      duration: 0,
    });

    await attendance.save();

    return NextResponse.json({
      success: true,
      message: "Break started successfully",
      data: {
        breakInTime: new Date(),
        employeeId,
      },
    });
  } catch (error: any) {
    console.error("Error starting break:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to start break",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
