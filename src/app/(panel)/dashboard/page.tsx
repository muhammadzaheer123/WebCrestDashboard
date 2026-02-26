"use client";

import LeavesClient from "@/app/(panel)/leaves/LeavesClient";
import { Activity, Users, Clock, ShieldCheck } from "lucide-react";

function StatCard({
  title,
  value,
  icon: Icon,
  hint,
}: {
  title: string;
  value: string;
  icon: any;
  hint: string;
}) {
  return (
    <div className="w-full rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold tracking-wide text-white/60">
            {title}
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{value}</div>
          <div className="mt-1 text-xs text-white/50">{hint}</div>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7C3AED]/20 ring-1 ring-[#7C3AED]/30">
          <Icon className="h-5 w-5 text-white/85" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-white/55">
          Overview of HR activities, employees, and status.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="System Status"
          value="Healthy"
          icon={ShieldCheck}
          hint="Auth, DB, APIs operating"
        />
        <StatCard
          title="Employees"
          value="—"
          icon={Users}
          hint="Total employees (from API)"
        />
        <StatCard
          title="Attendance"
          value="—"
          icon={Activity}
          hint="Today’s activity"
        />
        <StatCard
          title="Pending Leaves"
          value="—"
          icon={Clock}
          hint="Requests awaiting review"
        />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-6">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-white/90">
              Leaves Overview
            </div>
            <div className="text-xs text-white/55">
              Quick access to leave requests module
            </div>
          </div>
        </div>
        <LeavesClient />
      </div>
    </div>
  );
}
