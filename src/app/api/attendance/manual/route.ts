import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../lib/db";
import Attendance from "../../../../models/attendance.model";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    const { employeeId, date, checkIn, checkOut, breaks, status } = body;

    if (!employeeId || !date) {
      return NextResponse.json(
        {
          success: false,
          error: "Employee ID and Date are required",
        },
        { status: 400 }
      );
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({
      employeeId: employeeId,
      date: {
        $gte: attendanceDate,
        $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    if (attendance) {
      if (checkIn) attendance.checkIn = new Date(checkIn);
      if (checkOut) attendance.checkOut = new Date(checkOut);
      if (breaks) attendance.breaks = breaks;
      if (status) attendance.status = status;
    } else {
      attendance = new Attendance({
        employeeId,
        date: attendanceDate,
        checkIn: checkIn ? new Date(checkIn) : new Date(),
        checkOut: checkOut ? new Date(checkOut) : undefined,
        breaks: breaks || [],
        status: status || "present",
      });
    }

    await attendance.save();

    return NextResponse.json({
      success: true,
      message: attendance.isNew
        ? "Manual attendance created successfully"
        : "Manual attendance updated successfully",
      data: attendance,
    });
  } catch (error: any) {
    console.error("Error creating manual attendance:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create manual attendance",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
