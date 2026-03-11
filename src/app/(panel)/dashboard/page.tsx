import { requireRole } from "@/lib/server/roleGuard";
import {
  Boxes,
  Hourglass,
  LucideIcon,
  MailSearch,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import React from "react";

const stats: Array<{
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
}> = [
  {
    label: "System Status",
    value: "Healthy",
    helper: "Auth, DB, APIs operating",
    icon: ShieldCheck,
  },
  {
    label: "Employees",
    value: "—",
    helper: "Total employees (from API)",
    icon: Users,
  },
  {
    label: "Attendance",
    value: "—",
    helper: "Today’s activity",
    icon: TrendingUp,
  },
  {
    label: "Pending Leaves",
    value: "—",
    helper: "Requests awaiting review",
    icon: Hourglass,
  },
];

const tabs = ["Pending", "Approved", "Rejected", "All"] as const;

export default async function DashboardPage() {
  await requireRole(["admin", "hr"]);
  return (
    <div className="min-h-screen text-zinc-100">
      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute top-48 -left-40 h-[420px] w-[420px] rounded-full bg-fuchsia-600/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[520px] w-[520px] rounded-full bg-violet-500/10 blur-[140px]" />
      </div>

      <div className="relative mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Overview of HR activities, employees, and status.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-[340px]">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                🔎
              </span>
              <input
                placeholder="Search employees, leaves, reasons..."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-10 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none backdrop-blur-xl transition focus:border-violet-500/40 focus:ring-4 focus:ring-violet-500/15"
              />
            </div>

            <button className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/20 transition hover:opacity-95">
              + New Request
            </button>
          </div>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl transition hover:bg-white/7"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-zinc-400">
                      {s.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight">
                      {s.value}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">{s.helper}</p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 shadow-sm shadow-violet-500/10">
                    <Icon className="h-5 w-5 text-zinc-200" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Leaves Overview */}
        <div className="mt-7 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                Leaves Overview
              </h2>
              <p className="mt-1 text-xs text-zinc-400">
                Quick access to leave requests module
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Tabs */}
              <div className="inline-flex rounded-xl border border-white/10 bg-black/20 p-1">
                {tabs.map((t, idx) => {
                  const active = idx === 0; // set your state here
                  return (
                    <button
                      key={t}
                      className={[
                        "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                        active
                          ? "bg-white/10 text-zinc-100 shadow-sm"
                          : "text-zinc-400 hover:text-zinc-200",
                      ].join(" ")}
                    >
                      {t} <span className="ml-1 text-zinc-500">(0)</span>
                    </button>
                  );
                })}
              </div>

              {/* Search inside module */}
              <input
                placeholder="Search reason, type, employee..."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none backdrop-blur-xl transition focus:border-violet-500/40 focus:ring-4 focus:ring-violet-500/15 sm:w-[320px]"
              />
            </div>
          </div>

          {/* Table */}
          <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-0 bg-black/40 backdrop-blur-xl">
                  <tr className="text-xs text-zinc-400">
                    <th className="px-5 py-3 font-medium">Employee</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">Dates</th>
                    <th className="px-5 py-3 font-medium">Days</th>
                    <th className="px-5 py-3 font-medium">Reason</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {/* Empty State */}
                  <tr>
                    <td colSpan={7} className="px-5 py-14">
                      <div className="mx-auto flex max-w-md flex-col items-center text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 text-xl">
                          <span>
                            <MailSearch />
                          </span>
                        </div>
                        <p className="mt-4 text-sm font-medium text-zinc-200">
                          No requests found
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          Try changing filters or create a new leave request.
                        </p>
                        <div className="mt-5 flex gap-3">
                          <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-200 hover:bg-white/7">
                            Reset filters
                          </button>
                          <button className="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-xs font-medium text-white shadow-lg shadow-violet-500/20 hover:opacity-95">
                            Create request
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* Example row (remove when you wire data) */}
                  {/*
                  <tr className="border-t border-white/5 hover:bg-white/5">
                    <td className="px-5 py-4">John Doe</td>
                    <td className="px-5 py-4">Sick</td>
                    <td className="px-5 py-4">Feb 10 - Feb 12</td>
                    <td className="px-5 py-4">3</td>
                    <td className="px-5 py-4 text-zinc-300">Flu</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-amber-500/15 px-2 py-1 text-xs font-medium text-amber-300">
                        Pending
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/7">
                        Review
                      </button>
                    </td>
                  </tr>
                  */}
                </tbody>
              </table>
            </div>

            {/* Footer / Pagination */}
            <div className="flex items-center justify-between border-t border-white/10 px-5 py-3 text-xs text-zinc-400">
              <span>Page 1 of 1 • 0 results</span>
              <div className="flex gap-2">
                <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-zinc-300 hover:bg-white/7">
                  Prev
                </button>
                <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-zinc-300 hover:bg-white/7">
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Optional: small “Quick tip” card */}
        <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 text-sm backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15 text-lg">
              💡
            </div>
            <div>
              <p className="font-medium text-zinc-200">Quick tip</p>
              <p className="text-xs text-zinc-500">
                Use the search to quickly find requests & employees.
              </p>
            </div>
          </div>
          <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-200 hover:bg-white/7">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
