// app/api/attendance/check-in/route.ts

import { NextResponse } from "next/server";
import { ymd } from "@/lib/dates";
import Attendance from "@/models/attendance.model";
import { connectDB } from "@/lib/db";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { ensureOfficeGate } from "@/lib/ip";
import { cookies } from "next/headers";

export const runtime = "nodejs";

async function getEmployeeId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

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

    // ✅ FIX
    const empId = await getEmployeeId();

    if (!empId) {
      return NextResponse.json(
        { success: false, message: "Unauthenticated" },
        { status: 401 },
      );
    }
    const employeeId = String(empId);

    const employeeObjectId = new mongoose.Types.ObjectId(empId);

    await connectDB();

    const today = ymd();
    const now = new Date();

    const doc = await Attendance.findOne({
      employeeId: employeeId,
      date: today,
    });

    if (doc?.checkIn && !doc.checkOut) {
      return NextResponse.json(
        {
          success: false,
          message: "Already checked-in",
          date: today,
          employeeId: empId,
        },
        { status: 409 },
      );
    }

    const networkMeta = {
      ip: gate.ip,
      ssid: gate.ssid,
      ua: req.headers.get("user-agent") || "",
    };

    if (!doc) {
      const created = await Attendance.create({
        employeeId: employeeId,
        date: today,
        checkIn: now,
        source: "button",
        network: networkMeta,
      });

      return NextResponse.json(
        {
          success: true,
          message: "Checked-in",
          date: today,
          recordId: created._id,
          employeeId: empId,
        },
        { status: 200 },
      );
    }

    doc.checkIn = now;
    doc.checkOut = undefined;
    // doc.network = networkMeta;

    await doc.save();

    return NextResponse.json(
      {
        success: true,
        message: "Checked-in",
        date: today,
        recordId: doc._id,
        employeeId: empId,
      },
      { status: 200 },
    );
  } catch (e: any) {
    console.error("check-in error:", e);

    return NextResponse.json(
      { success: false, message: "Server error (check-in)" },
      { status: 500 },
    );
  }
}
