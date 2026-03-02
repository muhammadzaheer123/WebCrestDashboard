"use client";

import React, { useMemo, useState } from "react";
import { CalendarDays, Plus, Trash2 } from "lucide-react";
import type { Holiday } from "@/types/policy";
import { usePolicy } from "./usePolicy";
import { EmptyState, GlassCard, Input, cryptoId } from "./ui";

export default function HolidaysSection({ query }: { query: string }) {
  const { state, setState } = usePolicy();
  if (!state) return null;

  const filteredHolidays = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return state.holidays;
    return state.holidays.filter(
      (x) => x.title.toLowerCase().includes(q) || x.date.includes(q),
    );
  }, [state.holidays, query]);

  return (
    <GlassCard
      title="Company Holidays"
      subtitle="Dates here can be excluded from attendance calculations."
      icon={CalendarDays}
      right={
        <AddHoliday
          onAdd={(h) =>
            setState((s) => (s ? { ...s, holidays: [h, ...s.holidays] } : s))
          }
        />
      }
    >
      <div className="space-y-3">
        {filteredHolidays.length === 0 ? (
          <EmptyState
            title="No holidays found"
            subtitle="Add a holiday to get started."
          />
        ) : (
          filteredHolidays
            .slice()
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((h) => (
              <div
                key={h.id}
                className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-100">{h.title}</p>
                  <p className="mt-1 text-xs text-zinc-500">{h.date}</p>
                </div>
                <button
                  onClick={() =>
                    setState((s) =>
                      s
                        ? {
                            ...s,
                            holidays: s.holidays.filter((x) => x.id !== h.id),
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
            ))
        )}
      </div>
    </GlassCard>
  );
}

function AddHoliday({ onAdd }: { onAdd: (h: Holiday) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-xs font-medium text-white shadow-lg shadow-violet-500/20 hover:opacity-95"
      >
        <Plus className="h-4 w-4" />
        Add holiday
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-10 w-[320px] rounded-2xl border border-white/10 bg-zinc-950/80 p-4 backdrop-blur-xl">
          <div className="text-sm font-medium">New Holiday</div>
          <div className="mt-3 space-y-3">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Independence Day"
            />
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (!title.trim() || !date) return;
                  onAdd({ id: cryptoId(), title: title.trim(), date });
                  setTitle("");
                  setDate("");
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
