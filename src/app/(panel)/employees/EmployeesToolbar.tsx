"use client";
import React from "react";
import { Users, ShieldCheck, Sparkles, RefreshCw, Plus } from "lucide-react";

const cx = (...cls: Array<string | false | null | undefined>) =>
  cls.filter(Boolean).join(" ");

function Chip({
  icon,
  children,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400 backdrop-blur-sm">
      {icon ? <span className="text-zinc-500">{icon}</span> : null}
      {children}
    </span>
  );
}

export default function EmployeesToolbar({
  canWrite,
  totalEmployees,
  onRefresh,
  onCreate,
}: {
  canWrite: boolean;
  totalEmployees: number;
  onRefresh: () => void;
  onCreate: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      {/* Left — icon + title + chips */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 shadow-sm shadow-violet-500/10">
          <Users className="h-5 w-5 text-zinc-200" />
        </div>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
            Employees
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Manage employee records, roles, shifts and status.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Chip icon={<ShieldCheck className="h-3.5 w-3.5" />}>
              Access: {canWrite ? "Write enabled" : "Read only"}
            </Chip>
            <Chip icon={<Sparkles className="h-3.5 w-3.5" />}>
              Total: {totalEmployees}
            </Chip>
          </div>
        </div>
      </div>

      {/* Right — actions */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {/* Refresh */}
        <button
          type="button"
          onClick={onRefresh}
          title="Refresh"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-200 backdrop-blur-xl transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>

        {/* New Employee */}
        <button
          type="button"
          onClick={onCreate}
          disabled={!canWrite}
          title={
            canWrite ? "Create a new employee" : "Only Admin/HR can create"
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/20 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          New Employee
        </button>
      </div>
    </div>
  );
}
