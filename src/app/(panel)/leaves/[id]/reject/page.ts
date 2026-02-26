import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import LeaveRequest from "@/models/leaveRequest.model";

const ALLOWED = new Set(["admin", "hr"]);

function getUser(req: NextRequest) {
  const cookie = req.headers.get("cookie") || "";
  const bearer = req.headers.get("authorization") || "";
  const token =
    cookie.match(/auth_token=([^;]+)/)?.[1] ||
    (bearer.startsWith("Bearer ") ? bearer.slice(7) : "");
  if (!token) return null;
  try {
    const p = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    return { id: p.sub || p.id, role: p.role };
  } catch {
    return null;
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const me = getUser(req);
  if (!me || !ALLOWED.has(me.role)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const leave = await LeaveRequest.findById(params.id);
  if (!leave)
    return NextResponse.json({ message: "Leave not found" }, { status: 404 });
  if (leave.status !== "pending")
    return NextResponse.json(
      { message: "Only pending can be rejected" },
      { status: 400 }
    );

  leave.status = "rejected";
  leave.approverId = me.id;
  await leave.save();

  return NextResponse.json({ ok: true, message: "Rejected", id: leave._id });
}
