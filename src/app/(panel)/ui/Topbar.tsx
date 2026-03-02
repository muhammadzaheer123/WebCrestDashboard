"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  Search,
  LogOut,
  ChevronDown,
  User,
  HelpCircle,
  Moon,
  Sun,
  Sparkles,
} from "lucide-react";

type UserType = {
  id: string;
  name?: string;
  email: string;
  role?: string;
};

function initials(u?: UserType | null) {
  const src = (u?.name || u?.email || "").trim();
  if (!src) return "??";
  const parts = src.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  const handle = src.includes("@") ? src.split("@")[0] : src;
  return (handle.slice(0, 2) || "??").toUpperCase();
}

export default function Topbar({
  pathname,
  setMobileOpen,
  user,
  titleMap,
}: {
  pathname: string;
  setMobileOpen: (v: boolean | ((p: boolean) => boolean)) => void;
  user: UserType | null;
  titleMap: Record<string, { title: string; subtitle?: string }>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // optional: local theme toggle state (replace with your theme system if any)
  const [dark, setDark] = useState(true);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const meta = useMemo(() => {
    if (titleMap[pathname]) return titleMap[pathname];
    const keys = Object.keys(titleMap).sort((a, b) => b.length - a.length);
    const found = keys.find(
      (k) => pathname === k || pathname.startsWith(k + "/"),
    );
    return found
      ? titleMap[found]
      : { title: "Dashboard", subtitle: "Overview" };
  }, [pathname, titleMap]);

  async function logout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {}
    try {
      localStorage.removeItem("user");
    } catch {}
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0B0616]/70 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="md:hidden rounded-lg border border-white/10 bg-white/5 p-2 text-white/80 hover:bg-white/10"
            aria-label="Open menu"
            title="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="leading-tight">
            <div className="text-[20px] font-semibold text-white">
              {meta.title}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="hidden md:flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/70">
            <Search className="h-4 w-4" />
            <input
              className="w-[240px] bg-transparent text-sm outline-none placeholder:text-white/35"
              placeholder="Search…"
            />
          </div>

          {/* Profile pill (like your 3rd image) */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setOpen((s) => !s)}
              className="flex items-center gap-2 rounded-[13px] border border-white/10 bg-white/5 px-3 py-1.5 text-white/85 hover:bg-white/10"
              title={user?.email || "Account"}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#111827] ring-1 ring-white/10 text-xs font-semibold">
                {initials(user)}
              </span>
              <span className="max-w-[220px] truncate text-sm text-white/85">
                {user?.name || "account@email.com"}
              </span>
              <ChevronDown className="h-4 w-4 text-white/60" />
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-[280px] overflow-hidden rounded-2xl border border-white/10 bg-[#0B0616] shadow-2xl">
                <div className="px-4 py-3 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10 text-sm font-semibold">
                      {initials(user)}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-white">
                        {user?.name || "Account"}
                      </div>
                      <div className="truncate text-xs text-white/55">
                        {user?.email}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 inline-flex rounded-full bg-[#7C3AED]/20 px-2 py-0.5 text-[11px] text-[#C4B5FD] border border-[#7C3AED]/25">
                    {(user?.role || "user").toUpperCase()}
                  </div>
                </div>

                <button className="flex w-full items-center gap-2 px-4 py-3 text-sm text-white/80 hover:bg-white/5">
                  <User className="h-4 w-4" />
                  Profile Settings
                </button>

                <button className="flex w-full items-center gap-2 px-4 py-3 text-sm text-white/80 hover:bg-white/5">
                  <HelpCircle className="h-4 w-4" />
                  Help Center
                </button>

                <button
                  type="button"
                  onClick={() => setDark((d) => !d)}
                  className="flex w-full items-center gap-2 px-4 py-3 text-sm text-white/80 hover:bg-white/5"
                >
                  {dark ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                  {dark ? "Light Mode" : "Dark Mode"}
                </button>

                <button className="flex w-full items-center gap-2 px-4 py-3 text-sm text-white/80 hover:bg-white/5">
                  <Sparkles className="h-4 w-4" />
                  Upgrade Plan
                </button>

                <div className="h-px bg-white/10" />

                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center gap-2 px-4 py-3 text-sm text-white/80 hover:bg-white/5"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
