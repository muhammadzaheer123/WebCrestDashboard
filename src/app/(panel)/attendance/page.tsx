"use client";
import React, { useState, useEffect } from "react";
import AttendanceStatus from "./AttendanceStatus";
import AttendanceActions from "./AttendanceActions";
import AttendanceLog from "./AttendanceLog";

export default function AttendancePage() {
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  // Custom Toast Function
  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0a0510] text-white p-6 md:p-10">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-20 right-5 z-50 px-6 py-3 rounded-lg border shadow-2xl transition-all animate-bounce ${
            toast.type === "success"
              ? "bg-green-500/20 border-green-500 text-green-400"
              : "bg-red-500 border-red-500 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="mb-10">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="mt-4">
          <h2 className="text-xl font-semibold text-gray-300">
            Attendance Management
          </h2>
          <p className="text-gray-500 text-sm">
            Track your daily work hours and breaks
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <AttendanceStatus data={attendanceData} />
          <AttendanceActions
            setAttendanceData={setAttendanceData}
            showToast={showToast}
          />
        </div>
        <div className="lg:col-span-7">
          <AttendanceLog data={attendanceData} />
        </div>
      </div>
    </div>
  );
}
