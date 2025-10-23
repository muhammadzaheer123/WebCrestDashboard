// app/api/attendance/check-out/route.ts
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

    const empId = getEmployeeId(req);
    if (!empId)
      return NextResponse.json(
        { success: false, message: "Unauthenticated" },
        { status: 401 }
      );
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
        { status: 409 }
      );
    }

    // Optional policy: allow cross-midnight checkout.
    // If you want to enforce "same-day only", uncomment next block:
    // if (open.date !== today) {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       message: `Open check-in belongs to ${open.date}; same-day checkout only`,
    //       date: today,
    //       employeeId: empId,
    //     },
    //     { status: 409 }
    //   );
    // }

    open.checkOut = now;
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
        date: open.date ?? today, // keep the record's date
        recordId: open._id,
        employeeId: empId,
      },
      { status: 200 }
    );
  } catch (e: any) {
    if (process.env.NODE_ENV !== "production") {
      console.error("check-out error:", e?.stack || e?.message || e);
    }
    return NextResponse.json(
      {
        success: false,
        message: "Server error (check-out)",
        ...(process.env.NODE_ENV !== "production" && {
          error: e?.message ?? String(e),
        }),
      },
      { status: 500 }
    );
  }
}
