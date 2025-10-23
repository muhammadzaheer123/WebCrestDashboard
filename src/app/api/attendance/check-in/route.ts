// app/api/attendance/check-in/route.ts
import { NextResponse } from "next/server";
import { ymd } from "@/lib/dates";
import Attendance from "@/models/attendance.model";
import { connectDB } from "@/lib/db";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { ensureOfficeGate } from "@/lib/ip"; 

export const runtime = "nodejs";

function getEmployeeId(req: Request): string | null {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
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
    // 🔐 Office/SSID gate
    const gate = ensureOfficeGate(req.headers);
    if (!gate.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "Not on office network",
          reason: gate.reason,
          ip: gate.ip ?? undefined,
        },
        { status: 403 }
      );
    }

    // 🔑 Who is checking in?
    const empId = getEmployeeId(req);
    if (!empId) {
      return NextResponse.json(
        { success: false, message: "Unauthenticated" },
        { status: 401 }
      );
    }
    if (!mongoose.Types.ObjectId.isValid(empId)) {
      return NextResponse.json(
        { success: false, message: "Invalid employee id in token" },
        { status: 400 }
      );
    }
    const employeeObjectId = new mongoose.Types.ObjectId(empId);

    await connectDB();

    const today = ymd();
    const now = new Date();

    // Existing record for today?
    const doc = await Attendance.findOne({
      employeeId: employeeObjectId,
      date: today,
    });

    // If already checked-in and not checked-out -> conflict
    if (doc?.checkIn && !doc.checkOut) {
      return NextResponse.json(
        {
          success: false,
          message: "Already checked-in",
          date: today,
          employeeId: empId, // ⬅️ include employee id
        },
        { status: 409 }
      );
    }

    const networkMeta = {
      ip: gate.ip,
      ssid: gate.ssid,
      ua: req.headers.get("user-agent") || "",
    };

    if (!doc) {
      const created = await Attendance.create({
        employeeId: employeeObjectId,
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
          employeeId: empId, // ⬅️ include employee id
        },
        { status: 200 }
      );
    }

    // If a doc exists (e.g., had a prior checkout), reset it to a new check-in
    doc.checkIn = now;
    doc.checkOut = undefined;
    doc.network = networkMeta;
    await doc.save();

    return NextResponse.json(
      {
        success: true,
        message: "Checked-in",
        date: today,
        recordId: doc._id,
        employeeId: empId, // ⬅️ include employee id
      },
      { status: 200 }
    );
  } catch (e: any) {
    if (process.env.NODE_ENV !== "production") {
      console.error("check-in error:", e?.message || e);
    }
    return NextResponse.json(
      { success: false, message: "Server error (check-in)" },
      { status: 500 }
    );
  }
}
