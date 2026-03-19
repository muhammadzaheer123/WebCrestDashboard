import { NextResponse } from "next/server";
import { Policy } from "@/models/Policy";
import { connectDB } from "@/lib/db";

const POLICY_KEY = "default";

export async function GET() {
  await connectDB();

  const doc = await Policy.findOne({ key: POLICY_KEY }).lean();
  if (!doc) {
    const created = await Policy.create({ key: POLICY_KEY });
    return NextResponse.json(created);
  }

  return NextResponse.json(doc);
}

export async function PUT(req: Request) {
  await connectDB();

  const body = await req.json();

  const payload = {
    workdayStart: body.workdayStart,
    workdayEnd: body.workdayEnd,
    graceMinutes: body.graceMinutes,

    lateAfterMinutes: body.lateAfterMinutes,
    halfDayAfterMinutes: body.halfDayAfterMinutes,
    absentAfterMinutes: body.absentAfterMinutes,

    fullDayMinutes: body.fullDayMinutes,
    halfDayMinutes: body.halfDayMinutes,

    salaryCalculationMode: body.salaryCalculationMode,
    overtimeEnabled:
      typeof body.overtimeEnabled === "boolean"
        ? body.overtimeEnabled
        : undefined,
    overtimeMultiplier:
      typeof body.overtimeMultiplier === "number"
        ? body.overtimeMultiplier
        : undefined,
    partTimeMode: body.partTimeMode,

    enableLatePenalty: body.enableLatePenalty,
    lateToLeaveThreshold: body.lateToLeaveThreshold,

    missingCheckoutAction: body.missingCheckoutAction,
    weekends: Array.isArray(body.weekends) ? body.weekends : undefined,

    leaveTypes: Array.isArray(body.leaveTypes) ? body.leaveTypes : [],
    holidays: Array.isArray(body.holidays) ? body.holidays : [],
    shifts: Array.isArray(body.shifts) ? body.shifts : [],
  };

  const cleanedPayload = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  );

  const updated = await Policy.findOneAndUpdate(
    { key: POLICY_KEY },
    { $set: cleanedPayload },
    { new: true, upsert: true },
  ).lean();

  return NextResponse.json(updated);
}
