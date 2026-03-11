import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Attendance from "@/models/attendance.model";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import mongoose from "mongoose";
import { ymd } from "@/lib/dates";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    const employeeId =
      decoded?.sub ?? decoded?.userId ?? decoded?.id ?? decoded?._id;

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: "Employee ID missing in token" },
        { status: 400 },
      );
    }

    const employeeObjectId = new mongoose.Types.ObjectId(employeeId);

    const today = ymd(); // "2026-03-05"

    const attendance = await Attendance.findOne({
      employeeId: employeeObjectId,
      date: today,
    });

    if (!attendance) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    const breaks = attendance.breaks || [];

    // calculate break duration
    let totalBreakDuration = 0;

    breaks.forEach((b: any) => {
      if (b.breakIn && b.breakOut) {
        totalBreakDuration +=
          new Date(b.breakOut).getTime() - new Date(b.breakIn).getTime();
      }
    });

    // convert break ms to hours
    const breakHours = totalBreakDuration / (1000 * 60 * 60);

    // calculate work hours
    let totalHours = 0;

    if (attendance.checkIn && attendance.checkOut) {
      const workMs =
        attendance.checkOut.getTime() -
        attendance.checkIn.getTime() -
        totalBreakDuration;

      totalHours = workMs / (1000 * 60 * 60);
      totalHours = Math.round(totalHours * 100) / 100;
    }

    const overtime = totalHours > 8 ? totalHours - 8 : 0;

    // determine status
    let currentStatus = "Checked Out";

    if (attendance.checkIn && !attendance.checkOut) {
      currentStatus = "Checked In";

      const activeBreak = breaks.find((b: any) => !b.breakOut);
      if (activeBreak) currentStatus = "On Break";
    }

    return NextResponse.json({
      success: true,
      data: {
        _id: attendance._id,
        checkIn: attendance.checkIn,
        checkOut: attendance.checkOut,
        status: currentStatus,
        breaks,
        totalHours,
        breakDuration: breakHours,
        overtime,
        netWorkingHours: totalHours,
      },
    });
  } catch (error: any) {
    console.error("Error fetching today's attendance:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch today's attendance",
      },
      { status: 500 },
    );
  }
}
