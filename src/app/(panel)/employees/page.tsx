"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  Filter,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  BadgeCheck,
  BadgeX,
  Users,
} from "lucide-react";

/* ===== Types ===== */
type Role = "admin" | "hr" | "employee" | string;

type EmployeeDoc = {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  role: Role;
  shift: string;
  isActive: boolean;
  joiningDate?: string;
  qrCode?: string;
  createdAt?: string;
  updatedAt?: string;
};

type Pagination = {
  currentPage: number;
  totalPages: number;
  totalEmployees: number;
  hasNext: boolean;
  hasPrev: boolean;
  limit: number;
};

type User = {
  id: string;
  name?: string;
  email: string;
  role: Role;
};

/* ===== Utils ===== */
const fetchJson = async (input: RequestInfo, init?: RequestInit) => {
  const res = await fetch(input, init);
  let data: any = null;
  try {
    data = await res.json();
  } catch {}

  if (!res.ok) {
    const msg =
      (data && (data.error || data.message)) ||
      res.statusText ||
      "Request failed";
    throw new Error(msg);
  }
  return data;
};

const buildQuery = (
  params: Record<string, string | number | undefined | null>,
) => {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).length)
      usp.set(k, String(v));
  });
  return usp.toString();
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

/* ===== Page ===== */
export default function EmployeesClient({
  initialUser,
}: {
  initialUser: User | null;
}) {
  const [user, setUser] = useState<User | null>(initialUser);

  useEffect(() => {
    if (user) return;
    try {
      const raw = localStorage.getItem("user");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, [user]);

  const canWrite = user?.role === "admin" || user?.role === "hr";

  // filters
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState<Role | "">("");

  // pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // data
  const [rows, setRows] = useState<EmployeeDoc[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(
    () =>
      buildQuery({
        search: search || undefined,
        department: department || undefined,
        role: role || undefined,
        page,
        limit,
      }),
    [search, department, role, page, limit],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchJson(`/api/employees?${query}`);
      setRows(res?.data?.employees || []);
      setPagination(res?.data?.pagination || null);
    } catch (e: any) {
      setError(e.message || "Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EmployeeDoc | null>(null);

  const openCreate = () => {
    if (!canWrite) return;
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (row: EmployeeDoc) => {
    if (!canWrite) return;
    setEditing(row);
    setModalOpen(true);
  };
  const onSaved = () => {
    setModalOpen(false);
    setEditing(null);
    loadData();
  };

  const onDelete = async (id: string) => {
    if (!canWrite) return;
    if (!confirm("Delete this employee? This cannot be undone.")) return;
    try {
      await fetchJson(`/api/employees/${id}`, { method: "DELETE" });
      await loadData();
    } catch (e: any) {
      alert(e.message || "Failed to delete");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setDepartment("");
    setRole("");
    setPage(1);
  };

  return (
    <div className="w-full text-white">
      {/* Title + actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED]/60 to-[#111827] ring-1 ring-white/10">
              <Users className="h-5 w-5 text-white/90" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Employees</h1>
              <p className="text-sm text-white/55">
                Manage employee records, roles, shifts and status.
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70">
              Access: {canWrite ? "Write enabled" : "Read only"}
            </span>
            {pagination && (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70">
                Total: {pagination.totalEmployees}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/85 hover:bg-white/10"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>

          <button
            type="button"
            onClick={openCreate}
            disabled={!canWrite}
            className={cx(
              "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold",
              "bg-gradient-to-r from-[#7C3AED] to-[#111827] shadow-[0_12px_30px_rgba(0,0,0,0.35)]",
              "hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed",
            )}
            title={
              canWrite ? "Create a new employee" : "Only Admin/HR can create"
            }
          >
            <Plus className="h-4 w-4" />
            New Employee
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-white/85">
            <Filter className="h-4 w-4" />
            Filters
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/75 hover:bg-white/10"
          >
            Reset
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <label className="text-xs font-semibold text-white/60">
              Search
            </label>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name / Email / Employee ID"
                className="w-full rounded-2xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#7C3AED]/40 focus:ring-2 focus:ring-[#7C3AED]/20"
              />
            </div>
          </div>

          <div className="lg:col-span-4">
            <label className="text-xs font-semibold text-white/60">
              Department
            </label>
            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="HR, Engineering..."
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#7C3AED]/40 focus:ring-2 focus:ring-[#7C3AED]/20"
            />
          </div>

          <div className="lg:col-span-3">
            <label className="text-xs font-semibold text-white/60">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-[#7C3AED]/40 focus:ring-2 focus:ring-[#7C3AED]/20"
            >
              <option value="" className="text-black">
                All
              </option>
              <option value="admin" className="text-black">
                Admin
              </option>
              <option value="hr" className="text-black">
                HR
              </option>
              <option value="employee" className="text-black">
                Employee
              </option>
            </select>
          </div>

          <div className="lg:col-span-12 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setPage(1);
                loadData();
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-[#7C3AED] to-[#111827] hover:opacity-90"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-white/85">
            <thead className="bg-white/[0.04] text-xs font-semibold uppercase tracking-wide text-white/60">
              <tr>
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
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-white/55"
                  >
                    Loading...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-rose-300"
                  >
                    {error}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-white/55"
                  >
                    No employees found.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr
                    key={r._id}
                    className="border-t border-white/10 hover:bg-white/[0.04] transition"
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{r.name}</div>
                      <div className="text-xs text-white/55">
                        {r.employeeId}
                      </div>
                    </td>
                    <td className="px-4 py-3">{r.email}</td>
                    <td className="px-4 py-3">{r.department}</td>
                    <td className="px-4 py-3">{r.designation}</td>
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
                    <td className="px-4 py-3">{r.shift}</td>
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
                          onClick={() => openEdit(r)}
                          disabled={!canWrite}
                          className={cx(
                            "inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/85 hover:bg-white/10",
                            "disabled:opacity-50 disabled:cursor-not-allowed",
                          )}
                          title={
                            canWrite
                              ? "Edit employee"
                              : "Only Admin/HR can edit"
                          }
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </button>

                        <button
                          onClick={() => onDelete(r._id)}
                          disabled={!canWrite}
                          className={cx(
                            "inline-flex items-center gap-2 rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200 hover:bg-rose-500/15",
                            "disabled:opacity-50 disabled:cursor-not-allowed",
                          )}
                          title={
                            canWrite
                              ? "Delete employee"
                              : "Only Admin/HR can delete"
                          }
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

        {/* Pagination */}
        {pagination && (
          <div className="flex flex-col gap-3 border-t border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-white/60">
              Page {pagination.currentPage} of {pagination.totalPages} •{" "}
              {pagination.totalEmployees} employees
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <button
                  disabled={!pagination.hasPrev}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={cx(
                    "inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/85 hover:bg-white/10",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                  )}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </button>

                <button
                  disabled={!pagination.hasNext}
                  onClick={() => setPage((p) => p + 1)}
                  className={cx(
                    "inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/85 hover:bg-white/10",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                  )}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <select
                value={limit}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  setLimit(Number.isNaN(n) ? 20 : n);
                  setPage(1);
                }}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/85 outline-none"
              >
                {[10, 20, 50, 100].map((n) => (
                  <option key={n} value={n} className="text-black">
                    {n}/page
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <EmployeeModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSaved={onSaved}
          editing={editing}
          canWrite={canWrite}
        />
      )}
    </div>
  );
}

/* ===== Modal (Create / Edit) ===== */
function EmployeeModal({
  open,
  onClose,
  onSaved,
  editing,
  canWrite,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editing: EmployeeDoc | null;
  canWrite: boolean;
}) {
  const isEdit = !!editing?._id;

  const [name, setName] = useState(editing?.name || "");
  const [email, setEmail] = useState(editing?.email || "");
  const [phone, setPhone] = useState(editing?.phone || "");
  const [department, setDepartment] = useState(editing?.department || "");
  const [designation, setDesignation] = useState(editing?.designation || "");
  const [role, setRole] = useState<Role>(editing?.role || "employee");
  const [shift, setShift] = useState(editing?.shift || "Morning");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      document.getElementById("empNameInput")?.focus();
    }, 50);

    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);

    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onEsc);
    };
  }, [open, onClose]);

  const validate = () => {
    if (!name.trim()) return "Name is required";
    if (!email.trim()) return "Email is required";
    if (!phone.trim()) return "Phone is required";
    if (!department.trim()) return "Department is required";
    if (!designation.trim()) return "Designation is required";
    if (!shift.trim()) return "Shift is required";
    return null;
  };

  const submit = async () => {
    if (!canWrite) return;
    const v = validate();
    if (v) return setError(v);

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        name,
        email,
        phone,
        department,
        designation,
        role,
        shift,
      };

      if (isEdit) {
        await fetchJson(`/api/employees/${editing!._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetchJson(`/api/employees`, {
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
      className={cx(
        "fixed inset-0 z-[9999]",
        open ? "" : "pointer-events-none",
      )}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cx(
          "absolute inset-0 bg-black/60 transition-opacity",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cx(
          "absolute right-0 top-0 h-full w-full max-w-lg",
          "border-l border-white/10 bg-[#0B0616] text-white",
          "shadow-[0_20px_80px_rgba(0,0,0,0.7)]",
          "transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <header className="flex items-center justify-between border-b border-white/10 p-5">
          <div>
            <h2 className="text-lg font-semibold">
              {isEdit ? "Edit" : "New"} Employee
            </h2>
            <p className="text-xs text-white/55">
              {isEdit ? "Update details and save" : "Fill details and create"}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/80 hover:bg-white/10"
            aria-label="Close"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="h-[calc(100%-72px-76px)] overflow-y-auto p-5">
          {error && (
            <div className="mb-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-3 text-rose-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-xs font-semibold text-white/60">
                Name *
              </label>
              <input
                id="empNameInput"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-[#7C3AED]/40 focus:ring-2 focus:ring-[#7C3AED]/20"
                placeholder="Full name"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-white/60">
                  Email *
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-[#7C3AED]/40 focus:ring-2 focus:ring-[#7C3AED]/20"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-white/60">
                  Phone *
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-[#7C3AED]/40 focus:ring-2 focus:ring-[#7C3AED]/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-white/60">
                  Department *
                </label>
                <input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-[#7C3AED]/40 focus:ring-2 focus:ring-[#7C3AED]/20"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-white/60">
                  Designation *
                </label>
                <input
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-[#7C3AED]/40 focus:ring-2 focus:ring-[#7C3AED]/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-white/60">
                  Role *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-[#7C3AED]/40 focus:ring-2 focus:ring-[#7C3AED]/20"
                >
                  <option value="employee" className="text-black">
                    Employee
                  </option>
                  <option value="hr" className="text-black">
                    HR
                  </option>
                  <option value="admin" className="text-black">
                    Admin
                  </option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-white/60">
                  Shift *
                </label>
                <input
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-[#7C3AED]/40 focus:ring-2 focus:ring-[#7C3AED]/20"
                  placeholder="Morning / Evening"
                />
              </div>
            </div>

            {isEdit && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/75">
                <div>
                  <span className="font-semibold text-white/90">
                    Employee ID:
                  </span>{" "}
                  {editing?.employeeId}
                </div>
                {editing?.qrCode && (
                  <div className="mt-1">
                    <span className="font-semibold text-white/90">QR:</span>{" "}
                    {editing.qrCode}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <footer className="sticky bottom-0 flex items-center justify-between border-t border-white/10 bg-[#0B0616] p-4">
          <button
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/85 hover:bg-white/10"
          >
            Cancel
          </button>

          <button
            disabled={submitting || !canWrite}
            className={cx(
              "rounded-2xl px-4 py-2.5 text-sm font-semibold",
              "bg-gradient-to-r from-[#7C3AED] to-[#111827] hover:opacity-90",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
            title={canWrite ? "" : "Only Admin/HR can save"}
          >
            {submitting ? "Saving..." : isEdit ? "Save Changes" : "Create"}
          </button>
        </footer>
      </div>
    </div>
  );
}
