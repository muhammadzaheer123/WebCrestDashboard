"use client";

import React, { useMemo, useState } from "react";
import {
  CalendarDays,
  ClipboardList,
  Clock,
  Save,
  Settings2,
  Users,
} from "lucide-react";
import { usePolicy } from "./usePolicy";
import { cx } from "./ui";

import AttendanceSection from "./AttendanceSection";
import LeaveTypesSection from "./LeaveTypesSection";
import HolidaysSection from "./HolidaysSection";
import ShiftsSection from "./ShiftsSection";
import WorkHoursSection from "./WorkHoursSection";

const tabs = [
  { key: "work", label: "Work Hours", icon: Clock },
  { key: "attendance", label: "Attendance Rules", icon: ClipboardList },
  { key: "leaves", label: "Leave Types", icon: Users },
  { key: "holidays", label: "Holidays", icon: CalendarDays },
  { key: "shifts", label: "Shift Templates", icon: Settings2 },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export default function AdjustmentsShell() {
  const { state, loading, dirty, savedAt, save, reset } = usePolicy();
  const [activeTab, setActiveTab] = useState<TabKey>("work");
  const [query, setQuery] = useState("");

  const q = useMemo(() => query.trim().toLowerCase(), [query]);

  if (loading || !state) {
    return <div className="p-6 text-zinc-300">Loading adjustments...</div>;
  }

  return (
    <div className="min-h-screen text-zinc-100">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute top-48 -left-40 h-[420px] w-[420px] rounded-full bg-fuchsia-600/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[520px] w-[520px] rounded-full bg-violet-500/10 blur-[140px]" />
      </div>

      <div className="relative mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Adjustments
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Configure HR policies: work hours, attendance rules, leave types,
              and shifts.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-[340px]">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                🔎
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search leave types, holidays, shifts..."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-10 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none backdrop-blur-xl transition focus:border-violet-500/40 focus:ring-4 focus:ring-violet-500/15"
              />
            </div>

            <button
              onClick={save}
              className={cx(
                "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/20 transition",
                dirty
                  ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:opacity-95"
                  : "bg-white/10 text-zinc-300 shadow-none hover:bg-white/12",
              )}
            >
              <Save className="h-4 w-4" />
              Save
            </button>
          </div>
        </div>

        {/* Status strip */}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-zinc-400">
            {dirty ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-400/80" />
                Unsaved changes
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
                All changes saved
              </span>
            )}
            {savedAt ? (
              <span className="ml-2 text-zinc-500">
                • Last saved {new Date(savedAt).toLocaleTimeString()}
              </span>
            ) : null}
          </div>

          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-200 hover:bg-white/7"
          >
            Reset to default
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-6 inline-flex w-full flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/20 p-2 backdrop-blur-xl">
          {tabs.map((t) => {
            const active = t.key === activeTab;
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={cx(
                  "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition",
                  active
                    ? "bg-white/10 text-zinc-100 shadow-sm"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200",
                )}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {activeTab === "work" && <WorkHoursSection />}
          {activeTab === "attendance" && <AttendanceSection />}
          {activeTab === "leaves" && <LeaveTypesSection query={q} />}
          {activeTab === "holidays" && <HolidaysSection query={q} />}
          {activeTab === "shifts" && <ShiftsSection query={q} />}
        </div>
      </div>
    </div>
  );
}
