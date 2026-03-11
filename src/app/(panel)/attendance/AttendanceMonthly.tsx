"use client";

import { CalendarDays } from "lucide-react";

export default function AttendanceMonthly({ records }: any) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div>
          <h3 className="text-base font-semibold tracking-tight">
            Monthly Attendance
          </h3>
          <p className="mt-0.5 text-xs text-zinc-400">
            {records?.length ?? 0} records this month
          </p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10">
          <CalendarDays className="h-4 w-4 text-zinc-300" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 bg-black/40 backdrop-blur-xl">
            <tr className="text-xs text-zinc-400">
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Check In</th>
              <th className="px-5 py-3 font-medium">Check Out</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>

          <tbody>
            {!records?.length ? (
              <tr>
                <td colSpan={4} className="px-5 py-12">
                  <div className="mx-auto flex max-w-xs flex-col items-center text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 mb-4">
                      <CalendarDays className="h-5 w-5 text-zinc-400" />
                    </div>
                    <p className="text-sm font-medium text-zinc-300">
                      No records found
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Attendance history will appear here.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              records.map((row: any, i: number) => {
                const hasCheckOut = !!row.checkOut;
                return (
                  <tr
                    key={i}
                    className="border-t border-white/5 transition hover:bg-white/5"
                  >
                    <td className="px-5 py-3.5 text-zinc-200 text-xs font-medium">
                      {new Date(row.date).toLocaleDateString([], {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-400 text-xs tabular-nums">
                      {row.checkIn ? (
                        new Date(row.checkIn).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-400 text-xs tabular-nums">
                      {row.checkOut ? (
                        new Date(row.checkOut).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {hasCheckOut ? (
                        <span className="inline-flex rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">
                          Complete
                        </span>
                      ) : row.checkIn ? (
                        <span className="inline-flex rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-400">
                          Absent
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-white/10 px-5 py-3 text-xs text-zinc-400">
        <span>{records?.length ?? 0} records total</span>
      </div>
    </div>
  );
}
