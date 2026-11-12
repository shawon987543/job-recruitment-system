"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  Eye,
  X,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  UserRound,
  CalendarDays,
  FileText,
  Briefcase,
} from "lucide-react";
import { apiRequest } from "@/lib/api";

type ApplicationStatus =
  | "PENDING"
  | "SHORTLISTED"
  | "INTERVIEW"
  | "SELECTED"
  | "REJECTED"
  | "WITHDRAWN";

interface Application {
  id: number;
  jobId: number;
  candidateId: number;
  coverLetter: string | null;
  cvUrl: string | null;
  status: ApplicationStatus;
  adminNotes: string | null;
  appliedAt: string;
  updatedAt: string;
  withdrawnAt: string | null;
  job: {
    id: number;
    title: string;
    location: string;
  } | null;
  candidate: {
    id: number;
    name: string;
    email: string;
  } | null;
}

const statusOptions: ApplicationStatus[] = [
  "PENDING",
  "SHORTLISTED",
  "INTERVIEW",
  "SELECTED",
  "REJECTED",
  "WITHDRAWN",
];

const statusClass: Record<ApplicationStatus, string> = {
  PENDING: "ap-status-pending",
  SHORTLISTED: "ap-status-shortlisted",
  INTERVIEW: "ap-status-interview",
  SELECTED: "ap-status-selected",
  REJECTED: "ap-status-rejected",
  WITHDRAWN: "ap-status-withdrawn",
};

function formatDate(date: string) {
  if (!date) return "â€”";

  return new Date(date).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function CompanyApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);

  const [notes, setNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  async function loadApplications() {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest("/applications/company");

      if (!Array.isArray(data)) {
        throw new Error("Unexpected applications response from server.");
      }

      setApplications(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load applications.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadApplications();
  }, []);

  const filteredApplications = useMemo(() => {
    return applications.filter((application) => {
      const candidateName = application.candidate?.name || "";
      const candidateEmail = application.candidate?.email || "";
      const jobTitle = application.job?.title || "";

      const searchText =
        `${candidateName} ${candidateEmail} ${jobTitle}`.toLowerCase();

      const matchesSearch = searchText.includes(search.toLowerCase());

      const matchesFilter =
        filter === "ALL" || application.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [applications, search, filter]);

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "PENDING").length,
    shortlisted: applications.filter((a) => a.status === "SHORTLISTED")
      .length,
    interview: applications.filter((a) => a.status === "INTERVIEW").length,
    selected: applications.filter((a) => a.status === "SELECTED").length,
    rejected: applications.filter((a) => a.status === "REJECTED").length,
  };

  function openApplication(application: Application) {
    setSelectedApplication(application);
    setNotes(application.adminNotes || "");
  }

  async function updateApplicationStatus(
    status: ApplicationStatus,
  ) {
    if (!selectedApplication || updating) return;

    if (selectedApplication.status === "WITHDRAWN") {
      return;
    }

    try {
      setUpdating(true);
      setError("");

      await apiRequest(
        `/applications/${selectedApplication.id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status,
            adminNotes: notes,
          }),
        },
      );

      setApplications((previous) =>
        previous.map((application) =>
          application.id === selectedApplication.id
            ? {
                ...application,
                status,
                adminNotes: notes,
              }
            : application,
        ),
      );

      setSelectedApplication((previous) =>
        previous
          ? {
              ...previous,
              status,
              adminNotes: notes,
            }
          : null,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update application.",
      );
    } finally {
      setUpdating(false);
    }
  }

  return (
    <>
      <div className="ca-content ap-content">
          {/* Page introduction */}
          <section className="ap-page-intro">
            <div>
              <h2>Manage your applicants</h2>
              <p>
                Review candidate applications, check CVs, and manage
                your hiring process.
              </p>
            </div>

          
            {/**?Refresh button */}

            
          </section>

          {/* Error message */}
          {error && (
            <div className="ap-error">
              <XCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Statistics */}
          <section className="ap-stats-grid">
            <div className="ap-stat-card">
              <div className="ap-stat-icon ap-icon-blue">
                <FileText size={21} />
              </div>
              <div>
                <span>Total Applications</span>
                <strong>{stats.total}</strong>
                <small>All received applications</small>
              </div>
            </div>

            <div className="ap-stat-card">
              <div className="ap-stat-icon ap-icon-orange">
                <Clock size={21} />
              </div>
              <div>
                <span>Pending</span>
                <strong>{stats.pending}</strong>
                <small>Waiting for review</small>
              </div>
            </div>

            <div className="ap-stat-card">
              <div className="ap-stat-icon ap-icon-purple">
                <UserRound size={21} />
              </div>
              <div>
                <span>Shortlisted</span>
                <strong>{stats.shortlisted}</strong>
                <small>Selected for consideration</small>
              </div>
            </div>

            <div className="ap-stat-card">
              <div className="ap-stat-icon ap-icon-green">
                <CalendarDays size={21} />
              </div>
              <div>
                <span>Interview</span>
                <strong>{stats.interview}</strong>
                <small>In interview stage</small>
              </div>
            </div>
          </section>

          {/* Extra statistics */}
          <section className="ap-summary-row">
            <div>
              <CheckCircle2 size={18} />
              <span>Selected</span>
              <strong>{stats.selected}</strong>
            </div>

            <div>
              <XCircle size={18} />
              <span>Rejected</span>
              <strong>{stats.rejected}</strong>
            </div>
          </section>

          {/* Applications table */}
          <section className="ap-table-card">
            <div className="ap-table-header">
              <div>
                <h3>All Applications</h3>
                <p>Review and manage candidates who applied for your jobs.</p>
              </div>

              <span className="ap-result-count">
                {filteredApplications.length} results
              </span>
            </div>

            <div className="ap-toolbar">
              <div className="ap-search">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search candidate or job..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="ap-filter"
              >
                <option value="ALL">All Statuses</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="ap-empty-state">
                <RefreshCw className="ap-spinning" size={28} />
                <h3>Loading applications...</h3>
                <p>Please wait while we fetch your applications.</p>
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="ap-empty-state">
                <div className="ap-empty-icon">
                  <FileText size={28} />
                </div>
                <h3>No applications found</h3>
                <p>
                  {applications.length === 0
                    ? "You have not received any applications yet."
                    : "Try changing your search or status filter."}
                </p>
              </div>
            ) : (
              <div className="ap-table-wrapper">
                <table className="ap-table">
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Applied For</th>
                      <th>Applied Date</th>
                      <th>Status</th>
                      <th>CV</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredApplications.map((application) => (
                      <tr key={application.id}>
                        <td>
                          <div className="ap-candidate">
                            <div className="ap-candidate-avatar">
                              {getInitials(
                                application.candidate?.name || "Candidate",
                              )}
                            </div>

                            <div>
                              <strong>
                                {application.candidate?.name ||
                                  "Unknown Candidate"}
                              </strong>
                              <span>
                                {application.candidate?.email || "No email"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="ap-job-cell">
                            <Briefcase size={16} />
                            <span>
                              {application.job?.title || "Unknown Job"}
                            </span>
                          </div>
                        </td>

                        <td>{formatDate(application.appliedAt)}</td>

                        <td>
                          <span
                            className={`ap-status ${
                              statusClass[application.status]
                            }`}
                          >
                            {application.status.replace("_", " ")}
                          </span>
                        </td>

                        <td>
                          {application.cvUrl ? (
                            <a
                              className="ap-cv-link"
                              href={application.cvUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View CV <ExternalLink size={13} />
                            </a>
                          ) : (
                            <span className="ap-no-cv">Not uploaded</span>
                          )}
                        </td>

                        <td>
                          <button
                            className="ap-view-button"
                            onClick={() => openApplication(application)}
                          >
                            <Eye size={15} />
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
      </div>

      {/* Application details modal */}
      {selectedApplication && (
        <div
          className="ap-modal-overlay"
          onClick={() => setSelectedApplication(null)}
        >
          <div
            className="ap-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ap-modal-header">
              <div>
                <span>APPLICATION #{selectedApplication.id}</span>
                <h2>Candidate Review</h2>
              </div>

              <button
                className="ap-modal-close"
                onClick={() => setSelectedApplication(null)}
                aria-label="Close application details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="ap-modal-body">
              <div className="ap-detail-candidate">
                <div className="ap-detail-avatar">
                  {getInitials(
                    selectedApplication.candidate?.name || "Candidate",
                  )}
                </div>

                <div>
                  <h3>
                    {selectedApplication.candidate?.name ||
                      "Unknown Candidate"}
                  </h3>
                  <p>
                    {selectedApplication.candidate?.email || "No email"}
                  </p>
                </div>
              </div>

              <div className="ap-detail-grid">
                <div>
                  <span>Applied Position</span>
                  <strong>
                    {selectedApplication.job?.title || "Unknown Job"}
                  </strong>
                </div>

                <div>
                  <span>Location</span>
                  <strong>
                    {selectedApplication.job?.location || "Not specified"}
                  </strong>
                </div>

                <div>
                  <span>Applied Date</span>
                  <strong>{formatDate(selectedApplication.appliedAt)}</strong>
                </div>

                <div>
                  <span>Current Status</span>
                  <strong>
                    <span
                      className={`ap-status ${
                        statusClass[selectedApplication.status]
                      }`}
                    >
                      {selectedApplication.status.replace("_", " ")}
                    </span>
                  </strong>
                </div>
              </div>

              <div className="ap-detail-section">
                <h4>Cover Letter</h4>
                <div className="ap-cover-letter">
                  {selectedApplication.coverLetter?.trim() ||
                    "The candidate did not provide a cover letter."}
                </div>
              </div>

              <div className="ap-detail-section">
                <h4>Candidate CV</h4>

                {selectedApplication.cvUrl ? (
                  <a
                    className="ap-cv-download"
                    href={selectedApplication.cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FileText size={18} />
                    View candidate CV
                    <ExternalLink size={15} />
                  </a>
                ) : (
                  <p className="ap-no-cv">
                    No CV has been uploaded by this candidate.
                  </p>
                )}
              </div>

              <div className="ap-detail-section">
                <h4>Admin Notes</h4>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Write your review notes about this candidate..."
                  maxLength={5000}
                  disabled={
                    updating ||
                    selectedApplication.status === "WITHDRAWN"
                  }
                />
                <small>{notes.length}/5000 characters</small>
              </div>

              {selectedApplication.status === "WITHDRAWN" ? (
                <div className="ap-withdrawn-message">
                  This application was withdrawn by the candidate and cannot
                  be updated.
                </div>
              ) : (
                <div className="ap-detail-section">
                  <h4>Update Application Status</h4>

                  <div className="ap-status-actions">
                    <button
                      className="ap-action-shortlist"
                      disabled={updating}
                      onClick={() =>
                        updateApplicationStatus("SHORTLISTED")
                      }
                    >
                      Shortlist
                    </button>

                    <button
                      className="ap-action-interview"
                      disabled={updating}
                      onClick={() =>
                        updateApplicationStatus("INTERVIEW")
                      }
                    >
                      Interview
                    </button>

                    <button
                      className="ap-action-select"
                      disabled={updating}
                      onClick={() =>
                        updateApplicationStatus("SELECTED")
                      }
                    >
                      Select
                    </button>

                    <button
                      className="ap-action-reject"
                      disabled={updating}
                      onClick={() =>
                        updateApplicationStatus("REJECTED")
                      }
                    >
                      Reject
                    </button>
                  </div>

                  {updating && (
                    <p className="ap-updating-message">
                      Updating application...
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="ap-modal-footer">
              <button
                className="ap-cancel-button"
                onClick={() => setSelectedApplication(null)}
                disabled={updating}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
