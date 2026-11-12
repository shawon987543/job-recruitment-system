"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  Eye,
  X,
  ExternalLink,
  Users,
  FileText,
  BriefcaseBusiness,
  Clock,
  CheckCircle2,
  CalendarDays,
  Mail,
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
  appliedAt: string;
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

interface Candidate {
  id: number;
  name: string;
  email: string;
  applications: Application[];
  latestAppliedAt: string;
}

const statusOptions: ApplicationStatus[] = [
  "PENDING",
  "SHORTLISTED",
  "INTERVIEW",
  "SELECTED",
  "REJECTED",
  "WITHDRAWN",
];

function formatDate(date: string) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusClass(status: ApplicationStatus) {
  return `ca-candidate-status ca-status-${status.toLowerCase()}`;
}

export default function CandidatesPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedCandidate, setSelectedCandidate] =
    useState<Candidate | null>(null);

  async function loadCandidates() {
    try {
      setLoading(true);
      setError("");

      const response = await apiRequest("/applications/company");

      const data = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];

      setApplications(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Unable to load candidates. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCandidates();
  }, []);

  // Group applications by candidate.
  const candidates = useMemo<Candidate[]>(() => {
    const grouped = new Map<number, Candidate>();

    applications.forEach((application) => {
      const candidate = application.candidate;

      if (!candidate) return;

      const existing = grouped.get(candidate.id);

      if (existing) {
        existing.applications.push(application);

        if (
          new Date(application.appliedAt) >
          new Date(existing.latestAppliedAt)
        ) {
          existing.latestAppliedAt = application.appliedAt;
        }
      } else {
        grouped.set(candidate.id, {
          id: candidate.id,
          name: candidate.name,
          email: candidate.email,
          applications: [application],
          latestAppliedAt: application.appliedAt,
        });
      }
    });

    return Array.from(grouped.values()).sort(
      (a, b) =>
        new Date(b.latestAppliedAt).getTime() -
        new Date(a.latestAppliedAt).getTime(),
    );
  }, [applications]);

  const filteredCandidates = useMemo(() => {
    return candidates.filter((candidate) => {
      const matchesSearch =
        candidate.name.toLowerCase().includes(search.toLowerCase()) ||
        candidate.email.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" ||
        candidate.applications.some(
          (application) => application.status === statusFilter,
        );

      return matchesSearch && matchesStatus;
    });
  }, [candidates, search, statusFilter]);

  const totalApplications = applications.length;

  const shortlistedCount = applications.filter(
    (application) => application.status === "SHORTLISTED",
  ).length;

  const selectedCount = applications.filter(
    (application) => application.status === "SELECTED",
  ).length;

  const stats = [
    {
      label: "Total Candidates",
      value: candidates.length,
      icon: Users,
      color: "blue",
    },
    {
      label: "Total Applications",
      value: totalApplications,
      icon: FileText,
      color: "purple",
    },
    {
      label: "Shortlisted",
      value: shortlistedCount,
      icon: Clock,
      color: "orange",
    },
    {
      label: "Selected",
      value: selectedCount,
      icon: CheckCircle2,
      color: "green",
    },
  ];

  return (
    <div className="ca-content ca-candidates-content">
      <div className="ca-candidates-heading">
        <div>
          <h1>Your Candidates</h1>
          <p>
            View candidates who have applied to your company&apos;s job
            openings.
          </p>
        </div>

       {/**Refresh button */}
       
      </div>

      {error && (
        <div className="ca-candidates-error">
          {error}
        </div>
      )}

      <div className="ca-candidates-stats">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div className="ca-candidates-stat-card" key={stat.label}>
              <div className={`ca-candidates-stat-icon ${stat.color}`}>
                <Icon size={22} />
              </div>

              <div>
                <p>{stat.label}</p>
                <h2>{loading ? "—" : stat.value}</h2>
              </div>
            </div>
          );
        })}
      </div>

      <div className="ca-candidates-directory">
        <div className="ca-candidates-directory-header">
          <div>
            <h2>Candidate Directory</h2>
            <p>
              {filteredCandidates.length} candidate
              {filteredCandidates.length !== 1 ? "s" : ""} found
            </p>
          </div>

          <div className="ca-candidates-filters">
            <div className="ca-candidates-search">
              <Search size={17} />
              <input
                type="text"
                placeholder="Search name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="ca-candidates-empty">
            <RefreshCw size={28} className="ca-spinning" />
            <p>Loading candidates...</p>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="ca-candidates-empty">
            <Users size={36} />
            <h3>No candidates found</h3>
            <p>
              Candidates will appear here when they apply to your company&apos;s
              jobs.
            </p>
          </div>
        ) : (
          <div className="ca-candidates-table-wrapper">
            <table className="ca-candidates-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Applications</th>
                  <th>Latest Application</th>
                  <th>Application Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredCandidates.map((candidate) => (
                  <tr key={candidate.id}>
                    <td>
                      <div className="ca-candidates-person">
                        <div className="ca-candidates-avatar">
                          {candidate.name.charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <strong>{candidate.name}</strong>
                          <span>{candidate.email}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="ca-candidates-count">
                        {candidate.applications.length}
                      </span>
                    </td>

                    <td>{formatDate(candidate.latestAppliedAt)}</td>

                    <td>
                      <div className="ca-candidates-status-list">
                        {Array.from(
                          new Set(
                            candidate.applications.map(
                              (application) => application.status,
                            ),
                          ),
                        ).map((status) => (
                          <span
                            key={status}
                            className={getStatusClass(status)}
                          >
                            {status.replace("_", " ")}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="ca-candidates-view"
                        onClick={() => setSelectedCandidate(candidate)}
                      >
                        <Eye size={16} />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedCandidate && (
        <div
          className="ca-candidates-modal-overlay"
          onClick={() => setSelectedCandidate(null)}
        >
          <div
            className="ca-candidates-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ca-candidates-modal-header">
              <div>
                <h2>Candidate Details</h2>
                <p>Candidate profile and application history</p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                aria-label="Close candidate details"
              >
                <X size={21} />
              </button>
            </div>

            <div className="ca-candidates-profile">
              <div className="ca-candidates-profile-avatar">
                {selectedCandidate.name.charAt(0).toUpperCase()}
              </div>

              <div>
                <h3>{selectedCandidate.name}</h3>
                <p>
                  <Mail size={15} />
                  {selectedCandidate.email}
                </p>
                <span>Candidate ID: #{selectedCandidate.id}</span>
              </div>
            </div>

            <div className="ca-candidates-modal-stats">
              <div>
                <FileText size={18} />
                <span>
                  <strong>{selectedCandidate.applications.length}</strong>
                  Applications
                </span>
              </div>

              <div>
                <CalendarDays size={18} />
                <span>
                  <strong>
                    {formatDate(selectedCandidate.latestAppliedAt)}
                  </strong>
                  Latest Applied
                </span>
              </div>
            </div>

            <div className="ca-candidates-history">
              <h3>Application History</h3>

              {selectedCandidate.applications
                .slice()
                .sort(
                  (a, b) =>
                    new Date(b.appliedAt).getTime() -
                    new Date(a.appliedAt).getTime(),
                )
                .map((application) => (
                  <div
                    className="ca-candidates-history-card"
                    key={application.id}
                  >
                    <div className="ca-candidates-history-top">
                      <div>
                        <BriefcaseBusiness size={17} />
                        <strong>
                          {application.job?.title || "Job not available"}
                        </strong>
                      </div>

                      <span className={getStatusClass(application.status)}>
                        {application.status.replace("_", " ")}
                      </span>
                    </div>

                    <p className="ca-candidates-job-location">
                      {application.job?.location || "Location not available"}
                    </p>

                    <p className="ca-candidates-applied-date">
                      <CalendarDays size={14} />
                      Applied: {formatDate(application.appliedAt)}
                    </p>

                    {application.coverLetter && (
                      <div className="ca-candidates-cover-letter">
                        <strong>Cover Letter</strong>
                        <p>{application.coverLetter}</p>
                      </div>
                    )}

                    {application.cvUrl && (
                      <a
                        href={application.cvUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ca-candidates-cv-link"
                      >
                        <FileText size={16} />
                        View CV
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}