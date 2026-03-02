"use client";

import { ClipboardList, Clock } from "lucide-react";
import { usePolicy } from "./usePolicy";
import { GlassCard, Field, Input, Select, clampInt } from "./ui";

export default function AttendanceSection() {
  const { state, setState } = usePolicy();
  if (!state) return null;

  return (
    <>
      <GlassCard
        title="Attendance Thresholds"
        subtitle="Define late, half-day, and absent rules."
        icon={ClipboardList}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Late after (minutes)" helper="After grace time">
            <Input
              type="number"
              min={0}
              value={state.lateAfterMinutes}
              onChange={(e) =>
                setState((s) =>
                  s
                    ? {
                        ...s,
                        lateAfterMinutes: clampInt(e.target.value, 0, 600),
                      }
                    : s,
                )
              }
            />
          </Field>

          <Field
            label="Half-day after (minutes)"
            helper="Late duration threshold"
          >
            <Input
              type="number"
              min={0}
              value={state.halfDayAfterMinutes}
              onChange={(e) =>
                setState((s) =>
                  s
                    ? {
                        ...s,
                        halfDayAfterMinutes: clampInt(e.target.value, 0, 1440),
                      }
                    : s,
                )
              }
            />
          </Field>

          <Field
            label="Absent after (minutes)"
            helper="Late duration threshold"
          >
            <Input
              type="number"
              min={0}
              value={state.absentAfterMinutes}
              onChange={(e) =>
                setState((s) =>
                  s
                    ? {
                        ...s,
                        absentAfterMinutes: clampInt(e.target.value, 0, 1440),
                      }
                    : s,
                )
              }
            />
          </Field>

          <Field label="Enforcement mode" helper="How strict should it be?">
            <Select defaultValue="standard" onChange={() => {}}>
              <option value="standard">Standard</option>
              <option value="strict">Strict</option>
              <option value="lenient">Lenient</option>
            </Select>
          </Field>
        </div>
      </GlassCard>

      <GlassCard
        title="Example Evaluation"
        subtitle="If someone checks in late..."
        icon={Clock}
      >
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-200">
          <p className="text-xs text-zinc-400">
            Example (workday start: {state.workdayStart})
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex items-center justify-between">
              <span className="text-zinc-300">09:08</span>
              <span className="text-emerald-200">On time (within grace)</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-zinc-300">09:25</span>
              <span className="text-amber-200">Late</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-zinc-300">11:30</span>
              <span className="text-orange-200">Half-day</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-zinc-300">13:30</span>
              <span className="text-red-200">Absent</span>
            </li>
          </ul>
        </div>
      </GlassCard>
    </>
  );
}
