"use client";
import React, { useState, useEffect } from "react";

export default function AttendanceStatus({ data }: any) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isCheckedIn = data?.checkIn && !data?.checkOut;
  const isOnBreak = data?.breaks?.some((b: any) => !b.breakOut);

  const statusText = isOnBreak
    ? "On Break"
    : isCheckedIn
      ? "Checked In"
      : "Checked Out";

  const statusColor = isOnBreak
    ? "text-amber-400"
    : isCheckedIn
      ? "text-emerald-400"
      : "text-red-400";

  const dotColor = isOnBreak
    ? "bg-amber-400 shadow-[0_0_8px_#fbbf24]"
    : isCheckedIn
      ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
      : "bg-red-400 shadow-[0_0_8px_#f87171]";

  const glowBg = isOnBreak
    ? "from-amber-500/10 to-transparent"
    : isCheckedIn
      ? "from-emerald-500/10 to-transparent"
      : "from-red-500/10 to-transparent";

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      {/* Subtle status glow overlay */}
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${glowBg}`}
      />

      <div className="relative">
        <div className="flex items-center justify-between mb-5">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-widest">
            Current Status
          </p>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5">
            <div className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
            <span className={`text-xs font-medium ${statusColor}`}>
              {statusText}
            </span>
          </div>
        </div>

        <div className="text-5xl font-semibold tracking-tight tabular-nums mb-2">
          {currentTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          })}
        </div>

        <p className="text-xs text-zinc-500 uppercase tracking-widest mt-3">
          Last Activity:{" "}
          <span className="text-zinc-400">
            {data?.checkIn
              ? new Date(data.checkIn).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "--:--"}
          </span>
        </p>
      </div>
    </div>
  );
}
