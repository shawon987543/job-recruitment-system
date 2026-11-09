
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  MapPin,
  CalendarDays,
  Clock3,
  FileText,
  RefreshCw,
  XCircle,
  ArrowRight,
  Building2,
  Search,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

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
  job: ApplicationJob | null;
}

const statusLabels: Record<ApplicationStatus, string> = {
  PENDING: "Pending",
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

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [withdrawingId, setWithdrawingId] = useState<number | null>(null);
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
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Unable to withdraw this application.",
      );
    } finally {
      setWithdrawingId(null);
    }
  };

  const filters = [
    { label: "All Applications", value: "ALL" },
    { label: "Pending", value: "PENDING" },
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

  const countByStatus = (status: string) =>
    applications.filter((application) => application.status === status).length;

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

        <section className="application-stats">
          <div className="application-stat-card">
            <div className="application-stat-icon total-icon">
              <FileText size={21} />
            </div>
            <div>
              <span>Total Applications</span>
              <strong>{applications.length}</strong>
            </div>
          </div>

          <div className="application-stat-card">
            <div className="application-stat-icon pending-icon">
              <Clock3 size={21} />
            </div>
            <div>
              <span>Pending</span>
              <strong>{countByStatus("PENDING")}</strong>
            </div>
          </div>

          <div className="application-stat-card">
            <div className="application-stat-icon interview-icon">
              <CalendarDays size={21} />
            </div>
            <div>
              <span>Interviews</span>
              <strong>{countByStatus("INTERVIEW")}</strong>
            </div>
          </div>

          <div className="application-stat-card">
            <div className="application-stat-icon selected-icon">
              <CheckCircle2 size={21} />
            </div>
            <div>
              <span>Selected</span>
              <strong>{countByStatus("SELECTED")}</strong>
            </div>
          </div>
        </section>

        <section className="applications-content">
          <div className="applications-toolbar">
            <div>
              <h2>Your Applications</h2>
              <p>
                {applications.length}{" "}
                {applications.length === 1 ? "application" : "applications"}{" "}
                submitted
              </p>
            </div>

            <button
              type="button"
              className="applications-refresh-button"
              onClick={() => void fetchApplications()}
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? "spin-icon" : ""} />
              Refresh
            </button>
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
            <div className="applications-message">
              <RefreshCw size={30} className="spin-icon" />
              <h3>Loading applications...</h3>
              <p>Please wait while we retrieve your applications.</p>
            </div>
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
          ) : filteredApplications.length === 0 ? (
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
          ) : (
            <div className="application-list">
              {filteredApplications.map((application) => {
                const status = application.status;
                const canWithdraw = status === "PENDING";

                return (
                  <article
                    className="application-card"
                    key={application.id}
                  >
                    <div className="application-card-top">
                      <div className="application-job-icon">
                        <BriefcaseBusiness size={23} />
                      </div>

                      <div className="application-job-info">
                        <h3>
                          {application.job?.title || "Job no longer available"}
                        </h3>

                        <div className="application-job-company">
                          <Building2 size={15} />
                          <span>Job ID: #{application.jobId}</span>
                        </div>
                      </div>

                      <span
                        className={`application-status status-${status.toLowerCase()}`}
                      >
                        {statusLabels[status] || status}
                      </span>
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
                        Application deadline:{" "}
                        {formatDate(application.job.deadline)}
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
                      <span className="application-id">
                        Application ID: #{application.id}
                      </span>

                      <div className="application-actions">
                        {application.job && (
                          <Link
                            href={`/candidate/jobs/${application.job.id}`}
                            className="application-details-link"
                          >
                            View Job <ArrowRight size={16} />
                          </Link>
                        )}

                        {canWithdraw && (
                          <button
                            type="button"
                            className="withdraw-button"
                            onClick={() =>
                              void handleWithdraw(application.id)
                            }
                            disabled={withdrawingId === application.id}
                          >
                            <XCircle size={16} />
                            {withdrawingId === application.id
                              ? "Withdrawing..."
                              : "Withdraw"}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
