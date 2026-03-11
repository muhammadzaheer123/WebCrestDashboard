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
  // Update the matched array item using positional operator
  const updated = await Policy.findOneAndUpdate(
    { key: POLICY_KEY, "leaveTypes.id": id },
    {
      $set: {
        "leaveTypes.$.name": patch.name,
        "leaveTypes.$.paid": patch.paid,
        "leaveTypes.$.requiresApproval": patch.requiresApproval,
        "leaveTypes.$.maxPerYear": patch.maxPerYear,
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
    { $pull: { leaveTypes: { id:id } } },
    { new: true },
  ).lean();

  return NextResponse.json(updated);
}
