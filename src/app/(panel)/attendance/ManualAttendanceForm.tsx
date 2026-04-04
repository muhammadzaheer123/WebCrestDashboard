"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

type Employee = {
  _id: string;
  name: string;
  email: string;
  employeeId: string;
  department?: string;
  designation?: string;
};

type CurrentUser = {
  id?: string;
  role?: string;
  email?: string;
  name?: string;
};

function getTodayDateInputValue() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function ManualAttendanceForm() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    employeeId: "",
    date: getTodayDateInputValue(),
    checkIn: "",
    checkOut: "",
    status: "present",
    manualNote: "",
  });

  const isAllowed = useMemo(() => {
    return user?.role === "admin" || user?.role === "hr";
  }, [user]);

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json();
        const currentUser = data?.user || data?.data || data || null;
        setUser(currentUser);
      } catch {
        setUser(null);
      }
    };

    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (!isAllowed) return;

    const loadEmployees = async () => {
      try {
        setLoadingEmployees(true);

        const res = await fetch("/api/employees?limit=1000", {
          cache: "no-store",
        });
        const data = await res.json();

        const list = data?.data?.employees || [];
        setEmployees(Array.isArray(list) ? list : []);
      } catch (error) {
        console.error("Failed to load employees:", error);
        setEmployees([]);
      } finally {
        setLoadingEmployees(false);
      }
    };

    loadEmployees();
  }, [isAllowed]);

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.employeeId || !form.date || !form.checkIn) {
      toast.error("Employee, date and check-in time are required");
      return;
    }

    // if (form.checkOut && form.checkOut <= form.checkIn) {
    //   toast.error("Check-out time must be greater than check-in time");
    //   return;
    // }

    try {
      setSubmitting(true);

      const res = await fetch("/api/attendance/manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: form.employeeId,
          date: form.date,
          checkIn: form.checkIn,
          checkOut: form.checkOut || undefined,
          status: form.status,
          manualNote: form.manualNote,
          breaks: [],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error || "Failed to save manual attendance");
        return;
      }

      toast.success(data?.message || "Manual attendance saved successfully");

      setForm((prev) => ({
        ...prev,
        checkIn: "",
        checkOut: "",
        manualNote: "",
      }));
    } catch (error) {
      console.error(error);
      toast.error("Server error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAllowed) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">
          Manual Attendance Entry
        </h3>
        <p className="mt-1 text-sm text-zinc-400">
          Admin or HR can create or update an employee attendance record.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        <div className="md:col-span-2 xl:col-span-1">
          <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-zinc-400">
            Employee
          </label>
          <select
            value={form.employeeId}
            onChange={(e) => handleChange("employeeId", e.target.value)}
            disabled={loadingEmployees || submitting}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-400/40"
          >
            <option value="">Select employee</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.name} ({emp.employeeId})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-zinc-400">
            Date
          </label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => handleChange("date", e.target.value)}
            disabled={submitting}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-400/40"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-zinc-400">
            Status
          </label>
          <select
            value={form.status}
            onChange={(e) => handleChange("status", e.target.value)}
            disabled={submitting}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-400/40"
          >
            <option value="present">Present</option>
            <option value="half-day">Half Day</option>
            <option value="on-break">On Break</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-zinc-400">
            Check In
          </label>
          <input
            type="time"
            value={form.checkIn}
            onChange={(e) => handleChange("checkIn", e.target.value)}
            disabled={submitting}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-400/40"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-zinc-400">
            Check Out
          </label>
          <input
            type="time"
            value={form.checkOut}
            onChange={(e) => handleChange("checkOut", e.target.value)}
            disabled={submitting}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-400/40"
          />
        </div>

        <div className="md:col-span-2 xl:col-span-3">
          <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-zinc-400">
            Note
          </label>
          <textarea
            rows={3}
            value={form.manualNote}
            onChange={(e) => handleChange("manualNote", e.target.value)}
            disabled={submitting}
            placeholder="Optional note e.g. missed punch, admin correction"
            className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-400/40"
          />
        </div>

        <div className="md:col-span-2 xl:col-span-3">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-violet-500/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save Manual Attendance"}
          </button>
        </div>
      </form>
    </div>
  );
}
