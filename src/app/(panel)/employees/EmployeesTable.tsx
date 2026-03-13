"use client";

import React from "react";
import {
  RefreshCw,
  AlertTriangle,
  ListX,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  BadgeCheck,
  BadgeX,
  DollarSign,
} from "lucide-react";

type Role = "admin" | "hr" | "employee" | string;

export type EmployeeDoc = {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  role: Role;
  shift: string;
  salary: number;
  isActive: boolean;
};

export type Pagination = {
  currentPage: number;
  totalPages: number;
  totalEmployees: number;
  hasNext: boolean;
  hasPrev: boolean;
  limit: number;
};

const cx = (...cls: Array<string | false | null | undefined>) =>
  cls.filter(Boolean).join(" ");

function rolePill(role: Role) {
  if (role === "admin")
    return "bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-400/25";
  if (role === "hr")
    return "bg-fuchsia-500/15 text-fuchsia-300 ring-1 ring-fuchsia-400/25";
  return "bg-white/10 text-zinc-400 ring-1 ring-white/10";
}

function statusPill(active: boolean) {
  return active
    ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/25"
    : "bg-red-500/15 text-red-300 ring-1 ring-red-400/25";
}

function formatSalary(value: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">
        {label}
      </p>
      <div className="mt-1 break-words text-sm text-zinc-300">{value}</div>
    </div>
  );
}

export default function EmployeesTable({
  rows,
  loading,
  error,
  canWrite,
  pagination,
  onEdit,
  onDelete,
  onResetFilters,
  onCreate,
  page,
  setPage,
  limit,
  setLimit,
}: {
  rows: EmployeeDoc[];
  loading: boolean;
  error: string | null;
  canWrite: boolean;
  pagination: Pagination | null;
  onEdit: (row: EmployeeDoc) => void;
  onDelete: (row: EmployeeDoc) => void;
  onResetFilters: () => void;
  onCreate: () => void;
  page: number;
  setPage: (v: number) => void;
  limit: number;
  setLimit: (v: number) => void;
}) {
  const loadingNode = (
    <div className="flex items-center justify-center gap-3 text-zinc-400">
      <RefreshCw className="h-4 w-4 animate-spin" />
      <span className="text-sm">Loading employees...</span>
    </div>
  );

  const emptyNode = (
    <div className="mx-auto flex max-w-md flex-col items-center text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10">
        <ListX className="h-5 w-5 text-zinc-400" />
      </div>
      <p className="mt-4 text-sm font-medium text-zinc-200">
        No employees found
      </p>
      <p className="mt-1 text-xs text-zinc-500">
        Try changing filters, or add a new employee.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={onResetFilters}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-200 transition hover:bg-white/10"
        >
          Reset filters
        </button>
        <button
          type="button"
          onClick={onCreate}
          disabled={!canWrite}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-xs font-medium text-white shadow-lg shadow-violet-500/20 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          Add employee
        </button>
      </div>
    </div>
  );

  const errorNode = (
    <div className="mx-auto flex max-w-md flex-col items-center text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-red-500/20 to-red-500/5">
        <AlertTriangle className="h-5 w-5 text-red-400" />
      </div>
      <p className="mt-4 text-sm font-medium text-zinc-200">
        Something went wrong
      </p>
      <p className="mt-1 text-xs text-zinc-500">{error}</p>
      <div className="mt-5">
        <button
          type="button"
          onClick={() => location.reload()}
          className="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-xs font-medium text-white shadow-lg shadow-violet-500/20 transition hover:opacity-95"
        >
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
      {/* ── Desktop table (md+) ── */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-black/40 backdrop-blur-xl">
              <tr className="text-xs text-zinc-400">
                {[
                  "Employee",
                  "Email",
                  "Department",
                  "Designation",
                  "Role",
                  "Shift",
                  "Salary",
                  "Status",
                ].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-5 py-3 font-medium"
                  >
                    {h}
                  </th>
                ))}
                <th className="whitespace-nowrap px-5 py-3 font-medium text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-5 py-14">
                    {loadingNode}
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={9} className="px-5 py-14">
                    {errorNode}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-14">
                    {emptyNode}
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr
                    key={r._id}
                    className="border-t border-white/5 transition hover:bg-white/5"
                  >
                    {/* Employee */}
                    <td className="px-5 py-3.5">
                      <div className="whitespace-nowrap font-medium text-zinc-200">
                        {r.name}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {r.employeeId}
                      </div>
                    </td>

                    {/* Email — truncated with tooltip */}
                    <td className="px-5 py-3.5">
                      <span
                        className="block max-w-[160px] truncate text-zinc-300"
                        title={r.email}
                      >
                        {r.email}
                      </span>
                    </td>

                    {/* Department */}
                    <td className="whitespace-nowrap px-5 py-3.5 text-zinc-300">
                      {r.department}
                    </td>

                    {/* Designation */}
                    <td className="whitespace-nowrap px-5 py-3.5 text-zinc-300">
                      {r.designation}
                    </td>

                    {/* Role */}
                    <td className="px-5 py-3.5">
                      <span
                        className={cx(
                          "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize whitespace-nowrap",
                          rolePill(r.role),
                        )}
                      >
                        {r.role}
                      </span>
                    </td>

                    {/* Shift */}
                    <td className="whitespace-nowrap px-5 py-3.5 text-zinc-300">
                      {r.shift}
                    </td>

                    {/* Salary */}
                    <td className="whitespace-nowrap px-5 py-3.5 text-zinc-300 tabular-nums">
                      {formatSalary(r.salary)}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <span
                        className={cx(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
                          statusPill(r.isActive),
                        )}
                      >
                        {r.isActive ? (
                          <BadgeCheck className="h-3.5 w-3.5" />
                        ) : (
                          <BadgeX className="h-3.5 w-3.5" />
                        )}
                        {r.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEdit(r)}
                          disabled={!canWrite}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(r)}
                          disabled={!canWrite}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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
      </div>

      {/* ── Mobile cards (< md) ── */}
      <div className="md:hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-3 p-10 text-zinc-400">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading employees...</span>
          </div>
        ) : error ? (
          <div className="p-5">{errorNode}</div>
        ) : rows.length === 0 ? (
          <div className="p-5">{emptyNode}</div>
        ) : (
          <div className="space-y-3 p-4">
            {rows.map((r) => (
              <div
                key={r._id}
                className="overflow-hidden rounded-2xl border border-white/10 bg-black/20"
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-3 border-b border-white/5 p-4">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-zinc-200">
                      {r.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {r.employeeId}
                    </p>
                  </div>
                  <span
                    className={cx(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                      statusPill(r.isActive),
                    )}
                  >
                    {r.isActive ? (
                      <BadgeCheck className="h-3.5 w-3.5" />
                    ) : (
                      <BadgeX className="h-3.5 w-3.5" />
                    )}
                    {r.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Card body — 2-col grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-4">
                  <Field
                    label="Email"
                    value={
                      <span className="block truncate" title={r.email}>
                        {r.email}
                      </span>
                    }
                  />
                  <Field label="Department" value={r.department} />
                  <Field label="Designation" value={r.designation} />
                  <Field label="Shift" value={r.shift} />
                  <Field label="Salary" value={formatSalary(r.salary)} />
                  <Field
                    label="Role"
                    value={
                      <span
                        className={cx(
                          "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                          rolePill(r.role),
                        )}
                      >
                        {r.role}
                      </span>
                    }
                  />
                </div>

                {/* Card actions */}
                <div className="flex gap-2 border-t border-white/5 p-3">
                  <button
                    onClick={() => onEdit(r)}
                    disabled={!canWrite}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-zinc-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(r)}
                    disabled={!canWrite}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {pagination && (
        <div className="flex flex-col gap-3 border-t border-white/10 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-zinc-400">
            Page <span className="text-zinc-200">{pagination.currentPage}</span>{" "}
            of <span className="text-zinc-200">{pagination.totalPages}</span> •{" "}
            <span className="text-zinc-200">{pagination.totalEmployees}</span>{" "}
            employees
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={!pagination.hasPrev}
              onClick={() => setPage(Math.max(1, page - 1))}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </button>

            <button
              disabled={!pagination.hasNext}
              onClick={() => setPage(page + 1)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>

            <select
              value={limit}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                setLimit(Number.isNaN(n) ? 20 : n);
                setPage(1);
              }}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 outline-none transition focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/15"
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n} className="bg-zinc-900 text-zinc-100">
                  {n} / page
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
