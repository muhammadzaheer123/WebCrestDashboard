"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useRouter } from "next/router";
import Image from "next/image";

export type NavItem = {
  id: string;
  label: string; // shows in UI
  icon: LucideIcon;
  path: string; // used only for href + active check
};

export default function Sidebar({
  pathname,
  navItems,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  brandTitle,
}: {
  pathname: string;
  navItems: NavItem[];
  collapsed: boolean;
  setCollapsed: (v: boolean | ((p: boolean) => boolean)) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean | ((p: boolean) => boolean)) => void;
  brandTitle: string;
}) {
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const widthClass = collapsed ? "w-[86px]" : "w-[280px]";

  const renderNav = (isMobile = false) => (
    <nav className="mt-5 space-y-1 px-3">
      {navItems.map((item) => {
        const active =
          pathname === item.path || pathname.startsWith(`${item.path}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.id}
            href={item.path}
            className={[
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 transition",
              "border border-transparent",
              active
                ? "bg-[#6D28D9]/20 border-[#7C3AED]/30"
                : "hover:bg-white/5 hover:border-white/10",
            ].join(" ")}
            title={item.label}
          >
            <span
              className={[
                "flex h-9 w-9 items-center justify-center rounded-lg",
                active ? "bg-[#7C3AED]/25" : "bg-white/5",
              ].join(" ")}
            >
              <Icon className="h-5 w-5 text-white/90" />
            </span>

            {!collapsed && (
              <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-white/90">
                {item.label}
              </span>
            )}

            {active && !collapsed && (
              <span className="h-1.5 w-1.5 rounded-full bg-[#A78BFA]" />
            )}
          </Link>
        );
      })}

      {isMobile && (
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
        >
          <X className="h-4 w-4" />
          Close
        </button>
      )}
    </nav>
  );

  return (
    <>
      {/* Desktop */}
      <aside
        className={[
          "hidden md:flex md:flex-col md:border-r md:border-white/10",
          "bg-[#0B0616]",
          widthClass,
          "transition-[width] duration-200",
        ].join(" ")}
      >
        <div className="flex items-center justify-between px-4 pt-5">
          <div className="flex items-center gap-3">
            <span className="w-12 h-10 rounded-[8px] bg-gradient-to-br from-[#7C3AED] to-[#1f283e]">
              <Image
                src="/assets/images/Webcrest.png"
                alt=""
                width={100}
                height={100}
                className="mt-2 ml-1 w-10 h-auto"
              />
            </span>
            {!collapsed && (
              <div className="leading-tight">
                <div className="text-sm font-semibold text-white">
                  {brandTitle}
                </div>
                <div className="text-xs text-white/55">Admin panel</div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setCollapsed((s) => !s)}
            className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/80 hover:bg-white/10"
            aria-label="Toggle sidebar"
            title="Toggle sidebar"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {renderNav(false)}

        <div className="mt-auto px-4 pb-5 pt-6">
          <div className="rounded-xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.03] p-3">
            {!collapsed ? (
              <>
                <div className="text-xs font-semibold text-white/80">
                  Quick tip
                </div>
                <div className="mt-1 text-xs text-white/60">
                  Use the top search to quickly find employees.
                </div>
              </>
            ) : (
              <div className="h-6" />
            )}
          </div>
        </div>
      </aside>

      {/* Mobile */}
      <div className={["md:hidden", mobileOpen ? "block" : "hidden"].join(" ")}>
        <div
          className="fixed inset-0 z-[60] bg-black/60"
          onClick={() => setMobileOpen(false)}
        />
        <aside className="fixed left-0 top-0 z-[70] h-dvh w-[86%] max-w-[320px] border-r border-white/10 bg-[#0B0616]">
          <div className="flex items-center justify-between px-4 pt-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#111827] ring-1 ring-white/10" />
              <div className="leading-tight">
                <div className="text-sm font-semibold text-white">
                  {brandTitle}
                </div>
                <div className="text-xs text-white/55">Admin panel</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/80 hover:bg-white/10"
              aria-label="Close"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {renderNav(true)}
        </aside>
      </div>
    </>
  );
}
