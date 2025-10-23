"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import "../../styles/dashboard.css";
import LeavesClient from "@/app/components/leaves/LeavesClient";

type User = {
  id: string;
  name?: string;
  email: string;
  role: "admin" | "hr" | string;
};

function getInitials(u?: User) {
  if (!u) return "??";
  const src = (u.name || u.email || "").trim();
  if (!src) return "??";
  const parts = src.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  const first = src[0];
  const handle = src.includes("@") ? src.split("@")[0] : src;
  const second = handle[1] || src[1] || "";
  return (first + second).toUpperCase();
}

export default function Dashboard() {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  async function logout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {}
    localStorage.removeItem("user");
    router.push("/login");
  }

  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "📊",
      path: "/admin/dashboard",
    },
    {
      id: "adjustments",
      label: "Adjustments",
      icon: "📈",
      path: "/components/adjustments",
    },
    {
      id: "employee",
      label: "Employees",
      icon: "👥",
      path: "/components/emplyees",
    },
    { id: "users", label: "Users", icon: "🛒", path: "/orders" },
    { id: "settings", label: "Settings", icon: "⚙️", path: "/settings" },
  ];

  const accountTitle = user
    ? `${user.name ?? user.email} (${(user.role ?? "").toUpperCase()})`
    : "Account";

  return (
    <>
      <div
        className={`dashboard-root ${
          sidebarOpen ? "sidebar-open" : "sidebar-collapsed"
        }`}
      >
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="brand">
              <div className="brand-logo">🚀</div>
              <h2>WebCrest</h2>
            </div>
          </div>

          <nav className="sidebar-nav">
            {navItems.map((item) => {
              const active =
                pathname === item.path || pathname.startsWith(`${item.path}/`);
              return (
                <Link
                  key={item.id}
                  href={item.path}
                  className={`nav-item ${active ? "active" : ""}`}
                  title={item.label}
                >
                  <span className="nav-ico">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="main">
          <header className="main-header">
            <div className="header-left">
              <h1 className="page-title">Dashboard</h1>
              <span className="breadcrumb">Admin · Overview</span>
            </div>

            <div className="header-right">
              <div className="search-wrap">
                <input className="search" placeholder="Search…" />
              </div>

              <button className="icon-btn" title="Notifications">
                🔔
              </button>

              <div className="user-area" ref={menuRef}>
                <button
                  type="button"
                  className="user-avatar"
                  onClick={() => setMenuOpen((s) => !s)}
                  title={accountTitle}
                >
                  {getInitials(user ?? undefined)}
                </button>

                {menuOpen && (
                  <div className="user-menu">
                    <div className="user-menu-header">
                      <div className="user-menu-name">
                        {user?.name ?? user?.email}
                      </div>
                      <div className="user-menu-role">
                        {user?.role?.toUpperCase()}
                      </div>
                    </div>
                    <button className="user-menu-item" onClick={logout}>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>
          <div className="content">
            <LeavesClient />
          </div>
        </main>
      </div>
    </>
  );
}
