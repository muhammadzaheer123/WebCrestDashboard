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
  if (!res.ok)
    throw new Error(data?.error || data?.message || "Request failed");
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

  const [name, setName] = useState(editing?.name || "");
  const [email, setEmail] = useState(editing?.email || "");
  const [phone, setPhone] = useState(editing?.phone || "");
  const [department, setDepartment] = useState(editing?.department || "");
  const [designation, setDesignation] = useState(editing?.designation || "");
  const [role, setRole] = useState<Role>(editing?.role || "employee");
  const [shift, setShift] = useState(editing?.shift || "Morning");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // reset values when opening modal / switching edit target
  useEffect(() => {
    if (!open) return;
    setName(editing?.name || "");
    setEmail(editing?.email || "");
    setPhone(editing?.phone || "");
    setDepartment(editing?.department || "");
    setDesignation(editing?.designation || "");
    setRole(editing?.role || "employee");
    setShift(editing?.shift || "Morning");
    setError(null);
  }, [open, editing]);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <div
        className={cx(
          "absolute right-0 top-0 h-full w-full max-w-lg",
          "border-l border-white/10 bg-[#0B0616] text-white",
          "shadow-[0_20px_90px_rgba(0,0,0,0.75)]",
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
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            Close
          </button>
        </header>

        <div className="h-[calc(100%-72px-76px)] overflow-y-auto p-5">
          {error && (
            <div className="mb-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <Field label="Name *">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Email *">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field label="Phone *">
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Department *">
                <Input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </Field>
              <Field label="Designation *">
                <Input
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Role *">
                <select
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-[#7C3AED]/45 focus:ring-4 focus:ring-[#7C3AED]/15"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
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
              </Field>

              <Field label="Shift *">
                <Input
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                />
              </Field>
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
            onClick={submit}
            disabled={submitting || !canWrite}
            className="rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#111827] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "Saving..." : isEdit ? "Save Changes" : "Create"}
          </button>
        </footer>
      </div>
    </div>
  );
}

/* ===== Tiny atoms ===== */

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-xs font-semibold text-white/60">{label}</div>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cx(
        "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white",
        "placeholder:text-white/40 outline-none",
        "focus:border-[#7C3AED]/45 focus:ring-4 focus:ring-[#7C3AED]/15",
      )}
    />
  );
}
