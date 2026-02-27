import { NextResponse } from "next/server";
import { Policy } from "@/models/Policy";
import { connectDB } from "@/lib/db";

const POLICY_KEY = "default";

export async function POST(req: Request) {
  await connectDB();
  const lt = await req.json();

  // Expect { id, name, paid, requiresApproval, maxPerYear }
  const updated = await Policy.findOneAndUpdate(
    { key: POLICY_KEY },
    { $push: { leaveTypes: { $each: [lt], $position: 0 } } },
    { new: true, upsert: true },
  ).lean();

  return NextResponse.json(updated);
}
