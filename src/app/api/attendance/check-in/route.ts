import { NextResponse } from "next/server";
import Attendance from "@/models/attendance.model";
import { connectDB } from "@/lib/db";
import { haversineDistanceMeters } from "@/lib/location";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

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

function isValidLatitude(value: number): boolean {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value: number): boolean {
  return Number.isFinite(value) && value >= -180 && value <= 180;
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

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Request body must be valid JSON" },
        { status: 400 },
      );
    }

    const { latitude, longitude, accuracy, locationPermissionGranted } =
      body as {
        latitude?: number;
        longitude?: number;
        accuracy?: number;
        locationPermissionGranted?: boolean;
      };

    const deniedByClient =
      locationPermissionGranted === false ||
      (latitude === 0 && longitude === 0);

    if (deniedByClient) {
      return NextResponse.json(
        {
          success: false,
          message: "Location permission is required for check-in",
        },
        { status: 400 },
      );
    }

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      !isValidLatitude(latitude) ||
      !isValidLongitude(longitude)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid latitude or longitude range" },
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
      !Number.isFinite(officeRadiusMeters) ||
      officeRadiusMeters <= 0 ||
      !isValidLatitude(officeLat) ||
      !isValidLongitude(officeLng)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Office location is not configured properly",
        },
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

    const conservativeDistance = distanceFromOffice + accuracy;

    if (conservativeDistance > officeRadiusMeters) {
      return NextResponse.json(
        {
          success: false,
          message: "You are outside the allowed office area",
          distanceFromOffice: Math.round(distanceFromOffice),
          effectiveDistance: Math.round(conservativeDistance),
          allowedRadius: Math.round(officeRadiusMeters),
        },
        { status: 403 },
      );
    }

    await connectDB();

    const now = new Date();
    const { start, end } = getDayRange(now);

    const doc = await Attendance.findOne({
      employeeId: empId,
      date: { $gte: start, $lt: end },
    });

    if (doc?.checkIn && !doc.checkOut) {
      return NextResponse.json(
        {
          success: false,
          message: "Already checked-in",
          distanceFromOffice: Math.round(distanceFromOffice),
          date: start,
          employeeId: empId,
        },
        { status: 409 },
      );
    }

    const networkMeta = { ip, ssid: "", ua: userAgent };
    const locationMeta = {
      latitude,
      longitude,
      accuracy,
      distanceFromOffice: Math.round(distanceFromOffice),
      checkedAt: now,
      userAgent,
      ipAddress: ip,
    };

    if (!doc) {
      const created = await Attendance.create({
        employeeId: empId,
        date: start,
        checkIn: now,
        status: "present",
        source: "button",
        network: networkMeta,
        checkInIP: ip,
        checkInLocation: locationMeta,
        breaks: [],
        totalBreakTime: 0,
        totalWorkHours: 0,
        totalHours: 0,
      });

      return NextResponse.json(
        {
          success: true,
          message: "Checked-in",
          distanceFromOffice: Math.round(distanceFromOffice),
          date: start,
          recordId: created._id,
          employeeId: empId,
        },
        { status: 200 },
      );
    }

    doc.checkIn = now;
    doc.checkOut = undefined;
    doc.status = "present";
    doc.source = "button";
    doc.network = networkMeta;
    doc.checkInIP = ip;
    doc.checkInLocation = locationMeta;
    doc.date = start;

    await doc.save();

    return NextResponse.json(
      {
        success: true,
        message: "Checked-in",
        distanceFromOffice: Math.round(distanceFromOffice),
        date: start,
        recordId: doc._id,
        employeeId: empId,
      },
      { status: 200 },
    );
  } catch (e: any) {
    console.error("check-in error:", e);

    return NextResponse.json(
      { success: false, message: "Server error (check-in)" },
      { status: 500 },
    );
  }
}
