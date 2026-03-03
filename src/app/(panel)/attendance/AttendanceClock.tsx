"use client";
import { useState, useEffect } from "react";
import { Play, Coffee, LogOut, Clock } from "lucide-react";

export default function AttendanceClock({ attendance, refreshData }: any) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAction = async (actionType: string) => {
    // Agar login nahi ho toh testing ke liye static ID
    const empId = "65f1a2b3c4d5e6f7a8b9c0d1";
    const endpoints: any = {
      "check-in": "/api/attendance/check-in",
      "check-out": "/api/attendance/check-out",
      "break-in": "/api/attendance/break-in",
      "break-out": "/api/attendance/break-out",
    };

    try {
      const res = await fetch(endpoints[actionType], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: empId }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        refreshData(); // API se fresh data lao
      } else {
        alert(data.error || data.message);
      }
    } catch (err) {
      alert("API Error");
    }
  };

  // Determine current status based on API data
  const isCheckedIn = attendance?.checkIn && !attendance?.checkOut;
  const isOnBreak = attendance?.breaks?.some((b: any) => !b.breakOut);

  return (
    <div className="bg-[#120a1f] border border-[#1f142e] rounded-2xl p-8 shadow-2xl">
      <div className="flex justify-between items-center mb-8">
        <span className="text-gray-400 font-medium">Current Status</span>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${isCheckedIn ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : "bg-red-500"}`}
          ></div>
          <span className={isCheckedIn ? "text-green-500" : "text-red-500"}>
            {isOnBreak
              ? "On Break"
              : isCheckedIn
                ? "Checked In"
                : "Checked Out"}
          </span>
        </div>
      </div>

      <div className="mb-10">
        <div className="text-5xl font-bold tracking-tighter mb-2">
          {time.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })}
        </div>
        <div className="text-gray-500 text-xs tracking-widest uppercase">
          Last Activity:{" "}
          {attendance?.checkIn
            ? new Date(attendance.checkIn).toLocaleTimeString()
            : "--:--"}
        </div>
      </div>

      {/* Primary Purple Button (Matched to Screenshot) */}
      {!isCheckedIn ? (
        <button
          onClick={() => handleAction("check-in")}
          className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-purple-900/20"
        >
          <Play size={20} fill="currentColor" /> Check In
        </button>
      ) : (
        <div className="space-y-4">
          {!isOnBreak ? (
            <button
              onClick={() => handleAction("break-in")}
              className="w-full bg-[#1f142e] border border-purple-500/30 text-purple-400 hover:bg-purple-500 hover:text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all"
            >
              <Coffee size={20} /> Start Break
            </button>
          ) : (
            <button
              onClick={() => handleAction("break-out")}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all"
            >
              <Play size={20} fill="currentColor" /> End Break
            </button>
          )}
          <button
            onClick={() => handleAction("check-out")}
            className="w-full bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all"
          >
            <LogOut size={20} /> Check Out
          </button>
        </div>
      )}
    </div>
  );
}
