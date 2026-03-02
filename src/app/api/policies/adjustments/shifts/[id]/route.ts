import { NextResponse } from "next/server";
import { Policy } from "@/models/Policy";
import { connectDB } from "@/lib/db";

const POLICY_KEY = "default";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  await connectDB();
  const patch = await req.json();

  const updated = await Policy.findOneAndUpdate(
    { key: POLICY_KEY, "shifts.id": params.id },
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
  { params }: { params: { id: string } },
) {
  await connectDB();

  const updated = await Policy.findOneAndUpdate(
    { key: POLICY_KEY },
    { $pull: { shifts: { id: params.id } } },
    { new: true },
  ).lean();

  return NextResponse.json(updated);
}
