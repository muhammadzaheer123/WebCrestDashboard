import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import Attendance from "../../../models/attendance.model";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const employeeId = searchParams.get("employeeId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const filter: any = {};

    if (employeeId) {
      filter.employeeId = employeeId;
    }

    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.date.$lte = new Date(endDate);
      }
    }

    const skip = (page - 1) * limit;

    const attendanceRecords = await Attendance.find(filter)
      .select("-__v")
      .sort({ date: -1, checkIn: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Attendance.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    const recordsWithStats = attendanceRecords.map((record: any) => {
      let totalHours = 0;
      if (record.checkIn && record.checkOut) {
        totalHours =
          (record.checkOut.getTime() - record.checkIn.getTime()) /
          (1000 * 60 * 60);
        totalHours = Math.round(totalHours * 100) / 100;
      }

      const totalBreakDuration = record.breaks.reduce(
        (total: number, breakRecord: any) =>
          total + (breakRecord.duration || 0),
        0
      );

      const overtime = totalHours > 8 ? totalHours - 8 : 0;

      return {
        ...record.toObject(),
        totalHours,
        totalBreakDuration,
        overtime: Math.round(overtime * 100) / 100,
        netWorkingHours:
          Math.round((totalHours - totalBreakDuration / 60) * 100) / 100,
      };
    });

    return NextResponse.json({
      success: true,
      message: "Attendance records fetched successfully",
      data: {
        records: recordsWithStats,
        pagination: {
          currentPage: page,
          totalPages,
          totalRecords: total,
          hasNext: page < totalPages,
          hasPrev: page > 1,
          limit,
        },
        filters: {
          employeeId,
          startDate,
          endDate,
          status,
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching attendance records:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch attendance records",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
