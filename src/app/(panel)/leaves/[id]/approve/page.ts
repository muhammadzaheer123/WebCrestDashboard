import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import LeaveRequest from "@/models/leaveRequest.model";
import LeaveBalance from "@/models/leaveBalance.model";

const ALLOWED = new Set(["admin", "hr"]);
const PAID = new Set(["annual", "sick", "casual"]);

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
  const sess = await mongoose.startSession();
  sess.startTransaction();

  try {
    const leave = await LeaveRequest.findById(params.id).session(sess);
    if (!leave) {
      await sess.abortTransaction();
      return NextResponse.json({ message: "Leave not found" }, { status: 404 });
    }
    if (leave.status !== "pending") {
      await sess.abortTransaction();
      return NextResponse.json(
        { message: "Only pending can be approved" },
        { status: 400 }
      );
    }

    // Deduct balance if paid type
    if (PAID.has(leave.type)) {
      const field = `${leave.type}`;
      const updated = await LeaveBalance.findOneAndUpdate(
        { userId: leave.userId, [field]: { $gte: leave.daysRequested } },
        { $inc: { [field]: -leave.daysRequested } },
        { new: true, session: sess }
      );
      if (!updated) {
        await sess.abortTransaction();
        return NextResponse.json(
          { message: `Insufficient ${leave.type} balance` },
          { status: 400 }
        );
      }
    }

    leave.status = "approved";
    // @ts-ignore
    leave.approverId = me.id;
    await leave.save({ session: sess });

    await sess.commitTransaction();
    return NextResponse.json({ ok: true, message: "Approved", id: leave._id });
  } catch (e) {
    await sess.abortTransaction();
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  } finally {
    sess.endSession();
  }
}
