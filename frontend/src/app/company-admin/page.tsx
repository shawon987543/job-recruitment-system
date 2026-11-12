"use client";
import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  FileText,
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  UserRound,
} from "lucide-react";

import { apiRequest } from "@/lib/api";
import Skeleton from "@/components/ui/skeleton";

interface DashboardData {
  jobs: {
    total: number;
    draft: number;
    published: number;
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
  recentApplications: {
    applicationId: number;
    status: string;
    appliedAt: string;
    candidateName: string;
    candidateEmail: string;
    jobTitle: string;
  }[];
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusClass(status: string) {
  const statusClasses: Record<string, string> = {
    PENDING: "ca-status-pending",
    SHORTLISTED: "ca-status-shortlisted",
    INTERVIEW: "ca-status-interview",
    SELECTED: "ca-status-selected",
    REJECTED: "ca-status-rejected",
    WITHDRAWN: "ca-status-withdrawn",
  };

  return statusClasses[status] || "ca-status-pending";
}

// Dashboard skeleton loading component
function DashboardSkeleton() {
  return (
    <div className="ca-content ca-skeleton-content">
      {/* Welcome skeleton */}
      <section className="ca-welcome">
        <div className="ca-welcome-content">
          <Skeleton width="150px" height={12} />

          <div style={{ marginTop: 16 }}>
            <Skeleton width="260px" height={30} />
          </div>

          <div style={{ marginTop: 18 }}>
            <Skeleton width="90%" height={12} />
          </div>

          <div style={{ marginTop: 10 }}>
            <Skeleton width="75%" height={12} />
          </div>
        </div>

        <div className="ca-welcome-illustration">
          <Skeleton variant="circle" width={75} height={75} />
          <Skeleton width="130px" height={12} />
        </div>
      </section>

      {/* Section heading skeleton */}
      <section className="ca-section-heading">
        <div style={{ width: "100%" }}>
          <Skeleton width="190px" height={22} />
          <div style={{ marginTop: 12 }}>
            <Skeleton width="240px" height={12} />
          </div>
        </div>
      </section>

      {/* Statistics skeleton */}
      <section className="ca-stats-grid">
        {[1, 2, 3, 4].map((item) => (
          <article className="ca-stat-card" key={item}>
            <Skeleton
              variant="rectangle"
              width={45}
              height={45}
            />

            <div
              className="ca-stat-information"
              style={{ width: "100%" }}
            >
              <Skeleton width="75%" height={12} />

              <div style={{ marginTop: 12 }}>
                <Skeleton variant="number" width={65} height={28} />
              </div>

              <div style={{ marginTop: 10 }}>
                <Skeleton width="90%" height={10} />
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* Job postings and hiring pipeline skeleton */}
      <section className="ca-main-grid">
        <article className="ca-panel ca-jobs-panel">
          <div className="ca-panel-heading">
            <div style={{ flex: 1 }}>
              <Skeleton width="140px" height={19} />
              <div style={{ marginTop: 10 }}>
                <Skeleton width="190px" height={11} />
              </div>
            </div>

            <Skeleton variant="circle" width={40} height={40} />
          </div>

          <div className="ca-job-total">
            <div style={{ flex: 1 }}>
              <Skeleton width="130px" height={12} />
              <div style={{ marginTop: 12 }}>
                <Skeleton variant="number" width={65} height={30} />
              </div>
            </div>

            <Skeleton variant="rectangle" width={45} height={45} />
          </div>

          <div className="ca-job-breakdown">
            {[1, 2, 3].map((item) => (
              <div className="ca-breakdown-row" key={item}>
                <Skeleton width="85px" height={13} />
                <Skeleton width="30px" height={16} />
              </div>
            ))}
          </div>
        </article>

        <article className="ca-panel ca-pipeline-panel">
          <div className="ca-panel-heading">
            <div style={{ flex: 1 }}>
              <Skeleton width="140px" height={19} />
              <div style={{ marginTop: 10 }}>
                <Skeleton width="180px" height={11} />
              </div>
            </div>

            <Skeleton variant="circle" width={40} height={40} />
          </div>

          <div className="ca-pipeline-total">
            <Skeleton variant="number" width={70} height={32} />
            <div style={{ marginTop: 8 }}>
              <Skeleton width="170px" height={12} />
            </div>
          </div>

          <div className="ca-pipeline-list">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div className="ca-pipeline-row" key={item}>
                <Skeleton width="85px" height={12} />
                <div style={{ flex: 1 }}>
                  <Skeleton width="100%" height={9} />
                </div>
                <Skeleton width="25px" height={13} />
              </div>
            ))}
          </div>
        </article>
      </section>

      {/* Recent applications table skeleton */}
      <section className="ca-panel ca-recent-panel">
        <div className="ca-panel-heading ca-recent-heading">
          <div style={{ flex: 1 }}>
            <Skeleton width="175px" height={20} />

            <div style={{ marginTop: 10 }}>
              <Skeleton width="260px" height={12} />
            </div>
          </div>

          <Skeleton variant="circle" width={40} height={40} />
        </div>

        <div className="ca-table-wrapper">
          <table className="ca-table">
            
              <thead>
                <tr>
                  <th>
                    <Skeleton width="85px" height={13} />
                  </th>
                  <th>
                    <Skeleton width="95px" height={13} />
                  </th>
                  <th>
                    <Skeleton width="55px" height={13} />
                  </th>
                  <th>
                    <Skeleton width="90px" height={13} />
                  </th>
                </tr>
              </thead>


            <tbody>
              {[1, 2, 3, 4].map((item) => (
                <tr key={item}>
                  <td>
                    <div className="ca-candidate-cell">
                      <Skeleton
                        variant="circle"
                        width={36}
                        height={36}
                      />

                      <div style={{ flex: 1 }}>
                        <Skeleton width="110px" height={12} />
                        <div style={{ marginTop: 8 }}>
                          <Skeleton width="140px" height={10} />
                        </div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <Skeleton width="120px" height={12} />
                  </td>

                  <td>
                    <Skeleton
                      variant="rectangle"
                      width={85}
                      height={24}
                    />
                  </td>

                  <td>
                    <Skeleton width="90px" height={12} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Footer skeleton */}
      <footer className="ca-footer">
        <Skeleton width="110px" height={11} />
        <Skeleton width="190px" height={11} />
      </footer>
    </div>
  );
}

export default function CompanyAdminDashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adminName, setAdminName] = useState("Company Admin");

  async function loadDashboard() {
    try {
      setLoading(true);

      const data = await apiRequest("/company-admin/dashboard");

      setDashboard(data);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem("user");

      if (storedUser) {
        const user = JSON.parse(storedUser);

        if (user?.name) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setAdminName(user.name);
        }
      }
    } catch {
      // Ignore invalid stored user data.
    }

    loadDashboard();
  }, []);

  const statCards = dashboard
    ? [
        {
          title: "Total Jobs",
          value: dashboard.jobs.total,
          description: "All company job postings",
          icon: BriefcaseBusiness,
          color: "blue",
        },
        {
          title: "Published Jobs",
          value: dashboard.jobs.published,
          description: "Currently accepting applications",
          icon: CheckCircle2,
          color: "green",
        },
        {
          title: "Total Applications",
          value: dashboard.applications.total,
          description: "Candidates who applied",
          icon: Users,
          color: "purple",
        },
        {
          title: "Pending Review",
          value: dashboard.applications.pending,
          description: "Waiting for your review",
          icon: Clock,
          color: "orange",
        },
      ]
    : [];

  const applicationStatuses = dashboard
    ? [
        {
          label: "Pending",
          value: dashboard.applications.pending,
          color: "orange",
        },
        {
          label: "Shortlisted",
          value: dashboard.applications.shortlisted,
          color: "blue",
        },
        {
          label: "Interview",
          value: dashboard.applications.interview,
          color: "purple",
        },
        {
          label: "Selected",
          value: dashboard.applications.selected,
          color: "green",
        },
        {
          label: "Rejected",
          value: dashboard.applications.rejected,
          color: "red",
        },
        {
          label: "Withdrawn",
          value: dashboard.applications.withdrawn,
          color: "gray",
        },
      ]
    : [];

  // Show dashboard skeleton while loading
  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !dashboard) {
    return (
      <main className="ca-state-screen">
        <div className="ca-error-card">
          <div className="ca-error-icon">
            <XCircle size={30} />
          </div>

          <h2>Unable to load dashboard</h2>

          <p>{error || "Dashboard data is not available."}</p>

          <button
            className="ca-primary-button"
            onClick={loadDashboard}
          >
             
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="ca-content">

      {/* Welcome section */}
      <section className="ca-welcome">
        <div className="ca-welcome-content">
          <span className="ca-welcome-label">
            COMPANY WORKSPACE
          </span>

          <h2>Welcome back, {adminName}!</h2>

          <p>
            Here is an overview of your recruitment activities. Track job
            postings, review applications, and keep your hiring process
            moving.
          </p>
        </div>

        <div className="ca-welcome-illustration">
          <div className="ca-illustration-circle">
            <TrendingUp size={42} />
          </div>

          <span>Recruitment overview</span>
        </div>
      </section>

      {/* Recruitment overview */}
      <section className="ca-section-heading">
        <div>
          <h2>Recruitment Overview</h2>
          <p>Key statistics from your company workspace</p>
        </div>
      </section>

      {/* Statistics cards */}
      <section className="ca-stats-grid">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <article className="ca-stat-card" key={card.title}>
              <div className={`ca-stat-icon ca-${card.color}`}>
                <Icon size={22} />
              </div>

              <div className="ca-stat-information">
                <p>{card.title}</p>
                <h3>{card.value}</h3>
                <span>{card.description}</span>
              </div>

              <ArrowUpRight
                className="ca-stat-decoration"
                size={19}
              />
            </article>
          );
        })}
      </section>

      {/* Job postings and hiring pipeline */}
      <section className="ca-main-grid">
        <article className="ca-panel ca-jobs-panel">
          <div className="ca-panel-heading">
            <div>
              <h2>Job Postings</h2>
              <p>Current status of your job openings</p>
            </div>

            <div className="ca-panel-icon">
              <BriefcaseBusiness size={20} />
            </div>
          </div>

          <div className="ca-job-total">
            <div>
              <span>Total job postings</span>
              <strong>{dashboard.jobs.total}</strong>
            </div>

            <div className="ca-job-total-icon">
              <BriefcaseBusiness size={23} />
            </div>
          </div>

          <div className="ca-job-breakdown">
            <div className="ca-breakdown-row">
              <span>
                <i className="ca-dot ca-dot-draft" /> Draft
              </span>
              <strong>{dashboard.jobs.draft}</strong>
            </div>

            <div className="ca-breakdown-row">
              <span>
                <i className="ca-dot ca-dot-published" /> Published
              </span>
              <strong>{dashboard.jobs.published}</strong>
            </div>

            <div className="ca-breakdown-row">
              <span>
                <i className="ca-dot ca-dot-closed" /> Closed
              </span>
              <strong>{dashboard.jobs.closed}</strong>
            </div>
          </div>
        </article>

        <article className="ca-panel ca-pipeline-panel">
          <div className="ca-panel-heading">
            <div>
              <h2>Hiring Pipeline</h2>
              <p>Candidate application progress</p>
            </div>

            <div className="ca-panel-icon">
              <TrendingUp size={20} />
            </div>
          </div>

          <div className="ca-pipeline-total">
            <strong>{dashboard.applications.total}</strong>
            <span>Total applications received</span>
          </div>

          <div className="ca-pipeline-list">
            {applicationStatuses.map((item) => (
              <div className="ca-pipeline-row" key={item.label}>
                <span className="ca-pipeline-label">
                  <i className={`ca-dot ca-dot-${item.color}`} />
                  {item.label}
                </span>

                <div className="ca-pipeline-track">
                  <div
                    className={`ca-pipeline-fill ca-fill-${item.color}`}
                    style={{
                      width: `${
                        dashboard.applications.total > 0
                          ? (item.value / dashboard.applications.total) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>

                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      {/* Recent applications */}
      <section className="ca-panel ca-recent-panel">
        <div className="ca-panel-heading ca-recent-heading">
          <div>
            <h2>Recent Applications</h2>
            <p>
              Keep track of the latest candidates applying to your jobs
            </p>
          </div>

          <div className="ca-panel-icon">
            <FileText size={20} />
          </div>
        </div>

        {dashboard.recentApplications.length === 0 ? (
          <div className="ca-empty-state">
            <div className="ca-empty-icon">
              <FileText size={27} />
            </div>

            <h3>No applications yet</h3>

            <p>
              When candidates apply for your published jobs, their
              applications will appear here.
            </p>
          </div>
        ) : (
          <div className="ca-table-wrapper">
            <table className="ca-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Job Position</th>
                  <th>Status</th>
                  <th>Applied Date</th>
                </tr>
              </thead>

              <tbody>
                {dashboard.recentApplications.map((application) => (
                  <tr key={application.applicationId}>
                    <td>
                      <div className="ca-candidate-cell">
                        <div className="ca-candidate-avatar">
                          <UserRound size={17} />
                        </div>

                        <div>
                          <strong>{application.candidateName}</strong>
                          <span>{application.candidateEmail}</span>
                        </div>
                      </div>
                    </td>

                    <td>{application.jobTitle}</td>

                    <td>
                      <span
                        className={`ca-status ${getStatusClass(
                          application.status,
                        )}`}
                      >
                        {application.status}
                      </span>
                    </td>

                    <td>{formatDate(application.appliedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="ca-footer">
        <span>
          © {new Date().getFullYear()} CareerHub
        </span>

        <span>Company Recruitment Workspace</span>
      </footer>
    </div>
  );
}
