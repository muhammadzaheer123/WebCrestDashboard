import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Attendance from "@/models/attendance.model";
import Employee from "@/models/Employee";
import { getUserFromToken } from "@/lib/middlewares/auth";

export const runtime = "nodejs";

type ManualBreakInput = {
  breakIn: string;
  breakOut?: string;
};

function getStartOfDay(input: string | Date) {
  const day = new Date(input);
  day.setHours(0, 0, 0, 0);
  return day;
}

function combineDateAndTime(date: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new Error(`Invalid time value: ${time}`);
  }

  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

function normalizeRange(start: Date, end?: Date) {
  if (!end) return { start, end };

  let normalizedEnd = new Date(end);

  if (normalizedEnd <= start) {
    normalizedEnd.setDate(normalizedEnd.getDate() + 1);
  }

  return {
    start,
    end: normalizedEnd,
  };
}

function calculateBreaks(
  day: Date,
  breaks: ManualBreakInput[] = [],
): {
  normalizedBreaks: { breakIn: Date; breakOut?: Date; duration?: number }[];
  totalBreakMinutes: number;
  hasActiveBreak: boolean;
} {
  let totalBreakMinutes = 0;

  const normalizedBreaks = (breaks || []).map((item) => {
    const breakIn = combineDateAndTime(day, item.breakIn);

    let breakOut: Date | undefined;
    let duration = 0;

    if (item.breakOut) {
      const rawBreakOut = combineDateAndTime(day, item.breakOut);
      const normalized = normalizeRange(breakIn, rawBreakOut);
      breakOut = normalized.end;

      duration = Math.round(
        ((breakOut?.getTime() || 0) - breakIn.getTime()) / 60000,
      );

      totalBreakMinutes += duration;
    }

    return {
      breakIn,
      breakOut,
      duration,
    };
  });

  const hasActiveBreak = normalizedBreaks.some((b) => !b.breakOut);

  return {
    normalizedBreaks,
    totalBreakMinutes,
    hasActiveBreak,
  };
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 },
      );
    }

    if (!["admin", "hr"].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    await connectDB();

    const body = await request.json();

    const {
      employeeId,
      date,
      checkIn,
      checkOut,
      breaks = [],
      status = "present",
    } = body as {
      employeeId?: string;
      date?: string;
      checkIn?: string;
      checkOut?: string;
      breaks?: ManualBreakInput[];
      status?: "present" | "half-day" | "on-break";
    };

    if (!employeeId || !date || !checkIn) {
      return NextResponse.json(
        {
          success: false,
          error: "employeeId, date and checkIn are required",
        },
        { status: 400 },
      );
    }

    if (!["present", "half-day", "on-break"].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: "status must be present, half-day, or on-break",
        },
        { status: 400 },
      );
    }

    const employee = await Employee.findById(employeeId).select(
      "_id name email isActive",
    );

    if (!employee) {
      return NextResponse.json(
        { success: false, error: "Employee not found" },
        { status: 404 },
      );
    }

    if (employee.isActive === false) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot mark attendance for inactive employee",
        },
        { status: 400 },
      );
    }

    const attendanceDate = getStartOfDay(date);

    if (Number.isNaN(attendanceDate.getTime())) {
      return NextResponse.json(
        { success: false, error: "Invalid date" },
        { status: 400 },
      );
    }

    let checkInDate: Date;
    let adjustedCheckOut: Date | undefined;

    try {
      checkInDate = combineDateAndTime(attendanceDate, checkIn);

      if (checkOut) {
        const rawCheckOut = combineDateAndTime(attendanceDate, checkOut);
        adjustedCheckOut = normalizeRange(checkInDate, rawCheckOut).end;
      }
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || "Invalid time value" },
        { status: 400 },
      );
    }

    let breakData;
    try {
      breakData = calculateBreaks(attendanceDate, breaks);
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || "Invalid break timings" },
        { status: 400 },
      );
    }

    const { normalizedBreaks, totalBreakMinutes, hasActiveBreak } = breakData;

    const grossMinutes = adjustedCheckOut
      ? Math.max(
          0,
          Math.round(
            (adjustedCheckOut.getTime() - checkInDate.getTime()) / 60000,
          ),
        )
      : 0;

    const totalWorkMinutes = adjustedCheckOut
      ? Math.max(0, grossMinutes - totalBreakMinutes)
      : 0;

    const totalHours = Number((grossMinutes / 60).toFixed(2));
    const totalWorkHours = Number((totalWorkMinutes / 60).toFixed(2));

    const finalStatus =
      hasActiveBreak && !adjustedCheckOut ? "on-break" : status;

    const existingAttendance = await Attendance.findOne({
      employeeId: String(employeeId),
      date: {
        $gte: attendanceDate,
        $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    if (existingAttendance) {
      existingAttendance.checkIn = checkInDate;
      existingAttendance.checkOut = adjustedCheckOut;
      existingAttendance.breaks = normalizedBreaks;
      existingAttendance.status = finalStatus;
      existingAttendance.totalBreakTime = totalBreakMinutes;
      existingAttendance.totalHours = totalHours;
      existingAttendance.totalWorkHours = totalWorkHours;
      existingAttendance.source = "manual";
      existingAttendance.updatedBy = String(user.id);

      await existingAttendance.save();

      return NextResponse.json({
        success: true,
        message: "Manual attendance updated successfully",
        data: existingAttendance,
      });
    }

    const attendance = await Attendance.create({
      employeeId: String(employeeId),
      date: attendanceDate,
      checkIn: checkInDate,
      checkOut: adjustedCheckOut,
      breaks: normalizedBreaks,
      status: finalStatus,
      totalBreakTime: totalBreakMinutes,
      totalHours,
      totalWorkHours,
      source: "manual",
      updatedBy: String(user.id),
    });

    return NextResponse.json({
      success: true,
      message: "Manual attendance created successfully",
      data: attendance,
    });
  } catch (error: any) {
    console.error("Error creating manual attendance:", error);

    if (error?.name === "ValidationError") {
      const errors = Object.values(error.errors || {}).map(
        (err: any) => err.message,
      );

      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: errors,
        },
        { status: 400 },
      );
    }

    if (error?.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: "Attendance record already exists for this employee and date",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create manual attendance",
        details: error?.message || "Unknown server error",
      },
      { status: 500 },
    );
  }
}
