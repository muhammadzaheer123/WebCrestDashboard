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
    return "bg-indigo-500/15 text-indigo-200 ring-1 ring-indigo-400/25";
  if (role === "hr")
    return "bg-fuchsia-500/15 text-fuchsia-200 ring-1 ring-fuchsia-400/25";
  return "bg-white/10 text-white/70 ring-1 ring-white/10";
}

function statusPill(active: boolean) {
  return active
    ? "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/25"
    : "bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/25";
}

function GlassCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cx(
        "rounded-2xl border border-white/10 bg-white/[0.035] backdrop-blur-xl",
        "shadow-[0_20px_80px_rgba(0,0,0,0.45)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function GhostButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/85",
        "hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed",
        props.className,
      )}
    />
  );
}

function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white",
        "bg-gradient-to-r from-[#7C3AED] to-[#111827]",
        "shadow-[0_14px_40px_rgba(124,58,237,0.20)]",
        "hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed",
        props.className,
      )}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cx(
        "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white",
        "outline-none focus:border-[#7C3AED]/45 focus:ring-4 focus:ring-[#7C3AED]/15",
        props.className,
      )}
    />
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
  return (
    <GlassCard className="mt-6 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm text-white/85">
          <thead className="sticky top-0 bg-black/30 backdrop-blur-xl">
            <tr className="text-xs font-semibold uppercase tracking-wide text-white/55">
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Designation</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Shift</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-14">
                  <div className="flex items-center justify-center gap-3 text-white/60">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Loading employees...
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={8} className="px-4 py-14">
                  <div className="mx-auto flex max-w-md flex-col items-center text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-500/10">
                      <AlertTriangle className="h-6 w-6 text-rose-200" />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-rose-200">
                      Something went wrong
                    </p>
                    <p className="mt-1 text-xs text-white/50">{error}</p>
                    <div className="mt-5">
                      <PrimaryButton
                        type="button"
                        onClick={() => location.reload()}
                      >
                        Retry
                      </PrimaryButton>
                    </div>
                  </div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-14">
                  <div className="mx-auto flex max-w-md flex-col items-center text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-[#7C3AED]/15 to-black">
                      <ListX className="h-6 w-6 text-white/80" />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-white/90">
                      No employees found
                    </p>
                    <p className="mt-1 text-xs text-white/50">
                      Try changing filters, or add a new employee.
                    </p>
                    <div className="mt-5 flex gap-3">
                      <GhostButton type="button" onClick={onResetFilters}>
                        Reset filters
                      </GhostButton>
                      <PrimaryButton
                        type="button"
                        onClick={onCreate}
                        disabled={!canWrite}
                      >
                        <Plus className="h-4 w-4" />
                        Add employee
                      </PrimaryButton>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r._id}
                  className="border-t border-white/10 transition hover:bg-white/[0.04]"
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">{r.name}</div>
                    <div className="text-xs text-white/55">{r.employeeId}</div>
                  </td>

                  <td className="px-4 py-3 text-white/80">{r.email}</td>
                  <td className="px-4 py-3 text-white/80">{r.department}</td>
                  <td className="px-4 py-3 text-white/80">{r.designation}</td>

                  <td className="px-4 py-3">
                    <span
                      className={cx(
                        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                        rolePill(r.role),
                      )}
                    >
                      {r.role}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-white/80">{r.shift}</td>

                  <td className="px-4 py-3">
                    <span
                      className={cx(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                        statusPill(r.isActive),
                      )}
                    >
                      {r.isActive ? (
                        <BadgeCheck className="h-4 w-4" />
                      ) : (
                        <BadgeX className="h-4 w-4" />
                      )}
                      {r.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(r)}
                        disabled={!canWrite}
                        className={cx(
                          "inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/85 hover:bg-white/10",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                        )}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </button>

                      <button
                        onClick={() => onDelete(r)}
                        disabled={!canWrite}
                        className={cx(
                          "inline-flex items-center gap-2 rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200 hover:bg-rose-500/15",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                        )}
                      >
                        <Trash2 className="h-4 w-4" />
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

      {pagination && (
        <div className="flex flex-col gap-3 border-t border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-white/60">
            Page <span className="text-white/85">{pagination.currentPage}</span>{" "}
            of <span className="text-white/85">{pagination.totalPages}</span> •{" "}
            <span className="text-white/85">{pagination.totalEmployees}</span>{" "}
            employees
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <GhostButton
                disabled={!pagination.hasPrev}
                onClick={() => setPage(Math.max(1, page - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </GhostButton>

              <GhostButton
                disabled={!pagination.hasNext}
                onClick={() => setPage(page + 1)}
              >
                NextÍ
                <ChevronRight className="h-4 w-4" />
              </GhostButton>
            </div>

            <Select
              value={limit}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                setLimit(Number.isNaN(n) ? 20 : n);
                setPage(1);
              }}
              className="sm:w-[130px]"
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n} className="text-black">
                  {n}/page
                </option>
              ))}
            </Select>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
