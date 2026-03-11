import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import Leave from "../../../models/Leave";

function monthKeyFromDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function daysInclusive(start: Date, end: Date) {
  const s = new Date(start);
  s.setHours(0, 0, 0, 0);
  const e = new Date(end);
  e.setHours(0, 0, 0, 0);
  const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
  return diff + 1;
}

export async function POST(req: Request) {
  await connectDB();
  const user = await getAuthUser(); // must contain { id, name, email, role }

  const body = await req.json();
  const { type, startDate, endDate, reason } = body;

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
      { message: "Start date cannot be after end date" },
      { status: 400 },
    );
  }

  const days = daysInclusive(s, e);

  // (optional) overlap check (pending/approved)
  const overlap = await Leave.findOne({
    employeeId: user.id,
    status: { $in: ["pending", "approved"] },
    $or: [
      { startDate: { $lte: e }, endDate: { $gte: s } }, // overlaps
    ],
  });
  if (overlap) {
    return NextResponse.json(
      { message: "Leave already exists in this date range" },
      { status: 409 },
    );
  }

  const doc = await Leave.create({
    employeeId: user.id,
    employeeName: user.name ?? "",
    employeeEmail: user.email ?? "",
    type,
    startDate: s,
    endDate: e,
    monthKey: monthKeyFromDate(s),
    days,
    reason,
    status: "pending",
  });

  return NextResponse.json({ leave: doc }, { status: 201 });
}

export async function GET(req: Request) {
  await connectDB();
  const user = await getAuthUser();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // pending/approved/rejected/all
  const monthKey = searchParams.get("monthKey"); // "YYYY-MM"
  const q = searchParams.get("q"); // search employee/type/reason
  const mine = searchParams.get("mine"); // "1" => only my leaves

  const filter: any = {};

  // access control:
  // HR/Admin => all, Employee => only own
  const isHR = user.role === "hr" || user.role === "admin";
  if (!isHR || mine === "1") filter.employeeId = user.id;

  if (status && status !== "all") filter.status = status;
  if (monthKey) filter.monthKey = monthKey;

  if (q) {
    filter.$or = [
      { employeeName: { $regex: q, $options: "i" } },
      { employeeEmail: { $regex: q, $options: "i" } },
      { reason: { $regex: q, $options: "i" } },
      { type: { $regex: q, $options: "i" } },
    ];
  }

  const leaves = await Leave.find(filter).sort({ createdAt: -1 }).limit(500);
  return NextResponse.json({ leaves });
}
