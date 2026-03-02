"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  SlidersHorizontal,
  Settings,
} from "lucide-react";

import Sidebar, { NavItem } from "./Sidebar";
import Topbar from "./Topbar";

type User = {
  id: string;
  name?: string;
  email: string;
  role?: string;
};

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  // ✅ Sidebar nav items (NO URL text under label)
  const navItems: NavItem[] = useMemo(
    () => [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        path: "/dashboard",
      },
      { id: "employees", label: "Employees", icon: Users, path: "/employees" },
      {
        id: "adjustments",
        label: "Adjustments",
        icon: SlidersHorizontal,
        path: "/adjustments",
      },
      { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
    ],
    [],
  );

  // ✅ Title map for topbar (raw "/dashboard" nahi dikhayega)
  const titleMap = useMemo(
    () => ({
      "/dashboard": {
        title: "Dashboard",
        subtitle: "Overview of HR activities, employees, and status.",
      },
      "/employees": {
        title: "Employees",
        subtitle: "Manage employee records and profiles.",
      },
      "/adjustments": {
        title: "Adjustments",
        subtitle: "Track adjustments and updates.",
      },
      "/settings": {
        title: "Settings",
        subtitle: "Configure system preferences.",
      },
    }),
    [],
  );

  const mainPad = collapsed ? "md:pl-[86px]" : "md:pl-[280px]";

  return (
    <div className="min-h-screen bg-[#07030F] text-white">
      <div className="flex w-full">
        <Sidebar
          pathname={pathname}
          navItems={navItems}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          brandTitle={user?.name || user?.email || "WebCrest HR"}
        />

        <div className="min-h-screen flex-1 w-full">
          <Topbar
            pathname={pathname}
            setMobileOpen={setMobileOpen}
            user={user}
            titleMap={titleMap}
          />

          <main className="px-4 py-6 md:px-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
