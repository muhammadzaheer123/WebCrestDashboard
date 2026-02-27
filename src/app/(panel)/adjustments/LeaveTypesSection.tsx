"use client";

import React, { useMemo, useState } from "react";
import { Plus, Trash2, Users } from "lucide-react";
import type { LeaveType } from "@/types/policy";
import { usePolicy } from "./usePolicy";
import {
  EmptyState,
  Field,
  GlassCard,
  Input,
  Toggle,
  clampInt,
  cryptoId,
} from "./ui";

export default function LeaveTypesSection({ query }: { query: string }) {
  const { state, setState } = usePolicy();
  if (!state) return null;

  const filteredLeaveTypes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return state.leaveTypes;
    return state.leaveTypes.filter((x) => x.name.toLowerCase().includes(q));
  }, [state.leaveTypes, query]);

  return (
    <GlassCard
      title="Leave Types"
      subtitle="Create leave types and set default rules."
      icon={Users}
      right={
        <AddLeaveType
          onAdd={(lt) =>
            setState((s) =>
              s ? { ...s, leaveTypes: [lt, ...s.leaveTypes] } : s,
            )
          }
        />
      }
    >
      <div className="space-y-3">
        {filteredLeaveTypes.length === 0 ? (
          <EmptyState
            title="No leave types found"
            subtitle="Try another search or add a leave type."
          />
        ) : (
          filteredLeaveTypes.map((lt) => (
            <div
              key={lt.id}
              className="rounded-2xl border border-white/10 bg-black/20 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-100">{lt.name}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Max/year: {lt.maxPerYear} • {lt.paid ? "Paid" : "Unpaid"} •{" "}
                    {lt.requiresApproval ? "Approval required" : "No approval"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Toggle
                    checked={lt.paid}
                    onChange={(v) =>
                      setState((s) =>
                        s
                          ? {
                              ...s,
                              leaveTypes: s.leaveTypes.map((x) =>
                                x.id === lt.id ? { ...x, paid: v } : x,
                              ),
                            }
                          : s,
                      )
                    }
                    label="Paid"
                  />
                  <Toggle
                    checked={lt.requiresApproval}
                    onChange={(v) =>
                      setState((s) =>
                        s
                          ? {
                              ...s,
                              leaveTypes: s.leaveTypes.map((x) =>
                                x.id === lt.id
                                  ? { ...x, requiresApproval: v }
                                  : x,
                              ),
                            }
                          : s,
                      )
                    }
                    label="Approval"
                  />
                  <button
                    onClick={() =>
                      setState((s) =>
                        s
                          ? {
                              ...s,
                              leaveTypes: s.leaveTypes.filter(
                                (x) => x.id !== lt.id,
                              ),
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
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Name">
                  <Input
                    value={lt.name}
                    onChange={(e) =>
                      setState((s) =>
                        s
                          ? {
                              ...s,
                              leaveTypes: s.leaveTypes.map((x) =>
                                x.id === lt.id
                                  ? { ...x, name: e.target.value }
                                  : x,
                              ),
                            }
                          : s,
                      )
                    }
                  />
                </Field>
                <Field label="Max per year">
                  <Input
                    type="number"
                    min={0}
                    value={lt.maxPerYear}
                    onChange={(e) =>
                      setState((s) =>
                        s
                          ? {
                              ...s,
                              leaveTypes: s.leaveTypes.map((x) =>
                                x.id === lt.id
                                  ? {
                                      ...x,
                                      maxPerYear: clampInt(
                                        e.target.value,
                                        0,
                                        365,
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

function AddLeaveType({ onAdd }: { onAdd: (lt: LeaveType) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [maxPerYear, setMaxPerYear] = useState(10);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-xs font-medium text-white shadow-lg shadow-violet-500/20 hover:opacity-95"
      >
        <Plus className="h-4 w-4" />
        Add leave type
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-10 w-[320px] rounded-2xl border border-white/10 bg-zinc-950/80 p-4 backdrop-blur-xl">
          <div className="text-sm font-medium">New Leave Type</div>
          <div className="mt-3 space-y-3">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Maternity Leave"
            />
            <Input
              type="number"
              min={0}
              value={maxPerYear}
              onChange={(e) => setMaxPerYear(Number(e.target.value || 0))}
              placeholder="Max per year"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (!name.trim()) return;
                  onAdd({
                    id: cryptoId(),
                    name: name.trim(),
                    paid: true,
                    requiresApproval: true,
                    maxPerYear: Math.max(0, maxPerYear),
                  });
                  setName("");
                  setMaxPerYear(10);
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
