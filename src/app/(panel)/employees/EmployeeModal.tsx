"use client";

import React, { useEffect, useState } from "react";

type Role = "admin" | "hr" | "employee" | string;

type EmployeeDoc = {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  designation: string;
  role: Role;
  shift: string;
  salary: number;
  isActive: boolean;
  qrCode?: string;
};

const cx = (...cls: Array<string | false | null | undefined>) =>
  cls.filter(Boolean).join(" ");

async function fetchJson(input: RequestInfo, init?: RequestInit) {
  const res = await fetch(input, init);
  let data: any = null;

  try {
    data = await res.json();
  } catch {}

  if (!res.ok) {
    throw new Error(data?.error || data?.message || "Request failed");
  }

  return data;
}

export default function EmployeeModal({
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

  const [password, setPassword] = useState("");
  const [name, setName] = useState(editing?.name || "");
  const [email, setEmail] = useState(editing?.email || "");
  const [phone, setPhone] = useState(editing?.phone || "");
  const [department, setDepartment] = useState(editing?.department || "");
  const [designation, setDesignation] = useState(editing?.designation || "");
  const [role, setRole] = useState<Role>(editing?.role || "employee");
  const [shift, setShift] = useState(editing?.shift || "Morning");
  const [salary, setSalary] = useState(
    editing?.salary !== undefined ? String(editing.salary) : "",
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setPassword("");
    setName(editing?.name || "");
    setEmail(editing?.email || "");
    setPhone(editing?.phone || "");
    setDepartment(editing?.department || "");
    setDesignation(editing?.designation || "");
    setRole(editing?.role || "employee");
    setShift(editing?.shift || "Morning");
    setSalary(editing?.salary !== undefined ? String(editing.salary) : "");
    setError(null);
  }, [open, editing]);

  useEffect(() => {
    if (!open) return;

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  const validate = () => {
    if (!name.trim()) return "Name is required";
    if (!email.trim()) return "Email is required";
    if (!phone.trim()) return "Phone is required";
    if (!department.trim()) return "Department is required";
    if (!designation.trim()) return "Designation is required";
    if (!shift.trim()) return "Shift is required";
    if (!salary.trim()) return "Salary is required";

    const parsedSalary = Number(salary);
    if (Number.isNaN(parsedSalary) || parsedSalary < 0) {
      return "Salary must be a valid number greater than or equal to 0";
    }

    if (!isEdit && !password.trim()) return "Password is required";

    return null;
  };

  const submit = async () => {
    if (!canWrite) return;

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        department: department.trim(),
        designation: designation.trim(),
        role,
        shift: shift.trim(),
        salary: Number(salary),
        ...(password.trim() ? { password } : {}),
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="absolute right-0 top-0 flex h-full w-full max-w-lg flex-col border-l border-white/10 bg-[#08040f] text-zinc-100 shadow-[0_20px_90px_rgba(0,0,0,0.75)]">
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 shadow-sm shadow-violet-500/10">
              <span className="text-sm">{isEdit ? "✏️" : "➕"}</span>
            </div>

            <div>
              <h2 className="text-base font-semibold tracking-tight">
                {isEdit ? "Edit" : "New"} Employee
              </h2>
              <p className="text-xs text-zinc-400">
                {isEdit ? "Update details and save" : "Fill details and create"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300 transition hover:bg-white/10"
          >
            Close
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <Field label="Name *">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Email *">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@company.com"
                />
              </Field>

              <Field label={isEdit ? "Password" : "Password *"}>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    isEdit ? "Leave blank to keep current password" : "••••••••"
                  }
                />
              </Field>

              <Field label="Phone *">
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 234 567 890"
                />
              </Field>

              <Field label="Salary *">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder="50000"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Department *">
                <Input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Engineering, HR..."
                />
              </Field>

              <Field label="Designation *">
                <Input
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="Software Engineer..."
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Role *">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-100 outline-none backdrop-blur-xl transition focus:border-violet-500/40 focus:ring-4 focus:ring-violet-500/15"
                >
                  <option
                    value="employee"
                    className="bg-zinc-900 text-zinc-100"
                  >
                    Employee
                  </option>
                  <option value="hr" className="bg-zinc-900 text-zinc-100">
                    HR
                  </option>
                  <option value="admin" className="bg-zinc-900 text-zinc-100">
                    Admin
                  </option>
                </select>
              </Field>

              <Field label="Shift *">
                <Input
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  placeholder="Morning, Evening..."
                />
              </Field>
            </div>

            {isEdit && (
              <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm">
                <div className="text-zinc-400">
                  <span className="font-medium text-zinc-200">
                    Employee ID:
                  </span>{" "}
                  {editing?.employeeId}
                </div>

                {editing?.qrCode && (
                  <div className="mt-1 text-zinc-400">
                    <span className="font-medium text-zinc-200">QR:</span>{" "}
                    {editing.qrCode}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <footer className="flex items-center justify-between border-t border-white/10 bg-[#08040f] px-5 py-4">
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-200 transition hover:bg-white/10"
          >
            Cancel
          </button>

          <button
            onClick={submit}
            disabled={submitting || !canWrite}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/20 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Saving..." : isEdit ? "Save Changes" : "Create"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-xs font-medium text-zinc-400">{label}</div>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cx(
        "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-100",
        "placeholder:text-zinc-600 outline-none backdrop-blur-xl",
        "transition focus:border-violet-500/40 focus:ring-4 focus:ring-violet-500/15",
      )}
    />
  );
}
