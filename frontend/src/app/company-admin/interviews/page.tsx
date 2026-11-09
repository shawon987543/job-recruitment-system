
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  CalendarDays,
  Video,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Pencil,
  X,
  UserRound,
  BriefcaseBusiness,
  ExternalLink,
} from "lucide-react";
import { apiRequest } from "@/lib/api";

type InterviewStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";
type InterviewType = "ONLINE" | "OFFLINE";

interface Application {
  id: number;
  candidateId: number;
  status: string;
  candidate?: {
    id: number;
    name: string;
    email: string;
  } | null;
  job?: {
    id: number;
    title: string;
    location: string;
  } | null;
}

interface Interview {
  id: number;
  applicationId: number;
  companyId: number;
  scheduledAt: string;
  type: InterviewType;
  status: InterviewStatus;
  meetingLink: string | null;
  location: string | null;
  notes: string | null;
  job?: {
    id: number;
    title: string;
    location: string;
  } | null;
  application?: {
    id: number;
    status: string;
    candidateId: number;
  } | null;
}

interface InterviewForm {
  applicationId: string;
  scheduledAt: string;
  type: InterviewType;
  meetingLink: string;
  location: string;
  notes: string;
}

const emptyForm: InterviewForm = {
  applicationId: "",
  scheduledAt: "",
  type: "ONLINE",
  meetingLink: "",
  location: "",
  notes: "",
};

function formatDate(date: string) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(date: string) {
  if (!date) return "—";

  return new Date(date).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toDateTimeLocal(date: string) {
  const value = new Date(date);
  const offset = value.getTimezoneOffset() * 60000;

  return new Date(value.getTime() - offset).toISOString().slice(0, 16);
}

function getStatusClass(status: InterviewStatus) {
  return `ca-interview-status ca-interview-${status.toLowerCase()}`;
}

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingInterview, setEditingInterview] =
    useState<Interview | null>(null);
  const [form, setForm] = useState<InterviewForm>(emptyForm);

  const applicationMap = useMemo(() => {
    return new Map(applications.map((app) => [app.id, app]));
  }, [applications]);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [interviewResponse, applicationResponse] = await Promise.all([
        apiRequest("/interviews/company"),
        apiRequest("/applications/company"),
      ]);

      const interviewData = Array.isArray(interviewResponse)
        ? interviewResponse
        : Array.isArray(interviewResponse?.data)
          ? interviewResponse.data
          : [];

      const applicationData = Array.isArray(applicationResponse)
        ? applicationResponse
        : Array.isArray(applicationResponse?.data)
          ? applicationResponse.data
          : [];

      setInterviews(interviewData);
      setApplications(applicationData);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load interviews. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  const filteredInterviews = useMemo(() => {
    return interviews.filter((interview) => {
      const application = applicationMap.get(interview.applicationId);
      const candidateName = application?.candidate?.name || "";
      const candidateEmail = application?.candidate?.email || "";
      const jobTitle = interview.job?.title || application?.job?.title || "";

      const searchText =
        `${candidateName} ${candidateEmail} ${jobTitle}`.toLowerCase();

      const matchesSearch = searchText.includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" || interview.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [interviews, applicationMap, search, statusFilter]);

  const scheduledCount = interviews.filter(
    (item) => item.status === "SCHEDULED",
  ).length;

  const completedCount = interviews.filter(
    (item) => item.status === "COMPLETED",
  ).length;

  const cancelledCount = interviews.filter(
    (item) => item.status === "CANCELLED",
  ).length;

  const stats = [
    {
      label: "Total Interviews",
      value: interviews.length,
      icon: CalendarDays,
      color: "blue",
    },
    {
      label: "Scheduled",
      value: scheduledCount,
      icon: Clock,
      color: "orange",
    },
    {
      label: "Completed",
      value: completedCount,
      icon: CheckCircle2,
      color: "green",
    },
    {
      label: "Cancelled",
      value: cancelledCount,
      icon: XCircle,
      color: "purple",
    },
  ];

  function openCreateModal() {
    setEditingInterview(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function openEditModal(interview: Interview) {
    setEditingInterview(interview);

    setForm({
      applicationId: String(interview.applicationId),
      scheduledAt: toDateTimeLocal(interview.scheduledAt),
      type: interview.type,
      meetingLink: interview.meetingLink || "",
      location: interview.location || "",
      notes: interview.notes || "",
    });

    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingInterview(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!form.scheduledAt) {
        throw new Error("Please select an interview date and time.");
      }

      if (form.type === "ONLINE" && !form.meetingLink.trim()) {
        throw new Error("Meeting link is required for online interviews.");
      }

      if (form.type === "OFFLINE" && !form.location.trim()) {
        throw new Error("Location is required for offline interviews.");
      }

      const scheduledAt = new Date(form.scheduledAt);

      if (Number.isNaN(scheduledAt.getTime())) {
        throw new Error("Please enter a valid interview date.");
      }

      if (scheduledAt.getTime() <= Date.now() && !editingInterview) {
        throw new Error("Please select a future interview date and time.");
      }

      if (editingInterview) {
        const payload = {
          scheduledAt: scheduledAt.toISOString(),
          type: form.type,
          status: editingInterview.status,
          meetingLink:
            form.type === "ONLINE" ? form.meetingLink.trim() : undefined,
          location:
            form.type === "OFFLINE" ? form.location.trim() : undefined,
          notes: form.notes,
        };

        await apiRequest(`/interviews/${editingInterview.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });

        setSuccess("Interview updated successfully.");
      } else {
        const payload = {
          applicationId: Number(form.applicationId),
          scheduledAt: scheduledAt.toISOString(),
          type: form.type,
          meetingLink:
            form.type === "ONLINE" ? form.meetingLink.trim() : undefined,
          location:
            form.type === "OFFLINE" ? form.location.trim() : undefined,
          notes: form.notes,
        };

        await apiRequest("/interviews", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        setSuccess("Interview scheduled successfully.");
      }

      setModalOpen(false);
      setEditingInterview(null);
      setForm(emptyForm);
      await loadData();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Unable to save interview.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(
    interview: Interview,
    status: InterviewStatus,
  ) {
    const confirmed = window.confirm(
      status === "CANCELLED"
        ? "Are you sure you want to cancel this interview?"
        : "Mark this interview as completed?",
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await apiRequest(`/interviews/${interview.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      setSuccess(
        status === "CANCELLED"
          ? "Interview cancelled successfully."
          : "Interview marked as completed.",
      );

      await loadData();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Unable to update interview.",
      );
    }
  }

  const availableApplications = applications.filter(
    (application) =>
      application.status !== "REJECTED" &&
      application.status !== "WITHDRAWN",
  );

  return (
    <div className="ca-content ca-interviews-content">
      <div className="ca-interviews-heading">
        <div>
          <h1>Interviews</h1>
          <p>
            Schedule and manage interviews for candidates who applied to your
            company&apos;s jobs.
          </p>
        </div>

        <div className="ca-interviews-heading-actions">
          <button
            type="button"
            className="ca-interviews-refresh"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw
              size={17}
              className={loading ? "ca-interviews-spinning" : ""}
            />
            Refresh
          </button>

          <button
            type="button"
            className="ca-interviews-add"
            onClick={openCreateModal}
          >
            <Plus size={18} />
            Schedule Interview
          </button>
        </div>
      </div>

      {error && !modalOpen && (
        <div className="ca-interviews-error">{error}</div>
      )}

      {success && (
        <div className="ca-interviews-success">{success}</div>
      )}

      <div className="ca-interviews-stats">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div className="ca-interviews-stat-card" key={stat.label}>
              <div className={`ca-interviews-stat-icon ${stat.color}`}>
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

      <div className="ca-interviews-directory">
        <div className="ca-interviews-directory-header">
          <div>
            <h2>Interview Schedule</h2>
            <p>
              {filteredInterviews.length} interview
              {filteredInterviews.length !== 1 ? "s" : ""} found
            </p>
          </div>

          <div className="ca-interviews-filters">
            <div className="ca-interviews-search">
              <Search size={17} />
              <input
                type="text"
                placeholder="Search candidate or job..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="ca-interviews-empty">
            <RefreshCw size={28} className="ca-interviews-spinning" />
            <p>Loading interviews...</p>
          </div>
        ) : filteredInterviews.length === 0 ? (
          <div className="ca-interviews-empty">
            <CalendarDays size={38} />
            <h3>No interviews found</h3>
            <p>
              Schedule an interview for an eligible candidate to see it here.
            </p>
          </div>
        ) : (
          <div className="ca-interviews-table-wrapper">
            <table className="ca-interviews-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Job Position</th>
                  <th>Date &amp; Time</th>
                  <th>Interview Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredInterviews.map((interview) => {
                  const application = applicationMap.get(
                    interview.applicationId,
                  );

                  const candidate = application?.candidate;
                  const jobTitle =
                    interview.job?.title ||
                    application?.job?.title ||
                    "Job not available";

                  return (
                    <tr key={interview.id}>
                      <td>
                        <div className="ca-interviews-person">
                          <div className="ca-interviews-avatar">
                            {(candidate?.name || "C")
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              {candidate?.name || `Candidate #${interview.application?.candidateId ?? ""}`}
                            </strong>
                            <span>
                              {candidate?.email || "Email not available"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="ca-interviews-job">
                          <BriefcaseBusiness size={16} />
                          {jobTitle}
                        </div>
                      </td>

                      <td>
                        <div className="ca-interviews-date">
                          <strong>{formatDate(interview.scheduledAt)}</strong>
                          <span>{formatTime(interview.scheduledAt)}</span>
                        </div>
                      </td>

                      <td>
                        <span className="ca-interviews-type">
                          {interview.type === "ONLINE" ? (
                            <Video size={15} />
                          ) : (
                            <MapPin size={15} />
                          )}
                          {interview.type}
                        </span>
                      </td>

                      <td>
                        <span className={getStatusClass(interview.status)}>
                          {interview.status}
                        </span>
                      </td>

                      <td>
                        <div className="ca-interviews-actions">
                          <button
                            type="button"
                            className="ca-interviews-edit"
                            title="Edit interview"
                            onClick={() => openEditModal(interview)}
                          >
                            <Pencil size={16} />
                          </button>

                          {interview.type === "ONLINE" &&
                            interview.meetingLink && (
                              <a
                                href={interview.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ca-interviews-link"
                                title="Open meeting link"
                              >
                                <ExternalLink size={16} />
                              </a>
                            )}

                          {interview.status === "SCHEDULED" && (
                            <>
                              <button
                                type="button"
                                className="ca-interviews-complete"
                                title="Mark completed"
                                onClick={() =>
                                  updateStatus(interview, "COMPLETED")
                                }
                              >
                                <CheckCircle2 size={16} />
                              </button>

                              <button
                                type="button"
                                className="ca-interviews-cancel"
                                title="Cancel interview"
                                onClick={() =>
                                  updateStatus(interview, "CANCELLED")
                                }
                              >
                                <XCircle size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div
          className="ca-interviews-modal-overlay"
          onClick={closeModal}
        >
          <div
            className="ca-interviews-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ca-interviews-modal-header">
              <div>
                <h2>
                  {editingInterview ? "Edit Interview" : "Schedule Interview"}
                </h2>
                <p>
                  {editingInterview
                    ? "Update the interview details."
                    : "Choose a candidate and set the interview details."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close modal"
              >
                <X size={21} />
              </button>
            </div>

            <form
              className="ca-interviews-form"
              onSubmit={handleSubmit}
            >
              {error && (
                <div className="ca-interviews-error">{error}</div>
              )}

              {!editingInterview && (
                <label>
                  <span>
                    <UserRound size={15} />
                    Select Candidate / Application
                  </span>

                  <select
                    required
                    value={form.applicationId}
                    onChange={(e) =>
                      setForm({ ...form, applicationId: e.target.value })
                    }
                  >
                    <option value="">Choose an application</option>

                    {availableApplications.map((application) => (
                      <option
                        key={application.id}
                        value={application.id}
                      >
                        {application.candidate?.name ||
                          `Candidate #${application.candidateId}`}
                        {" — "}
                        {application.job?.title || "Job"}
                        {" (Application #"}
                        {application.id}
                        {")"}
                      </option>
                    ))}
                  </select>

                  {availableApplications.length === 0 && (
                    <small>
                      No eligible applications found. Candidates must have
                      applied before you can schedule an interview.
                    </small>
                  )}
                </label>
              )}

              {editingInterview && (
                <div className="ca-interviews-edit-info">
                  <UserRound size={17} />
                  <span>
                    Application #{editingInterview.applicationId}
                    {" — "}
                    {editingInterview.job?.title ||
                      applicationMap.get(editingInterview.applicationId)?.job
                        ?.title ||
                      "Job"}
                  </span>
                </div>
              )}

              <label>
                <span>
                  <CalendarDays size={15} />
                  Interview Date &amp; Time
                </span>

                <input
                  type="datetime-local"
                  required
                  value={form.scheduledAt}
                  onChange={(e) =>
                    setForm({ ...form, scheduledAt: e.target.value })
                  }
                />
              </label>

              <label>
                <span>
                  <Video size={15} />
                  Interview Type
                </span>

                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      type: e.target.value as InterviewType,
                    })
                  }
                >
                  <option value="ONLINE">Online Interview</option>
                  <option value="OFFLINE">Offline Interview</option>
                </select>
              </label>

              {form.type === "ONLINE" ? (
                <label>
                  <span>
                    <Video size={15} />
                    Meeting Link
                  </span>

                  <input
                    type="url"
                    required
                    placeholder="https://meet.google.com/..."
                    value={form.meetingLink}
                    onChange={(e) =>
                      setForm({ ...form, meetingLink: e.target.value })
                    }
                  />
                </label>
              ) : (
                <label>
                  <span>
                    <MapPin size={15} />
                    Interview Location
                  </span>

                  <input
                    type="text"
                    required
                    placeholder="Enter office address or location"
                    value={form.location}
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                  />
                </label>
              )}

              <label>
                <span>Notes (Optional)</span>

                <textarea
                  rows={4}
                  placeholder="Add interview instructions or notes..."
                  value={form.notes}
                  onChange={(e) =>
                    setForm({ ...form, notes: e.target.value })
                  }
                />
              </label>

              <div className="ca-interviews-form-actions">
                <button
                  type="button"
                  className="ca-interviews-modal-cancel"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="ca-interviews-modal-submit"
                  disabled={
                    saving ||
                    (!editingInterview && availableApplications.length === 0)
                  }
                >
                  {saving ? (
                    <>
                      <RefreshCw
                        size={16}
                        className="ca-interviews-spinning"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CalendarDays size={16} />
                      {editingInterview ? "Save Changes" : "Schedule Interview"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
