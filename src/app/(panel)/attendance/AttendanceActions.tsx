"use client";
import { Play, Coffee, LogOut } from "lucide-react";

export default function AttendanceActions({
  setAttendanceData,
  showToast,
}: any) {
  const handleRequest = async (path: string, type: string) => {
    // static ID for testing since you are not logged in
    const testEmpId = "65f1a2b3c4d5e6f7a8b9c0d1";

    try {
      const res = await fetch(path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Agar unauthenticated error aa rha hai toh yahan token paste karein testing ke liye
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ employeeId: testEmpId }),
      });

      const result = await res.json();

      if (result.success) {
        showToast(result.message, "success");
        // Re-fetch data or update UI
      } else {
        showToast(result.message || result.error || "Unauthenticated", "error");
      }
    } catch (err) {
      showToast("Server Error", "error");
    }
  };

  return (
    <div className="bg-[#120a1f] border border-[#1f142e] rounded-2xl p-4 space-y-3">
      <button
        onClick={() => handleRequest("/api/attendance/check-in", "in")}
        className="w-full bg-[#3b1e6d] hover:bg-[#4c2a8a] text-purple-200 font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all"
      >
        <Play size={20} fill="currentColor" /> Check In
      </button>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleRequest("/api/attendance/break-in", "break")}
          className="bg-[#1a102a] border border-purple-500/20 hover:bg-purple-500/10 text-gray-300 py-3 rounded-xl flex items-center justify-center gap-2"
        >
          <Coffee size={18} /> Break
        </button>
        <button
          onClick={() => handleRequest("/api/attendance/check-out", "out")}
          className="bg-[#1a102a] border border-red-500/20 hover:bg-red-500/10 text-red-400 py-3 rounded-xl flex items-center justify-center gap-2"
        >
          <LogOut size={18} /> Check Out
        </button>
      </div>
    </div>
  );
}
