"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Building2,
  KeyRound,
  Lock,
  Save,
  ShieldCheck,
  Slack,
  Timer,
  Users,
  Webhook,
} from "lucide-react";

type Role = {
  id: string;
  name: "Admin" | "HR" | "Manager" | "Employee";
  canManageEmployees: boolean;
  canApproveLeaves: boolean;
  canViewReports: boolean;
  canEditPolicies: boolean;
};

type SettingsState = {
  orgName: string;
  timezone: string;
  currency: string;

  notificationsEmail: boolean;
  notificationsSlack: boolean;
  dailyDigest: boolean;

  require2FA: boolean;
  sessionTimeoutMinutes: number;

  integrationsApiKey: string;
  webhookUrl: string;

  roles: Role[];
};

const STORAGE_KEY = "webcrest.panel.settings.v1";

function cryptoId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

const defaultState: SettingsState = {
  orgName: "WebCrest",
  timezone: "Asia/Karachi",
  currency: "PKR",

  notificationsEmail: true,
  notificationsSlack: false,
  dailyDigest: true,

  require2FA: false,
  sessionTimeoutMinutes: 60,

  integrationsApiKey: "",
  webhookUrl: "",

  roles: [
    {
      id: cryptoId(),
      name: "Admin",
      canManageEmployees: true,
      canApproveLeaves: true,
      canViewReports: true,
      canEditPolicies: true,
    },
    {
      id: cryptoId(),
      name: "HR",
      canManageEmployees: true,
      canApproveLeaves: true,
      canViewReports: true,
      canEditPolicies: true,
    },
    {
      id: cryptoId(),
      name: "Manager",
      canManageEmployees: false,
      canApproveLeaves: true,
      canViewReports: true,
      canEditPolicies: false,
    },
    {
      id: cryptoId(),
      name: "Employee",
      canManageEmployees: false,
      canApproveLeaves: false,
      canViewReports: false,
      canEditPolicies: false,
    },
  ],
};

function cx(...classes: Array<string | boolean | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cx(
        "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none backdrop-blur-xl transition",
        "focus:border-violet-500/40 focus:ring-4 focus:ring-violet-500/15",
        props.className,
      )}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cx(
        "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-100 outline-none backdrop-blur-xl transition",
        "focus:border-violet-500/40 focus:ring-4 focus:ring-violet-500/15",
        props.className,
      )}
    />
  );
}

function Field({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="flex items-end justify-between gap-3">
        <span className="text-xs font-medium text-zinc-300">{label}</span>
        {helper ? (
          <span className="text-[11px] text-zinc-500">{helper}</span>
        ) : null}
      </div>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  icon: Icon,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  icon?: React.ElementType;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cx(
        "inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-medium transition",
        checked
          ? "bg-emerald-500/15 text-emerald-200"
          : "bg-white/5 text-zinc-300 hover:bg-white/7",
      )}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      <span
        className={cx(
          "ml-1 h-4 w-7 rounded-full border border-white/10 p-[2px] transition",
          checked ? "bg-emerald-500/20" : "bg-black/20",
        )}
      >
        <span
          className={cx(
            "block h-3 w-3 rounded-full transition",
            checked
              ? "translate-x-3 bg-emerald-300"
              : "translate-x-0 bg-zinc-300",
          )}
        />
      </span>
      {label}
    </button>
  );
}

function GlassCard({
  title,
  subtitle,
  icon: Icon,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {Icon ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 shadow-sm shadow-violet-500/10">
              <Icon className="h-5 w-5 text-zinc-200" />
            </div>
          ) : null}
          <div>
            <h2 className="text-base font-semibold tracking-tight">{title}</h2>
            {subtitle ? (
              <p className="mt-1 text-xs text-zinc-400">{subtitle}</p>
            ) : null}
          </div>
        </div>
        {right}
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const [state, setState] = useState<SettingsState>(defaultState);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      setState(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const dirty = useMemo(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return true;
    return raw !== JSON.stringify(state);
  }, [state]);

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setSavedAt(Date.now());
  }

  function reset() {
    setState(defaultState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState));
    setSavedAt(Date.now());
  }

  return (
    <div className="min-h-screen text-zinc-100">
      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute top-48 -left-40 h-[420px] w-[420px] rounded-full bg-fuchsia-600/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[520px] w-[520px] rounded-full bg-violet-500/10 blur-[140px]" />
      </div>

      <div className="relative mx-auto ">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Admin configuration: organization, roles, notifications, security,
              integrations.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-200 hover:bg-white/7"
            >
              Reset
            </button>

            <button
              onClick={save}
              className={cx(
                "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/20 transition",
                dirty
                  ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:opacity-95"
                  : "bg-white/10 text-zinc-300 shadow-none hover:bg-white/12",
              )}
            >
              <Save className="h-4 w-4" />
              Save
            </button>
          </div>
        </div>

        {/* Status strip */}
        <div className="mt-5 text-xs text-zinc-400">
          {dirty ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400/80" />
              Unsaved changes
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
              All changes saved
            </span>
          )}
          {savedAt ? (
            <span className="ml-2 text-zinc-500">
              • Last saved {new Date(savedAt).toLocaleTimeString()}
            </span>
          ) : null}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Org */}
          <GlassCard
            title="Organization"
            subtitle="Company identity and regional defaults."
            icon={Building2}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Organization name">
                <Input
                  value={state.orgName}
                  onChange={(e) =>
                    setState((s) => ({ ...s, orgName: e.target.value }))
                  }
                />
              </Field>

              <Field
                label="Timezone"
                helper="Used for check-in/out and reports"
              >
                <Select
                  value={state.timezone}
                  onChange={(e) =>
                    setState((s) => ({ ...s, timezone: e.target.value }))
                  }
                >
                  <option>Asia/Karachi</option>
                  <option>Asia/Dubai</option>
                  <option>Asia/Kolkata</option>
                  <option>Europe/London</option>
                  <option>America/New_York</option>
                </Select>
              </Field>

              <Field label="Currency" helper="For payroll and costs">
                <Select
                  value={state.currency}
                  onChange={(e) =>
                    setState((s) => ({ ...s, currency: e.target.value }))
                  }
                >
                  <option>PKR</option>
                  <option>USD</option>
                  <option>AED</option>
                  <option>INR</option>
                  <option>GBP</option>
                </Select>
              </Field>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-xs text-zinc-400">
              <div className="flex items-center justify-between">
                <span>Current org</span>
                <span className="font-medium text-zinc-100">
                  {state.orgName}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>Timezone</span>
                <span className="font-medium text-zinc-100">
                  {state.timezone}
                </span>
              </div>
            </div>
          </GlassCard>

          {/* Notifications */}
          <GlassCard
            title="Notifications"
            subtitle="Choose where admins receive updates."
            icon={Bell}
          >
            <div className="flex flex-wrap gap-2">
              <Toggle
                checked={state.notificationsEmail}
                onChange={(v) =>
                  setState((s) => ({ ...s, notificationsEmail: v }))
                }
                label="Email alerts"
                icon={Bell}
              />
              <Toggle
                checked={state.notificationsSlack}
                onChange={(v) =>
                  setState((s) => ({ ...s, notificationsSlack: v }))
                }
                label="Slack alerts"
                icon={Slack}
              />
              <Toggle
                checked={state.dailyDigest}
                onChange={(v) => setState((s) => ({ ...s, dailyDigest: v }))}
                label="Daily digest"
                icon={ShieldCheck}
              />
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-xs text-zinc-400">
              <p className="text-zinc-300 font-medium">
                What will be notified?
              </p>
              <ul className="mt-2 space-y-1">
                <li>• New leave requests</li>
                <li>• Absent/late anomalies</li>
                <li>• New employee created</li>
                <li>• Policy changes</li>
              </ul>
            </div>
          </GlassCard>

          {/* Roles */}
          <GlassCard
            title="Roles & Permissions"
            subtitle="Quick permission toggles (you can connect to RBAC later)."
            icon={Users}
          >
            <div className="space-y-3">
              {state.roles.map((r) => (
                <div
                  key={r.id}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-zinc-100">
                      {r.name}
                    </p>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-zinc-400">
                      Role
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Toggle
                      checked={r.canManageEmployees}
                      onChange={(v) =>
                        updateRole(setState, r.id, { canManageEmployees: v })
                      }
                      label="Manage Employees"
                    />
                    <Toggle
                      checked={r.canApproveLeaves}
                      onChange={(v) =>
                        updateRole(setState, r.id, { canApproveLeaves: v })
                      }
                      label="Approve Leaves"
                    />
                    <Toggle
                      checked={r.canViewReports}
                      onChange={(v) =>
                        updateRole(setState, r.id, { canViewReports: v })
                      }
                      label="View Reports"
                    />
                    <Toggle
                      checked={r.canEditPolicies}
                      onChange={(v) =>
                        updateRole(setState, r.id, { canEditPolicies: v })
                      }
                      label="Edit Policies"
                    />
                  </div>

                  <p className="mt-3 text-xs text-zinc-500">
                    Later: map these toggles to backend permissions.
                  </p>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Security */}
          <GlassCard
            title="Security"
            subtitle="Protect admin panel access and session behavior."
            icon={Lock}
          >
            <div className="flex flex-wrap gap-2">
              <Toggle
                checked={state.require2FA}
                onChange={(v) => setState((s) => ({ ...s, require2FA: v }))}
                label="Require 2FA"
                icon={KeyRound}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Session timeout (minutes)"
                helper="Auto logout after inactivity"
              >
                <Input
                  type="number"
                  min={5}
                  value={state.sessionTimeoutMinutes}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      sessionTimeoutMinutes: clampInt(e.target.value, 5, 720),
                    }))
                  }
                />
              </Field>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-xs text-zinc-400">
                <div className="flex items-center gap-2 text-zinc-200">
                  <Timer className="h-4 w-4" />
                  Enforcement
                </div>
                <p className="mt-2">
                  Sessions expire after{" "}
                  <span className="text-zinc-100 font-medium">
                    {state.sessionTimeoutMinutes}
                  </span>{" "}
                  minutes.
                </p>
                <p className="mt-1 text-zinc-500">
                  Later: add IP allow-list, device trust, audit logs.
                </p>
              </div>
            </div>
          </GlassCard>

          {/* Integrations */}
          <div className="lg:col-span-2">
            <GlassCard
              title="Integrations"
              subtitle="Prepare connections for your future mobile app, webhooks, and internal tools."
              icon={Webhook}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="API Key" helper="Used by your mobile app later">
                  <Input
                    value={state.integrationsApiKey}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        integrationsApiKey: e.target.value,
                      }))
                    }
                    placeholder="Paste generated API key..."
                  />
                </Field>
                <Field label="Webhook URL" helper="Receive real-time events">
                  <Input
                    value={state.webhookUrl}
                    onChange={(e) =>
                      setState((s) => ({ ...s, webhookUrl: e.target.value }))
                    }
                    placeholder="https://your-server.com/webhooks"
                  />
                </Field>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-xs text-zinc-400">
                <p className="text-zinc-200 font-medium">
                  Events you can send later
                </p>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>• user.checked_in</div>
                  <div>• user.checked_out</div>
                  <div>• leave.requested</div>
                  <div>• leave.approved</div>
                  <div>• employee.created</div>
                  <div>• policy.updated</div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Footer tip */}
        <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 text-sm backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15 text-lg">
              💡
            </div>
            <div>
              <p className="font-medium text-zinc-200">Quick tip</p>
              <p className="text-xs text-zinc-500">
                For production, replace localStorage with DB + server actions or
                API routes.
              </p>
            </div>
          </div>
          <button
            onClick={save}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-200 hover:bg-white/7"
          >
            Save now
          </button>
        </div>
      </div>
    </div>
  );
}

function clampInt(v: string, min: number, max: number) {
  const n = Number.parseInt(v || "0", 10);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function updateRole(
  setState: React.Dispatch<React.SetStateAction<SettingsState>>,
  id: string,
  patch: Partial<Role>,
) {
  setState((s) => ({
    ...s,
    roles: s.roles.map((r) => (r.id === id ? { ...r, ...patch } : r)),
  }));
}
