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
    <div className="min-h-screen bg-[#0a0510] text-white p-6 md:p-10">
      <div className="mb-10">
        <h1 className="text-3xl font-bold">Attendance</h1>
        <p className="text-gray-500 text-sm">
          Track your daily work hours and breaks
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <AttendanceStatus data={attendance} />
          <AttendanceClock refreshData={fetchAttendance} />
        </div>

        <div className="lg:col-span-7">
          <AttendanceHistory attendance={attendance} />
        </div>
      </div>

      <div className="mt-10">
        <AttendanceMonthly records={monthly} />
      </div>
    </div>
  );
}
