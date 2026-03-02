"use client";
import React from "react";

export function cryptoId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export function cx(...classes: Array<string | boolean | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

export function clampInt(v: string, min: number, max: number) {
  const n = Number.parseInt(v || "0", 10);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

export function GlassCard({
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

export function Field({
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

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
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

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
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

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
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
      <span
        className={cx(
          "h-4 w-7 rounded-full border border-white/10 p-[2px] transition",
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

export function EmptyState({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 text-xl">
        🗂️
      </div>
      <p className="mt-4 text-sm font-medium text-zinc-200">{title}</p>
      <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>
    </div>
  );
}
