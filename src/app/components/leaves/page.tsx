import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import LeaveRequest from "@/models/leaveRequest.model";
import User from "@/models/user.model";

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

export async function GET(req: NextRequest) {
  const me = getUser(req);
  if (!me || !ALLOWED.has(me.role)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  await connectDB();

  const { searchParams } = new URL(req.url);
  const status = (searchParams.get("status") ?? "pending") as
    | "pending"
    | "approved"
    | "rejected"
    | "all";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(
    100,
    Math.max(5, Number(searchParams.get("limit") ?? 10))
  );
  const qstr = (searchParams.get("q") ?? "").trim();

  const query: any = status === "all" ? {} : { status };
  if (qstr) {
    // search by reason / type; (user name/email joined below)
    query.$or = [
      { reason: { $regex: qstr, $options: "i" } },
      { type: { $regex: qstr, $options: "i" } },
    ];
  }

  // Counts for tabs
  const [pendingCount, approvedCount, rejectedCount, totalCount] =
    await Promise.all([
      LeaveRequest.countDocuments({ status: "pending" }),
      LeaveRequest.countDocuments({ status: "approved" }),
      LeaveRequest.countDocuments({ status: "rejected" }),
      LeaveRequest.countDocuments({}),
    ]);

  const items = await LeaveRequest.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  // attach user info
  const uids = [...new Set(items.map((i) => String(i.userId)))];
  const users = await User.find({ _id: { $in: uids } })
    .select("_id name email")
    .lean();
  const uMap = new Map(users.map((u) => [String(u._id), u]));
  const data = items.map((i) => ({
    ...i,
    user: uMap.get(String(i.userId)) || null,
  }));

  const filteredTotal = await LeaveRequest.countDocuments(query);

  return NextResponse.json({
    ok: true,
    data,
    page,
    limit,
    total: filteredTotal,
    counts: {
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      all: totalCount,
    },
  });
}
