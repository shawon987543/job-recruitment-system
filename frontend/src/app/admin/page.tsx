
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Building2,
  Users,
  BriefcaseBusiness,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  RefreshCw,
  Menu,
  X,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

interface DashboardStats {
  users: {
    total: number;
    candidates: number;
    companyAdmins: number;
    superAdmins: number;
    active: number;
  };
  companies: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    active: number;
  };
  jobs: {
    total: number;
    published: number;
    draft: number;
    closed: number;
  };
  applications: {
    total: number;
    pending: number;
    shortlisted: number;
    interview: number;
    selected: number;
    rejected: number;
    withdrawn: number;
  };
}

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { label: "Companies", icon: Building2, path: "/admin/companies" },
  { label: "Users", icon: Users, path: "/admin/users" },
  { label: "Company Admins", icon: Users, path: "/admin/company-admin" },
  { label: "Jobs", icon: BriefcaseBusiness, path: "/admin/jobs" },
  { label: "Applications", icon: FileText, path: "/admin/applications" },
  { label: "Reports", icon: BarChart3, path: "/admin/reports" },
  { label: "Settings", icon: Settings, path: "/admin/settings" },
];

export default function AdminPage() {
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const clearSession = () => {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("user");
  };

  const logout = async () => {
    const token = sessionStorage.getItem("access_token");

    try {
      if (token) {
        await fetch(`${API_URL}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch {
      // Clear the local session even if the API request fails.
    } finally {
      clearSession();
      router.push("/login");
    }
  };

  const fetchDashboard = async () => {
    setLoading(true);
    setError("");

    let accessToken = sessionStorage.getItem("access_token");
    const refreshToken = sessionStorage.getItem("refresh_token");

    if (!accessToken) {
      clearSession();
      router.replace("/login");
      setLoading(false);
      return;
    }

    try {
      let response = await fetch(`${API_URL}/admin/dashboard`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      });

      // Refresh the access token if it has expired.
      if (response.status === 401 && refreshToken) {
        const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
        });

        if (!refreshResponse.ok) {
          throw new Error("Your session has expired. Please log in again.");
        }

        const refreshed = await refreshResponse.json();

        accessToken = refreshed.access_token;

        sessionStorage.setItem("access_token", refreshed.access_token);
        sessionStorage.setItem("refresh_token", refreshed.refresh_token);

        response = await fetch(`${API_URL}/admin/dashboard`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        });
      }

      if (response.status === 401 || response.status === 403) {
        throw new Error("You are not authorized to access this dashboard.");
      }

      if (!response.ok) {
        throw new Error("Unable to load dashboard information.");
      }

      const data: DashboardStats = await response.json();
      setStats(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";

      if (message.includes("session has expired")) {
        clearSession();
        router.replace("/login");
        return;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userData = sessionStorage.getItem("user");

    if (!userData || !sessionStorage.getItem("access_token")) {
      clearSession();
      router.replace("/login");
      return;
    }

    try {
      const user = JSON.parse(userData);

      if (user.role !== "SUPER_ADMIN") {
        router.replace("/");
        return;
      }
    } catch {
      clearSession();
      router.replace("/login");
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statCards = stats
    ? [
        {
          title: "Total Users",
          value: stats.users.total,
          detail: `${stats.users.active} active users`,
          icon: Users,
          color: "blue",
        },
        {
          title: "Total Companies",
          value: stats.companies.total,
          detail: `${stats.companies.pending} pending approval`,
          icon: Building2,
          color: "purple",
        },
        {
          title: "Total Jobs",
          value: stats.jobs.total,
          detail: `${stats.jobs.published} published jobs`,
          icon: BriefcaseBusiness,
          color: "green",
        },
        {
          title: "Applications",
          value: stats.applications.total,
          detail: `${stats.applications.pending} pending review`,
          icon: FileText,
          color: "orange",
        },
      ]
    : [];

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${menuOpen ? "open" : ""}`}>
        <div className="admin-brand">
          <div className="admin-brand-icon">C</div>

          <div>
            <h2>CareerHub</h2>
            <span>Admin Portal</span>
          </div>

          <button
            className="admin-close-menu"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="admin-nav-label">MENU</div>

        <nav className="admin-navigation">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === "/admin";

            return (
              <Link
                key={item.label}
                href={item.path}
                className={`admin-nav-item ${isActive ? "active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-profile">
            <div className="admin-avatar">SA</div>

            <div className="admin-profile-info">
              <strong>Super Admin</strong>
              <span>Administrator</span>
            </div>
          </div>

          <button className="admin-logout" onClick={logout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {menuOpen && (
        <button
          className="admin-overlay"
          onClick={() => setMenuOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <main className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-menu-button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          <div>
            <h1>Dashboard Overview</h1>
            <p>Welcome back! Here&apos;s what&apos;s happening today.</p>
          </div>

          <button
            className="admin-refresh"
            onClick={fetchDashboard}
            disabled={loading}
          >
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
        </header>

        <section className="admin-content">
          {error && (
            <div className="admin-error">
              <span>{error}</span>
              <button onClick={fetchDashboard}>Try again</button>
            </div>
          )}

          <div className="admin-welcome">
            <div>
              <span className="admin-welcome-label">SUPER ADMIN PANEL</span>
              <h2>Manage your recruitment platform</h2>
              <p>
                Monitor users, companies, jobs, and applications from one
                place.
              </p>
            </div>

            <div className="admin-welcome-decoration">CH</div>
          </div>

          <div className="admin-section-heading">
            <div>
              <h2>Platform Statistics</h2>
              <p>Overview of your platform activity</p>
            </div>
          </div>

          {loading ? (
            <div className="admin-loading">Loading dashboard data...</div>
          ) : stats ? (
            <>
              <div className="admin-stats-grid">
                {statCards.map((card) => {
                  const Icon = card.icon;

                  return (
                    <div className="admin-stat-card" key={card.title}>
                      <div className={`admin-stat-icon ${card.color}`}>
                        <Icon size={22} />
                      </div>

                      <p>{card.title}</p>
                      <h3>{card.value.toLocaleString()}</h3>
                      <span>{card.detail}</span>
                    </div>
                  );
                })}
              </div>

              <div className="admin-section-heading">
                <div>
                  <h2>Detailed Overview</h2>
                  <p>Current status across the platform</p>
                </div>
              </div>

              <div className="admin-details-grid">
                <div className="admin-detail-card">
                  <h3>Users</h3>

                  <div className="admin-detail-row">
                    <span>Candidates</span>
                    <strong>{stats.users.candidates}</strong>
                  </div>

                  <div className="admin-detail-row">
                    <span>Company Admins</span>
                    <strong>{stats.users.companyAdmins}</strong>
                  </div>

                  <div className="admin-detail-row">
                    <span>Super Admins</span>
                    <strong>{stats.users.superAdmins}</strong>
                  </div>

                  <div className="admin-detail-row">
                    <span>Active Users</span>
                    <strong>{stats.users.active}</strong>
                  </div>
                </div>

                <div className="admin-detail-card">
                  <h3>Companies</h3>

                  <div className="admin-detail-row">
                    <span>Approved</span>
                    <strong>{stats.companies.approved}</strong>
                  </div>

                  <div className="admin-detail-row">
                    <span>Pending</span>
                    <strong>{stats.companies.pending}</strong>
                  </div>

                  <div className="admin-detail-row">
                    <span>Rejected</span>
                    <strong>{stats.companies.rejected}</strong>
                  </div>

                  <div className="admin-detail-row">
                    <span>Active</span>
                    <strong>{stats.companies.active}</strong>
                  </div>
                </div>

                <div className="admin-detail-card">
                  <h3>Jobs</h3>

                  <div className="admin-detail-row">
                    <span>Published</span>
                    <strong>{stats.jobs.published}</strong>
                  </div>

                  <div className="admin-detail-row">
                    <span>Draft</span>
                    <strong>{stats.jobs.draft}</strong>
                  </div>

                  <div className="admin-detail-row">
                    <span>Closed</span>
                    <strong>{stats.jobs.closed}</strong>
                  </div>
                </div>

                <div className="admin-detail-card">
                  <h3>Applications</h3>

                  <div className="admin-detail-row">
                    <span>Pending</span>
                    <strong>{stats.applications.pending}</strong>
                  </div>

                  <div className="admin-detail-row">
                    <span>Shortlisted</span>
                    <strong>{stats.applications.shortlisted}</strong>
                  </div>

                  <div className="admin-detail-row">
                    <span>Interview</span>
                    <strong>{stats.applications.interview}</strong>
                  </div>

                  <div className="admin-detail-row">
                    <span>Selected</span>
                    <strong>{stats.applications.selected}</strong>
                  </div>

                  <div className="admin-detail-row">
                    <span>Rejected</span>
                    <strong>{stats.applications.rejected}</strong>
                  </div>

                  <div className="admin-detail-row">
                    <span>Withdrawn</span>
                    <strong>{stats.applications.withdrawn}</strong>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="admin-loading">
              No dashboard data available.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
