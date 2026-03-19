import { NextResponse } from "next/server";
import Attendance from "@/models/attendance.model";
import { connectDB } from "@/lib/db";
import jwt from "jsonwebtoken";
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

function getDayRange(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
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

    if (!empId) {
      return NextResponse.json(
        { success: false, message: "Unauthenticated" },
        { status: 401 },
      );
    }

    await connectDB();

    const now = new Date();
    const { start, end } = getDayRange(now);

    const doc = await Attendance.findOne({
      employeeId: empId,
      date: { $gte: start, $lt: end },
    });

    if (doc?.checkIn && !doc.checkOut) {
      return NextResponse.json(
        {
          success: false,
          message: "Already checked-in",
          date: start,
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
        employeeId: empId,
        date: start,
        checkIn: now,
        status: "present",
        source: "button",
        network: networkMeta,
        checkInIP: gate.ip,
        breaks: [],
        totalBreakTime: 0,
        totalWorkHours: 0,
        totalHours: 0,
      });

      return NextResponse.json(
        {
          success: true,
          message: "Checked-in",
          date: start,
          recordId: created._id,
          employeeId: empId,
        },
        { status: 200 },
      );
    }

    doc.checkIn = now;
    doc.checkOut = undefined;
    doc.status = "present";
    doc.source = "button";
    doc.network = networkMeta;
    doc.checkInIP = gate.ip;
    doc.date = start;

    await doc.save();

    return NextResponse.json(
      {
        success: true,
        message: "Checked-in",
        date: start,
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
