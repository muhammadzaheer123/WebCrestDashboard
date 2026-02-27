import { NextResponse } from "next/server";
import { Policy } from "@/models/Policy";
import { connectDB } from "@/lib/db";

const POLICY_KEY = "default";

export async function POST(req: Request) {
  await connectDB();
  const h = await req.json();

  const updated = await Policy.findOneAndUpdate(
    { key: POLICY_KEY },
    { $push: { holidays: { $each: [h], $position: 0 } } },
    { new: true, upsert: true },
  ).lean();

  return NextResponse.json(updated);
}
