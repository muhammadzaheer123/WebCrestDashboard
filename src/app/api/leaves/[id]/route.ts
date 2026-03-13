import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/server/auth";
import Leave from "@/models/Leave";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await connectDB();

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const isHR = user.role === "hr" || user.role === "admin";
  if (!isHR) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { status, hrComment } = body as {
    status?: "approved" | "rejected";
    hrComment?: string;
  };

  if (!status || !["approved", "rejected"].includes(status)) {
    return NextResponse.json({ message: "Invalid status" }, { status: 400 });
  }

  const existing = await Leave.findById(id);
  if (!existing) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const updated = await Leave.findByIdAndUpdate(
    id,
    {
      status,
      hrComment: hrComment?.trim() || "",
      decidedBy: user.sub,
      decidedAt: new Date(),
    },
    { new: true },
  );

  return NextResponse.json({
    status: "success",
    leave: updated,
  });
}
