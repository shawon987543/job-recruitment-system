"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  X,
  RefreshCw,
  Plus,
  Search,
  MapPin,
  Clock,
  Pencil,
  Send,
  Lock,
  XCircle,
  Calendar,
  Banknote,
} from "lucide-react";
import { apiRequest } from "@/lib/api";

type JobStatus = "DRAFT" | "PUBLISHED" | "CLOSED";

type JobType =
  | "FULL_TIME"
  | "PART_TIME"
  | "CONTRACT"
  | "INTERNSHIP"
  | "REMOTE";

interface Job {
  id: number;
  title: string;
  description: string;
  requirements: string;
  location: string;
  jobType: JobType;
  salaryMin: number | null;
  salaryMax: number | null;
  deadline: string | null;
  status: JobStatus;
  companyId: number;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

interface JobForm {
  title: string;
  description: string;
  requirements: string;
  location: string;
  jobType: JobType;
  salaryMin: string;
  salaryMax: string;
  deadline: string;
}

const emptyForm: JobForm = {
  title: "",
  description: "",
  requirements: "",
  location: "",
  jobType: "FULL_TIME",
  salaryMin: "",
  salaryMax: "",
  deadline: "",
};


function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatSalary(min: number | null, max: number | null) {
  if (min == null && max == null) return "Negotiable";

  const format = (value: number) => `৳${value.toLocaleString("en-BD")}`;

  if (min != null && max != null) {
    return `${format(min)} - ${format(max)}`;
  }

  if (min != null) return `From ${format(min)}`;

  return `Up to ${format(max!)}`;
}

function statusClass(status: JobStatus) {
  return {
    DRAFT: "jm-status-draft",
    PUBLISHED: "jm-status-published",
    CLOSED: "jm-status-closed",
  }[status];
}

export default function JobManagementPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [form, setForm] = useState<JobForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);
  const [formError, setFormError] = useState("");

  const loadJobs = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const data = await apiRequest("/jobs/mine");

      if (!Array.isArray(data)) {
        throw new Error("Unexpected jobs response from server.");
      }

      setJobs(data);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load jobs.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadJobs();
  }, [loadJobs]);

  const statistics = useMemo(
    () => ({
      total: jobs.length,
      published: jobs.filter((job) => job.status === "PUBLISHED").length,
      draft: jobs.filter((job) => job.status === "DRAFT").length,
      closed: jobs.filter((job) => job.status === "CLOSED").length,
    }),
    [jobs],
  );

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch =
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.location.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        filter === "ALL" || job.status === filter;

      return matchesSearch && matchesStatus;
    });
  }, [jobs, search, filter]);


  function openCreateModal() {
    setEditingJob(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(job: Job) {
    setEditingJob(job);

    setForm({
      title: job.title,
      description: job.description,
      requirements: job.requirements,
      location: job.location,
      jobType: job.jobType,
      salaryMin: job.salaryMin?.toString() ?? "",
      salaryMax: job.salaryMax?.toString() ?? "",
      deadline: job.deadline?.slice(0, 10) ?? "",
    });

    setFormError("");
    setModalOpen(true);
  }

  function updateForm<K extends keyof JobForm>(
    field: K,
    value: JobForm[K],
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function saveJob(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const title = form.title.trim();
    const description = form.description.trim();
    const requirements = form.requirements.trim();
    const location = form.location.trim();

    if (!title || !description || !requirements || !location) {
      setFormError("Please complete all required fields.");
      return;
    }

    if (title.length > 200 || location.length > 200) {
      setFormError("Title and location must not exceed 200 characters.");
      return;
    }

    const salaryMin =
      form.salaryMin.trim() === "" ? undefined : Number(form.salaryMin);

    const salaryMax =
      form.salaryMax.trim() === "" ? undefined : Number(form.salaryMax);

    if (
      (salaryMin !== undefined &&
        (!Number.isInteger(salaryMin) || salaryMin < 0)) ||
      (salaryMax !== undefined &&
        (!Number.isInteger(salaryMax) || salaryMax < 0))
    ) {
      setFormError("Salary must be a valid non-negative whole number.");
      return;
    }

    if (
      salaryMin !== undefined &&
      salaryMax !== undefined &&
      salaryMin > salaryMax
    ) {
      setFormError("Minimum salary cannot exceed maximum salary.");
      return;
    }

    const payload = {
      title,
      description,
      requirements,
      location,
      jobType: form.jobType,
      salaryMin,
      salaryMax,
      deadline: form.deadline || null,
    };

    try {
      setSaving(true);

      if (editingJob) {
        await apiRequest(`/jobs/${editingJob.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest("/jobs", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      setModalOpen(false);
      await loadJobs(true);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Unable to save job.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(job: Job, action: "publish" | "close") {
    const message =
      action === "publish"
        ? `Publish "${job.title}"?`
        : `Close "${job.title}"?`;

    if (!window.confirm(message)) return;

    try {
      setActionId(job.id);

      await apiRequest(`/jobs/${job.id}/${action}`, {
        method: "PATCH",
      });

      await loadJobs(true);
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "Unable to update job.",
      );
    } finally {
      setActionId(null);
    }
  }

  return (
    <>
      <div className="ca-content jm-content">
        <div className="jm-page-toolbar">
          <button
            className="ca-refresh-button"
            onClick={() => loadJobs(true)}
            disabled={refreshing}
          >
            <RefreshCw
              size={17}
              className={refreshing ? "ca-spinning" : ""}
            />
            <span>{refreshing ? "Refreshing" : "Refresh"}</span>
          </button>
        </div>

        <section className="jm-welcome">
          <div>
            <span className="jm-eyebrow">COMPANY WORKSPACE</span>
            <h2>Manage your job openings</h2>
            <p>
              Create new opportunities, manage existing vacancies and
              find the right candidates for your company.
            </p>
          </div>

          <button className="jm-create-button" onClick={openCreateModal}>
            <Plus size={19} />
            Create New Job
          </button>
        </section>

          <section className="jm-stats-grid">
            <article className="jm-stat-card">
              <div className="jm-stat-icon jm-blue">
                <BriefcaseBusiness size={22} />
              </div>
              <div>
                <span>Total Jobs</span>
                <h3>{statistics.total}</h3>
                <p>All your job postings</p>
              </div>
            </article>

            <article className="jm-stat-card">
              <div className="jm-stat-icon jm-green">
                <Send size={22} />
              </div>
              <div>
                <span>Published</span>
                <h3>{statistics.published}</h3>
                <p>Visible to candidates</p>
              </div>
            </article>

            <article className="jm-stat-card">
              <div className="jm-stat-icon jm-orange">
                <Clock size={22} />
              </div>
              <div>
                <span>Drafts</span>
                <h3>{statistics.draft}</h3>
                <p>Not yet published</p>
              </div>
            </article>

            <article className="jm-stat-card">
              <div className="jm-stat-icon jm-gray">
                <Lock size={22} />
              </div>
              <div>
                <span>Closed</span>
                <h3>{statistics.closed}</h3>
                <p>Currently inactive</p>
              </div>
            </article>
          </section>

          <section className="jm-list-panel">
            <div className="jm-list-heading">
              <div>
                <h2>Your Job Postings</h2>
                <p>Manage and track your company&apos;s vacancies.</p>
              </div>

              <span className="jm-job-count">
                {filteredJobs.length} jobs
              </span>
            </div>

            <div className="jm-toolbar">
              <div className="jm-search">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search by job title or location..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              <select
                className="jm-filter"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                aria-label="Filter jobs by status"
              >
                <option value="ALL">All statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            {loading ? (
              <div className="jm-state">
                <RefreshCw size={30} className="ca-loading-icon" />
                <h3>Loading your jobs...</h3>
                <p>Please wait while we fetch your job postings.</p>
              </div>
            ) : error ? (
              <div className="jm-state">
                <XCircle size={34} className="jm-error-icon" />
                <h3>Unable to load jobs</h3>
                <p>{error}</p>
                <button
                  className="jm-secondary-button"
                  onClick={() => loadJobs()}
                >
                  <RefreshCw size={16} />
                  Try Again
                </button>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="jm-state">
                <div className="jm-empty-icon">
                  <BriefcaseBusiness size={30} />
                </div>
                <h3>
                  {jobs.length === 0
                    ? "No jobs created yet"
                    : "No matching jobs found"}
                </h3>
                <p>
                  {jobs.length === 0
                    ? "Create your first job posting to start attracting candidates."
                    : "Try changing your search or status filter."}
                </p>
                {jobs.length === 0 && (
                  <button
                    className="jm-create-button"
                    onClick={openCreateModal}
                  >
                    <Plus size={17} />
                    Create Your First Job
                  </button>
                )}
              </div>
            ) : (
              <div className="jm-job-list">
                {filteredJobs.map((job) => (
                  <article className="jm-job-card" key={job.id}>
                    <div className="jm-job-main">
                      <div className="jm-job-icon">
                        <BriefcaseBusiness size={22} />
                      </div>

                      <div className="jm-job-information">
                        <div className="jm-job-title-row">
                          <h3>{job.title}</h3>
                          <span className={`jm-status ${statusClass(job.status)}`}>
                            {job.status}
                          </span>
                        </div>

                        <div className="jm-job-meta">
                          <span>
                            <MapPin size={15} />
                            {job.location}
                          </span>
                          <span>
                            <Clock size={15} />
                            {job.jobType.replace("_", " ")}
                          </span>
                          <span>
                            <Banknote size={15} />
                            {formatSalary(job.salaryMin, job.salaryMax)}
                          </span>
                          {job.deadline && (
                            <span>
                              <Calendar size={15} />
                              Deadline: {formatDate(job.deadline)}
                            </span>
                          )}
                        </div>

                        <p className="jm-job-date">
                          Posted {formatDate(job.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="jm-job-actions">
                      <button
                        className="jm-action-button"
                        onClick={() => openEditModal(job)}
                        title="Edit job"
                      >
                        <Pencil size={16} />
                        Edit
                      </button>

                      {job.status === "DRAFT" && (
                        <button
                          className="jm-action-button jm-publish-action"
                          disabled={actionId === job.id}
                          onClick={() => changeStatus(job, "publish")}
                        >
                          <Send size={16} />
                          Publish
                        </button>
                      )}

                      {job.status === "PUBLISHED" && (
                        <button
                          className="jm-action-button jm-close-action"
                          disabled={actionId === job.id}
                          onClick={() => changeStatus(job, "close")}
                        >
                          <Lock size={16} />
                          Close
                        </button>
                      )}

                      {actionId === job.id && (
                        <RefreshCw
                          size={17}
                          className="ca-spinning"
                        />
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <footer className="ca-footer">
            <span>© {new Date().getFullYear()} CareerHub</span>
            <span>Company Recruitment Workspace</span>
          </footer>
      </div>

      {modalOpen && (
        <div
          className="jm-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setModalOpen(false);
            }
          }}
        >
          <div
            className="jm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="jm-modal-title"
          >
            <div className="jm-modal-heading">
              <div>
                <span className="jm-eyebrow">
                  JOB MANAGEMENT
                </span>
                <h2 id="jm-modal-title">
                  {editingJob ? "Edit Job Posting" : "Create New Job"}
                </h2>
                <p>
                  {editingJob
                    ? "Update the details of your job posting."
                    : "Fill in the information to create a new job."}
                </p>
              </div>

              <button
                className="jm-modal-close"
                onClick={() => setModalOpen(false)}
                disabled={saving}
                aria-label="Close modal"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={saveJob}>
              <div className="jm-form-grid">
                <label className="jm-field jm-full">
                  Job Title *
                  <input
                    required
                    maxLength={200}
                    placeholder="e.g. Frontend Developer"
                    value={form.title}
                    onChange={(event) =>
                      updateForm("title", event.target.value)
                    }
                  />
                </label>

                <label className="jm-field">
                  Location *
                  <input
                    required
                    maxLength={200}
                    placeholder="e.g. Dhaka, Bangladesh"
                    value={form.location}
                    onChange={(event) =>
                      updateForm("location", event.target.value)
                    }
                  />
                </label>

                <label className="jm-field">
                  Job Type *
                  <select
                    value={form.jobType}
                    onChange={(event) =>
                      updateForm("jobType", event.target.value as JobType)
                    }
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="INTERNSHIP">Internship</option>
                    <option value="REMOTE">Remote</option>
                  </select>
                </label>

                <label className="jm-field">
                  Minimum Salary (BDT)
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="e.g. 20000"
                    value={form.salaryMin}
                    onChange={(event) =>
                      updateForm("salaryMin", event.target.value)
                    }
                  />
                </label>

                <label className="jm-field">
                  Maximum Salary (BDT)
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="e.g. 40000"
                    value={form.salaryMax}
                    onChange={(event) =>
                      updateForm("salaryMax", event.target.value)
                    }
                  />
                </label>

                <label className="jm-field jm-full">
                  Application Deadline
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(event) =>
                      updateForm("deadline", event.target.value)
                    }
                  />
                </label>

                <label className="jm-field jm-full">
                  Job Description *
                  <textarea
                    required
                    rows={5}
                    placeholder="Describe the job responsibilities..."
                    value={form.description}
                    onChange={(event) =>
                      updateForm("description", event.target.value)
                    }
                  />
                </label>

                <label className="jm-field jm-full">
                  Requirements *
                  <textarea
                    required
                    rows={5}
                    placeholder="List the skills and qualifications required..."
                    value={form.requirements}
                    onChange={(event) =>
                      updateForm("requirements", event.target.value)
                    }
                  />
                </label>
              </div>

              {formError && (
                <div className="jm-form-error">
                  <XCircle size={17} />
                  {formError}
                </div>
              )}

              <div className="jm-form-footer">
                <button
                  type="button"
                  className="jm-cancel-button"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="jm-create-button"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <RefreshCw size={17} className="ca-spinning" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus size={17} />
                      {editingJob ? "Save Changes" : "Create Job"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </>
  );
}
