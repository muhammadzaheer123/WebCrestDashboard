"use client";
import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  SlidersHorizontal,
  Settings,
  Notebook,
  Calendar,
  Banknote,
} from "lucide-react";

import Sidebar, { NavItem } from "./Sidebar";
import Topbar from "./Topbar";

type User = {
  id: string;
  name?: string;
  email: string;
  role?: "admin" | "hr" | "employee";
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

  // ✅ ROLE BASED NAV
  const navItems: NavItem[] = useMemo(() => {
    if (user?.role === "employee") {
      return [
        {
          id: "attendance",
          label: "Attendance",
          icon: Notebook,
          path: "/attendance",
        },
        {
          id: "employee-adjustments",
          label: "Company Policies",
          icon: SlidersHorizontal,
          path: "/employee-adjustments",
        },
        {
          id: "my-leaves",
          label: "My Leaves",
          icon: Calendar,
          path: "/my-leaves",
        },
        {
          id: "payroll",
          label: "My Payroll",
          icon: Banknote,
          path: "/payroll",
        },
      ];
    }

    return [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        path: "/dashboard",
      },
      {
        id: "employees",
        label: "Employees",
        icon: Users,
        path: "/employees",
      },
      {
        id: "adjustments",
        label: "Adjustments",
        icon: SlidersHorizontal,
        path: "/adjustments",
      },
      {
        id: "attendance",
        label: "Attendance",
        icon: Notebook,
        path: "/attendance",
      },
      {
        id: "leaves",
        label: "Leave Management",
        icon: Calendar,
        path: "/leaves",
      },
      {
        id: "payroll",
        label: "Payroll",
        icon: Banknote,
        path: "/payroll",
      },
      {
        id: "settings",
        label: "Settings",
        icon: Settings,
        path: "/settings",
      },
    ];
  }, [user]);

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
        subtitle: "Configure company policies.",
      },
      "/attendance": {
        title: "Attendance",
        subtitle: "Track employee attendance and work hours.",
      },
      "/settings": {
        title: "Settings",
        subtitle: "Configure system preferences.",
      },
      "/leaves": {
        title: "Leave Management",
        subtitle: "Manage employee leave requests.",
      },
      "/my-leaves": {
        title: "My Leaves",
        subtitle: "Submit and track your leave requests.",
      },
      "/employee-adjustments": {
        title: "Company Policies",
        subtitle: "View company HR adjustments and policies.",
      },
      "/payroll": {
        title: "Payroll",
        subtitle: "View and manage salary calculations and breakdowns.",
      },
    }),
    [],
  );

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
