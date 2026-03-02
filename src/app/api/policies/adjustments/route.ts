import { NextResponse } from "next/server";
import { Policy } from "@/models/Policy";
import { connectDB } from "@/lib/db";

const POLICY_KEY = "default";

export async function GET() {
  await connectDB();

  const doc = await Policy.findOne({ key: POLICY_KEY }).lean();
  if (!doc) {
    // create first-time default doc if missing
    const created = await Policy.create({ key: POLICY_KEY });
    return NextResponse.json(created);
  }

  return NextResponse.json(doc);
}

export async function PUT(req: Request) {
  await connectDB();

  const body = await req.json();

  // Minimal safety: only pick allowed fields (prevents injecting weird data)
  const payload = {
    workdayStart: body.workdayStart,
    workdayEnd: body.workdayEnd,
    graceMinutes: body.graceMinutes,

    lateAfterMinutes: body.lateAfterMinutes,
    halfDayAfterMinutes: body.halfDayAfterMinutes,
    absentAfterMinutes: body.absentAfterMinutes,

    leaveTypes: Array.isArray(body.leaveTypes) ? body.leaveTypes : [],
    holidays: Array.isArray(body.holidays) ? body.holidays : [],
    shifts: Array.isArray(body.shifts) ? body.shifts : [],
  };

  const updated = await Policy.findOneAndUpdate(
    { key: POLICY_KEY },
    { $set: payload },
    { new: true, upsert: true },
  ).lean();

  return NextResponse.json(updated);
}
