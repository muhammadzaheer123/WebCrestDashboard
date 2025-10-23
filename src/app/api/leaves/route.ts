import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "../../../lib/db";
import LeaveRequest from "@/models/leaveRequest.model";
import LeaveBalance from "@/models/leaveBalance.model";
import { businessDaysBetween, toUTCDateOnly } from "@/lib/dates";

function getUserFromAuth(
  req: NextRequest
): { id: string; role?: string } | null {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    return { id: payload.sub || payload.id, role: payload.role };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  await connectDB();

  const user = getUserFromAuth(req);
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const {
    type,
    startDate,
    endDate,
    isHalfDay = false,
    halfDayPart = null,
    reason = "",
  } = body || {};

  const TYPES = ["annual", "sick", "casual", "unpaid", "other"];
  if (!TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 422 });
  }
  const s = toUTCDateOnly(new Date(startDate));
  const e = toUTCDateOnly(new Date(endDate));
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
    return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
  }
  if (e < s) {
    return NextResponse.json(
      { error: "endDate must be on/after startDate" },
      { status: 400 }
    );
  }
  if (isHalfDay && s.getTime() !== e.getTime()) {
    return NextResponse.json(
      { error: "Half-day must have same start and end date" },
      { status: 400 }
    );
  }
  if (isHalfDay && halfDayPart !== "AM" && halfDayPart !== "PM") {
    return NextResponse.json(
      { error: "halfDayPart must be AM or PM" },
      { status: 400 }
    );
  }

  const HOLIDAYS: string[] = [];

  let daysRequested = isHalfDay ? 0.5 : businessDaysBetween(s, e, HOLIDAYS);
  if (daysRequested <= 0) {
    return NextResponse.json(
      { error: "Selected dates contain no business days" },
      { status: 400 }
    );
  }

  const overlapping = await LeaveRequest.findOne({
    userId: user.id,
    status: { $in: ["pending", "approved"] },
    $expr: { $and: [{ $lte: ["$startDate", e] }, { $gte: ["$endDate", s] }] },
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
      { status: 409 }
    );
  }

  const needsBalance = ["annual", "sick", "casual"].includes(type);
  let balance = await LeaveBalance.findOne({ userId: user.id });
  if (!balance) {
    balance = await LeaveBalance.create({
      userId: user.id,
      annual: 0,
      sick: 0,
      casual: 0,
    });
  }
  if (needsBalance) {
    const available = (balance as any)[type] ?? 0;
    if (available < daysRequested) {
      return NextResponse.json(
        {
          error: `Insufficient ${type} balance`,
          available,
          requested: daysRequested,
        },
        { status: 400 }
      );
    }
  }

  const leave = await LeaveRequest.create({
    userId: user.id,
    type,
    startDate: s,
    endDate: e,
    isHalfDay,
    halfDayPart: isHalfDay ? halfDayPart : null,
    reason,
    status: "pending",
    approverId: null,
    daysRequested,
    balanceSnapshot: {
      annual: balance.annual ?? 0,
      sick: balance.sick ?? 0,
      casual: balance.casual ?? 0,
    },
  });

  return NextResponse.json(
    {
      status: "success",
      data: {
        id: leave._id,
        type: leave.type,
        startDate: leave.startDate,
        endDate: leave.endDate,
        isHalfDay: leave.isHalfDay,
        halfDayPart: leave.halfDayPart,
        reason: leave.reason,
        status: leave.status,
        daysRequested: leave.daysRequested,
        createdAt: leave.createdAt,
      },
    },
    { status: 201 }
  );
}
