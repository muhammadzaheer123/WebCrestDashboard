import { NextResponse } from "next/server";
import { Policy } from "@/models/Policy";
import { connectDB } from "@/lib/db";

const POLICY_KEY = "default";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  await connectDB();

  const updated = await Policy.findOneAndUpdate(
    { key: POLICY_KEY },
    { $pull: { holidays: { id: params.id } } },
    { new: true },
  ).lean();

  return NextResponse.json(updated);
}
