"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  AlertTriangle,
  CalendarDays,
  Clock3,
  CheckCircle2,
  XCircle,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Search,
  MailSearch,
} from "lucide-react";

type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

type LeaveRow = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  type: string;
  startDate: string;
  endDate: string;
  monthKey: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  hrComment: string;
  decidedBy: string | null;
  decidedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type Pagination = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrev: boolean;
  limit: number;
};

type Summary = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  onLeave: number;
};

const cx = (...cls: Array<string | false | null | undefined>) =>
  cls.filter(Boolean).join(" ");

function statusPill(status: LeaveStatus) {
  if (status === "approved")
    return "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/25";
  if (status === "rejected")
    return "bg-red-500/15 text-red-300 ring-1 ring-red-400/25";
  if (status === "cancelled")
    return "bg-white/10 text-zinc-400 ring-1 ring-white/10";
  return "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/25";
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  iconClass,
  iconWrap,
  valueClass,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  iconClass: string;
  iconWrap: string;
  valueClass?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl transition hover:bg-white/[0.07]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-zinc-400">{label}</p>
          <p
            className={cx(
              "mt-2 text-2xl font-semibold tracking-tight",
              valueClass ?? "text-zinc-100",
            )}
          >
            {value}
          </p>
        </div>
        <div
          className={cx(
            "flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 shadow-sm",
            iconWrap,
          )}
        >
          <Icon className={cx("h-5 w-5", iconClass)} />
        </div>
      </div>
    </div>
  );
}

export default function LeavesManagementClient() {
  const [rows, setRows] = useState<LeaveRow[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [summary, setSummary] = useState<Summary>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
    onLeave: 0,
  });

  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (status) params.set("status", status);
    if (q.trim()) params.set("q", q.trim());
    return params.toString();
  }, [page, limit, status, q]);

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/leaves?${queryString}`, {
        method: "GET",
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data?.message || data?.error || "Failed to load leaves",
        );
      setRows(Array.isArray(data?.data) ? data.data : []);
      setPagination(data?.pagination ?? null);
      setSummary(
        data?.summary ?? {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          cancelled: 0,
          onLeave: 0,
        },
      );
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
      setRows([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  async function handleDecision(
    id: string,
    nextStatus: "approved" | "rejected",
  ) {
    const hrComment =
      window.prompt(
        nextStatus === "approved"
          ? "Optional HR comment for approval:"
          : "Optional HR comment for rejection:",
        "",
      ) ?? "";

    setActingId(id);
    try {
      const res = await fetch(`/api/leaves/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, hrComment }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data?.message || data?.error || "Failed to update leave",
        );
      await fetchLeaves();
    } catch (err: any) {
      window.alert(err?.message || "Failed to update leave");
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="min-h-screen text-zinc-100">
      {/* Ambient background glows */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute top-48 -left-40 h-[420px] w-[420px] rounded-full bg-fuchsia-600/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[520px] w-[520px] rounded-full bg-violet-500/10 blur-[140px]" />
      </div>

      <div className="relative space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Leave Management
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Review and manage employee leave requests.
          </p>
        </div>

        {/* Summary Section */}
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Leave Overview card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold tracking-tight">
                  Leave Overview
                </h2>
                <p className="mt-0.5 text-xs text-zinc-400">
                  All-time request summary
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 shadow-sm shadow-violet-500/10">
                <CalendarDays className="h-5 w-5 text-zinc-200" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <SummaryCard
                label="Total Requests"
                value={summary.total}
                icon={CalendarDays}
                iconClass="text-zinc-200"
                iconWrap="bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10"
              />
              <SummaryCard
                label="Pending"
                value={summary.pending}
                icon={Clock3}
                iconClass="text-amber-300"
                iconWrap="bg-amber-500/10"
                valueClass="text-amber-300"
              />
              <SummaryCard
                label="Approved"
                value={summary.approved}
                icon={CheckCircle2}
                iconClass="text-emerald-300"
                iconWrap="bg-emerald-500/10"
                valueClass="text-emerald-300"
              />
              <SummaryCard
                label="Rejected"
                value={summary.rejected}
                icon={XCircle}
                iconClass="text-red-300"
                iconWrap="bg-red-500/10"
                valueClass="text-red-400"
              />
            </div>
          </div>

          {/* Quick Stats card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold tracking-tight">
                  Quick Stats
                </h2>
                <p className="mt-0.5 text-xs text-zinc-400">
                  Current workforce at a glance
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 shadow-sm shadow-violet-500/10">
                <UserCheck className="h-5 w-5 text-zinc-200" />
              </div>
            </div>

            <div className="space-y-2.5">
              {[
                {
                  icon: CheckCircle2,
                  iconClass: "text-emerald-400",
                  label: "Approved Leaves",
                  value: summary.approved,
                },
                {
                  icon: XCircle,
                  iconClass: "text-red-400",
                  label: "Rejected Leaves",
                  value: summary.rejected,
                },
                {
                  icon: UserCheck,
                  iconClass: "text-violet-400",
                  label: "Employees on Leave",
                  value: summary.onLeave,
                },
                {
                  icon: RefreshCw,
                  iconClass: "text-zinc-400",
                  label: "Cancelled",
                  value: summary.cancelled,
                },
              ].map(({ icon: Icon, iconClass, label, value }) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3 transition hover:bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cx("h-4 w-4", iconClass)} />
                    <span className="text-sm text-zinc-300">{label}</span>
                  </div>
                  <span className="text-sm font-semibold text-zinc-100">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Leave Requests Table */}
        <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
          {/* Table Header */}
          <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                Leave Requests
              </h2>
              <p className="mt-0.5 text-xs text-zinc-400">
                Review employee leave requests and update their status.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Search */}
              <div className="relative w-full sm:w-[280px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  value={q}
                  onChange={(e) => {
                    setPage(1);
                    setQ(e.target.value);
                  }}
                  placeholder="Search employee, email, type..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none backdrop-blur-xl transition focus:border-violet-500/40 focus:ring-4 focus:ring-violet-500/15"
                />
              </div>

              {/* Status filter */}
              <select
                value={status}
                onChange={(e) => {
                  setPage(1);
                  setStatus(e.target.value);
                }}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-zinc-100 outline-none backdrop-blur-xl transition focus:border-violet-500/40 focus:ring-4 focus:ring-violet-500/15 sm:w-[160px]"
              >
                <option value="" className="bg-zinc-900 text-zinc-100">
                  All statuses
                </option>
                <option value="pending" className="bg-zinc-900 text-zinc-100">
                  Pending
                </option>
                <option value="approved" className="bg-zinc-900 text-zinc-100">
                  Approved
                </option>
                <option value="rejected" className="bg-zinc-900 text-zinc-100">
                  Rejected
                </option>
                <option value="cancelled" className="bg-zinc-900 text-zinc-100">
                  Cancelled
                </option>
              </select>

              {/* Refresh */}
              <button
                type="button"
                onClick={fetchLeaves}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  className={cx("h-4 w-4", loading && "animate-spin")}
                />
                Refresh
              </button>
            </div>
          </div>

          {/* States */}
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-zinc-400">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading leave requests...</span>
            </div>
          ) : error ? (
            <div className="mx-auto flex max-w-md flex-col items-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-red-500/20 to-red-500/5">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <p className="mt-4 text-sm font-medium text-zinc-200">
                Failed to load leave requests
              </p>
              <p className="mt-1 text-xs text-zinc-500">{error}</p>
              <button
                type="button"
                onClick={fetchLeaves}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-violet-500/20 hover:opacity-95"
              >
                Retry
              </button>
            </div>
          ) : rows.length === 0 ? (
            <div className="px-5 py-14">
              <div className="mx-auto flex max-w-md flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 text-xl">
                  <MailSearch className="h-5 w-5 text-zinc-400" />
                </div>
                <p className="mt-4 text-sm font-medium text-zinc-200">
                  No requests found
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Try changing filters or search terms.
                </p>
                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => {
                      setQ("");
                      setStatus("");
                      setPage(1);
                    }}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-200 hover:bg-white/10"
                  >
                    Reset filters
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full text-left text-sm">
                  <thead className="sticky top-0 bg-black/40 backdrop-blur-xl">
                    <tr className="text-xs text-zinc-400">
                      <th className="px-5 py-3 font-medium">Employee</th>
                      <th className="px-5 py-3 font-medium">Type</th>
                      <th className="px-5 py-3 font-medium">From</th>
                      <th className="px-5 py-3 font-medium">To</th>
                      <th className="px-5 py-3 font-medium">Days</th>
                      <th className="px-5 py-3 font-medium">Reason</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">HR Comment</th>
                      <th className="px-5 py-3 font-medium text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {rows.map((item) => {
                      const canAct = item.status === "pending";
                      const isActing = actingId === item.id;

                      return (
                        <tr
                          key={item.id}
                          className="border-t border-white/5 transition hover:bg-white/5"
                        >
                          <td className="px-5 py-4">
                            <div className="font-medium text-zinc-200">
                              {item.employeeName || "—"}
                            </div>
                            <div className="text-xs text-zinc-500">
                              {item.employeeEmail || "—"}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-zinc-300">
                            {item.type}
                          </td>
                          <td className="px-5 py-4 text-zinc-300">
                            {formatDate(item.startDate)}
                          </td>
                          <td className="px-5 py-4 text-zinc-300">
                            {formatDate(item.endDate)}
                          </td>
                          <td className="px-5 py-4 text-zinc-300">
                            {item.days}
                          </td>
                          <td className="max-w-[240px] px-5 py-4">
                            <p className="line-clamp-2 text-zinc-300">
                              {item.reason || "—"}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={cx(
                                "inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                                statusPill(item.status),
                              )}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="max-w-[200px] px-5 py-4">
                            <p className="line-clamp-2 text-zinc-400">
                              {item.hrComment || "—"}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                disabled={!canAct || isActing}
                                onClick={() =>
                                  handleDecision(item.id, "approved")
                                }
                                className="inline-flex items-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isActing ? "Updating..." : "Approve"}
                              </button>
                              <button
                                type="button"
                                disabled={!canAct || isActing}
                                onClick={() =>
                                  handleDecision(item.id, "rejected")
                                }
                                className="inline-flex items-center rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isActing ? "Updating..." : "Reject"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="grid grid-cols-1 gap-3 p-4 md:hidden">
                {rows.map((item) => {
                  const canAct = item.status === "pending";
                  const isActing = actingId === item.id;

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-white/10 bg-black/20 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold text-zinc-200">
                            {item.employeeName || "—"}
                          </h3>
                          <p className="mt-0.5 break-all text-xs text-zinc-500">
                            {item.employeeEmail || "—"}
                          </p>
                        </div>
                        <span
                          className={cx(
                            "inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                            statusPill(item.status),
                          )}
                        >
                          {item.status}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        {[
                          { label: "Type", value: item.type },
                          { label: "Days", value: item.days },
                          { label: "From", value: formatDate(item.startDate) },
                          { label: "To", value: formatDate(item.endDate) },
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <p className="text-[10px] uppercase tracking-widest text-zinc-500">
                              {label}
                            </p>
                            <p className="mt-1 text-zinc-300">{value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3">
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500">
                          Reason
                        </p>
                        <p className="mt-1 text-sm text-zinc-300">
                          {item.reason || "—"}
                        </p>
                      </div>

                      {item.hrComment && (
                        <div className="mt-3">
                          <p className="text-[10px] uppercase tracking-widest text-zinc-500">
                            HR Comment
                          </p>
                          <p className="mt-1 text-sm text-zinc-400">
                            {item.hrComment}
                          </p>
                        </div>
                      )}

                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          disabled={!canAct || isActing}
                          onClick={() => handleDecision(item.id, "approved")}
                          className="inline-flex w-full items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isActing ? "Updating..." : "Approve"}
                        </button>
                        <button
                          type="button"
                          disabled={!canAct || isActing}
                          onClick={() => handleDecision(item.id, "rejected")}
                          className="inline-flex w-full items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs font-medium text-red-400 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isActing ? "Updating..." : "Reject"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination && (
                <div className="flex flex-col gap-3 border-t border-white/10 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-xs text-zinc-400">
                    Page{" "}
                    <span className="text-zinc-200">
                      {pagination.currentPage}
                    </span>{" "}
                    of{" "}
                    <span className="text-zinc-200">
                      {pagination.totalPages}
                    </span>{" "}
                    •{" "}
                    <span className="text-zinc-200">
                      {pagination.totalItems}
                    </span>{" "}
                    requests
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={!pagination.hasPrev}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      Prev
                    </button>

                    <button
                      disabled={!pagination.hasNext}
                      onClick={() => setPage((p) => p + 1)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>

                    <select
                      value={limit}
                      onChange={(e) => {
                        const next = Number(e.target.value);
                        setLimit(Number.isNaN(next) ? 10 : next);
                        setPage(1);
                      }}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 outline-none transition focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/15"
                    >
                      {[10, 20, 50, 100].map((n) => (
                        <option
                          key={n}
                          value={n}
                          className="bg-zinc-900 text-zinc-100"
                        >
                          {n} / page
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
