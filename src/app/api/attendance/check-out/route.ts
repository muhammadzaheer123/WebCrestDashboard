import { NextResponse } from "next/server";
import { ymd } from "@/lib/dates";
import Attendance from "@/models/attendance.model";
import type { IBreak } from "@/models/attendance.model";
import { connectDB } from "@/lib/db";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { ensureOfficeGate } from "@/lib/ip";
import { cookies } from "next/headers";

export const runtime = "nodejs";

interface JWTPayload {
  sub?: string;
  userId?: string;
  id?: string;
  _id?: string;
}

async function getEmployeeId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    return (
      decoded?.sub ?? decoded?.userId ?? decoded?.id ?? decoded?._id ?? null
    );
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const gate = ensureOfficeGate(req.headers);
    if (!gate.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "Not on office network",
          reason: gate.reason,
          ip: gate.ip ?? undefined,
        },
        { status: 403 },
      );
    }

    const empId = await getEmployeeId();
    if (!empId)
      return NextResponse.json(
        { success: false, message: "Unauthenticated" },
        { status: 401 },
      );

    if (!mongoose.Types.ObjectId.isValid(empId)) {
      return NextResponse.json(
        { success: false, message: "Invalid employee id in token" },
        { status: 400 },
      );
    }
    const employeeObjectId = new mongoose.Types.ObjectId(empId);

    await connectDB();

    const today = ymd();
    const now = new Date();

    const open = await Attendance.findOne({
      employeeId: employeeObjectId,
      checkIn: { $exists: true },
      $or: [{ checkOut: { $exists: false } }, { checkOut: null }],
    })
      .sort({ checkIn: -1 })
      .lean(false);

    if (!open) {
      return NextResponse.json(
        {
          success: false,
          message: "No open check-in found",
          date: today,
          employeeId: empId,
        },
        { status: 409 },
      );
    }

    // set checkout time
    open.checkOut = now;

    // calculate total break time
    let totalBreak = 0;

    if (open.breaks && open.breaks.length > 0) {
      open.breaks.forEach((b: IBreak) => {
        if (b.breakIn && b.breakOut) {
          totalBreak +=
            new Date(b.breakOut).getTime() - new Date(b.breakIn).getTime();
        }
      });
    }

    // total work duration
    const totalDuration =
      new Date(now).getTime() - new Date(open.checkIn).getTime() - totalBreak;

    // convert to hours
    const totalWorkHours = totalDuration / (1000 * 60 * 60);

    // save calculations
    open.totalBreakTime = totalBreak;
    open.totalWorkHours = Number(totalWorkHours.toFixed(2));

    // save network info
    open.network = {
      ip: gate.ip,
      ssid: gate.ssid,
      ua: req.headers.get("user-agent") || "",
    };

    await open.save();

    return NextResponse.json(
      {
        success: true,
        message: "Checked-out",
        date: open.date ?? today,
        recordId: open._id,
        employeeId: empId,
        totalWorkHours: open.totalWorkHours,
        totalBreakTime: open.totalBreakTime,
      },
      { status: 200 },
    );
  } catch (e: unknown) {
    const err = e as Error;
    if (process.env.NODE_ENV !== "production") {
      console.error("check-out error:", err?.stack || err?.message || e);
    }
    return NextResponse.json(
      {
        success: false,
        message: "Server error (check-out)",
        ...(process.env.NODE_ENV !== "production" && {
          error: err?.message ?? String(e),
        }),
      },
      { status: 500 },
    );
  }
}
