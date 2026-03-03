"use client";
import React, { useState, useEffect } from "react";

export default function AttendanceStatus({ data }: any) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isCheckedIn = data?.checkIn && !data?.checkOut;

  return (
    <div className="bg-[#120a1f] border border-[#1f142e] rounded-2xl p-8 shadow-xl relative overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <span className="text-gray-400 text-sm font-medium">
          Current Status
        </span>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${isCheckedIn ? "bg-green-500 shadow-[0_0_10px_green]" : "bg-red-500 shadow-[0_0_10px_red]"}`}
          ></div>
          <span className={isCheckedIn ? "text-green-500" : "text-red-500"}>
            {isCheckedIn ? "Checked In" : "Checked Out"}
          </span>
        </div>
      </div>

      <div className="text-6xl font-bold tracking-tighter mb-2">
        {currentTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })}
      </div>
      <p className="text-gray-500 text-xs tracking-widest uppercase">
        LAST ACTIVITY:{" "}
        {data?.checkIn ? new Date(data.checkIn).toLocaleTimeString() : "--:--"}
      </p>
    </div>
  );
}
