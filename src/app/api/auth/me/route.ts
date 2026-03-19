import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import Employee from "@/models/Employee";

export const runtime = "nodejs";

type JwtPayload = {
  sub?: string;
  userId?: string;
  id?: string;
  _id?: string;
  email?: string;
  name?: string;
  role?: string;
  employmentType?: string;
};

function getUserIdFromToken(decoded: JwtPayload): string | null {
  return decoded?.sub ?? decoded?.userId ?? decoded?.id ?? decoded?._id ?? null;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { ok: false, message: "Unauthenticated" },
        { status: 401 },
      );
    }

    const JWT_SECRET = process.env.JWT_SECRET;

    if (!JWT_SECRET) {
      return NextResponse.json(
        { ok: false, message: "Server configuration error" },
        { status: 500 },
      );
    }

    let decoded: JwtPayload;

    try {
      decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
      return NextResponse.json(
        { ok: false, message: "Invalid or expired token" },
        { status: 401 },
      );
    }

    const userId = getUserIdFromToken(decoded);

    if (!userId) {
      return NextResponse.json(
        { ok: false, message: "Invalid token payload" },
        { status: 401 },
      );
    }

    await connectDB();

    const user = await Employee.findById(userId)
      .select(
        "_id employeeId name email role salary employmentType isActive department designation shift phone qrCode createdAt updatedAt",
      )
      .lean();

    if (!user) {
      return NextResponse.json(
        { ok: false, message: "User not found" },
        { status: 404 },
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { ok: false, message: "Account is inactive" },
        { status: 403 },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        user: {
          id: String(user._id),
          employeeId: user.employeeId ?? "",
          name: user.name ?? "",
          email: user.email ?? "",
          role: user.role ?? "",
          salary: typeof user.salary === "number" ? user.salary : 0,
          employmentType: user.employmentType ?? "full-time",
          isActive: !!user.isActive,
          department: user.department ?? "",
          designation: user.designation ?? "",
          shift: user.shift ?? "",
          phone: user.phone ?? "",
          qrCode: user.qrCode ?? "",
          createdAt: user.createdAt ?? null,
          updatedAt: user.updatedAt ?? null,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error: any) {
    console.error("auth/me error:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Server error",
        error: error?.message || "Unknown error",
      },
      { status: 500 },
    );
  }
}
