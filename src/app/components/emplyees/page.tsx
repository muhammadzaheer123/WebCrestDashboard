"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";

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
  params: Record<string, string | number | undefined | null>
) => {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).length)
      usp.set(k, String(v));
  });
  return usp.toString();
};

/* ===== Page ===== */
export default function EmployeesPage() {
  // current user (for role-based permissions)
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);
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
    [search, department, role, page, limit]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchJson(`/api/employees?${query}`);
      // { success, message, data: { employees, pagination } }
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

  return (
    <div className="min-h-screen w-full bg-[#1C1039] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              HR • <span className="text-[#BB37A4]">Employees</span>
            </h1>
            <p className="text-sm text-[#d9c9ff]">
              Manage employees: create, update, search, and remove.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreate}
            disabled={!canWrite}
            className={`rounded-xl px-5 py-2 font-medium shadow-lg transition ${
              canWrite
                ? "bg-gradient-to-r from-[#BB37A4] to-[#4315DB] text-white hover:opacity-90"
                : "bg-gray-600/50 text-gray-300 cursor-not-allowed"
            }`}
            title={
              canWrite ? "Create a new employee" : "Only Admin/HR can create"
            }
          >
            + New Employee
          </button>
        </header>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">
          <div className="flex flex-col">
            <label className="text-sm text-[#c7b7ff]">Search</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name / Email / Employee ID"
              className="mt-1 rounded-lg border border-[#BB37A4]/30 bg-[#2A144A] px-3 py-2 text-white placeholder-gray-400 focus:border-[#BB37A4] focus:ring-1 focus:ring-[#BB37A4]/60"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-[#c7b7ff]">Department</label>
            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. HR, Engineering"
              className="mt-1 rounded-lg border border-[#BB37A4]/30 bg-[#2A144A] px-3 py-2 text-white focus:border-[#BB37A4] focus:ring-1 focus:ring-[#BB37A4]/60"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-[#c7b7ff]">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 rounded-lg border border-[#BB37A4]/30 bg-[#2A144A] px-3 py-2 text-white focus:border-[#BB37A4] focus:ring-1 focus:ring-[#BB37A4]/60"
            >
              <option value="">All</option>
              <option value="admin">Admin</option>
              <option value="hr">HR</option>
              <option value="employee">Employee</option>
            </select>
          </div>

          <div className="md:col-span-2 flex items-end gap-2 md:justify-end">
            <button
              onClick={() => {
                setSearch("");
                setDepartment("");
                setRole("");
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
                      className="px-4 py-8 text-center text-[#c7b7ff]"
                    >
                      Loading…
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-rose-400"
                    >
                      {error}
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-[#c7b7ff]"
                    >
                      No employees found.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr
                      key={r._id}
                      className="border-t border-[#BB37A4]/20 transition hover:bg-[#4315DB]/10"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{r.name}</div>
                        <div className="text-xs text-[#c7b7ff]">
                          {r.employeeId}
                        </div>
                      </td>
                      <td className="px-4 py-3">{r.email}</td>
                      <td className="px-4 py-3">{r.department}</td>
                      <td className="px-4 py-3">{r.designation}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            r.role === "admin"
                              ? "bg-blue-900/30 text-blue-300"
                              : r.role === "hr"
                              ? "bg-purple-900/30 text-purple-300"
                              : "bg-gray-800/30 text-gray-300"
                          }`}
                        >
                          {r.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">{r.shift}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            r.isActive
                              ? "bg-emerald-900/30 text-emerald-300"
                              : "bg-rose-900/30 text-rose-300"
                          }`}
                        >
                          {r.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(r)}
                            disabled={!canWrite}
                            className={`rounded-lg border px-3 py-1.5 ${
                              canWrite
                                ? "border-[#BB37A4]/40 text-[#BB37A4] hover:bg-[#BB37A4]/20"
                                : "border-gray-600/50 text-gray-400 cursor-not-allowed"
                            }`}
                            title={
                              canWrite
                                ? "Edit employee"
                                : "Only Admin/HR can edit"
                            }
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onDelete(r._id)}
                            disabled={!canWrite}
                            className={`rounded-lg px-3 py-1.5 text-white ${
                              canWrite
                                ? "bg-rose-600 hover:bg-rose-700"
                                : "bg-gray-600/50 cursor-not-allowed"
                            }`}
                            title={
                              canWrite
                                ? "Delete employee"
                                : "Only Admin/HR can delete"
                            }
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
                {pagination.totalEmployees} employees
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
                    const n = parseInt(e.target.value, 10);
                    setLimit(Number.isNaN(n) ? 20 : n);
                    setPage(1);
                  }}
                  className="rounded-lg border border-[#BB37A4]/40 bg-transparent px-2 py-1.5"
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
      className={`fixed inset-0 z-[9999] ${open ? "" : "pointer-events-none"}`}
      role="dialog"
      aria-modal="true"
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
              {isEdit ? "Edit" : "New"} Employee
            </h2>
            <p className="text-xs text-gray-500">
              {isEdit ? "Update details and save" : "Fill the details and save"}
            </p>
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
              <label className="text-sm text-gray-600">Name *</label>
              <input
                id="empNameInput"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2"
                placeholder="Full name"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm text-gray-600">Email *</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Phone *</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm text-gray-600">Department *</label>
                <input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Designation *</label>
                <input
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm text-gray-600">Role *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                >
                  <option value="employee">Employee</option>
                  <option value="hr">HR</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-600">Shift *</label>
                <input
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  placeholder="e.g. Morning / Evening"
                />
              </div>
            </div>

            {isEdit && (
              <div className="rounded-lg border border-[#BB37A4]/20 p-3 text-sm">
                <div>
                  <span className="font-semibold">Employee ID:</span>{" "}
                  {editing?.employeeId}
                </div>
                {editing?.qrCode && (
                  <div className="mt-1">
                    <span className="font-semibold">QR:</span> {editing.qrCode}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <footer className="sticky bottom-0 flex items-center justify-between border-t bg-white p-4">
          <button onClick={onClose} className="rounded-lg border px-4 py-2">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting || !canWrite}
            className={`rounded-lg px-4 py-2 text-white disabled:opacity-60 ${
              canWrite ? "bg-black" : "bg-gray-500"
            }`}
            title={canWrite ? "" : "Only Admin/HR can save"}
          >
            {submitting ? "Saving…" : isEdit ? "Save Changes" : "Create"}
          </button>
        </footer>
      </div>
    </div>
  );
}
