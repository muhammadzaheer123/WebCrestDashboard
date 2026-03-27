"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calculator,
  Coins,
  Download,
  FileSpreadsheet,
  Hourglass,
  RefreshCw,
  Search,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  UserCircle2,
  Users,
} from "lucide-react";

type Role = "admin" | "hr" | "employee" | string;
type EmploymentType = "full-time" | "part-time";

type AuthUser = {
  id: string;
  email: string;
  role: Role;
};

type EmployeeOption = {
  _id: string;
  name: string;
  email: string;
  employeeId: string;
  employmentType?: EmploymentType;
};

type PayrollBreakdownRow = {
  date: string;
  dayType:
    | "working-day"
    | "weekend"
    | "holiday"
    | "paid-leave"
    | "unpaid-leave"
    | "present"
    | "half-day"
    | "absent";
  attendanceStatus: string;
  payableFraction: number;
  deductionFraction: number;
  lateMinutes: number;
  workedMinutes: number;
  breakMinutes: number;
  overtimeMinutes: number;
  dailySalaryEarned: number;
  autoClosed: boolean;
  remarks: string[];
};

type PayrollDoc = {
  _id?: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  employmentType: EmploymentType;
  month: number;
  year: number;
  salaryMode: "per-day" | "per-hour";
  baseSalary: number;
  perDaySalary: number;
  perHourSalary: number;
  workingDays: number;
  weekendDays: number;
  holidayDays: number;
  presentDays: number;
  halfDays: number;
  absentDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  lateCount: number;
  latePenaltyLeaveDays: number;
  deductionDays: number;
  deductionAmount: number;
  totalWorkedHours: number;
  totalOvertimeHours: number;
  overtimeAmount: number;
  netSalary: number;
  status: "draft" | "finalized";
  breakdown: PayrollBreakdownRow[];
};

function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

function monthName(month: number) {
  return new Date(2000, Math.max(0, month - 1), 1).toLocaleString("en-US", {
    month: "long",
  });
}

/** Returns a label like "Mar 10 – Apr 9, 2026" for the 10th-to-10th payroll period */
function payrollPeriodLabel(month: number, year: number) {
  const startDate = new Date(year, month - 1, 10);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const endDate = new Date(nextYear, nextMonth - 1, 9);
  const fmt = (d: Date) =>
    d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  return `${fmt(startDate)} – ${fmt(endDate)}`;
}

function formatMoney(value: number) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatFraction(value: number) {
  if (!Number.isFinite(value)) return "0";
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function round2Hours(value: number) {
  if (!Number.isFinite(value)) return "0";
  return Number(value.toFixed(2)).toString();
}

function formatMinutes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0m";
  const h = Math.floor(value / 60);
  const m = value % 60;
  if (h <= 0) return `${m}m`;
  if (m <= 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function payrollStatusPill(status: PayrollDoc["status"]) {
  return status === "finalized"
    ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/25"
    : "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/25";
}

function dayTypePill(type: PayrollBreakdownRow["dayType"]) {
  switch (type) {
    case "present":
      return "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/25";
    case "half-day":
      return "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/25";
    case "absent":
    case "unpaid-leave":
      return "bg-red-500/15 text-red-300 ring-1 ring-red-400/25";
    case "paid-leave":
    case "holiday":
      return "bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/25";
    case "weekend":
      return "bg-violet-500/15 text-violet-300 ring-1 ring-violet-400/25";
    default:
      return "bg-white/10 text-zinc-300 ring-1 ring-white/10";
  }
}

function humanDayType(type: PayrollBreakdownRow["dayType"]) {
  switch (type) {
    case "paid-leave":
      return "Paid Leave";
    case "unpaid-leave":
      return "Unpaid Leave";
    case "half-day":
      return "Half Day";
    case "working-day":
      return "Working Day";
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
}

async function fetchJson(input: RequestInfo, init?: RequestInit) {
  const res = await fetch(input, init);
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || data?.message || "Request failed");
  }

  return data;
}

function useCurrentUser() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const data = await fetchJson("/api/auth/me", {
          cache: "no-store",
        });
        if (!alive) return;

        setUser({
          id: data?.user?.id ?? "",
          email: data?.user?.email ?? "",
          role: data?.user?.role ?? "",
        });
      } catch {
        if (!alive) return;
        setUser(null);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return user;
}

function SummaryCard({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string;
  value: string;
  helper: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl transition hover:bg-white/7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-zinc-400">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
          <p className="mt-1 text-xs text-zinc-500">{helper}</p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 shadow-sm shadow-violet-500/10">
          <Icon className="h-5 w-5 text-zinc-200" />
        </div>
      </div>
    </div>
  );
}

export default function PayrollClient() {
  const authUser = useCurrentUser();

  const canRunPayroll = authUser?.role === "admin";
  const canViewOthers = authUser?.role === "admin" || authUser?.role === "hr";
  const isEmployeeView = authUser?.role === "employee";

  const now = new Date();

  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [payroll, setPayroll] = useState<PayrollDoc | null>(null);

  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear - 1, currentYear, currentYear + 1];
  }, []);

  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        value: i + 1,
        label: monthName(i + 1),
      })),
    [],
  );

  const filteredEmployees = useMemo(() => {
    const q = employeeSearch.trim().toLowerCase();
    if (!q) return employees;

    return employees.filter((emp) => {
      return (
        emp.name.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        emp.employeeId.toLowerCase().includes(q)
      );
    });
  }, [employeeSearch, employees]);

  const loadEmployees = useCallback(async () => {
    if (!canViewOthers) return;

    setEmployeesLoading(true);

    try {
      const res = await fetchJson("/api/employees?page=1&limit=200", {
        cache: "no-store",
      });

      const rows = Array.isArray(res?.data?.employees)
        ? res.data.employees
        : [];

      const normalized: EmployeeOption[] = rows.map((item: any) => ({
        _id: item?._id ?? item?.id ?? "",
        name: item?.name ?? "",
        email: item?.email ?? "",
        employeeId: item?.employeeId ?? "",
        employmentType:
          item?.employmentType === "part-time" ? "part-time" : "full-time",
      }));

      setEmployees(normalized);
    } catch (e: any) {
      setError(e.message || "Failed to load employees");
    } finally {
      setEmployeesLoading(false);
    }
  }, [canViewOthers]);

  const loadPayroll = useCallback(async () => {
    if (!authUser?.id) return;

    setLoading(true);
    setError(null);

    try {
      let endpoint = `/api/payroll/my?month=${month}&year=${year}`;

      if (canViewOthers && selectedEmployeeId) {
        endpoint = `/api/payroll/${selectedEmployeeId}?month=${month}&year=${year}`;
      }

      const res = await fetchJson(endpoint, { cache: "no-store" });
      setPayroll(res?.data ?? null);
    } catch (e: any) {
      setPayroll(null);
      setError(e.message || "Failed to load payroll");
    } finally {
      setLoading(false);
    }
  }, [authUser?.id, canViewOthers, month, year, selectedEmployeeId]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  useEffect(() => {
    if (!authUser?.id) return;

    if (canViewOthers) {
      if (selectedEmployeeId || isEmployeeView === false) {
        loadPayroll();
      }
      return;
    }

    loadPayroll();
  }, [
    authUser?.id,
    canViewOthers,
    isEmployeeView,
    selectedEmployeeId,
    loadPayroll,
  ]);

  const selectedEmployee = useMemo(() => {
    return employees.find((emp) => emp._id === selectedEmployeeId) || null;
  }, [employees, selectedEmployeeId]);

  const runPayroll = async (finalize: boolean) => {
    setRunning(true);
    setError(null);

    try {
      await fetchJson("/api/payroll/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month,
          year,
          finalize,
        }),
      });

      await loadPayroll();
    } catch (e: any) {
      setError(e.message || "Failed to run payroll");
    } finally {
      setRunning(false);
    }
  };

  const stats = [
    {
      label: "Payroll Status",
      value: payroll
        ? payroll.status === "finalized"
          ? "Finalized"
          : "Draft"
        : "—",
      helper: payroll
        ? payrollPeriodLabel(payroll.month, payroll.year)
        : "Monthly payroll state",
      icon: ShieldCheck,
    },
    {
      label: "Base Salary",
      value: payroll ? formatMoney(payroll.baseSalary) : "—",
      helper: "Configured monthly salary",
      icon: Coins,
    },
    {
      label: "Deductions",
      value: payroll ? formatMoney(payroll.deductionAmount) : "—",
      helper: payroll
        ? `${formatFraction(payroll.deductionDays)} deduction day(s)`
        : "Policy-based deductions",
      icon: TrendingDown,
    },
    {
      label: "Net Salary",
      value: payroll ? formatMoney(payroll.netSalary) : "—",
      helper: "Final payable salary",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="min-h-screen text-zinc-100">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute top-48 -left-40 h-[420px] w-[420px] rounded-full bg-fuchsia-600/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[520px] w-[520px] rounded-full bg-violet-500/10 blur-[140px]" />
      </div>

      <div className="relative mx-auto">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Payroll</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Salary breakdown from policies, attendance, leaves, and
              deductions.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-zinc-300 backdrop-blur-xl">
              <Calculator className="h-4 w-4 text-zinc-400" />
              <span>{payrollPeriodLabel(month, year)}</span>
            </div>

            <button
              onClick={loadPayroll}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className={cx("h-4 w-4", loading && "animate-spin")} />
              Refresh
            </button>

            {canRunPayroll && (
              <>
                <button
                  onClick={() => runPayroll(false)}
                  disabled={running}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  {running ? "Running..." : "Run Draft"}
                </button>

                <button
                  onClick={() => runPayroll(true)}
                  disabled={running}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/20 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  {running ? "Finalizing..." : "Finalize Payroll"}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <SummaryCard
              key={s.label}
              label={s.label}
              value={s.value}
              helper={s.helper}
              icon={s.icon}
            />
          ))}
        </div>

        <div className="mt-7 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                Payroll Filters
              </h2>
              <p className="mt-1 text-xs text-zinc-400">
                Select a month and employee to inspect payroll details.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <label className="text-xs font-medium text-zinc-400">
                  Month
                </label>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-100 outline-none backdrop-blur-xl transition focus:border-violet-500/40 focus:ring-4 focus:ring-violet-500/15"
                >
                  {months.map((m) => (
                    <option
                      key={m.value}
                      value={m.value}
                      className="bg-zinc-900 text-zinc-100"
                    >
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-400">
                  Year
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-100 outline-none backdrop-blur-xl transition focus:border-violet-500/40 focus:ring-4 focus:ring-violet-500/15"
                >
                  {years.map((y) => (
                    <option
                      key={y}
                      value={y}
                      className="bg-zinc-900 text-zinc-100"
                    >
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              {canViewOthers && (
                <>
                  <div>
                    <label className="text-xs font-medium text-zinc-400">
                      Search employee
                    </label>
                    <div className="relative mt-1.5">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                      <input
                        value={employeeSearch}
                        onChange={(e) => setEmployeeSearch(e.target.value)}
                        placeholder="Name / Email / Employee ID"
                        className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none backdrop-blur-xl transition focus:border-violet-500/40 focus:ring-4 focus:ring-violet-500/15"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-zinc-400">
                      Employee
                    </label>
                    <select
                      value={selectedEmployeeId}
                      onChange={(e) => setSelectedEmployeeId(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-100 outline-none backdrop-blur-xl transition focus:border-violet-500/40 focus:ring-4 focus:ring-violet-500/15"
                    >
                      <option value="" className="bg-zinc-900 text-zinc-100">
                        Select employee
                      </option>
                      {filteredEmployees.map((emp) => (
                        <option
                          key={emp._id}
                          value={emp._id}
                          className="bg-zinc-900 text-zinc-100"
                        >
                          {emp.name} — {emp.employeeId}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>

          {canViewOthers && (
            <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
              <Users className="h-4 w-4" />
              {employeesLoading
                ? "Loading employees..."
                : `${employees.length} employee option(s) available`}
            </div>
          )}
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {payroll && (
          <>
            <div className="mt-7 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold tracking-tight">
                      Payroll Summary
                    </h2>
                    <span
                      className={cx(
                        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                        payrollStatusPill(payroll.status),
                      )}
                    >
                      {payroll.status === "finalized" ? "Finalized" : "Draft"}
                    </span>
                    <span
                      className={cx(
                        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                        payroll.salaryMode === "per-hour"
                          ? "bg-violet-500/15 text-violet-300 ring-1 ring-violet-400/25"
                          : "bg-zinc-500/15 text-zinc-300 ring-1 ring-zinc-400/25",
                      )}
                    >
                      {payroll.salaryMode === "per-hour"
                        ? "Per-Hour Mode"
                        : "Per-Day Mode"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">
                    {payroll.employeeName} • {payroll.employeeEmail}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <MiniStat
                    label="Working Days"
                    value={String(payroll.workingDays)}
                  />
                  <MiniStat
                    label="Present"
                    value={formatFraction(payroll.presentDays)}
                  />
                  <MiniStat
                    label="Half Days"
                    value={formatFraction(payroll.halfDays)}
                  />
                  <MiniStat
                    label="Absent"
                    value={formatFraction(payroll.absentDays)}
                  />
                  <MiniStat
                    label="Hours Worked"
                    value={`${round2Hours(payroll.totalWorkedHours)}h`}
                  />
                  {payroll.totalOvertimeHours > 0 && (
                    <MiniStat
                      label="Overtime"
                      value={`${round2Hours(payroll.totalOvertimeHours)}h`}
                    />
                  )}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <InfoCard
                  icon={UserCircle2}
                  title="Employee"
                  lines={[
                    payroll.employeeName,
                    payroll.employeeEmail,
                    `Type: ${payroll.employmentType}`,
                  ]}
                />

                <InfoCard
                  icon={Coins}
                  title="Salary"
                  lines={[
                    `Base: ${formatMoney(payroll.baseSalary)}`,
                    `Per Day: ${formatMoney(payroll.perDaySalary)}`,
                    payroll.salaryMode === "per-hour"
                      ? `Per Hour: ${formatMoney(payroll.perHourSalary)}`
                      : `Mode: Per-day`,
                    `Net: ${formatMoney(payroll.netSalary)}`,
                  ]}
                />

                <InfoCard
                  icon={Hourglass}
                  title="Leaves & Late"
                  lines={[
                    `Paid Leaves: ${formatFraction(payroll.paidLeaveDays)}`,
                    `Unpaid Leaves: ${formatFraction(payroll.unpaidLeaveDays)}`,
                    `Late Count: ${payroll.lateCount} • Penalty: ${payroll.latePenaltyLeaveDays}`,
                  ]}
                />

                <InfoCard
                  icon={TrendingDown}
                  title="Deductions"
                  lines={[
                    `Deduction Days: ${formatFraction(payroll.deductionDays)}`,
                    `Deduction Amount: ${formatMoney(payroll.deductionAmount)}`,
                    `Weekends (paid by company): ${payroll.weekendDays} • Holidays (paid): ${payroll.holidayDays}`,
                    ...(payroll.overtimeAmount > 0
                      ? [
                          `Overtime: ${round2Hours(payroll.totalOvertimeHours)}h → +${formatMoney(payroll.overtimeAmount)}`,
                        ]
                      : []),
                  ]}
                />
              </div>
            </div>

            <div className="mt-7 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold tracking-tight">
                    Daily Breakdown
                  </h2>
                  <p className="mt-1 text-xs text-zinc-400">
                    Daily payroll evaluation for{" "}
                    {payrollPeriodLabel(payroll.month, payroll.year)}
                  </p>
                </div>

                {selectedEmployee && (
                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-zinc-300">
                    Selected: {selectedEmployee.name} (
                    {selectedEmployee.employeeId})
                  </div>
                )}
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="sticky top-0 bg-black/40 backdrop-blur-xl">
                      <tr className="text-xs text-zinc-400">
                        <th className="px-5 py-3 font-medium">Date</th>
                        <th className="px-5 py-3 font-medium">Day Type</th>
                        <th className="px-5 py-3 font-medium">Attendance</th>
                        <th className="px-5 py-3 font-medium">Worked</th>
                        <th className="px-5 py-3 font-medium">Break</th>
                        <th className="px-5 py-3 font-medium">Late</th>
                        {payroll.totalOvertimeHours > 0 && (
                          <th className="px-5 py-3 font-medium">Overtime</th>
                        )}
                        <th className="px-5 py-3 font-medium">Payable</th>
                        <th className="px-5 py-3 font-medium">Deduction</th>
                        <th className="px-5 py-3 font-medium">Earned</th>
                        <th className="px-5 py-3 font-medium">Remarks</th>
                      </tr>
                    </thead>

                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={10} className="px-5 py-14">
                            <div className="flex items-center justify-center gap-3 text-zinc-400">
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              <span className="text-sm">
                                Loading payroll...
                              </span>
                            </div>
                          </td>
                        </tr>
                      ) : payroll.breakdown.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="px-5 py-14">
                            <div className="mx-auto flex max-w-md flex-col items-center text-center">
                              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10">
                                <FileSpreadsheet className="h-5 w-5 text-zinc-300" />
                              </div>
                              <p className="mt-4 text-sm font-medium text-zinc-200">
                                No payroll breakdown available
                              </p>
                              <p className="mt-1 text-xs text-zinc-500">
                                Try another month or generate payroll first.
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        payroll.breakdown.map((row) => (
                          <tr
                            key={row.date}
                            className="border-t border-white/5 transition hover:bg-white/5"
                          >
                            <td className="whitespace-nowrap px-5 py-3.5 text-zinc-300">
                              {row.date}
                            </td>

                            <td className="px-5 py-3.5">
                              <span
                                className={cx(
                                  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
                                  dayTypePill(row.dayType),
                                )}
                              >
                                {humanDayType(row.dayType)}
                              </span>
                            </td>

                            <td className="whitespace-nowrap px-5 py-3.5 text-zinc-300">
                              {row.attendanceStatus || "—"}
                            </td>

                            <td className="whitespace-nowrap px-5 py-3.5 text-zinc-300">
                              {formatMinutes(row.workedMinutes)}
                            </td>

                            <td className="whitespace-nowrap px-5 py-3.5 text-zinc-300">
                              {formatMinutes(row.breakMinutes)}
                            </td>

                            <td className="whitespace-nowrap px-5 py-3.5 text-zinc-300">
                              {row.lateMinutes > 0
                                ? `${row.lateMinutes}m`
                                : "—"}
                            </td>

                            {payroll.totalOvertimeHours > 0 && (
                              <td className="whitespace-nowrap px-5 py-3.5">
                                {row.overtimeMinutes > 0 ? (
                                  <span className="text-xs font-medium text-emerald-300">
                                    +{row.overtimeMinutes}m
                                  </span>
                                ) : (
                                  <span className="text-zinc-600">—</span>
                                )}
                              </td>
                            )}

                            <td className="whitespace-nowrap px-5 py-3.5 text-zinc-300">
                              {formatFraction(row.payableFraction)}
                            </td>

                            <td className="whitespace-nowrap px-5 py-3.5 text-zinc-300">
                              {formatFraction(row.deductionFraction)}
                            </td>

                            <td className="whitespace-nowrap px-5 py-3.5">
                              {row.dayType === "weekend" ||
                              row.dayType === "holiday" ? (
                                <span className="inline-flex items-center rounded-full bg-violet-500/15 px-2 py-0.5 text-xs font-medium text-violet-300 ring-1 ring-violet-400/20">
                                  Paid
                                </span>
                              ) : (
                                <span
                                  className={cx(
                                    "text-sm font-medium",
                                    row.dailySalaryEarned > 0
                                      ? "text-emerald-300"
                                      : "text-red-400",
                                  )}
                                >
                                  {formatMoney(row.dailySalaryEarned)}
                                </span>
                              )}
                            </td>

                            <td className="px-5 py-3.5 text-zinc-300">
                              <div className="max-w-[360px] space-y-1">
                                {row.autoClosed && (
                                  <div className="text-xs text-amber-300">
                                    Auto-closed due to missing checkout
                                  </div>
                                )}
                                {Array.isArray(row.remarks) &&
                                row.remarks.length > 0 ? (
                                  row.remarks.map((remark, idx) => (
                                    <div
                                      key={idx}
                                      className="text-xs text-zinc-400"
                                    >
                                      • {remark}
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-xs text-zinc-500">
                                    —
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between border-t border-white/10 px-5 py-3 text-xs text-zinc-400">
                  <span>
                    {payroll.breakdown.length} day record(s) •{" "}
                    {payrollPeriodLabel(payroll.month, payroll.year)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-zinc-300">
                      Net: {formatMoney(payroll.netSalary)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {!loading && !payroll && !error && (
          <div className="mt-7 rounded-2xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-xl">
            <div className="mx-auto flex max-w-md flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10">
                <FileSpreadsheet className="h-5 w-5 text-zinc-300" />
              </div>
              <p className="mt-4 text-sm font-medium text-zinc-200">
                No payroll selected
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {canViewOthers
                  ? "Select an employee and month to view payroll."
                  : "Select a month to view your payroll."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-zinc-100">{value}</div>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  lines,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  lines: string[];
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10">
          <Icon className="h-4 w-4 text-zinc-200" />
        </div>
        <div>
          <div className="text-sm font-medium text-zinc-200">{title}</div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {lines.map((line, idx) => (
          <div key={idx} className="text-sm text-zinc-400">
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
