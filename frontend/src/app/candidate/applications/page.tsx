
"use client";
import { useToastErrorState } from "@/components/ui/toast-message-state";
import toast from "react-hot-toast";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  MapPin,
  CalendarDays,
  Clock3,
  FileText,
  XCircle,
  ArrowRight,
  Building2,
  Search,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import Skeleton from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/api";
import "./applications.css";

type ApplicationStatus =
  | "PENDING"
  | "SHORTLISTED"
  | "INTERVIEW"
  | "SELECTED"
  | "REJECTED"
  | "WITHDRAWN";

interface ApplicationJob {
  id: number;
  title: string;
  location: string;
  jobType: string;
  status: string;
  deadline: string | null;
}

interface Application {
  id: number;
  jobId: number;
  candidateId: number;
  coverLetter: string | null;
  cvUrl: string | null;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
  withdrawnAt: string | null;
  reapplyDisabledReason?: string | null;
  job: ApplicationJob | null;
}

const statusLabels: Record<ApplicationStatus, string> = {
  PENDING: "Applied",
  SHORTLISTED: "Shortlisted",
  INTERVIEW: "Interview",
  SELECTED: "Selected",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

function formatDate(date: string | null | undefined) {
  if (!date) return "Not available";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not available";
  }

  return parsedDate.toLocaleDateString("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatJobType(jobType: string | undefined) {
  if (!jobType) return "Not specified";

  return jobType
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getReapplyDisabledReason(application: Application) {
  if (application.reapplyDisabledReason) {
    return application.reapplyDisabledReason;
  }

  if (!application.job) {
    return "This job is no longer available.";
  }

  if (application.job.status !== "PUBLISHED") {
    return application.job.status === "CLOSED"
      ? "This job is closed and cannot accept reapplications."
      : "This job is not currently accepting applications.";
  }

  const today = new Date().toISOString().slice(0, 10);
  if (application.job.deadline && application.job.deadline < today) {
    return "The application deadline has passed.";
  }

  return null;
}

function ApplicationListSkeleton() {
  return (
    <div className="application-list" aria-label="Loading applications" aria-busy="true">
      {[0, 1, 2].map((item) => (
        <article className="application-card" key={item}>
          <div className="application-card-top">
            <Skeleton variant="rectangle" width={48} height={48} />
            <div style={{ flex: 1, display: "grid", gap: 9 }}>
              <Skeleton variant="text" width="55%" height={18} />
              <Skeleton variant="text" width="35%" height={13} />
            </div>
            <Skeleton variant="rectangle" width={95} height={28} rounded />
          </div>
          <div className="application-job-meta">
            <Skeleton variant="text" width={120} height={13} />
            <Skeleton variant="text" width={105} height={13} />
            <Skeleton variant="text" width={125} height={13} />
          </div>
          <div className="application-card-footer">
            <Skeleton variant="text" width={80} height={12} />
            <Skeleton variant="rectangle" width={110} height={34} />
          </div>
        </article>
      ))}
    </div>
  );
}

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useToastErrorState();
  const [withdrawingId, setWithdrawingId] = useState<number | null>(null);
  const [reapplyingId, setReapplyingId] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest("/applications/mine");

      setApplications(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load your applications.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchApplications();
  }, [fetchApplications]);

  const handleWithdraw = async (applicationId: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to withdraw this application?",
    );

    if (!confirmed) return;

    try {
      setWithdrawingId(applicationId);

      await apiRequest(`/applications/${applicationId}/withdraw`, {
        method: "PATCH",
      });

      setApplications((previous) =>
        previous.map((application) =>
          application.id === applicationId
            ? {
                ...application,
                status: "WITHDRAWN",
                withdrawnAt: new Date().toISOString(),
              }
            : application,
        ),
      );
      toast.success("Application withdrawn.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to withdraw this application.",
      );
    } finally {
      setWithdrawingId(null);
    }
  };

  const handleReapply = async (application: Application) => {
    if (getReapplyDisabledReason(application) || reapplyingId !== null) return;

    try {
      setReapplyingId(application.id);
      const updated = await apiRequest(
        `/applications/${application.id}/reapply`,
        { method: "POST" },
      );

      setApplications((previous) =>
        previous.map((item) =>
          item.id === application.id
            ? {
                ...item,
                ...updated,
                status: "PENDING",
                reapplyDisabledReason: null,
              }
            : item,
        ),
      );
      toast.success("Your application has been reactivated.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to reapply for this job.",
      );
    } finally {
      setReapplyingId(null);
    }
  };

  const filters = [
    { label: "All Applications", value: "ALL" },
    { label: "Applied", value: "PENDING" },
    { label: "Shortlisted", value: "SHORTLISTED" },
    { label: "Interview", value: "INTERVIEW" },
    { label: "Selected", value: "SELECTED" },
    { label: "Rejected", value: "REJECTED" },
    { label: "Withdrawn", value: "WITHDRAWN" },
  ];

  const filteredApplications = applications.filter((application) => {
    const matchesFilter =
      activeFilter === "ALL" || application.status === activeFilter;

    const jobTitle = application.job?.title?.toLowerCase() || "";
    const location = application.job?.location?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      jobTitle.includes(search) || location.includes(search);

    return matchesFilter && matchesSearch;
  });

  const withdrawnApplications = filteredApplications.filter(
    (application) => application.status === "WITHDRAWN",
  );
  const activeApplications = filteredApplications.filter(
    (application) => application.status !== "WITHDRAWN",
  );

  const countByStatus = (status: string) =>
    applications.filter((application) => application.status === status).length;

  const renderApplicationCard = (application: Application) => {
    const status = application.status;
    const reapplyDisabledReason = getReapplyDisabledReason(application);

    return (
      <article className="application-card" key={application.id}>
        <div className="application-card-top">
          <div className="application-job-icon">
            <BriefcaseBusiness size={23} />
          </div>
          <div className="application-job-info">
            <h3>{application.job?.title || "Job no longer available"}</h3>
            <div className="application-job-company">
              <Building2 size={15} />
              <span>Job ID: #{application.jobId}</span>
            </div>
          </div>
          <span className={`application-status status-${status.toLowerCase()}`}>
            {statusLabels[status] || status}
          </span>
          {status === "WITHDRAWN" && (
            <div className="reapply-control">
              <button
                type="button"
                className="reapply-button"
                onClick={() => void handleReapply(application)}
                disabled={
                  Boolean(reapplyDisabledReason) ||
                  reapplyingId !== null
                }
                title={reapplyDisabledReason || undefined}
              >
                {reapplyingId === application.id ? "Reapplying..." : "Reapply"}
              </button>
              {reapplyDisabledReason && (
                <p className="reapply-blocked-reason" role="note">
                  {reapplyDisabledReason}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="application-job-meta">
          <span>
            <MapPin size={16} />
            {application.job?.location || "Location not available"}
          </span>
          <span>
            <BriefcaseBusiness size={16} />
            {formatJobType(application.job?.jobType)}
          </span>
          <span>
            <CalendarDays size={16} />
            Applied {formatDate(application.appliedAt)}
          </span>
        </div>

        {application.job?.deadline && (
          <div className="application-deadline">
            <Clock3 size={15} />
            Application deadline: {formatDate(application.job.deadline)}
          </div>
        )}

        {application.withdrawnAt && (
          <div className="application-history-note">
            {status === "WITHDRAWN" ? "Withdrawn" : "Previously withdrawn"} on{" "}
            {formatDate(application.withdrawnAt)}.
          </div>
        )}

        {application.coverLetter && (
          <div className="application-cover-letter">
            <strong>Cover letter</strong>
            <p>{application.coverLetter}</p>
          </div>
        )}

        {application.cvUrl && (
          <div className="application-cv">
            <FileText size={16} />
            <span>CV attached to application</span>
          </div>
        )}

        <div className="application-card-footer">
          <span className="application-id">Application ID: #{application.id}</span>
          <div className="application-actions">
            {application.job && (
              <Link
                href={`/candidate/jobs/${application.job.id}`}
                className="application-details-link"
              >
                View Job <ArrowRight size={16} />
              </Link>
            )}

            {status === "PENDING" && (
              <button
                type="button"
                className="withdraw-button"
                onClick={() => void handleWithdraw(application.id)}
                disabled={withdrawingId === application.id}
              >
                <XCircle size={16} />
                {withdrawingId === application.id ? "Withdrawing..." : "Withdraw"}
              </button>
            )}

          </div>
        </div>
      </article>
    );
  };

  return (
    <main className="my-applications-page">
      <div className="applications-container">
        <div className="applications-heading">
          <div>
            <div className="applications-eyebrow">
              <BriefcaseBusiness size={16} />
              Candidate Portal
            </div>

            <h1>My Applications</h1>

            <p>
              Track your job applications and stay updated on your recruitment
              progress.
            </p>
          </div>

          <Link href="/candidate/jobs" className="browse-jobs-button">
            <Search size={17} />
            Browse Jobs
          </Link>
        </div>

        <section className="application-stats" aria-busy={loading}>
          <div className="application-stat-card">
            <div className="application-stat-icon total-icon">
              <FileText size={21} />
            </div>
            <div>
              <span>Total Applications</span>
              {loading ? <Skeleton variant="number" width={52} /> : <strong>{applications.length}</strong>}
            </div>
          </div>

          <div className="application-stat-card">
            <div className="application-stat-icon pending-icon">
              <Clock3 size={21} />
            </div>
            <div>
              <span>Applied</span>
              {loading ? <Skeleton variant="number" width={52} /> : <strong>{countByStatus("PENDING")}</strong>}
            </div>
          </div>

          <div className="application-stat-card">
            <div className="application-stat-icon interview-icon">
              <CalendarDays size={21} />
            </div>
            <div>
              <span>Interviews</span>
              {loading ? <Skeleton variant="number" width={52} /> : <strong>{countByStatus("INTERVIEW")}</strong>}
            </div>
          </div>

          <div className="application-stat-card">
            <div className="application-stat-icon selected-icon">
              <CheckCircle2 size={21} />
            </div>
            <div>
              <span>Selected</span>
              {loading ? <Skeleton variant="number" width={52} /> : <strong>{countByStatus("SELECTED")}</strong>}
            </div>
          </div>
        </section>

        <section className="applications-content">
          <div className="applications-toolbar">
            <div>
              <h2>Your Applications</h2>
              {loading ? (
                <Skeleton variant="text" width={170} height={13} />
              ) : (
                <p>
                  {applications.length}{" "}
                  {applications.length === 1 ? "application" : "applications"}{" "}
                  submitted
                </p>
              )}
            </div>

          </div>

          <div className="applications-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by job title or location..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <div className="applications-filters">
            {filters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                className={
                  activeFilter === filter.value ? "active-filter" : ""
                }
                onClick={() => setActiveFilter(filter.value)}
              >
                {filter.label}
                {filter.value === "ALL" && (
                  <span>{applications.length}</span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <ApplicationListSkeleton />
          ) : error ? (
            <div className="applications-message error-message">
              <AlertCircle size={34} />
              <h3>Unable to load applications</h3>
              <p>{error}</p>
              <button
                type="button"
                onClick={() => void fetchApplications()}
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="application-sections">
              {activeApplications.length > 0 && (
                <div className="application-list">
                  {activeApplications.map(renderApplicationCard)}
                </div>
              )}

              {activeApplications.length === 0 &&
                withdrawnApplications.length === 0 && (
                  <div className="applications-message empty-message">
                    <div className="empty-applications-icon">
                      <BriefcaseBusiness size={34} />
                    </div>
                    <h3>
                      {applications.length === 0
                        ? "No applications yet"
                        : "No matching applications"}
                    </h3>
                    <p>
                      {applications.length === 0
                        ? "You haven't applied for any jobs yet. Explore available jobs and submit your first application."
                        : "Try changing your search or selecting another status filter."}
                    </p>
                    {applications.length === 0 && (
                      <Link href="/candidate/jobs" className="empty-browse-button">
                        Explore Jobs <ArrowRight size={17} />
                      </Link>
                    )}
                  </div>
                )}

              {(activeFilter === "ALL" || activeFilter === "WITHDRAWN") &&
                withdrawnApplications.length > 0 && (
                  <section className="withdrawn-applications-section">
                    <div className="withdrawn-applications-heading">
                      <div>
                        <h3>Withdrawn Applications</h3>
                        <p>
                          Reapply while the job is still accepting applications.
                        </p>
                      </div>
                      <span>{withdrawnApplications.length}</span>
                    </div>
                    <div className="application-list">
                      {withdrawnApplications.map(renderApplicationCard)}
                    </div>
                  </section>
                )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
