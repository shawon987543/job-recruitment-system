
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BriefcaseBusiness,
  FileText,
  Users,
  CalendarDays,
  Building2,
  LogOut,
  ChevronRight,
  Menu,
  X,
  CircleHelp,
} from "lucide-react";


const navigation = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/company-admin",
  },
  {
    label: "Job Management",
    icon: BriefcaseBusiness,
    href: "/company-admin/jobs",
  },
  {
    label: "Applications",
    icon: FileText,
    href: "/company-admin/applications",
  },
  {
    label: "Candidates",
    icon: Users,
    href: "/company-admin/candidates",
  },
  {
    label: "Interviews",
    icon: CalendarDays,
    href: "/company-admin/interviews",
  },
  {
    label: "Company Profile",
    icon: Building2,
    href: "/company-admin/company-profile",
  },
];


function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "CA";
}

export default function CompanyAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminName, setAdminName] = useState("Company Admin");

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAdminName(user.name || user.fullName || "Company Admin");
      } catch {
        setAdminName("Company Admin");
      }
    }
  }, []);

  const pageTitle =
  pathname === "/company-admin"
    ? "Dashboard"
    : pathname.startsWith("/company-admin/jobs")
      ? "Job Management"
      : pathname.startsWith("/company-admin/applications")
        ? "Applications"
        : pathname.startsWith("/company-admin/candidates")
          ? "Candidates"
          : pathname.startsWith("/company-admin/interviews")
            ? "Interviews"
            : pathname.startsWith("/company-admin/company-profile")
              ? "Company Profile"
              : "Company Workspace";

  function logout() {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("user");
    router.push("/login");
  }

  return (
    <div className="ca-layout">
      {sidebarOpen && (
        <button
          className="ca-overlay"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`ca-sidebar ${sidebarOpen ? "ca-sidebar-open" : ""}`}>
        <div className="ca-brand">
          <div className="ca-brand-icon">
            <BriefcaseBusiness size={22} />
          </div>

          <div className="ca-brand-text">
            <h2>CareerHub</h2>
            <p>COMPANY PORTAL</p>
          </div>

          <button
            className="ca-mobile-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="ca-sidebar-section">
          <p className="ca-menu-label">WORKSPACE</p>

          <nav className="ca-navigation">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = item.href === pathname;

              if (item.href) {
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={
                      active
                        ? "ca-nav-item ca-nav-active"
                        : "ca-nav-item"
                    }
                  >
                    <Icon size={19} />
                    <span>{item.label}</span>
                    {active && (
                      <ChevronRight size={17} className="ca-nav-arrow" />
                    )}
                  </Link>
                );
              }

              return (
                <div
                  key={item.label}
                  className="ca-nav-item ca-nav-disabled"
                  title="Coming soon"
                >
                  <Icon size={19} />
                  <span>{item.label}</span>
                  <span className="ca-coming-soon">Soon</span>
                </div>
              );
            })}
          </nav>
        </div>

        <div className="ca-sidebar-help">
          <div className="ca-help-icon">
            <CircleHelp size={19} />
          </div>
          <div>
            <strong>Need help?</strong>
            <p>Contact your system administrator.</p>
          </div>
        </div>

        <div className="ca-sidebar-bottom">
          <div className="ca-profile">
            <div className="ca-avatar">{getInitials(adminName)}</div>
            <div className="ca-profile-info">
              <strong>{adminName}</strong>
              <span>Company Administrator</span>
            </div>
          </div>

          <button className="ca-logout-button" onClick={logout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="ca-main">
        <header className="ca-topbar">
          <div className="ca-topbar-left">
            <button
              className="ca-menu-button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={22} />
            </button>

            <div>
              <div className="ca-breadcrumb">
                Workspace <ChevronRight size={13} /> {pageTitle}
              </div>
              <h1>{pageTitle}</h1>
            </div>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
