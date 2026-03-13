"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapPin,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { getCurrentLocation } from "@/lib/getCurrentLocation";

type AttendanceRecord = {
  _id?: string;
  checkIn?: string | Date | null;
  checkOut?: string | Date | null;
  status?: string;
  breaks?: any[];
  totalHours?: number;
  breakDuration?: number;
  overtime?: number;
  netWorkingHours?: number;
} | null;

type Props = {
  onSuccess?: () => void | Promise<void>;
  attendance?: AttendanceRecord;
  attendanceLoaded: boolean;
  employeeId?: string;
};

type AutoState = "idle" | "loading" | "success" | "error";

function getTodayKey(employeeId?: string) {
  if (!employeeId) return null;

  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");

  return `auto-check-in:${employeeId}:${y}-${m}-${d}`;
}

export default function AutoCheckInCard({
  onSuccess,
  attendance,
  attendanceLoaded,
  employeeId,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<AutoState>("idle");
  const [message, setMessage] = useState(
    "Preparing automatic office location verification...",
  );
  const [distance, setDistance] = useState<number | null>(null);
  const [checkedIn, setCheckedIn] = useState(false);

  const attemptedRef = useRef(false);

  const todayKey = useMemo(() => getTodayKey(employeeId), [employeeId]);

  const hasCheckIn = Boolean(attendance?.checkIn);
  const hasCheckOut = Boolean(attendance?.checkOut);

  const alreadyCheckedIn = hasCheckIn && !hasCheckOut;
  const alreadyCheckedOut = hasCheckIn && hasCheckOut;

  useEffect(() => {
    attemptedRef.current = false;
    setLoading(false);
    setCheckedIn(false);
    setStatus("idle");
    setDistance(null);
    setMessage("Preparing automatic office location verification...");
  }, [employeeId, attendance?._id, attendanceLoaded]);

  async function runAutoCheckIn(manual = false) {
    if (loading) return;
    if (!manual && alreadyCheckedIn) return;
    if (!manual && alreadyCheckedOut) return;

    setLoading(true);
    setStatus("loading");
    setMessage("Fetching your current location...");

    try {
      const location = await getCurrentLocation();

      setMessage("Validating office location and marking attendance...");

      const res = await fetch("/api/attendance/auto-check-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(location),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 409) {
          const apiMessage =
            data?.error ||
            data?.message ||
            "Attendance already exists for today.";

          if (
            String(apiMessage).toLowerCase().includes("checked out") ||
            String(apiMessage).toLowerCase().includes("completed")
          ) {
            setCheckedIn(false);
            setStatus("idle");
            setMessage("Today’s attendance has already been completed.");

            if (todayKey && typeof window !== "undefined") {
              localStorage.removeItem(todayKey);
            }

            await onSuccess?.();
            return;
          }

          setCheckedIn(true);
          setStatus("success");
          setMessage("You are already checked in for today.");

          if (todayKey && typeof window !== "undefined") {
            localStorage.setItem(todayKey, "done");
          }

          await onSuccess?.();
          return;
        }

        throw new Error(data?.error || data?.message || "Auto check-in failed");
      }

      setCheckedIn(true);
      setDistance(
        typeof data?.distanceFromOffice === "number"
          ? data.distanceFromOffice
          : null,
      );
      setStatus("success");
      setMessage("You have been checked in successfully.");

      if (todayKey && typeof window !== "undefined") {
        localStorage.setItem(todayKey, "done");
      }

      await onSuccess?.();
    } catch (error: any) {
      console.error("Auto check-in failed:", error);
      setCheckedIn(false);
      setStatus("error");
      setMessage(error?.message || "Auto check-in failed.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!attendanceLoaded) return;
    if (attemptedRef.current) return;

    attemptedRef.current = true;

    if (alreadyCheckedIn) {
      setCheckedIn(true);
      setStatus("success");
      setMessage("You are already checked in for today.");

      if (todayKey && typeof window !== "undefined") {
        localStorage.setItem(todayKey, "done");
      }

      return;
    }

    if (alreadyCheckedOut) {
      setCheckedIn(false);
      setStatus("idle");
      setMessage("Today’s attendance has already been completed.");

      if (todayKey && typeof window !== "undefined") {
        localStorage.removeItem(todayKey);
      }

      return;
    }

    if (todayKey && typeof window !== "undefined") {
      const alreadyAttemptedToday = localStorage.getItem(todayKey) === "done";

      if (alreadyAttemptedToday) {
        setCheckedIn(false);
        setStatus("idle");
        setMessage("Auto check-in was already attempted today.");
        return;
      }
    }

    runAutoCheckIn(false);
  }, [attendanceLoaded, todayKey, alreadyCheckedIn, alreadyCheckedOut]);

  return (
    <div
      className={
        checkedIn
          ? "relative overflow-hidden rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5 backdrop-blur-xl"
          : "rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl"
      }
    >
      {checkedIn ? (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_40%)]" />
      ) : null}

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3
              className={
                checkedIn
                  ? "flex items-center gap-2 text-lg font-semibold text-emerald-200"
                  : "flex items-center gap-2 text-lg font-semibold text-white"
              }
            >
              {checkedIn ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
              ) : (
                <MapPin className="h-5 w-5 text-fuchsia-300" />
              )}
              {checkedIn ? "Checked In Automatically" : "Auto Check-In"}
            </h3>

            <p
              className={
                checkedIn
                  ? "mt-1 text-sm text-emerald-100/80"
                  : "mt-1 text-sm text-white/60"
              }
            >
              {checkedIn
                ? "Your attendance has been marked based on your verified office location."
                : "Your location is being verified before attendance is marked."}
            </p>
          </div>

          {!checkedIn && status === "error" ? (
            <button
              type="button"
              onClick={() => runAutoCheckIn(true)}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"}
              />
              Retry
            </button>
          ) : checkedIn ? (
            <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-200">
              <Sparkles className="h-4 w-4" />
              Success
            </div>
          ) : null}
        </div>

        <div
          className={
            checkedIn
              ? "mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4"
              : "mt-4 rounded-xl border border-white/10 bg-black/20 p-4"
          }
        >
          <div className="flex items-start gap-3">
            {status === "success" ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
            ) : status === "error" ? (
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" />
            ) : status === "loading" ? (
              <RefreshCw className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-fuchsia-300" />
            ) : (
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-fuchsia-300" />
            )}

            <div>
              <p
                className={
                  status === "success"
                    ? "text-sm font-semibold text-emerald-200"
                    : status === "error"
                      ? "text-sm font-semibold text-rose-300"
                      : "text-sm font-semibold text-white"
                }
              >
                {message}
              </p>

              {status === "success" && distance !== null ? (
                <p className="mt-1 text-sm text-emerald-100/80">
                  Verified at approximately{" "}
                  <span className="font-semibold text-emerald-200">
                    {distance}m
                  </span>{" "}
                  from the office.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
