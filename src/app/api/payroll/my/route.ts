import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { calculateEmployeePayroll } from "@/lib/payroll/calculatePayroll";
import { Payroll } from "@/models/payroll.model";

export const runtime = "nodejs";

async function getEmployeeId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    return (
      decoded?.sub ?? decoded?.userId ?? decoded?.id ?? decoded?._id ?? null
    );
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const employeeId = await getEmployeeId();

    if (!employeeId) {
      return NextResponse.json(
        { success: false, message: "Unauthenticated" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const now = new Date();

    const month = Number(searchParams.get("month") || now.getMonth() + 1);
    const year = Number(searchParams.get("year") || now.getFullYear());

    await connectDB();

    // If a finalized payroll exists, return it as-is — never overwrite finalized records.
    const existing = await Payroll.findOne({ employeeId, month, year }).lean();
    if ((existing as any)?.status === "finalized") {
      return NextResponse.json({ success: true, data: existing });
    }

    const summary = await calculateEmployeePayroll({
      employeeId,
      month,
      year,
    });

    const saved = await Payroll.findOneAndUpdate(
      { employeeId, month, year },
      {
        $set: {
          ...summary,
          status: "draft",
        },
      },
      { upsert: true, new: true },
    ).lean();

    return NextResponse.json({
      success: true,
      data: saved,
    });
  } catch (error: any) {
    console.error("payroll/my error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch payroll",
        error: error?.message || "Unknown error",
      },
      { status: 500 },
    );
  }
}
