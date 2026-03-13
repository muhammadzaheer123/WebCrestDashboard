"use client";

import { useEffect, useState } from "react";
import AttendanceClock from "./AttendanceClock";
import AttendanceStatus from "./AttendanceStatus";
import AttendanceHistory from "./AttendanceHistory";
import AttendanceMonthly from "./AttendanceMonthly";
import AutoCheckInCard from "./AutoCheckInCard";

export default function AttendanceClient() {
  const [attendance, setAttendance] = useState<any>(null);
  const [monthly, setMonthly] = useState<any[]>([]);
  const [attendanceLoaded, setAttendanceLoaded] = useState(false);

  const fetchAttendance = async () => {
    try {
      const res = await fetch("/api/attendance/today", { cache: "no-store" });
      const data = await res.json();

      if (data.success) {
        setAttendance(data.data ?? null);
      } else {
        setAttendance(null);
      }
    } catch (error) {
      console.error("Failed to fetch today's attendance:", error);
      setAttendance(null);
    } finally {
      setAttendanceLoaded(true);
    }
  };

  const fetchMonthly = async () => {
    try {
      const res = await fetch("/api/attendance/history", { cache: "no-store" });
      const data = await res.json();

      if (data.success) {
        setMonthly(data.data ?? []);
      } else {
        setMonthly([]);
      }
    } catch (error) {
      console.error("Failed to fetch monthly attendance:", error);
      setMonthly([]);
    }
  };

  const refreshData = async () => {
    await Promise.all([fetchAttendance(), fetchMonthly()]);
  };

  useEffect(() => {
    refreshData();
  }, []);

  return (
    <div className="min-h-screen text-zinc-100">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute top-48 -left-40 h-[420px] w-[420px] rounded-full bg-fuchsia-600/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[520px] w-[520px] rounded-full bg-violet-500/10 blur-[140px]" />
      </div>

      <div className="relative mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Attendance</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Track your daily work hours and breaks
          </p>
        </div>

        <div className="mb-6">
          <AutoCheckInCard
            attendance={attendance}
            attendanceLoaded={attendanceLoaded}
            onSuccess={fetchAttendance}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-5">
            <AttendanceStatus data={attendance} />
            <AttendanceClock refreshData={fetchAttendance} />
          </div>

          <div className="lg:col-span-7">
            <AttendanceHistory attendance={attendance} />
          </div>
        </div>

        <div className="mt-6">
          <AttendanceMonthly records={monthly} />
        </div>
      </div>
    </div>
  );
}
