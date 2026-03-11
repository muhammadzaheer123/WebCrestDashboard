import { NextResponse } from "next/server";
import { Policy } from "@/models/Policy";
import { connectDB } from "@/lib/db";

const POLICY_KEY = "default";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await connectDB();
  const { id } = await params;
  const updated = await Policy.findOneAndUpdate(
    { key: POLICY_KEY },
    { $pull: { holidays: { id: id } } },
    { new: true },
  ).lean();

  return NextResponse.json(updated);
}
