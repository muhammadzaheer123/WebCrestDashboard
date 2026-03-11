import { NextResponse } from "next/server";
import Leave from "@/models/Leave";
import dbConnect from "@/lib/dbConnect";
import { getAuthUser } from "@/lib/auth"; // placeholder

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await dbConnect();
  const user = await getAuthUser();

  const isHR = user.role === "hr" || user.role === "admin";
  if (!isHR)
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { status, hrComment } = body; // status: approved/rejected

  if (!["approved", "rejected"].includes(status)) {
    return NextResponse.json({ message: "Invalid status" }, { status: 400 });
  }

  const updated = await Leave.findByIdAndUpdate(
    id,
    {
      status,
      hrComment: hrComment ?? "",
      decidedBy: user.id,
      decidedAt: new Date(),
    },
    { new: true },
  );

  if (!updated)
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json({ leave: updated });
}
