import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import Employee from "@/models/Employee";
import { connectDB } from "@/lib/db";
import { calculateEmployeePayroll } from "@/lib/payroll/calculatePayroll";
import { Payroll } from "@/models/payroll.model";

export const runtime = "nodejs";

async function getAuthUser(): Promise<{ id: string; role: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    return {
      id: decoded?.sub ?? decoded?.userId ?? decoded?.id ?? decoded?._id ?? "",
      role: decoded?.role ?? "",
    };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser();

    if (!auth?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthenticated" },
        { status: 401 },
      );
    }

    if (!["admin"].includes(auth.role)) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const now = new Date();

    const month = Number(body?.month || now.getMonth() + 1);
    const year = Number(body?.year || now.getFullYear());
    const finalize = Boolean(body?.finalize);

    await connectDB();

    const employees = await Employee.find({ isActive: true })
      .select("_id name email salary employmentType shift isActive")
      .lean();

    const results = [];

    for (const emp of employees) {
      const employeeId = String(emp._id);

      const summary = await calculateEmployeePayroll({
        employeeId,
        month,
        year,
      });

      // Preserve existing "finalized" status when running a draft recalculation.
      const existingPayroll = await Payroll.findOne({
        employeeId,
        month,
        year,
      }).lean();
      const newStatus = finalize
        ? "finalized"
        : (existingPayroll as any)?.status === "finalized"
          ? "finalized"
          : "draft";

      const saved = await Payroll.findOneAndUpdate(
        { employeeId, month, year },
        {
          $set: {
            ...summary,
            status: newStatus,
          },
        },
        { upsert: true, new: true },
      ).lean();

      results.push(saved);
    }

    return NextResponse.json({
      success: true,
      message: `Payroll ${finalize ? "finalized" : "generated"} successfully`,
      count: results.length,
      data: results,
    });
  } catch (error: any) {
    console.error("payroll/run error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to run payroll",
        error: error?.message || "Unknown error",
      },
      { status: 500 },
    );
  }
}
