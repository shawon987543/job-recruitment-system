"use client";
import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  X,
  Menu,
  TrendingUp,
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

interface MonthlyItem {
  month: string;
  count: number;
}

interface MonthlyAnalytics {
  period: string;
  users: MonthlyItem[];
  jobs: MonthlyItem[];
  applications: MonthlyItem[];
}

interface CompanyPerformanceItem {
  id: number;
  name: string;
  email: string;
  status: string;
  isActive: boolean;
  jobs: { total: number; published: number; draft: number; closed: number };
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

interface CompanyPerformance {
  totalCompanies: number;
  companies: CompanyPerformanceItem[];
}

interface RefreshResponse {
  access_token: string;
  refresh_token: string;
}

interface FilteredReports {
  period: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  users: number;
  jobs: number;
  applications: number;
}

// internal data

const initialStats: DashboardStats = {
  users: {
    total: 0,
    candidates: 0,
    companyAdmins: 0,
    superAdmins: 0,
    active: 0,
  },
  companies: {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    active: 0,
  },
  jobs: {
    total: 0,
    published: 0,
    draft: 0,
    closed: 0,
  },
  applications: {
    total: 0,
    pending: 0,
    shortlisted: 0,
    interview: 0,
    selected: 0,
    rejected: 0,
    withdrawn: 0,
  },
};

// monthly chat component

function MonthlyChart({
  title,
  description,
  data,
  type,
  color,
}: {
  title: string;
  description: string;
  data: MonthlyItem[];
  type: "line" | "bar";
  color: string;
}) {
  const width = 720;
  const height = 280;
  const left = 48;
  const right = 20;
  const top = 25;
  const bottom = 65;

  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;

  const maxValue = Math.max(1, ...data.map((item) => item.count));

  const formatMonth = (month: string) => {
    const [year, monthNumber] = month.split("-");

    const date = new Date(
      Number(year),
      Number(monthNumber) - 1,
      1,
    );

    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    });
  };

  const points = data.map((item, index) => {
    const x =
      data.length > 1
        ? left + (index / (data.length - 1)) * chartWidth
        : left + chartWidth / 2;

    const y =
      top + chartHeight - (item.count / maxValue) * chartHeight;

    return {
      x,
      y,
      ...item,
    };
  });

  const linePoints = points
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  const barSlotWidth = data.length > 0
    ? chartWidth / data.length
    : chartWidth;

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e8edf4",
        borderRadius: 16,
        padding: 22,
        minWidth: 0,
        boxShadow: "0 3px 12px rgba(15, 23, 42, 0.035)",
      }}
    >
      <div style={{ marginBottom: 18 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 18,
            color: "#172033",
          }}
        >
          {title}
        </h2>

        <p
          style={{
            color: "#64748b",
            fontSize: 13,
            marginBottom: 0,
          }}
        >
          {description}
        </p>
      </div>

      {data.length === 0 ? (
        <div
          style={{
            minHeight: 180,
            display: "grid",
            placeItems: "center",
            color: "#64748b",
          }}
        >
          No monthly data available.
        </div>
      ) : (
        <div style={{ width: "100%", overflowX: "auto" }}>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={title}
            style={{
              width: "100%",
              minWidth: 520,
              display: "block",
            }}
          >
            {/* Horizontal grid lines */}

            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = top + chartHeight * ratio;

              const value = Math.round(
                maxValue * (1 - ratio),
              );

              return (
                <g key={ratio}>
                  <line
                    x1={left}
                    y1={y}
                    x2={width - right}
                    y2={y}
                    stroke="#edf0f5"
                    strokeDasharray="4 4"
                  />

                  <text
                    x={left - 10}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="11"
                    fill="#94a3b8"
                  >
                    {value}
                  </text>
                </g>
              );
            })}

            {/* Line chart */}

            {type === "line" && points.length > 0 && (
              <>
                <polygon
                  points={`${left},${top + chartHeight} ${linePoints} ${
                    points[points.length - 1].x
                  },${top + chartHeight}`}
                  fill={color}
                  opacity="0.09"
                />

                <polyline
                  points={linePoints}
                  fill="none"
                  stroke={color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {points.map((point) => (
                  <circle
                    key={point.month}
                    cx={point.x}
                    cy={point.y}
                    r="4"
                    fill={color}
                    stroke="#ffffff"
                    strokeWidth="2"
                  >
                    <title>
                      {formatMonth(point.month)}: {point.count}
                    </title>
                  </circle>
                ))}
              </>
            )}

            {/* Bar chart */}

            {type === "bar" &&
              points.map((point) => {
                const barWidth = Math.min(
                  28,
                  barSlotWidth * 0.55,
                );

                const barHeight =
                  (point.count / maxValue) * chartHeight;

                return (
                  <rect
                    key={point.month}
                    x={
                      left +
                      points.indexOf(point) * barSlotWidth +
                      barSlotWidth / 2 -
                      barWidth / 2
                    }
                    y={top + chartHeight - barHeight}
                    width={barWidth}
                    height={Math.max(0, barHeight)}
                    rx="5"
                    fill={color}
                  >
                    <title>
                      {formatMonth(point.month)}: {point.count}
                    </title>
                  </rect>
                );
              })}

            {/* Month labels */}

            {points.map((point, index) => {
              const x =
                type === "bar"
                  ? left + index * barSlotWidth + barSlotWidth / 2
                  : point.x;

              return (
                <text
                  key={point.month}
                  x={x}
                  y={height - 25}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#64748b"
                >
                  {formatMonth(point.month)}
                </text>
              );
            })}
          </svg>
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 8,
          color: "#64748b",
          fontSize: 13,
        }}
      >
        <span
          style={{
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: color,
          }}
        />

        Monthly total
      </div>
    </div>
  );
}

// main report page

export default function ReportsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reportPeriod, setReportPeriod] = useState("last7days");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

// serssion managment

  const clearSession = useCallback(() => {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("user");

    queryClient.clear();
  }, [queryClient]);

  const refreshAccessToken = useCallback(async (): Promise<string> => {
    const refreshToken = sessionStorage.getItem("refresh_token");

    if (!refreshToken) {
      clearSession();
      router.replace("/login");

      throw new Error(
        "Your session has expired. Please log in again.",
      );
    }

    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });

    if (!response.ok) {
      clearSession();
      router.replace("/login");

      throw new Error(
        "Your session has expired. Please log in again.",
      );
    }

    const refreshed: RefreshResponse = await response.json();

    if (
      !refreshed.access_token ||
      !refreshed.refresh_token
    ) {
      clearSession();
      router.replace("/login");

      throw new Error("Unable to refresh your session.");
    }

    sessionStorage.setItem(
      "access_token",
      refreshed.access_token,
    );

    sessionStorage.setItem(
      "refresh_token",
      refreshed.refresh_token,
    );

    return refreshed.access_token;
  }, [clearSession, router]);

  const apiRequest = useCallback(
    async (path: string) => {
      let token = sessionStorage.getItem("access_token");

      if (!token) {
        token = await refreshAccessToken();
      }

      const sendRequest = (accessToken: string) =>
        fetch(`${API_URL}${path}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

      let response = await sendRequest(token);

      if (response.status === 401) {
        token = await refreshAccessToken();
        response = await sendRequest(token);
      }

      if (response.status === 401) {
        clearSession();
        router.replace("/login");

        throw new Error(
          "Your session has expired. Please log in again.",
        );
      }

      if (response.status === 403) {
        throw new Error(
          "You are not authorized to view reports.",
        );
      }

      return response;
    },
    [clearSession, refreshAccessToken, router],
  );

 //dashboard static querey

  const {
    data: stats = initialStats,
    isLoading,
    isFetching,
    isError,
    error: queryError,
    refetch,
  } = useQuery<DashboardStats>({
    queryKey: ["admin-reports"],

    queryFn: async () => {
      const userData = sessionStorage.getItem("user");

      if (!userData) {
        clearSession();
        router.replace("/login");

        throw new Error("Please log in again.");
      }

      let user: { role?: string };

      try {
        user = JSON.parse(userData);
      } catch {
        clearSession();
        router.replace("/login");

        throw new Error(
          "Invalid session. Please log in again.",
        );
      }

      if (user.role !== "SUPER_ADMIN") {
        router.replace("/");

        throw new Error(
          "You are not authorized to view reports.",
        );
      }

      const response = await apiRequest("/admin/dashboard");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(result.message)
            ? result.message.join(", ")
            : result.message || "Unable to load reports.",
        );
      }

      if (
        !result.users ||
        !result.companies ||
        !result.jobs ||
        !result.applications
      ) {
        throw new Error(
          "Invalid dashboard statistics response.",
        );
      }

      return result as DashboardStats;
    },

    retry: false,
  });

  // ==================== MONTHLY ANALYTICS QUERY ====================

  const {
    data: monthlyAnalytics,
    isLoading: monthlyLoading,
    isError: monthlyIsError,
    error: monthlyError,
    refetch: refetchMonthly,
  } = useQuery<MonthlyAnalytics>({
    queryKey: ["admin-monthly-analytics"],

    queryFn: async () => {
      const response = await apiRequest(
        "/admin/monthly-analytics",
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(result.message)
            ? result.message.join(", ")
            : result.message ||
                "Unable to load monthly analytics.",
        );
      }

      if (
        !Array.isArray(result.users) ||
        !Array.isArray(result.jobs) ||
        !Array.isArray(result.applications)
      ) {
        throw new Error(
          "Invalid monthly analytics response.",
        );
      }

      return result as MonthlyAnalytics;
    },

    retry: false,
  });

 // compnay performance query

  const {
    data: companyPerformance,
    isLoading: companyPerformanceLoading,
    isError: companyPerformanceIsError,
    error: companyPerformanceError,
    refetch: refetchCompanyPerformance,
  } = useQuery<CompanyPerformance>({
    queryKey: ["admin-company-performance"],
    queryFn: async () => {
      const response = await apiRequest("/admin/company-performance");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(result.message)
            ? result.message.join(", ")
            : result.message || "Unable to load company performance.",
        );
      }

      if (
        !Array.isArray(result.companies) ||
        typeof result.totalCompanies !== "number"
      ) {
        throw new Error("Invalid company performance response.");
      }

      return result as CompanyPerformance;
    },
    retry: false,
  });

  // ==================== DATE-FILTERED REPORTS QUERY ====================

  const customDateRangeReady =
    reportPeriod !== "custom" ||
    (Boolean(customStartDate) &&
      Boolean(customEndDate) &&
      customStartDate <= customEndDate);

  const {
    data: filteredReports,
    isLoading: filteredReportsLoading,
    isError: filteredReportsIsError,
    error: filteredReportsError,
    refetch: refetchFilteredReports,
  } = useQuery<FilteredReports>({
    queryKey: [
      "admin-filtered-reports",
      reportPeriod,
      customStartDate,
      customEndDate,
    ],
    enabled: customDateRangeReady,
    queryFn: async () => {
      const params = new URLSearchParams({ period: reportPeriod });

      if (reportPeriod === "custom") {
        params.set("startDate", customStartDate);
        params.set("endDate", customEndDate);
      }

      const response = await apiRequest(
        `/admin/filtered-reports?${params.toString()}`,
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(result.message)
            ? result.message.join(", ")
            : result.message || "Unable to load filtered reports.",
        );
      }

      if (
        typeof result.users !== "number" ||
        typeof result.jobs !== "number" ||
        typeof result.applications !== "number"
      ) {
        throw new Error("Invalid filtered reports response.");
      }

      return result as FilteredReports;
    },
    retry: false,
  });

 // logout

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
      // Clear the local session even if logout fails.
    } finally {
      clearSession();
      router.push("/login");
    }
  };

// report calculation

  const totalRecords =
    stats.users.total +
    stats.companies.total +
    stats.jobs.total +
    stats.applications.total;

  const applicationRows = useMemo(
    () => [
      {
        label: "Pending",
        value: stats.applications.pending,
        color: "#f59e0b",
      },
      {
        label: "Shortlisted",
        value: stats.applications.shortlisted,
        color: "#6366f1",
      },
      {
        label: "Interview",
        value: stats.applications.interview,
        color: "#0ea5e9",
      },
      {
        label: "Selected",
        value: stats.applications.selected,
        color: "#16a34a",
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
    ],
    [stats.applications],
  );

  const jobRows = [
    {
      label: "Published",
      value: stats.jobs.published,
      color: "#16a34a",
    },
    {
      label: "Draft",
      value: stats.jobs.draft,
      color: "#f59e0b",
    },
    {
      label: "Closed",
      value: stats.jobs.closed,
      color: "#ef4444",
    },
  ];

  const companyRows = [
    {
      label: "Approved",
      value: stats.companies.approved,
      color: "#16a34a",
    },
    {
      label: "Pending",
      value: stats.companies.pending,
      color: "#f59e0b",
    },
    {
      label: "Rejected",
      value: stats.companies.rejected,
      color: "#ef4444",
    },
  ];

  const userRows = [
    {
      label: "Candidates",
      value: stats.users.candidates,
      color: "#0ea5e9",
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
  ];

// brackdown component

  const renderBreakdown = (
    rows: {
      label: string;
      value: number;
      color: string;
    }[],
    total: number,
  ) => {
    return (
      <div style={{ display: "grid", gap: 18 }}>
        {rows.map((item) => {
          const percentage =
            total > 0
              ? (item.value / total) * 100
              : 0;

          return (
            <div key={item.label}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  marginBottom: 8,
                  fontSize: 14,
                }}
              >
                <span
                  style={{
                    color: "#64748b",
                    fontWeight: 600,
                  }}
                >
                  {item.label}
                </span>

                <strong>
                  {item.value.toLocaleString()} (
                  {percentage.toFixed(1)}%)
                </strong>
              </div>

              <div
                style={{
                  height: 10,
                  width: "100%",
                  background: "#edf0f5",
                  borderRadius: 20,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${percentage}%`,
                    maxWidth: "100%",
                    background: item.color,
                    borderRadius: 20,
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

// error handling

  const displayError =
    error ||
    (isError
      ? queryError instanceof Error
        ? queryError.message
        : "Unable to load reports."
      : "");

  // card style

  const cardStyle = {
    background: "#ffffff",
    border: "1px solid #e8edf4",
    borderRadius: 16,
    padding: 22,
    minWidth: 0,
    boxShadow: "0 3px 12px rgba(15, 23, 42, 0.035)",
  } as const;

  const reportCardStyle = {
    ...cardStyle,
    display: "grid",
    gap: 22,
  } as const;

  // stat card

  const statCards = [
    {
      title: "Total Users",
      value: stats.users.total,
      detail: `${stats.users.active} active users`,
      icon: <Users size={23} />,
      color: "#2563eb",
      background: "#eff6ff",
    },
    {
      title: "Total Companies",
      value: stats.companies.total,
      detail: `${stats.companies.approved} approved`,
      icon: <Building2 size={23} />,
      color: "#7c3aed",
      background: "#f5f3ff",
    },
    {
      title: "Total Jobs",
      value: stats.jobs.total,
      detail: `${stats.jobs.published} published`,
      icon: <BriefcaseBusiness size={23} />,
      color: "#0891b2",
      background: "#ecfeff",
    },
    {
      title: "Total Applications",
      value: stats.applications.total,
      detail: `${stats.applications.selected} selected`,
      icon: <FileText size={23} />,
      color: "#059669",
      background: "#ecfdf5",
    },
  ];
  
  // Export date-filtered reports as CSV
const exportFilteredReports = () => {
  if (!filteredReports || filteredReportsLoading || !customDateRangeReady) {
    setError("There are no filtered report results to export.");
    return;
  }

  setError("");
  setSuccess("");

  const rows = [
    ["Report", "Value"],
    ["Period", filteredReports.period],
    ["Start Date", filteredReports.dateRange?.startDate ?? ""],
    ["End Date", filteredReports.dateRange?.endDate ?? ""],
    ["New Users", String(filteredReports.users)],
    ["New Jobs", String(filteredReports.jobs)],
    ["Applications", String(filteredReports.applications)],
  ];

  const csvContent = rows
    .map((row) =>
      row
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\r\n");

  const blob = new Blob(["\uFEFF", csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateLabel = new Date().toISOString().slice(0, 10);

  link.href = downloadUrl;
  link.download = `careerhub-report-${reportPeriod}-${dateLabel}.csv`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(downloadUrl);

  setSuccess("Filtered report exported successfully.");
};
  // refresh all report

  const refreshAllReports = async () => {
    await Promise.all([
      refetch(),
      refetchMonthly(),
      refetchCompanyPerformance(),
      refetchFilteredReports(),
    ]);
  };

  // page ui

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}

      <aside
        className={`admin-sidebar ${menuOpen ? "open" : ""}`}
      >
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
          <Link
            href="/admin"
            className="admin-nav-item"
            onClick={() => setMenuOpen(false)}
          >
            <LayoutDashboard size={19} />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/admin/companies"
            className="admin-nav-item"
            onClick={() => setMenuOpen(false)}
          >
            <Building2 size={19} />
            <span>Companies</span>
          </Link>

          <Link
            href="/admin/users"
            className="admin-nav-item"
            onClick={() => setMenuOpen(false)}
          >
            <Users size={19} />
            <span>Users</span>
          </Link>

          <Link
            href="/admin/jobs"
            className="admin-nav-item"
            onClick={() => setMenuOpen(false)}
          >
            <BriefcaseBusiness size={19} />
            <span>Jobs</span>
          </Link>

          <Link
            href="/admin/applications"
            className="admin-nav-item"
            onClick={() => setMenuOpen(false)}
          >
            <FileText size={19} />
            <span>Applications</span>
          </Link>

          <Link
            href="/admin/reports"
            className="admin-nav-item active"
            onClick={() => setMenuOpen(false)}
          >
            <BarChart3 size={19} />
            <span>Reports</span>
          </Link>

          <Link
            href="/admin/settings"
            className="admin-nav-item"
            onClick={() => setMenuOpen(false)}
          >
            <Settings size={19} />
            <span>Settings</span>
          </Link>
        </nav>

        {/* SIDEBAR BOTTOM */}

        <div className="admin-sidebar-bottom">
          <div className="admin-profile">
            <div className="admin-avatar">SA</div>

            <div className="admin-profile-info">
              <strong>Super Admin</strong>
              <span>Administrator</span>
            </div>
          </div>

          <button
            className="admin-logout"
            onClick={logout}
          >
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
        {/* TOPBAR */}

        <header className="admin-topbar">
          <button
            className="admin-menu-button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          <div>
            <h1>Reports & Analytics</h1>
            <p>
              Monitor platform statistics and recruitment activity.
            </p>
          </div>

          <button
            className="admin-refresh"
            onClick={refreshAllReports}
            disabled={isFetching || monthlyLoading || companyPerformanceLoading}
          >
            <RefreshCw
              size={16}
              className={
                isFetching || monthlyLoading || companyPerformanceLoading
                  ? "animate-spin"
                  : ""
              }
            />

            <span>
              {isFetching || monthlyLoading || companyPerformanceLoading
                ? "Refreshing..."
                : "Refresh"}
            </span>
          </button>
        </header>

        {/* PAGE CONTENT */}

        <section className="admin-content">
          {/* ERROR MESSAGE */}

          {displayError && (
            <div className="company-alert error">
              <span>{displayError}</span>

              <button onClick={() => setError("")}>
                <X size={16} />
              </button>
            </div>
          )}

          {success && (
            <div className="company-alert success">
              <span>{success}</span>

              <button onClick={() => setSuccess("")}>
                <X size={16} />
              </button>
            </div>
          )}

          {/* WELCOME SECTION */}

          <div className="company-welcome">
            <div>
              <span>SUPER ADMIN / REPORTS</span>

              <h2>Platform overview</h2>

              <p>
                Get an overview of users, companies, job postings,
                and candidate applications across CareerHub.
              </p>
            </div>

            <div className="company-welcome-icon">
              <BarChart3 size={55} />
            </div>
          </div>

          {/* DATE-FILTERED REPORTS */}
          <section
            style={{
              ...cardStyle,
              marginBottom: 24,
              display: "grid",
              gap: 18,
            }}
          >
            <div
  style={{
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
  }}
>
  <div>
    <h2 style={{ margin: 0, fontSize: 20, color: "#172033" }}>
      Date-Filtered Reports
    </h2>

    <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 13 }}>
      View new users, jobs, and applications within a selected period.
      The platform overview below remains the all-time summary.
    </p>
  </div>

  <button
    type="button"
    onClick={exportFilteredReports}
    disabled={
      !filteredReports ||
      filteredReportsLoading ||
      !customDateRangeReady
    }
    style={{
      minHeight: 42,
      padding: "10px 16px",
      border: "none",
      borderRadius: 9,
      background:
        !filteredReports ||
        filteredReportsLoading ||
        !customDateRangeReady
          ? "#cbd5e1"
          : "#2563eb",
      color: "#ffffff",
      fontSize: 13,
      fontWeight: 700,
      cursor:
        !filteredReports ||
        filteredReportsLoading ||
        !customDateRangeReady
          ? "not-allowed"
          : "pointer",
      display: "flex",
      alignItems: "center",
      gap: 8,
    }}
  >
    <FileText size={17} />
    Export CSV
  </button>
</div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "end",
                gap: 14,
              }}
            >
              <label style={{ display: "grid", gap: 7, minWidth: 190 }}>
                <span style={{ color: "#475569", fontSize: 13, fontWeight: 600 }}>
                  Report period
                </span>
                <select
                  value={reportPeriod}
                  onChange={(event) => setReportPeriod(event.target.value)}
                  style={{
                    minHeight: 42,
                    padding: "9px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: 9,
                    background: "#fff",
                    color: "#172033",
                  }}
                >
                  <option value="today">Today</option>
                  <option value="last7days">Last 7 Days</option>
                  <option value="last30days">Last 30 Days</option>
                  <option value="thisMonth">This Month</option>
                  <option value="thisYear">This Year</option>
                  <option value="custom">Custom Date Range</option>
                </select>
              </label>

              {reportPeriod === "custom" && (
                <>
                  <label style={{ display: "grid", gap: 7 }}>
                    <span style={{ color: "#475569", fontSize: 13, fontWeight: 600 }}>
                      Start date
                    </span>
                    <input
                      type="date"
                      value={customStartDate}
                      max={customEndDate || undefined}
                      onChange={(event) => setCustomStartDate(event.target.value)}
                      style={{
                        minHeight: 42,
                        padding: "9px 12px",
                        border: "1px solid #cbd5e1",
                        borderRadius: 9,
                      }}
                    />
                  </label>
                  <label style={{ display: "grid", gap: 7 }}>
                    <span style={{ color: "#475569", fontSize: 13, fontWeight: 600 }}>
                      End date
                    </span>
                    <input
                      type="date"
                      value={customEndDate}
                      min={customStartDate || undefined}
                      onChange={(event) => setCustomEndDate(event.target.value)}
                      style={{
                        minHeight: 42,
                        padding: "9px 12px",
                        border: "1px solid #cbd5e1",
                        borderRadius: 9,
                      }}
                    />
                  </label>
                </>
              )}
            </div>

            {reportPeriod === "custom" && !customDateRangeReady && (
              <p style={{ margin: 0, color: "#b45309", fontSize: 13 }}>
                Choose both dates. The start date must not be after the end date.
              </p>
            )}

            {filteredReportsLoading ? (
              <p style={{ margin: 0, color: "#64748b" }}>
                Loading filtered reports...
              </p>
            ) : filteredReportsIsError ? (
              <div className="company-alert error">
                {filteredReportsError instanceof Error
                  ? filteredReportsError.message
                  : "Unable to load filtered reports."}
              </div>
            ) : filteredReports ? (
              <>
                <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
                  Period: <strong>{filteredReports.period}</strong>
                  {filteredReports.dateRange?.startDate &&
                    filteredReports.dateRange?.endDate &&
                    ` • ${filteredReports.dateRange.startDate} to ${filteredReports.dateRange.endDate}`}
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 14,
                  }}
                >
                  {[
                    { label: "New Users", value: filteredReports.users, color: "#2563eb" },
                    { label: "New Jobs", value: filteredReports.jobs, color: "#0891b2" },
                    { label: "Applications", value: filteredReports.applications, color: "#059669" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        padding: 18,
                        border: "1px solid #e8edf4",
                        borderRadius: 12,
                        background: "#f8fafc",
                      }}
                    >
                      <span style={{ color: "#64748b", fontSize: 13, fontWeight: 600 }}>
                        {item.label}
                      </span>
                      <strong
                        style={{
                          display: "block",
                          marginTop: 8,
                          fontSize: 28,
                          color: item.color,
                        }}
                      >
                        {item.value.toLocaleString()}
                      </strong>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </section>

          {isLoading ? (
            <div className="admin-loading">
              Loading platform reports...
            </div>
          ) : (
            <>
              {/* SUMMARY CARDS */}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(210px, 1fr))",
                  gap: 18,
                  marginBottom: 24,
                }}
              >
                {statCards.map((card) => (
                  <div
                    key={card.title}
                    style={cardStyle}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <span
                        style={{
                          color: "#64748b",
                          fontWeight: 600,
                        }}
                      >
                        {card.title}
                      </span>

                      <span
                        style={{
                          display: "grid",
                          placeItems: "center",
                          width: 46,
                          height: 46,
                          borderRadius: 13,
                          color: card.color,
                          background: card.background,
                        }}
                      >
                        {card.icon}
                      </span>
                    </div>

                    <strong
                      style={{
                        fontSize: 30,
                        color: "#172033",
                      }}
                    >
                      {card.value.toLocaleString()}
                    </strong>

                    <span
                      style={{
                        color: "#64748b",
                        fontSize: 13,
                      }}
                    >
                      {card.detail}
                    </span>
                  </div>
                ))}
              </div>

              {/* TOTAL PLATFORM RECORDS */}

              <div
                style={{
                  ...cardStyle,
                  marginBottom: 24,
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                }}
              >
                <div>
                  <span
                    style={{
                      color: "#64748b",
                      fontSize: 13,
                    }}
                  >
                    TOTAL PLATFORM RECORDS
                  </span>

                  <h2
                    style={{
                      fontSize: 28,
                      margin: "6px 0",
                    }}
                  >
                    {totalRecords.toLocaleString()}
                  </h2>

                  <p
                    style={{
                      color: "#64748b",
                      margin: 0,
                      fontSize: 13,
                    }}
                  >
                    Combined users, companies, jobs, and applications.
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    color: "#059669",
                    background: "#ecfdf5",
                    padding: "12px 16px",
                    borderRadius: 12,
                    fontWeight: 600,
                  }}
                >
                  <TrendingUp size={20} />
                  Live database statistics
                </div>
              </div>

              {/* ==================== MONTHLY ANALYTICS ==================== */}

              <div style={{ marginBottom: 28 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 12,
                    marginBottom: 18,
                  }}
                >
                  <div>
                    <h2
                      style={{
                        fontSize: 21,
                        margin: 0,
                        color: "#172033",
                      }}
                    >
                      Monthly Analytics
                    </h2>

                    <p
                      style={{
                        color: "#64748b",
                        fontSize: 13,
                        marginBottom: 0,
                      }}
                    >
                      Platform activity over the last 12 months.
                    </p>
                  </div>

                  <span
                    style={{
                      padding: "8px 13px",
                      background: "#eff6ff",
                      color: "#2563eb",
                      borderRadius: 9,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    LAST 12 MONTHS
                  </span>
                </div>

                {/* MONTHLY LOADING */}

                {monthlyLoading ? (
                  <div style={cardStyle}>
                    Loading monthly analytics...
                  </div>
                ) : monthlyIsError ? (
                  <div className="company-alert error">
                    <span>
                      {monthlyError instanceof Error
                        ? monthlyError.message
                        : "Unable to load monthly analytics."}
                    </span>
                  </div>
                ) : monthlyAnalytics ? (
                  <div
                    style={{
                      display: "grid",
                      gap: 20,
                    }}
                  >
                    {/* USER REGISTRATIONS */}

                    <MonthlyChart
                      title="User Registrations"
                      description="New user accounts registered each month."
                      data={monthlyAnalytics.users}
                      type="line"
                      color="#2563eb"
                    />

                    {/* JOB POSTINGS */}

                    <MonthlyChart
                      title="Monthly Job Postings"
                      description="New jobs created by companies each month."
                      data={monthlyAnalytics.jobs}
                      type="bar"
                      color="#0891b2"
                    />

                    {/* APPLICATIONS */}

                    <MonthlyChart
                      title="Monthly Applications"
                      description="Applications submitted by candidates each month."
                      data={monthlyAnalytics.applications}
                      type="line"
                      color="#059669"
                    />
                  </div>
                ) : null}
              </div>

              {/* ==================== COMPANY PERFORMANCE ==================== */}

              <div style={{ marginBottom: 28 }}>
                <div style={{ marginBottom: 18 }}>
                  <h2 style={{ fontSize: 21, margin: 0, color: "#172033" }}>
                    Company Performance
                  </h2>
                  <p style={{ color: "#64748b", fontSize: 13, marginBottom: 0 }}>
                    Compare job postings and candidate application outcomes across registered companies.
                  </p>
                </div>

                {companyPerformanceLoading ? (
                  <div style={cardStyle}>Loading company performance...</div>
                ) : companyPerformanceIsError ? (
                  <div className="company-alert error">
                    <span>
                      {companyPerformanceError instanceof Error
                        ? companyPerformanceError.message
                        : "Unable to load company performance."}
                    </span>
                  </div>
                ) : companyPerformance ? (
                  <>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                        gap: 16,
                        marginBottom: 18,
                      }}
                    >
                      <div style={cardStyle}>
                        <span style={{ color: "#64748b", fontSize: 13 }}>Companies tracked</span>
                        <h3 style={{ margin: "8px 0 0", fontSize: 28 }}>
                          {companyPerformance.totalCompanies.toLocaleString()}
                        </h3>
                      </div>
                      <div style={cardStyle}>
                        <span style={{ color: "#64748b", fontSize: 13 }}>Jobs posted by companies</span>
                        <h3 style={{ margin: "8px 0 0", fontSize: 28 }}>
                          {companyPerformance.companies.reduce((sum, company) => sum + company.jobs.total, 0).toLocaleString()}
                        </h3>
                      </div>
                      <div style={cardStyle}>
                        <span style={{ color: "#64748b", fontSize: 13 }}>Applications received</span>
                        <h3 style={{ margin: "8px 0 0", fontSize: 28 }}>
                          {companyPerformance.companies.reduce((sum, company) => sum + company.applications.total, 0).toLocaleString()}
                        </h3>
                      </div>
                      <div style={cardStyle}>
                        <span style={{ color: "#64748b", fontSize: 13 }}>Candidates selected</span>
                        <h3 style={{ margin: "8px 0 0", fontSize: 28, color: "#16a34a" }}>
                          {companyPerformance.companies.reduce((sum, company) => sum + company.applications.selected, 0).toLocaleString()}
                        </h3>
                      </div>
                    </div>

                    <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
                      <div style={{ padding: "20px 22px", borderBottom: "1px solid #edf0f5" }}>
                        <h3 style={{ margin: 0, fontSize: 17 }}>Company Performance Details</h3>
                        <p style={{ color: "#64748b", fontSize: 13, margin: "5px 0 0" }}>
                          Job activity and application status for each company.
                        </p>
                      </div>

                      {companyPerformance.companies.length === 0 ? (
                        <div style={{ padding: 28, textAlign: "center", color: "#64748b" }}>
                          No companies are available yet.
                        </div>
                      ) : (
                        <div style={{ overflowX: "auto" }}>
                          <table style={{ width: "100%", minWidth: 920, borderCollapse: "collapse", textAlign: "left" }}>
                            <thead>
                              <tr style={{ background: "#f8fafc" }}>
                                {["Company", "Status", "Total Jobs", "Published", "Applications", "Pending", "Interview", "Selected", "Rejected"].map((heading) => (
                                  <th key={heading} style={{ padding: "14px 16px", color: "#64748b", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
                                    {heading}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {companyPerformance.companies.map((company) => (
                                <tr key={company.id} style={{ borderTop: "1px solid #edf0f5" }}>
                                  <td style={{ padding: 16 }}>
                                    <strong style={{ display: "block", color: "#172033" }}>{company.name}</strong>
                                    <span style={{ color: "#64748b", fontSize: 12 }}>{company.email}</span>
                                  </td>
                                  <td style={{ padding: 16 }}>
                                    <span
                                      style={{
                                        display: "inline-block",
                                        padding: "5px 9px",
                                        borderRadius: 20,
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: company.status === "APPROVED" ? "#15803d" : company.status === "REJECTED" ? "#b91c1c" : "#b45309",
                                        background: company.status === "APPROVED" ? "#dcfce7" : company.status === "REJECTED" ? "#fee2e2" : "#fef3c7",
                                      }}
                                    >
                                      {company.status}
                                    </span>
                                    {!company.isActive && (
                                      <span style={{ display: "block", marginTop: 5, color: "#b91c1c", fontSize: 11 }}>
                                        Inactive
                                      </span>
                                    )}
                                  </td>
                                  <td style={{ padding: 16, fontWeight: 700 }}>{company.jobs.total}</td>
                                  <td style={{ padding: 16 }}>{company.jobs.published}</td>
                                  <td style={{ padding: 16, fontWeight: 700 }}>{company.applications.total}</td>
                                  <td style={{ padding: 16 }}>{company.applications.pending}</td>
                                  <td style={{ padding: 16 }}>{company.applications.interview}</td>
                                  <td style={{ padding: 16, color: "#15803d", fontWeight: 700 }}>{company.applications.selected}</td>
                                  <td style={{ padding: 16, color: "#b91c1c" }}>{company.applications.rejected}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                ) : null}
              </div>

              {/* ==================== BREAKDOWN CARDS ==================== */}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(290px, 1fr))",
                  gap: 20,
                  marginBottom: 24,
                }}
              >
                {/* USER BREAKDOWN */}

                <div style={reportCardStyle}>
                  <div>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: 18,
                      }}
                    >
                      User Breakdown
                    </h2>

                    <p
                      style={{
                        color: "#64748b",
                        fontSize: 13,
                        marginBottom: 0,
                      }}
                    >
                      User accounts by role.
                    </p>
                  </div>

                  {renderBreakdown(
                    userRows,
                    stats.users.total,
                  )}

                  <div
                    style={{
                      borderTop: "1px solid #edf0f5",
                      paddingTop: 15,
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span style={{ color: "#64748b" }}>
                      Active users
                    </span>

                    <strong>
                      {stats.users.active.toLocaleString()}
                    </strong>
                  </div>
                </div>

                {/* COMPANY BREAKDOWN */}

                <div style={reportCardStyle}>
                  <div>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: 18,
                      }}
                    >
                      Company Breakdown
                    </h2>

                    <p
                      style={{
                        color: "#64748b",
                        fontSize: 13,
                        marginBottom: 0,
                      }}
                    >
                      Company registration status.
                    </p>
                  </div>

                  {renderBreakdown(
                    companyRows,
                    stats.companies.total,
                  )}

                  <div
                    style={{
                      borderTop: "1px solid #edf0f5",
                      paddingTop: 15,
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span style={{ color: "#64748b" }}>
                      Active companies
                    </span>

                    <strong>
                      {stats.companies.active.toLocaleString()}
                    </strong>
                  </div>
                </div>

                {/* JOB BREAKDOWN */}

                <div style={reportCardStyle}>
                  <div>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: 18,
                      }}
                    >
                      Job Breakdown
                    </h2>

                    <p
                      style={{
                        color: "#64748b",
                        fontSize: 13,
                        marginBottom: 0,
                      }}
                    >
                      Job postings by status.
                    </p>
                  </div>

                  {renderBreakdown(
                    jobRows,
                    stats.jobs.total,
                  )}

                  <div
                    style={{
                      borderTop: "1px solid #edf0f5",
                      paddingTop: 15,
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span style={{ color: "#64748b" }}>
                      Total jobs
                    </span>

                    <strong>
                      {stats.jobs.total.toLocaleString()}
                    </strong>
                  </div>
                </div>
              </div>

              {/* APPLICATION BREAKDOWN */}

              <div style={reportCardStyle}>
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: 18,
                    }}
                  >
                    Application Status Breakdown
                  </h2>

                  <p
                    style={{
                      color: "#64748b",
                      fontSize: 13,
                      marginBottom: 0,
                    }}
                  >
                    Candidate applications grouped by their current status.
                  </p>
                </div>

                {renderBreakdown(
                  applicationRows,
                  stats.applications.total,
                )}

                <div
                  style={{
                    borderTop: "1px solid #edf0f5",
                    paddingTop: 15,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 20,
                  }}
                >
                  <div>
                    <span
                      style={{
                        color: "#64748b",
                        fontSize: 13,
                      }}
                    >
                      Total applications
                    </span>

                    <h3 style={{ margin: "5px 0" }}>
                      {stats.applications.total.toLocaleString()}
                    </h3>
                  </div>

                  <div>
                    <span
                      style={{
                        color: "#64748b",
                        fontSize: 13,
                      }}
                    >
                      Selected candidates
                    </span>

                    <h3
                      style={{
                        margin: "5px 0",
                        color: "#16a34a",
                      }}
                    >
                      {stats.applications.selected.toLocaleString()}
                    </h3>
                  </div>

                  <div>
                    <span
                      style={{
                        color: "#64748b",
                        fontSize: 13,
                      }}
                    >
                      Rejected applications
                    </span>

                    <h3
                      style={{
                        margin: "5px 0",
                        color: "#ef4444",
                      }}
                    >
                      {stats.applications.rejected.toLocaleString()}
                    </h3>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
