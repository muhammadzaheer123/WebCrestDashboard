import { NextResponse } from "next/server";
import Attendance from "@/models/attendance.model";
import type { IBreak } from "@/models/attendance.model";
import { connectDB } from "@/lib/db";
import { haversineDistanceMeters } from "@/lib/location";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export const runtime = "nodejs";

interface JWTPayload {
  sub?: string;
  userId?: string;
  id?: string;
  _id?: string;
}

async function getEmployeeId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    return (
      decoded?.sub ?? decoded?.userId ?? decoded?.id ?? decoded?._id ?? null
    );
  } catch {
    return null;
  }
}

function getDayRange(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

function getClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "";
  return headers.get("x-real-ip") || "";
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req.headers);
    const userAgent = req.headers.get("user-agent") || "";

    const empId = await getEmployeeId();
    if (!empId) {
      return NextResponse.json(
        { success: false, message: "Unauthenticated" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { latitude, longitude, accuracy } = body as {
      latitude?: number;
      longitude?: number;
      accuracy?: number;
    };

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid latitude or longitude" },
        { status: 400 },
      );
    }

    if (
      typeof accuracy !== "number" ||
      !Number.isFinite(accuracy) ||
      accuracy <= 0
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid location accuracy" },
        { status: 400 },
      );
    }

    const officeLat = Number(process.env.OFFICE_LAT);
    const officeLng = Number(process.env.OFFICE_LNG);
    const officeRadiusMeters = Number(process.env.OFFICE_RADIUS_METERS || 100);
    const maxAccuracyMeters = Number(
      process.env.MAX_LOCATION_ACCURACY_METERS || 100,
    );

    if (
      !Number.isFinite(officeLat) ||
      !Number.isFinite(officeLng) ||
      !Number.isFinite(officeRadiusMeters)
    ) {
      return NextResponse.json(
        { success: false, message: "Office location is not configured" },
        { status: 500 },
      );
    }

    if (accuracy > maxAccuracyMeters) {
      return NextResponse.json(
        {
          success: false,
          message: `Location accuracy is too low. Current accuracy is ${Math.round(accuracy)}m`,
        },
        { status: 400 },
      );
    }

    const distanceFromOffice = haversineDistanceMeters(
      latitude,
      longitude,
      officeLat,
      officeLng,
    );

    if (distanceFromOffice > officeRadiusMeters) {
      return NextResponse.json(
        {
          success: false,
          message: "You are outside the allowed office area",
          distanceFromOffice: Math.round(distanceFromOffice),
        },
        { status: 403 },
      );
    }

    await connectDB();

    const now = new Date();
    const { start, end } = getDayRange(now);

    const open = await Attendance.findOne({
      employeeId: empId,
      date: { $gte: start, $lt: end },
      checkIn: { $exists: true },
      $or: [{ checkOut: { $exists: false } }, { checkOut: null }],
    }).sort({ checkIn: -1 });

    if (!open) {
      return NextResponse.json(
        {
          success: false,
          message: "No open check-in found",
          date: start,
          employeeId: empId,
        },
        { status: 409 },
      );
    }

    open.checkOut = now;

    const locationMeta = {
      latitude,
      longitude,
      accuracy,
      distanceFromOffice: Math.round(distanceFromOffice),
      checkedAt: now,
      userAgent,
      ipAddress: ip,
    };

    let totalBreakMinutes = 0;

    if (open.breaks && open.breaks.length > 0) {
      open.breaks.forEach((b: IBreak) => {
        if (b.breakIn && b.breakOut) {
          const minutes = Math.round(
            (new Date(b.breakOut).getTime() - new Date(b.breakIn).getTime()) /
              60000,
          );
          b.duration = minutes;
          totalBreakMinutes += minutes;
        }
      });
    }

    const grossMinutes = Math.max(
      0,
      Math.round((now.getTime() - new Date(open.checkIn).getTime()) / 60000),
    );

    const totalWorkMinutes = Math.max(0, grossMinutes - totalBreakMinutes);
    const totalWorkHours = Number((totalWorkMinutes / 60).toFixed(2));

    open.totalBreakTime = totalBreakMinutes;
    open.totalHours = Number((grossMinutes / 60).toFixed(2));
    open.totalWorkHours = totalWorkHours;
    open.checkOutIP = ip;
    open.checkOutLocation = locationMeta;
    open.network = {
      ...(open.network || {}),
      ip,
      ssid: "",
      ua: req.headers.get("user-agent") || "",
    };

    if (open.status === "on-break") {
      open.status = "present";
    }

    await open.save();

    return NextResponse.json(
      {
        success: true,
        message: "Checked-out",
        distanceFromOffice: Math.round(distanceFromOffice),
        date: open.date,
        recordId: open._id,
        employeeId: empId,
        totalHours: open.totalHours,
        totalBreakMinutes: open.totalBreakTime,
        totalWorkHours: open.totalWorkHours,
        totalWorkMinutes,
      },
      { status: 200 },
    );
  } catch (e: unknown) {
    const err = e as Error;
    if (process.env.NODE_ENV !== "production") {
      console.error("check-out error:", err?.stack || err?.message || e);
    }
    return NextResponse.json(
      {
        success: false,
        message: "Server error (check-out)",
        ...(process.env.NODE_ENV !== "production" && {
          error: err?.message ?? String(e),
        }),
      },
      { status: 500 },
    );
  }
}
