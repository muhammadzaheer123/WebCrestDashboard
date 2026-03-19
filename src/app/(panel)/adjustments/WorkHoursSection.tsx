"use client";

import { Clock, DollarSign, Settings2 } from "lucide-react";
import { usePolicy } from "./usePolicy";
import { GlassCard, Field, Input, Select, clampInt } from "./ui";

const DAYS_OF_WEEK = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
];

export default function WorkHoursSection() {
  const { state, setState } = usePolicy();
  if (!state) return null;

  return (
    <>
      <GlassCard
        title="Workday Timing"
        subtitle="Define default check-in and check-out times."
        icon={Clock}
        right={
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-zinc-400">
            Defaults
          </span>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Workday start" helper="Default check-in time">
            <Input
              type="time"
              value={state.workdayStart}
              onChange={(e) =>
                setState((s) =>
                  s ? { ...s, workdayStart: e.target.value } : s,
                )
              }
            />
          </Field>
          <Field label="Workday end" helper="Default check-out time">
            <Input
              type="time"
              value={state.workdayEnd}
              onChange={(e) =>
                setState((s) => (s ? { ...s, workdayEnd: e.target.value } : s))
              }
            />
          </Field>
          <Field
            label="Full-day minutes"
            helper="Minutes required for a full working day"
          >
            <Input
              type="number"
              min={60}
              max={1440}
              value={state.fullDayMinutes ?? 480}
              onChange={(e) =>
                setState((s) =>
                  s
                    ? {
                        ...s,
                        fullDayMinutes: clampInt(e.target.value, 60, 1440),
                      }
                    : s,
                )
              }
            />
          </Field>
          <Field
            label="Half-day minutes"
            helper="Minutes required for a half-day to be counted"
          >
            <Input
              type="number"
              min={30}
              max={720}
              value={state.halfDayMinutes ?? 240}
              onChange={(e) =>
                setState((s) =>
                  s
                    ? {
                        ...s,
                        halfDayMinutes: clampInt(e.target.value, 30, 720),
                      }
                    : s,
                )
              }
            />
          </Field>
          <Field
            label="Grace time (minutes)"
            helper="Allowed late minutes without penalty"
          >
            <Input
              type="number"
              min={0}
              value={state.graceMinutes}
              onChange={(e) =>
                setState((s) =>
                  s
                    ? { ...s, graceMinutes: clampInt(e.target.value, 0, 180) }
                    : s,
                )
              }
            />
          </Field>
        </div>

        {/* Weekend day picker */}
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-zinc-400">
            Weekend days{" "}
            <span className="text-zinc-600">
              (company-paid, no attendance required)
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map((d) => {
              const isWeekend = (state.weekends ?? []).includes(d.value);
              return (
                <button
                  key={d.value}
                  type="button"
                  onClick={() =>
                    setState((s) => {
                      if (!s) return s;
                      const current = s.weekends ?? [];
                      const next = isWeekend
                        ? current.filter((v) => v !== d.value)
                        : [...current, d.value].sort((a, b) => a - b);
                      return { ...s, weekends: next };
                    })
                  }
                  className={[
                    "rounded-xl border px-4 py-2 text-xs font-medium transition",
                    isWeekend
                      ? "border-violet-500/40 bg-violet-500/20 text-violet-300"
                      : "border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10",
                  ].join(" ")}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>
      </GlassCard>

      <GlassCard
        title="Salary Calculation Mode"
        subtitle="Choose how employee salaries are computed from attendance data."
        icon={DollarSign}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Calculation mode"
            helper="Per-day deducts full/half days. Per-hour earns based on exact hours worked."
          >
            <Select
              value={state.salaryCalculationMode ?? "per-day"}
              onChange={(e) =>
                setState((s) =>
                  s
                    ? {
                        ...s,
                        salaryCalculationMode: e.target.value as
                          | "per-day"
                          | "per-hour",
                      }
                    : s,
                )
              }
            >
              <option value="per-day">Per Day (deduction-based)</option>
              <option value="per-hour">Per Hour (hourly-based)</option>
            </Select>
          </Field>

          {state.salaryCalculationMode === "per-hour" && (
            <>
              <Field
                label="Overtime enabled"
                helper="Allow earning extra pay for hours beyond the shift requirement"
              >
                <Select
                  value={state.overtimeEnabled ? "yes" : "no"}
                  onChange={(e) =>
                    setState((s) =>
                      s
                        ? { ...s, overtimeEnabled: e.target.value === "yes" }
                        : s,
                    )
                  }
                >
                  <option value="no">Disabled</option>
                  <option value="yes">Enabled</option>
                </Select>
              </Field>

              {state.overtimeEnabled && (
                <Field
                  label="Overtime multiplier"
                  helper="e.g., 1.5 = 1.5× the hourly rate for overtime hours"
                >
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    step={0.1}
                    value={state.overtimeMultiplier ?? 1.5}
                    onChange={(e) =>
                      setState((s) =>
                        s
                          ? {
                              ...s,
                              overtimeMultiplier: Math.max(
                                1,
                                parseFloat(e.target.value) || 1.5,
                              ),
                            }
                          : s,
                      )
                    }
                  />
                </Field>
              )}
            </>
          )}
        </div>

        {state.salaryCalculationMode === "per-hour" && (
          <div className="mt-4 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4 text-sm text-zinc-300">
            <p className="text-xs font-medium text-violet-300">
              Per-Hour Mode Active
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Salary is calculated as:{" "}
              <span className="font-mono text-zinc-300">
                perHourRate = (baseSalary / workingDays) / (
                {state.fullDayMinutes ?? 480} min ÷ 60)
              </span>
              . Each day&apos;s pay equals actual hours worked × perHourRate
              {state.overtimeEnabled &&
                ` (overtime beyond shift hours × ${state.overtimeMultiplier ?? 1.5}×)`}
              .
            </p>
          </div>
        )}
      </GlassCard>

      <GlassCard
        title="Policy Preview"
        subtitle="This is what the system will enforce by default."
        icon={Settings2}
      >
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Default work hours</span>
            <span className="font-medium text-zinc-100">
              {state.workdayStart} – {state.workdayEnd}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-zinc-400">Weekends (paid)</span>
            <span className="font-medium text-zinc-100">
              {(state.weekends ?? []).length === 0
                ? "None (all days working)"
                : (state.weekends ?? [])
                    .map((d) => DAYS_OF_WEEK.find((x) => x.value === d)?.label)
                    .filter(Boolean)
                    .join(", ")}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-zinc-400">Full-day / Half-day threshold</span>
            <span className="font-medium text-zinc-100">
              {state.fullDayMinutes ?? 480}m / {state.halfDayMinutes ?? 240}m
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-zinc-400">Grace window</span>
            <span className="font-medium text-zinc-100">
              {state.graceMinutes} min
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-zinc-400">Salary mode</span>
            <span className="font-medium text-zinc-100">
              {state.salaryCalculationMode === "per-hour"
                ? `Per Hour${state.overtimeEnabled ? ` · OT ${state.overtimeMultiplier ?? 1.5}×` : ""}`
                : "Per Day"}
            </span>
          </div>
          <div className="mt-3 text-xs text-zinc-500">
            Tip: later you can override these per employee or per shift
            template.
          </div>
        </div>
      </GlassCard>
    </>
  );
}
