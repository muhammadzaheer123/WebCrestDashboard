"use client";

import React, { useMemo, useState } from "react";
import { Plus, Settings2, Trash2 } from "lucide-react";
import type { ShiftTemplate } from "@/types/policy";
import { usePolicy } from "./usePolicy";
import { EmptyState, Field, GlassCard, Input, clampInt, cryptoId } from "./ui";

export default function ShiftsSection({ query }: { query: string }) {
  const { state, setState } = usePolicy();
  if (!state) return null;

  const filteredShifts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return state.shifts;
    return state.shifts.filter((x) => x.name.toLowerCase().includes(q));
  }, [state.shifts, query]);

  return (
    <GlassCard
      title="Shift Templates"
      subtitle="Use templates to assign standard timings for teams/employees."
      icon={Settings2}
      right={
        <AddShift
          onAdd={(shift) =>
            setState((s) => (s ? { ...s, shifts: [shift, ...s.shifts] } : s))
          }
        />
      }
    >
      <div className="space-y-3">
        {filteredShifts.length === 0 ? (
          <EmptyState
            title="No shift templates found"
            subtitle="Add a shift template to get started."
          />
        ) : (
          filteredShifts.map((sh) => (
            <div
              key={sh.id}
              className="rounded-2xl border border-white/10 bg-black/20 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-100">{sh.name}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {sh.start} – {sh.end} • Break: {sh.breakMinutes} min
                  </p>
                </div>
                <button
                  onClick={() =>
                    setState((s) =>
                      s
                        ? {
                            ...s,
                            shifts: s.shifts.filter((x) => x.id !== sh.id),
                          }
                        : s,
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-white/7"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Name">
                  <Input
                    value={sh.name}
                    onChange={(e) =>
                      setState((s) =>
                        s
                          ? {
                              ...s,
                              shifts: s.shifts.map((x) =>
                                x.id === sh.id
                                  ? { ...x, name: e.target.value }
                                  : x,
                              ),
                            }
                          : s,
                      )
                    }
                  />
                </Field>
                <Field label="Start">
                  <Input
                    type="time"
                    value={sh.start}
                    onChange={(e) =>
                      setState((s) =>
                        s
                          ? {
                              ...s,
                              shifts: s.shifts.map((x) =>
                                x.id === sh.id
                                  ? { ...x, start: e.target.value }
                                  : x,
                              ),
                            }
                          : s,
                      )
                    }
                  />
                </Field>
                <Field label="End">
                  <Input
                    type="time"
                    value={sh.end}
                    onChange={(e) =>
                      setState((s) =>
                        s
                          ? {
                              ...s,
                              shifts: s.shifts.map((x) =>
                                x.id === sh.id
                                  ? { ...x, end: e.target.value }
                                  : x,
                              ),
                            }
                          : s,
                      )
                    }
                  />
                </Field>
                <Field label="Break (minutes)">
                  <Input
                    type="number"
                    min={0}
                    value={sh.breakMinutes}
                    onChange={(e) =>
                      setState((s) =>
                        s
                          ? {
                              ...s,
                              shifts: s.shifts.map((x) =>
                                x.id === sh.id
                                  ? {
                                      ...x,
                                      breakMinutes: clampInt(
                                        e.target.value,
                                        0,
                                        300,
                                      ),
                                    }
                                  : x,
                              ),
                            }
                          : s,
                      )
                    }
                  />
                </Field>
              </div>
            </div>
          ))
        )}
      </div>
    </GlassCard>
  );
}

function AddShift({ onAdd }: { onAdd: (s: ShiftTemplate) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("18:00");
  const [breakMinutes, setBreakMinutes] = useState(60);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-xs font-medium text-white shadow-lg shadow-violet-500/20 hover:opacity-95"
      >
        <Plus className="h-4 w-4" />
        Add shift
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-10 w-[340px] rounded-2xl border border-white/10 bg-zinc-950/80 p-4 backdrop-blur-xl">
          <div className="text-sm font-medium">New Shift Template</div>
          <div className="mt-3 space-y-3">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Night Shift"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
              <Input
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>
            <Input
              type="number"
              min={0}
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(Number(e.target.value || 0))}
              placeholder="Break minutes"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (!name.trim()) return;
                  onAdd({
                    id: cryptoId(),
                    name: name.trim(),
                    start,
                    end,
                    breakMinutes: Math.max(0, breakMinutes),
                  });
                  setName("");
                  setStart("09:00");
                  setEnd("18:00");
                  setBreakMinutes(60);
                  setOpen(false);
                }}
                className="flex-1 rounded-xl bg-white/10 px-3 py-2 text-xs font-medium text-zinc-100 hover:bg-white/12"
              >
                Add
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-white/7"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
