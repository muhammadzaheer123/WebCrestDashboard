"use client";

import { useMemo, useState } from "react";

function daysInclusive(start?: string, end?: string) {
  if (!start || !end) return 0;
  const s = new Date(start);
  s.setHours(0, 0, 0, 0);
  const e = new Date(end);
  e.setHours(0, 0, 0, 0);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 0;
  if (s > e) return 0;
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

export default function LeaveRequestPage() {
  const [type, setType] = useState("Casual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null,
  );

  const days = useMemo(
    () => daysInclusive(startDate, endDate),
    [startDate, endDate],
  );
  const monthKey = useMemo(
    () => (startDate ? startDate.slice(0, 7) : ""),
    [startDate],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!startDate || !endDate || !reason.trim()) {
      setMsg({ type: "err", text: "Please fill all required fields." });
      return;
    }
    if (days <= 0) {
      setMsg({ type: "err", text: "Dates are invalid." });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, startDate, endDate, reason }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to submit");

      setMsg({ type: "ok", text: "Leave request submitted successfully." });
      setStartDate("");
      setEndDate("");
      setReason("");
      setType("Casual");
    } catch (err: any) {
      setMsg({ type: "err", text: err.message || "Something went wrong" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Request Leave</h1>
        <p className="text-white/60">
          Submit your leave request with dates and reason.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2 grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm text-white/70">Leave Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none"
              >
                <option>Casual</option>
                <option>Sick</option>
                <option>Annual</option>
                <option>Unpaid</option>
                <option>Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-white/70">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-white/70">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none"
              />
            </div>
          </div>

          <div className="md:col-span-2 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-black/10 p-3">
              <div className="text-xs text-white/60">Month</div>
              <div className="text-white">{monthKey || "-"}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/10 p-3">
              <div className="text-xs text-white/60">Total Days</div>
              <div className="text-white">{days || "-"}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/10 p-3">
              <div className="text-xs text-white/60">Status</div>
              <div className="text-white">Pending (after submit)</div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-sm text-white/70">Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none"
              placeholder="Write your reason..."
            />
          </div>

          <div className="md:col-span-2 flex items-center justify-between gap-3">
            {msg ? (
              <div
                className={`text-sm ${msg.type === "ok" ? "text-emerald-300" : "text-red-300"}`}
              >
                {msg.text}
              </div>
            ) : (
              <div />
            )}

            <button
              disabled={loading}
              className="rounded-xl bg-fuchsia-600 px-4 py-2 text-sm font-medium text-white hover:bg-fuchsia-500 disabled:opacity-60"
            >
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
