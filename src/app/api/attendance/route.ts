import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import Attendance from "../../../models/attendance.model";
import mongoose from "mongoose";

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

    if (employeeId && mongoose.Types.ObjectId.isValid(employeeId)) {
      filter.employeeId = new mongoose.Types.ObjectId(employeeId);
    }

    if (status) filter.status = status;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const records = await Attendance.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Attendance.countDocuments(filter);

    const recordsWithStats = records.map((record: any) => {
      const breaks = record.breaks || [];

      let totalHours = 0;
      if (record.checkIn && record.checkOut) {
        totalHours =
          (record.checkOut.getTime() - record.checkIn.getTime()) /
          (1000 * 60 * 60);
      }

      const totalBreakDuration = breaks.reduce(
        (t: number, b: any) => t + (b.duration || 0),
        0,
      );

      const overtime = totalHours > 8 ? totalHours - 8 : 0;

      return {
        ...record.toObject(),
        totalHours: Number(totalHours.toFixed(2)),
        totalBreakDuration,
        overtime: Number(overtime.toFixed(2)),
        netWorkingHours: Number(
          (totalHours - totalBreakDuration / 60).toFixed(2),
        ),
      };
    });

    return NextResponse.json({
      success: true,
      data: recordsWithStats,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching attendance records:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch attendance records",
      },
      { status: 500 },
    );
  }
}
