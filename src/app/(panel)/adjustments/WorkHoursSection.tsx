"use client";

import { Clock, Settings2 } from "lucide-react";
import { usePolicy } from "./usePolicy";
import { GlassCard, Field, Input, clampInt } from "./ui";

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
            <span className="text-zinc-400">Grace window</span>
            <span className="font-medium text-zinc-100">
              {state.graceMinutes} min
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
