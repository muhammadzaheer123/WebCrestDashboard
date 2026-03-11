import { NextResponse } from "next/server";
import { Policy } from "@/models/Policy";
import { connectDB } from "@/lib/db";

const POLICY_KEY = "default";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await connectDB();
  const patch = await req.json();
  const { id } = await params;
  const updated = await Policy.findOneAndUpdate(
    { key: POLICY_KEY, "shifts.id": params },
    {
      $set: {
        "shifts.$.name": patch.name,
        "shifts.$.start": patch.start,
        "shifts.$.end": patch.end,
        "shifts.$.breakMinutes": patch.breakMinutes,
      },
    },
    { new: true },
  ).lean();

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await connectDB();
  const { id } = await params;
  const updated = await Policy.findOneAndUpdate(
    { key: POLICY_KEY },
    { $pull: { shifts: { id: id } } },
    { new: true },
  ).lean();

  return NextResponse.json(updated);
}
