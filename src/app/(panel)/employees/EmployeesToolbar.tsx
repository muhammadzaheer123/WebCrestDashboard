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
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
      {icon ? <span className="text-white/55">{icon}</span> : null}
      {children}
    </span>
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
      <div>
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED]/70 to-black ring-1 ring-white/10 shadow-[0_10px_30px_rgba(124,58,237,0.15)]">
            <Users className="h-5 w-5 text-white/90" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
            <p className="mt-1 text-sm text-white/55">
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
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <GhostButton type="button" onClick={onRefresh} title="Refresh">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </GhostButton>

        <PrimaryButton
          type="button"
          onClick={onCreate}
          disabled={!canWrite}
          title={
            canWrite ? "Create a new employee" : "Only Admin/HR can create"
          }
        >
          <Plus className="h-4 w-4" />
          New Employee
        </PrimaryButton>
      </div>
    </div>
  );
}
