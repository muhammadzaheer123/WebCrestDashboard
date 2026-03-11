"use client";

import { useEffect, useMemo, useState } from "react";

type Leave = {
  _id: string;
  employeeName: string;
  employeeEmail: string;
  type: string;
  startDate: string;
  endDate: string;
  monthKey: string;
  days: number;
  reason: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  createdAt: string;
  hrComment?: string;
};

const statusTabs = ["pending", "approved", "rejected", "all"] as const;

export default function LeaveManagePage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [status, setStatus] = useState<(typeof statusTabs)[number]>("pending");
  const [monthKey, setMonthKey] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const sp = new URLSearchParams();
    sp.set("status", status);
    if (monthKey) sp.set("monthKey", monthKey);
    if (q) sp.set("q", q);

    const res = await fetch(`/api/leaves?${sp.toString()}`, {
      cache: "no-store",
    });
    const data = await res.json();
    setLeaves(data.leaves || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [status, monthKey]);

  async function decide(id: string, nextStatus: "approved" | "rejected") {
    const hrComment =
      prompt(
        nextStatus === "rejected"
          ? "Rejection reason (optional):"
          : "Comment (optional):",
      ) ?? "";
    const res = await fetch(`/api/leaves/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus, hrComment }),
    });
    if (res.ok) load();
  }

  const monthOptions = useMemo(() => {
    // quick options last 12 months (simple)
    const out: string[] = [];
    const d = new Date();
    d.setDate(1);
    for (let i = 0; i < 12; i++) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      out.push(`${y}-${m}`);
      d.setMonth(d.getMonth() - 1);
    }
    return out;
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Leave Requests</h1>
          <p className="text-white/60">
            View & manage all employees leave requests.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search employee, type, reason..."
            className="w-72 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none"
          />
          <button
            onClick={load}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
          >
            Search
          </button>

          <select
            value={monthKey}
            onChange={(e) => setMonthKey(e.target.value)}
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none"
          >
            <option value="">All months</option>
            {monthOptions.map((mk) => (
              <option key={mk} value={mk}>
                {mk}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            {statusTabs.map((t) => (
              <button
                key={t}
                onClick={() => setStatus(t)}
                className={[
                  "rounded-xl px-3 py-1.5 text-sm border",
                  status === t
                    ? "border-fuchsia-500/40 bg-fuchsia-500/20 text-white"
                    : "border-white/10 bg-black/10 text-white/70 hover:text-white",
                ].join(" ")}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          <div className="text-sm text-white/60">
            {loading ? "Loading..." : `${leaves.length} request(s)`}
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-[950px] w-full text-left text-sm">
            <thead className="bg-black/20 text-white/70">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Month</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">Days</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/10">
              {leaves.map((l) => (
                <tr key={l._id} className="text-white/85">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">
                      {l.employeeName || "Employee"}
                    </div>
                    <div className="text-xs text-white/60">
                      {l.employeeEmail}
                    </div>
                  </td>
                  <td className="px-4 py-3">{l.type}</td>
                  <td className="px-4 py-3">{l.monthKey}</td>
                  <td className="px-4 py-3">
                    {new Date(l.startDate).toLocaleDateString()} -{" "}
                    {new Date(l.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">{l.days}</td>
                  <td className="px-4 py-3 max-w-[320px]">
                    <div className="line-clamp-2 text-white/80">{l.reason}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={[
                        "rounded-full px-2 py-1 text-xs border",
                        l.status === "approved"
                          ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
                          : l.status === "rejected"
                            ? "border-red-500/30 bg-red-500/15 text-red-200"
                            : l.status === "pending"
                              ? "border-amber-500/30 bg-amber-500/15 text-amber-200"
                              : "border-white/10 bg-white/5 text-white/70",
                      ].join(" ")}
                    >
                      {l.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        disabled={l.status !== "pending"}
                        onClick={() => decide(l._id, "approved")}
                        className="rounded-lg bg-emerald-600/80 px-3 py-1.5 text-xs text-white hover:bg-emerald-600 disabled:opacity-40"
                      >
                        Approve
                      </button>
                      <button
                        disabled={l.status !== "pending"}
                        onClick={() => decide(l._id, "rejected")}
                        className="rounded-lg bg-red-600/80 px-3 py-1.5 text-xs text-white hover:bg-red-600 disabled:opacity-40"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && leaves.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-10 text-center text-white/60"
                    colSpan={8}
                  >
                    No leave requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
