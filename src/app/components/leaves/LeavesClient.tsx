"use client";

import useSWR from "swr";
import { useMemo, useState, useTransition } from "react";

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" }).then((r) => r.json());

type Row = {
  _id: string;
  userId: string;
  user?: { _id: string; name: string; email: string } | null;
  type: "annual" | "sick" | "casual" | "unpaid" | "other";
  startDate: string;
  endDate: string;
  isHalfDay: boolean;
  halfDayPart?: "AM" | "PM" | null;
  reason?: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  daysRequested: number;
  createdAt: string;
};

type ApiResp = {
  ok: boolean;
  data: Row[];
  page: number;
  limit: number;
  total: number;
  counts: { pending: number; approved: number; rejected: number; all: number };
};

const TABS = ["pending", "approved", "rejected", "all"] as const;

function Badge({ status }: { status: Row["status"] }) {
  const cls =
    status === "pending"
      ? "bg-amber-100 text-amber-800 ring-1 ring-amber-200"
      : status === "approved"
      ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200"
      : status === "rejected"
      ? "bg-rose-100 text-rose-800 ring-1 ring-rose-200"
      : "bg-slate-100 text-slate-800 ring-1 ring-slate-200";
  return (
    <span className={`px-2 py-1 rounded-md text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-t border-slate-200 animate-pulse">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div className="h-3 w-40 rounded bg-slate-200" />
        </td>
      ))}
    </tr>
  );
}

export default function LeavesClient() {
  const [status, setStatus] = useState<(typeof TABS)[number]>("pending");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isPending, startTransition] = useTransition();

  const url = useMemo(
    () =>
      `/api/leaves/admin?status=${status}&page=${page}&limit=${limit}&q=${encodeURIComponent(
        q
      )}`,
    [status, page, limit, q]
  );

  const { data, isLoading, mutate } = useSWR<ApiResp>(url, fetcher, {
    keepPreviousData: true,
  });

  const onTab = (s: (typeof TABS)[number]) => {
    startTransition(() => {
      setStatus(s);
      setPage(1);
    });
  };

  async function act(id: string, kind: "approve" | "reject") {
    const prev = data;
    mutate(
      async () => {
        await fetch(`/api/leaves/${id}/${kind}`, {
          method: "PATCH",
          credentials: "include",
        });
        return fetcher(url);
      },
      { revalidate: true }
    ).catch(() => mutate(prev, false));
  }

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          {TABS.map((t) => {
            const active = status === t;
            const count = data?.counts?.[t] ?? 0;
            return (
              <button
                key={t}
                onClick={() => onTab(t)}
                className={`px-3 py-1.5 rounded-md text-sm transition border ${
                  active
                    ? "bg-white text-slate-900 border-slate-300 shadow-sm"
                    : "bg-white/80 text-slate-700 border-slate-200 hover:bg-white"
                } ${isPending ? "opacity-80" : ""}`}
              >
                <span className="capitalize">{t}</span>
                <span className="ml-2 text-xs bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative">
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search reason, type, employee…"
            className="w-[280px] sm:w-[360px] rounded-lg bg-white text-slate-900 border border-slate-300 px-3 py-2 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 shadow-sm"
          />
          {q ? (
            <button
              onClick={() => setQ("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
              aria-label="Clear"
            >
              ✕
            </button>
          ) : null}
        </div>
      </div>

      {/* Card */}
      <div className="rounded-xl bg-white text-slate-900 border border-slate-200 shadow-md overflow-hidden">
        <div className="max-h-[62vh] overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-slate-50/95 backdrop-blur border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Employee
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Type
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Dates
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Days
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Reason
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : (data?.data?.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center">
                    <div className="inline-flex flex-col items-center gap-2 text-slate-600">
                      <div className="text-3xl">🗂️</div>
                      <div className="font-medium">No requests found</div>
                      <div className="text-xs">
                        Try changing status or search
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                data!.data.map((r, idx) => (
                  <tr
                    key={r._id}
                    className={`border-t border-slate-200 ${
                      idx % 2 === 1 ? "bg-slate-50/60" : ""
                    } hover:bg-slate-50`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {r.user?.name ?? r.userId}
                      </div>
                      <div className="text-xs text-slate-500">
                        {r.user?.email}
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize">{r.type}</td>
                    <td className="px-4 py-3">
                      {new Date(r.startDate).toLocaleDateString()} →{" "}
                      {new Date(r.endDate).toLocaleDateString()}
                      {r.isHalfDay ? ` (${r.halfDayPart} half)` : ""}
                    </td>
                    <td className="px-4 py-3">{r.daysRequested}</td>
                    <td
                      className="px-4 py-3 max-w-[360px] truncate"
                      title={r.reason}
                    >
                      {r.reason}
                    </td>
                    <td className="px-4 py-3">
                      <Badge status={r.status} />
                    </td>
                    <td className="px-4 py-3">
                      {r.status === "pending" ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => act(r._id, "approve")}
                            className="px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-sm"
                            title="Approve"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => act(r._id, "reject")}
                            className="px-3 py-1.5 rounded-md bg-rose-600 text-white hover:bg-rose-700 transition shadow-sm"
                            title="Reject"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
          <div className="text-xs text-slate-600">
            Page{" "}
            <span className="font-semibold text-slate-800">
              {data?.page ?? 1}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-800">
              {Math.max(1, Math.ceil((data?.total ?? 0) / (limit || 10)))}
            </span>{" "}
            •{" "}
            <span className="font-semibold text-slate-800">
              {data?.total ?? 0}
            </span>{" "}
            results
          </div>
          <div className="flex gap-2">
            <button
              disabled={(data?.page ?? 1) <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              disabled={
                (data?.page ?? 1) >=
                Math.max(1, Math.ceil((data?.total ?? 0) / (limit || 10)))
              }
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
