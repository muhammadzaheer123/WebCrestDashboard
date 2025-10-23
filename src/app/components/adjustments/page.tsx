"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";

/* ========= Types ========= */
type AdjustmentType = "bonus" | "deduction";
type AdjustmentStatus = "pending" | "approved" | "rejected";

interface Adjustment {
  _id: string;
  employeeId: string;
  type: AdjustmentType;
  amount: number;
  reason: string;
  description?: string;
  date: string; // ISO date string
  status: AdjustmentStatus;
  createdAt?: string;
  updatedAt?: string;
}

interface Paginated<T> {
  adjustments: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    hasNext: boolean;
    hasPrev: boolean;
    limit: number;
  };
  filters: {
    employeeId?: string | null;
    month?: string | null;
    type?: string | null;
    status?: string | null;
  };
}

/* ========= Utils ========= */
const fetchJson = async (input: RequestInfo, init?: RequestInit) => {
  const res = await fetch(input, init);
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // ignore
  }
  if (!res.ok) {
    const err =
      (data && (data.error || data.message)) ||
      res.statusText ||
      "Request failed";
    throw new Error(err);
  }
  return data;
};

const formatMoney = (v: number) =>
  new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
  }).format(v);

function buildQuery(
  params: Record<string, string | number | undefined | null>
) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).length)
      usp.set(k, String(v));
  });
  return usp.toString();
}

/* ========= Page ========= */
export default function AdjustmentsPage() {
  // filters
  const [employeeId, setEmployeeId] = useState("");
  const [month, setMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [type, setType] = useState<"" | AdjustmentType>("");
  const [status, setStatus] = useState<"" | AdjustmentStatus>("");

  // pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // data state
  const [rows, setRows] = useState<Adjustment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<
    Paginated<Adjustment>["pagination"] | null
  >(null);

  const query = useMemo(
    () =>
      buildQuery({
        employeeId: employeeId || undefined,
        month,
        type: type || undefined,
        status: status || undefined,
        page,
        limit,
      }),
    [employeeId, month, type, status, page, limit]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchJson(`/api/adjustments?${query}`);
      const payload = res.data as Paginated<Adjustment>;
      setRows(payload.adjustments || []);
      setPagination(payload.pagination || null);
    } catch (e: any) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Adjustment | null>(null);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (row: Adjustment) => {
    setEditing(row);
    setModalOpen(true);
  };
  const onSaved = () => {
    setModalOpen(false);
    setEditing(null);
    loadData();
  };
  const onDelete = async (id: string) => {
    if (!confirm("Delete this adjustment? This cannot be undone.")) return;
    try {
      await fetchJson(`/api/adjustments/${id}`, { method: "DELETE" });
      await loadData();
    } catch (e: any) {
      alert(e.message || "Failed to delete");
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#1C1039] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              HR • <span className="text-[#BB37A4]">Adjustments</span>
            </h1>
            <p className="text-sm text-[#d9c9ff]">
              Add bonuses and deductions, filter by month, and manage approvals.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="rounded-xl bg-gradient-to-r from-[#BB37A4] to-[#4315DB] px-5 py-2 text-white font-medium shadow-lg transition hover:opacity-90"
          >
            + New Adjustment
          </button>
        </header>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">
          <div className="flex flex-col">
            <label className="text-sm text-[#c7b7ff]">Employee ID</label>
            <input
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="EMP-123 or ObjectId"
              className="mt-1 rounded-lg border border-[#BB37A4]/30 bg-[#2A144A] px-3 py-2 text-white placeholder-gray-400 focus:border-[#BB37A4] focus:ring-1 focus:ring-[#BB37A4]/60"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-[#c7b7ff]">Month</label>
            <input
              type="month"
              value={month}
              onChange={(e) => {
                setMonth(e.target.value);
                setPage(1);
              }}
              className="mt-1 rounded-lg border border-[#BB37A4]/30 bg-[#2A144A] px-3 py-2 text-white focus:border-[#BB37A4] focus:ring-1 focus:ring-[#BB37A4]/60"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-[#c7b7ff]">Type</label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value as any);
                setPage(1);
              }}
              className="mt-1 rounded-lg border border-[#BB37A4]/30 bg-[#2A144A] px-3 py-2 text-white focus:border-[#BB37A4] focus:ring-1 focus:ring-[#BB37A4]/60"
            >
              <option value="">All</option>
              <option value="bonus">Bonus</option>
              <option value="deduction">Deduction</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-[#c7b7ff]">Status</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as any);
                setPage(1);
              }}
              className="mt-1 rounded-lg border border-[#BB37A4]/30 bg-[#2A144A] px-3 py-2 text-white focus:border-[#BB37A4] focus:ring-1 focus:ring-[#BB37A4]/60"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="flex items-end gap-2 md:justify-end">
            <button
              onClick={() => {
                setEmployeeId("");
                setType("");
                setStatus("");
                setPage(1);
              }}
              className="w-full rounded-lg border border-[#BB37A4]/30 px-3 py-2 text-[#BB37A4] hover:bg-[#BB37A4]/20 md:w-auto"
            >
              Reset
            </button>
            <button
              onClick={() => loadData()}
              className="w-full rounded-lg bg-gradient-to-r from-[#BB37A4] to-[#4315DB] px-3 py-2 text-white shadow hover:opacity-90 md:w-auto"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-[#BB37A4]/30 bg-[#2A144A]/40 backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-white/90">
              <thead className="bg-[#4315DB]/40 text-[#e8dcff] uppercase text-xs font-semibold tracking-wide">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-[#c7b7ff]"
                    >
                      Loading…
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-rose-400"
                    >
                      {error}
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-[#c7b7ff]"
                    >
                      No adjustments found.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr
                      key={r._id}
                      className="border-t border-[#BB37A4]/20 transition hover:bg-[#4315DB]/10"
                    >
                      <td className="px-4 py-3 font-medium text-white">
                        {r.employeeId}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            r.type === "bonus"
                              ? "bg-emerald-900/30 text-emerald-400"
                              : "bg-amber-900/30 text-amber-400"
                          }`}
                        >
                          {r.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#e8dcff]">
                        {r.type === "deduction" ? "-" : "+"}
                        {formatMoney(r.amount)}
                      </td>
                      <td
                        className="max-w-[320px] truncate px-4 py-3 text-[#c7b7ff]"
                        title={r.reason}
                      >
                        {r.reason}
                      </td>
                      <td className="px-4 py-3 text-[#e8dcff]">
                        {new Date(r.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            r.status === "approved"
                              ? "bg-blue-900/30 text-blue-300"
                              : r.status === "rejected"
                              ? "bg-rose-900/30 text-rose-300"
                              : "bg-gray-800/30 text-gray-300"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(r)}
                            className="rounded-lg border border-[#BB37A4]/40 px-3 py-1.5 text-[#BB37A4] hover:bg-[#BB37A4]/20"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onDelete(r._id)}
                            className="rounded-lg bg-rose-600 px-3 py-1.5 text-white hover:bg-rose-700"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && (
            <div className="flex flex-col items-center gap-3 border-t border-[#BB37A4]/20 p-4 sm:flex-row sm:justify-between">
              <div className="text-sm text-[#d9c9ff]">
                Page {pagination.currentPage} of {pagination.totalPages} —{" "}
                {pagination.totalRecords} records
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={!pagination.hasPrev}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-[#BB37A4]/40 px-3 py-1.5 text-white disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  disabled={!pagination.hasNext}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-[#BB37A4]/40 px-3 py-1.5 text-white disabled:opacity-50"
                >
                  Next
                </button>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(parseInt(e.target.value));
                    setPage(1);
                  }}
                  className="rounded-lg border border-[#BB37A4]/40 bg-transparent px-2 py-1.5"
                >
                  {[10, 20, 50, 100].map((n) => (
                    <option className="text-black" key={n} value={n}>
                      {n}/page
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal (mounted inside the page) */}
      {modalOpen && (
        <AdjustmentModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSaved={onSaved}
          editing={editing}
        />
      )}
    </div>
  );
}

/* ========= Modal ========= */
function AdjustmentModal({
  open,
  onClose,
  onSaved,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editing: Adjustment | null;
}) {
  const isEdit = !!editing?._id;

  const [employeeId, setEmployeeId] = useState(editing?.employeeId || "");
  const [type, setType] = useState<AdjustmentType>(editing?.type || "bonus");
  const [amount, setAmount] = useState<number>(editing?.amount ?? 0);
  const [reason, setReason] = useState<string>(editing?.reason || "");
  const [description, setDescription] = useState<string>(
    editing?.description || ""
  );
  const [date, setDate] = useState<string>(() =>
    editing ? editing.date.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [status, setStatus] = useState<AdjustmentStatus>(
    editing?.status || "pending"
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(
      () => document.getElementById("employeeIdInput")?.focus(),
      60
    );
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onEsc);
    };
  }, [open, onClose]);

  const validate = () => {
    if (!employeeId) return "Employee ID is required";
    if (!amount || amount <= 0) return "Amount must be greater than 0";
    if (!reason.trim()) return "Reason is required";
    if (!["bonus", "deduction"].includes(type))
      return "Type must be bonus or deduction";
    return null;
  };

  const submit = async () => {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        employeeId,
        type,
        amount,
        reason,
        description,
        date,
        status,
      };
      if (isEdit) {
        await fetchJson(`/api/adjustments/${editing!._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // status set to "pending" by server by default; can omit here
        await fetchJson(`/api/adjustments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      onSaved();
    } catch (e: any) {
      setError(e.message || "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] ${open ? "" : "pointer-events-none"}`}
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-lg bg-white text-black shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b p-5">
          <div>
            <h2 className="text-lg font-semibold">
              {isEdit ? "Edit" : "New"} Adjustment
            </h2>
            <p className="text-xs text-gray-500">Fill the details and save</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <div className="h-[calc(100%-64px-72px)] overflow-y-auto p-5">
          {error && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-sm text-gray-600">Employee ID *</label>
              <input
                id="employeeIdInput"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="EMP-123 or ObjectId"
                className="mt-1 w-full rounded-lg border px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Type *</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as AdjustmentType)}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                >
                  <option value="bonus">Bonus</option>
                  <option value="deduction">Deduction</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600">Amount *</label>
                <input
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value))}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600">Reason *</label>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Effective Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AdjustmentStatus)}
                className="mt-1 w-full rounded-lg border px-3 py-2"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                (Optional) Update status while editing. New records default to
                pending on the server.
              </p>
            </div>
          </div>
        </div>

        <footer className="sticky bottom-0 flex items-center justify-between border-t bg-white p-4">
          <button onClick={onClose} className="rounded-lg border px-4 py-2">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-60"
          >
            {submitting ? "Saving…" : isEdit ? "Save Changes" : "Create"}
          </button>
        </footer>
      </div>
    </div>
  );
}
