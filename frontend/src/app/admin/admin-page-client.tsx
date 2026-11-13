"use client";
import { useEffect, useState } from "react";
import { useToastErrorState } from "@/components/ui/toast-message-state";
import { useRouter } from "next/navigation";
import AdminSidebar from "../../components/admin/AdminSidebar";
import CompanyAdminsContent from "./company-admin/page";

import {
  Building2,
  Users,
  BriefcaseBusiness,
  FileText,
  Menu,
} from "lucide-react";

import { StatsSkeleton } from "@/components/ui/stats-skeleton";
import { DetailSkeleton } from "@/components/ui/detail-skeleton";

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

// Donut Chart Component

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

function DonutChart({
  title,
  segments,
}: {
  title: string;
  segments: DonutSegment[];
}) {
  const total = segments.reduce(
    (sum, segment) => sum + segment.value,
    0
  );

  let current = 0;

  const gradient =
    total === 0
      ? "#e2e8f0"
      : `conic-gradient(${segments
          .map((segment) => {
            const start = current;
            current += (segment.value / total) * 100;

            return `${segment.color} ${start}% ${current}%`;
          })
          .join(", ")})`;

  return (
    <div className="admin-detail-card">
      <h3>{title}</h3>

      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-5">
        {/* Donut Chart */}
        <div
          className="relative shrink-0 rounded-full"
          style={{
            width: "170px",
            height: "170px",
            background: gradient,
          }}
        >
          <div
            className="absolute rounded-full bg-white flex flex-col items-center justify-center"
            style={{ inset: "25px" }}
          >
            <strong className="text-2xl font-bold text-slate-800">
              {total.toLocaleString()}
            </strong>

            <span className="text-xs text-slate-500">
              Total
            </span>
          </div>
        </div>

        {/* Chart Legend */}
        <div className="flex flex-col gap-3 w-full">
          {segments.map((segment) => (
            <div
              key={segment.label}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: segment.color }}
                />

                <span className="text-sm text-slate-600">
                  {segment.label}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <strong className="text-sm text-slate-800">
                  {segment.value.toLocaleString()}
                </strong>

                <span className="text-xs text-slate-400">
                  {total > 0
                    ? `${Math.round(
                        (segment.value / total) * 100
                      )}%`
                    : "0%"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminPageContent({
  initialSection,
}: {
  initialSection: "dashboard" | "company-admins";
}) {
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useToastErrorState();
  const [menuOpen, setMenuOpen] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [activeSection, setActiveSection] = useState(initialSection);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveSection(initialSection);
  }, [initialSection]);

  const clearSession = () => {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("user");
  };

  // Fetch Dashboard Data
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

      // Refresh access token if expired.
      if (response.status === 401 && refreshToken) {
        const refreshResponse = await fetch(
          `${API_URL}/auth/refresh`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ refreshToken }),
          }
        );

        if (!refreshResponse.ok) {
          throw new Error(
            "Your session has expired. Please log in again."
          );
        }

        const refreshed = await refreshResponse.json();

        accessToken = refreshed.access_token;

        sessionStorage.setItem(
          "access_token",
          refreshed.access_token
        );

        sessionStorage.setItem(
          "refresh_token",
          refreshed.refresh_token
        );

        response = await fetch(`${API_URL}/admin/dashboard`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        });
      }

      if (response.status === 401 || response.status === 403) {
        throw new Error(
          "You are not authorized to access this dashboard."
        );
      }

      if (!response.ok) {
        throw new Error(
          "Unable to load dashboard information."
        );
      }

      const data: DashboardStats = await response.json();

      setStats(data);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong.";

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

  // Authentication
  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    const accessToken = sessionStorage.getItem("access_token");

    if (!userData || !accessToken) {
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

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAuthReady(true);
    } catch {
      clearSession();
      router.replace("/login");
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch dashboard ONLY when Dashboard is selected.
  useEffect(() => {
    if (!authReady || activeSection !== "dashboard") {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboard();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, activeSection]);

  // Navigate to Company Admins
  const handleCompanyAdminsClick = () => {
    setActiveSection("company-admins");
    router.push("/admin?section=company-admin");
  };

  // Keep the page shell and skeleton visible during authentication.
  return (
    <div className="admin-layout">
      {/* Admin Sidebar */}
      <AdminSidebar
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        activeSection={activeSection}
        onCompanyAdminsClick={handleCompanyAdminsClick}
      />

      <main className="admin-main">
        {/* Topbar */}
        <header className="admin-topbar">
          <button
            className="admin-menu-button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          <div className="admin-topbar-details">
            <h1>
              {activeSection === "company-admins"
                ? "Company Admins"
                : "Dashboard Overview"}
            </h1>

            <p>
              {activeSection === "company-admins"
                ? "Manage administrator accounts and company access"
                : "Monitor and manage your recruitment platform"}
            </p>
          </div>
        </header>

        {/* Main Content */}
        <section className="admin-content">
          {activeSection === "company-admins" ? (
            // Render the page shell and data skeletons before starting its request.
            <CompanyAdminsContent enabled={authReady} />
          ) : !authReady ? (
            <>
              <StatsSkeleton />
              <DetailSkeleton />
            </>
          ) : (
            // Dashboard Content
            <>
              {/* Error Message */}
              {error && (
                <div className="admin-error">
                  <span>{error}</span>

                  <button onClick={fetchDashboard}>
                    Try again
                  </button>
                </div>
              )}

              {/* Admin Welcome */}
              <div className="admin-welcome">
                <div>
                  <span className="admin-welcome-label">
                    SUPER ADMIN PANEL
                  </span>

                  <h2>
                    Manage your recruitment platform
                  </h2>

                  <p>
                    Monitor users, companies, jobs, and applications
                    from one place.
                  </p>
                </div>

                <div className="admin-welcome-decoration">
                  CH
                </div>
              </div>

              {/* Users & Applications Analytics */}
              {stats && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                  {/* Users Distribution */}
                  <DonutChart
                    title="Users Distribution"
                    segments={[
                      {
                        label: "Candidates",
                        value: stats.users.candidates,
                        color: "#3b82f6",
                      },
                      {
                        label: "Company Admins",
                        value: stats.users.companyAdmins,
                        color: "#8b5cf6",
                      },
                      {
                        label: "Super Admins",
                        value: stats.users.superAdmins,
                        color: "#f59e0b",
                      },
                    ]}
                  />

                  {/* Applications Distribution */}
                  <DonutChart
                    title="Applications Distribution"
                    segments={[
                      {
                        label: "Pending",
                        value: stats.applications.pending,
                        color: "#f59e0b",
                      },
                      {
                        label: "Shortlisted",
                        value: stats.applications.shortlisted,
                        color: "#3b82f6",
                      },
                      {
                        label: "Interview",
                        value: stats.applications.interview,
                        color: "#8b5cf6",
                      },
                      {
                        label: "Selected",
                        value: stats.applications.selected,
                        color: "#10b981",
                      },
                      {
                        label: "Rejected",
                        value: stats.applications.rejected,
                        color: "#ef4444",
                      },
                      {
                        label: "Withdrawn",
                        value: stats.applications.withdrawn,
                        color: "#64748b",
                      },
                    ]}
                  />
                </div>
              )}

              {/* Platform Statistics Heading */}
              <div className="admin-section-heading">
                <div>
                  <h2>Platform Statistics</h2>
                  <p>Overview of your platform activity</p>
                </div>
              </div>

              {/* Dashboard Content */}
              {loading ? (
                <>
                  <StatsSkeleton />
                  <DetailSkeleton />
                </>
              ) : stats ? (
                <>
                  {/* Statistics Cards */}
                  <div className="admin-stats-grid">
                    {[
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
                    ].map((card) => {
                      const Icon = card.icon;

                      return (
                        <div
                          className="admin-stat-card"
                          key={card.title}
                        >
                          <div
                            className={`admin-stat-icon ${card.color}`}
                          >
                            <Icon size={22} />
                          </div>

                          <p>{card.title}</p>

                          <h3>
                            {card.value.toLocaleString()}
                          </h3>

                          <span>{card.detail}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Detailed Overview Heading */}
                  <div className="admin-section-heading">
                    <div>
                      <h2>Detailed Overview</h2>
                      <p>
                        Current status across the platform
                      </p>
                    </div>
                  </div>

                  {/* Detailed Overview Cards */}
                  <div className="grid grid-cols-2 gap-4.5">
                    {/* Companies */}
                    <div className="admin-detail-card">
                      <h3>Companies</h3>

                      <div className="admin-detail-row">
                        <span>Approved</span>
                        <strong>
                          {stats.companies.approved}
                        </strong>
                      </div>

                      <div className="admin-detail-row">
                        <span>Pending</span>
                        <strong>
                          {stats.companies.pending}
                        </strong>
                      </div>

                      <div className="admin-detail-row">
                        <span>Rejected</span>
                        <strong>
                          {stats.companies.rejected}
                        </strong>
                      </div>

                      <div className="admin-detail-row">
                        <span>Active</span>
                        <strong>
                          {stats.companies.active}
                        </strong>
                      </div>
                    </div>

                    {/* Jobs */}
                    <div className="admin-detail-card">
                      <h3>Jobs</h3>

                      <div className="admin-detail-row">
                        <span>Published</span>
                        <strong>
                          {stats.jobs.published}
                        </strong>
                      </div>

                      <div className="admin-detail-row">
                        <span>Draft</span>
                        <strong>
                          {stats.jobs.draft}
                        </strong>
                      </div>

                      <div className="admin-detail-row">
                        <span>Closed</span>
                        <strong>
                          {stats.jobs.closed}
                        </strong>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="admin-loading">
                  No dashboard data available.
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default function AdminPageClient({
  initialSection,
}: {
  initialSection: "dashboard" | "company-admins";
}) {
  return <AdminPageContent initialSection={initialSection} />;
}
