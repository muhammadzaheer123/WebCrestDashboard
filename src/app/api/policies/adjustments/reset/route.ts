import { NextResponse } from "next/server";
import { Policy } from "@/models/Policy";
import { connectDB } from "@/lib/db";

const POLICY_KEY = "default";

export async function POST() {
  await connectDB();

  // Reset by overwriting with schema defaults + clearing arrays
  const updated = await Policy.findOneAndUpdate(
    { key: POLICY_KEY },
    {
      $set: {
        workdayStart: "09:00",
        workdayEnd: "18:00",
        graceMinutes: 10,
        lateAfterMinutes: 10,
        halfDayAfterMinutes: 120,
        absentAfterMinutes: 240,
        leaveTypes: [],
        holidays: [],
        shifts: [],
      },
    },
    { new: true, upsert: true },
  ).lean();

  return NextResponse.json(updated);
}
