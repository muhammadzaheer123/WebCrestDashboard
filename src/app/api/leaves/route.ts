import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import { getAuthUser } from "@/lib/server/auth";
import Leave from "@/models/Leave";

// ── helpers ────────────────────────────────────────────────────────────────

function monthKeyFromDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function businessDaysBetween(
  start: Date,
  end: Date,
  holidays: string[],
): number {
  let count = 0;
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  const fin = new Date(end);
  fin.setHours(0, 0, 0, 0);

  while (cur <= fin) {
    const dow = cur.getDay();
    const ymd = cur.toISOString().slice(0, 10);
    if (dow !== 0 && dow !== 6 && !holidays.includes(ymd)) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

// ── POST /api/leaves ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  await connectDB();

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = user.sub; // AuthUser uses `sub` not `id`

  const body = await req.json();
  const {
    type,
    startDate,
    endDate,
    reason,
    isHalfDay = false,
    halfDayPart,
  }: {
    type: string;
    startDate: string;
    endDate: string;
    reason: string;
    isHalfDay?: boolean;
    halfDayPart?: "AM" | "PM";
  } = body;

  if (!type || !startDate || !endDate || !reason) {
    return NextResponse.json({ message: "Missing fields" }, { status: 400 });
  }

  const s = new Date(startDate);
  const e = new Date(endDate);

  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
    return NextResponse.json({ message: "Invalid dates" }, { status: 400 });
  }
  if (s > e) {
    return NextResponse.json(
      { error: "endDate must be on/after startDate" },
      { status: 400 },
    );
  }
  if (isHalfDay && s.getTime() !== e.getTime()) {
    return NextResponse.json(
      { error: "Half-day must have same start and end date" },
      { status: 400 },
    );
  }
  if (isHalfDay && halfDayPart !== "AM" && halfDayPart !== "PM") {
    return NextResponse.json(
      { error: "halfDayPart must be AM or PM" },
      { status: 400 },
    );
  }

  const HOLIDAYS: string[] = [];

  const days = isHalfDay ? 0.5 : businessDaysBetween(s, e, HOLIDAYS);
  if (days <= 0) {
    return NextResponse.json(
      { error: "Selected dates contain no business days" },
      { status: 400 },
    );
  }

  // Check for overlapping leaves
  const overlapping = await Leave.findOne({
    employeeId: userId,
    status: { $in: ["pending", "approved"] },
    $or: [{ startDate: { $lte: e }, endDate: { $gte: s } }],
  });

  if (overlapping) {
    return NextResponse.json(
      {
        error: "Overlapping leave exists",
        existing: {
          id: overlapping._id,
          startDate: overlapping.startDate,
          endDate: overlapping.endDate,
          status: overlapping.status,
        },
      },
      { status: 409 },
    );
  }

  // Create leave
  const leave = await Leave.create({
    employeeId: userId,
    employeeName: user.name,
    employeeEmail: user.email,
    type,
    startDate: s,
    endDate: e,
    monthKey: monthKeyFromDate(s),
    days,
    reason,
    status: "pending",
    isHalfDay,
    halfDayPart: isHalfDay ? halfDayPart : undefined,
  });

  return NextResponse.json(
    {
      status: "success",
      data: {
        id: leave._id,
        type: leave.type,
        startDate: leave.startDate,
        endDate: leave.endDate,
        reason: leave.reason,
        status: leave.status,
        days: leave.days,
      },
    },
    { status: 201 },
  );
}
