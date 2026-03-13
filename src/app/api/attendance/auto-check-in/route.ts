import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import Attendance from "@/models/attendance.model";
import { connectDB } from "@/lib/db";
import { ymd } from "@/lib/dates";
import { haversineDistanceMeters } from "@/lib/location";

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

function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "";
  }

  return headers.get("x-real-ip") || "";
}

export async function POST(req: Request) {
  try {
    const empId = await getEmployeeId();

    if (!empId) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
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
        { success: false, error: "Invalid latitude or longitude" },
        { status: 400 },
      );
    }

    if (
      typeof accuracy !== "number" ||
      !Number.isFinite(accuracy) ||
      accuracy <= 0
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid location accuracy" },
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
        { success: false, error: "Office location is not configured properly" },
        { status: 500 },
      );
    }

    if (accuracy > maxAccuracyMeters) {
      return NextResponse.json(
        {
          success: false,
          error: `Location accuracy is too low. Current accuracy is ${Math.round(
            accuracy,
          )}m`,
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
          error: "You are outside the allowed office area",
          distanceFromOffice: Math.round(distanceFromOffice),
        },
        { status: 403 },
      );
    }

    await connectDB();

    const today = ymd();
    const now = new Date();
    const ipAddress = getClientIp(req.headers);
    const userAgent = req.headers.get("user-agent") || "";

    const existing = await Attendance.findOne({
      employeeId: empId,
      date: today,
    });

    if (existing?.checkIn && !existing.checkOut) {
      return NextResponse.json(
        {
          success: false,
          error: "Already checked in",
          distanceFromOffice: Math.round(distanceFromOffice),
        },
        { status: 409 },
      );
    }

    const locationMeta = {
      latitude,
      longitude,
      accuracy,
      distanceFromOffice: Math.round(distanceFromOffice),
      checkedAt: now,
      userAgent,
      ipAddress,
    };

    if (!existing) {
      const created = await Attendance.create({
        employeeId: empId,
        date: today,
        checkIn: now,
        status: "present",
        source: "auto",
        checkInIP: ipAddress,
        network: {
          ip: ipAddress,
          ua: userAgent,
        },
        checkInLocation: locationMeta,
      });

      return NextResponse.json({
        success: true,
        message: "Checked in successfully",
        distanceFromOffice: Math.round(distanceFromOffice),
        recordId: created._id,
      });
    }

    existing.checkIn = now;
    existing.checkOut = undefined;
    existing.status = "present";
    existing.source = "auto";
    existing.checkInIP = ipAddress;
    existing.network = {
      ...(existing.network || {}),
      ip: ipAddress,
      ua: userAgent,
    };
    existing.checkInLocation = locationMeta;

    await existing.save();

    return NextResponse.json({
      success: true,
      message: "Checked in successfully",
      distanceFromOffice: Math.round(distanceFromOffice),
      recordId: existing._id,
    });
  } catch (error) {
    console.error("auto-check-in error:", error);

    return NextResponse.json(
      { success: false, error: "Server error (auto check-in)" },
      { status: 500 },
    );
  }
}
