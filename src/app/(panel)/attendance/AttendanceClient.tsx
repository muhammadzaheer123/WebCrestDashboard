"use client";

import { useEffect, useState } from "react";
import AttendanceClock from "./AttendanceClock";
import AttendanceStatus from "./AttendanceStatus";
import AttendanceHistory from "./AttendanceHistory";
import AttendanceMonthly from "./AttendanceMonthly";

export default function AttendanceClient() {
  const [attendance, setAttendance] = useState<any>(null);
  const [monthly, setMonthly] = useState<any[]>([]);

  const fetchAttendance = async () => {
    const res = await fetch("/api/attendance/today");
    const data = await res.json();
    if (data.success) setAttendance(data.data);
  };

  const fetchMonthly = async () => {
    const res = await fetch("/api/attendance/history");
    const data = await res.json();
    if (data.success) setMonthly(data.data);
  };

  useEffect(() => {
    fetchAttendance();
    fetchMonthly();
  }, []);

  return (
    <div className="min-h-screen text-zinc-100">
      {/* Ambient background glows — matches dashboard */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute top-48 -left-40 h-[420px] w-[420px] rounded-full bg-fuchsia-600/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[520px] w-[520px] rounded-full bg-violet-500/10 blur-[140px]" />
      </div>

      <div className="relative mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Attendance</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Track your daily work hours and breaks
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-5">
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
