"use client";
import React from "react";
import { Filter, Search } from "lucide-react";

const cx = (...cls: Array<string | false | null | undefined>) =>
  cls.filter(Boolean).join(" ");

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

function Input({
  leftIcon,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  leftIcon?: React.ReactNode;
}) {
  return (
    <div className="relative">
      {leftIcon ? (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/45">
          {leftIcon}
        </span>
      ) : null}
      <input
        {...props}
        className={cx(
          "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white",
          "placeholder:text-white/40 outline-none",
          "focus:border-[#7C3AED]/45 focus:ring-4 focus:ring-[#7C3AED]/15",
          leftIcon ? "pl-10" : "",
          className,
        )}
      />
    </div>
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

export type Role = "admin" | "hr" | "employee" | string;

export default function EmployeesFilters({
  search,
  department,
  role,
  setSearch,
  setDepartment,
  setRole,
  onReset,
  onApply,
}: {
  search: string;
  department: string;
  role: Role | "";
  setSearch: (v: string) => void;
  setDepartment: (v: string) => void;
  setRole: (v: Role | "") => void;
  onReset: () => void;
  onApply: () => void;
}) {
  return (
    <GlassCard className="mt-6 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-white/85">
          <Filter className="h-4 w-4" />
          Filters
        </div>

        <button
          type="button"
          onClick={onReset}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/75 hover:bg-white/10"
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <label className="text-xs font-semibold text-white/60">Search</label>
          <div className="mt-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name / Email / Employee ID"
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
        </div>

        <div className="lg:col-span-4">
          <label className="text-xs font-semibold text-white/60">
            Department
          </label>
          <div className="mt-2">
            <Input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="HR, Engineering..."
            />
          </div>
        </div>

        <div className="lg:col-span-3">
          <label className="text-xs font-semibold text-white/60">Role</label>
          <div className="mt-2">
            <Select value={role} onChange={(e) => setRole(e.target.value)}>
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
            </Select>
          </div>
        </div>

        <div className="lg:col-span-12 flex justify-end">
          <PrimaryButton type="button" onClick={onApply}>
            Apply
          </PrimaryButton>
        </div>
      </div>
    </GlassCard>
  );
}
