
"use client";
import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  LayoutDashboard,
  Building2,
  Users,
  ShieldCheck,
  BriefcaseBusiness,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  X,
} from "lucide-react";

import Skeleton from "@/components/ui/skeleton";
import toast from "react-hot-toast";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

interface AdminSidebarProps {
  menuOpen: boolean;
  setMenuOpen: Dispatch<SetStateAction<boolean>>;
  onCompanyAdminsClick?: () => void;
  activeSection?: "dashboard" | "company-admins";
}

const navigation = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Companies",
    href: "/admin/companies",
    icon: Building2,
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "Company Admins",
    href: "/admin/company-admin",
    icon: ShieldCheck,
  },
  {
    label: "Jobs",
    href: "/admin/jobs",
    icon: BriefcaseBusiness,
  },
  {
    label: "Applications",
    href: "/admin/applications",
    icon: FileText,
  },
  {
    label: "Reports",
    href: "/admin/reports",
    icon: BarChart3,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

function AdminProfileSkeleton() {
  return (
    <div className="admin-profile">
      <Skeleton variant="circle" width={42} height={42} />

      <div className="admin-profile-skeleton">
        <Skeleton variant="text" width={100} height={13} />
        <Skeleton variant="text" width={75} height={11} />
      </div>
    </div>
  );
}

export default function AdminSidebar({
  menuOpen,
  setMenuOpen,
  onCompanyAdminsClick,
  activeSection = "dashboard",
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [profileLoading, setProfileLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfileLoading(false);
  }, []);

  function isActive(href: string) {
    if (href === "/admin") {
      return pathname === "/admin";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);
    const loadingToast = toast.loading("Signing out...");

    const accessToken = sessionStorage.getItem("access_token");

    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem("refresh_token");
      sessionStorage.removeItem("user");

      toast.dismiss(loadingToast);
      toast.success("Signed out.");
      router.push("/login");
    }
  }

  return (
    <>
      {/* Mobile overlay */}
      {menuOpen && (
        <button
          type="button"
          className="admin-overlay"
          aria-label="Close sidebar"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Admin sidebar */}
      <aside
        className={`admin-sidebar ${menuOpen ? "open" : ""}`}
      >
        {/* Brand */}
        <div className="admin-brand">
          <div className="admin-brand-icon">
            <BriefcaseBusiness size={22} />
          </div>

          <div className="admin-brand-text">
            <h2>CareerHub</h2>
            <p>SUPER-ADMIN PORTAL</p>
          </div>

          <button
            type="button"
            className="admin-close-menu"
            onClick={() => setMenuOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <div className="admin-sidebar-section">
          <p className="admin-nav-label">MAIN MENU</p>

          <nav className="admin-navigation">
            {navigation.map((item) => {
              const Icon = item.icon;

              // Company Admins: render as a button
              if (item.label === "Company Admins") {
                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => {
                      if (onCompanyAdminsClick){
                        onCompanyAdminsClick();
                      } else {
                        router.push("/admin?section=company-admin");
                      }

                      setMenuOpen(false);
                    }}
                    className={
                      activeSection === "company-admins"
                        ? "admin-nav-item active"
                        : "admin-nav-item"
                    }
                  >
                    <Icon size={19} />
                    <span>{item.label}</span>
                  </button>
                );
              }

              // Other menu items: normal navigation
              const active =
                item.href === "/admin"
                  ? activeSection === "dashboard" &&
                    isActive(item.href)
                  : isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={
                    active
                      ? "admin-nav-item active"
                      : "admin-nav-item"
                  }
                >
                  <Icon size={19} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Profile and logout */}
        <div className="admin-sidebar-bottom">
            <div className="admin-profile">
                <div className="admin-avatar">SA</div>

                <div className="admin-profile-info">
                <strong>Super Admin</strong>
                <span>Administrator</span>
                </div>
            </div>

            <button
                type="button"
                className="admin-logout"
                onClick={handleLogout}
                disabled={loggingOut}
            >
                <LogOut size={18} />
                <span>
                {loggingOut ? "Logging out..." : "Logout"}
                </span>
            </button>
            </div>
      </aside>
    </>
  );
}
