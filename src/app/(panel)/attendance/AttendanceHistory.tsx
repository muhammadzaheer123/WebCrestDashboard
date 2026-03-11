"use client";

import { Clock } from "lucide-react";

const labelMeta: Record<string, { color: string; dot: string }> = {
  "Check In": {
    color: "text-violet-400",
    dot: "bg-violet-400 shadow-[0_0_6px_#a78bfa]",
  },
  "Break In": {
    color: "text-amber-400",
    dot: "bg-amber-400 shadow-[0_0_6px_#fbbf24]",
  },
  "Break Out": {
    color: "text-emerald-400",
    dot: "bg-emerald-400 shadow-[0_0_6px_#34d399]",
  },
  "Check Out": {
    color: "text-red-400",
    dot: "bg-red-400 shadow-[0_0_6px_#f87171]",
  },
};

export default function AttendanceHistory({ attendance }: any) {
  const logs: any[] = [];

  if (!attendance) {
    return (
      <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 mb-4">
          <Clock className="h-5 w-5 text-zinc-400" />
        </div>
        <p className="text-sm font-medium text-zinc-300">No activity yet</p>
        <p className="mt-1 text-xs text-zinc-500">
          Check in to start tracking your day.
        </p>
      </div>
    );
  }

  if (attendance.checkIn) {
    logs.push({ label: "Check In", time: attendance.checkIn });
  }

  if (attendance.breaks?.length) {
    attendance.breaks.forEach((b: any) => {
      if (b.breakIn) logs.push({ label: "Break In", time: b.breakIn });
      if (b.breakOut) logs.push({ label: "Break Out", time: b.breakOut });
    });
  }

  if (attendance.checkOut) {
    logs.push({ label: "Check Out", time: attendance.checkOut });
  }

  logs.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div>
          <h3 className="text-base font-semibold tracking-tight">
            Today's Activity
          </h3>
          <p className="mt-0.5 text-xs text-zinc-400">
            {logs.length} events recorded
          </p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10">
          <Clock className="h-4 w-4 text-zinc-300" />
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="p-8 text-center text-zinc-500 text-sm italic">
          No activity recorded yet
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {logs.map((log, i) => {
            const meta = labelMeta[log.label] ?? {
              color: "text-zinc-300",
              dot: "bg-zinc-400",
            };
            return (
              <div
                key={i}
                className="flex items-center justify-between px-5 py-3.5 transition hover:bg-white/5"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${meta.dot}`}
                  />
                  <span className={`text-sm font-medium ${meta.color}`}>
                    {log.label}
                  </span>
                </div>
                <span className="text-xs text-zinc-400 tabular-nums">
                  {new Date(log.time).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
