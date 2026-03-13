"use client";
import React from "react";
import { Filter, Search } from "lucide-react";

const cx = (...cls: Array<string | false | null | undefined>) =>
  cls.filter(Boolean).join(" ");

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
    <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      {/* Filter header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10">
            <Filter className="h-3.5 w-3.5 text-zinc-300" />
          </div>
          <span className="text-sm font-medium text-zinc-200">Filters</span>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/10"
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Search */}
        <div className="lg:col-span-5">
          <label className="text-xs font-medium text-zinc-400">Search</label>
          <div className="relative mt-1.5">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name / Email / Employee ID"
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none backdrop-blur-xl transition focus:border-violet-500/40 focus:ring-4 focus:ring-violet-500/15"
            />
          </div>
        </div>

        {/* Department */}
        <div className="lg:col-span-4">
          <label className="text-xs font-medium text-zinc-400">
            Department
          </label>
          <input
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="HR, Engineering..."
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none backdrop-blur-xl transition focus:border-violet-500/40 focus:ring-4 focus:ring-violet-500/15"
          />
        </div>

        {/* Role */}
        <div className="lg:col-span-3">
          <label className="text-xs font-medium text-zinc-400">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-100 outline-none backdrop-blur-xl transition focus:border-violet-500/40 focus:ring-4 focus:ring-violet-500/15"
          >
            <option value="" className="bg-zinc-900 text-zinc-100">
              All
            </option>
            <option value="admin" className="bg-zinc-900 text-zinc-100">
              Admin
            </option>
            <option value="hr" className="bg-zinc-900 text-zinc-100">
              HR
            </option>
            <option value="employee" className="bg-zinc-900 text-zinc-100">
              Employee
            </option>
          </select>
        </div>

        {/* Apply */}
        <div className="lg:col-span-12 flex justify-end">
          <button
            type="button"
            onClick={onApply}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/20 transition hover:opacity-95"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
