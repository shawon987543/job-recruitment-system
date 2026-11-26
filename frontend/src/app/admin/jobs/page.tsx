"use client";
import { startToastLoading, useToastErrorState, useToastSuccessState } from "@/components/ui/toast-message-state";
import { useCallback, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminSidebar from "../../../components/admin/AdminSidebar";
import RichTextEditor from "@/components/ui/rich-text-editor";
import { richTextHasContent, sanitizeRichText } from "@/lib/rich-text";
import Skeleton from "@/components/ui/skeleton";
import AdminNotifications from "@/components/admin/AdminNotifications";
import {
  ArrowRight,
  Bookmark,
  Building2,
  CalendarDays,
  CheckCircle,
  Clock,
  MapPin,
  Menu,
  Pencil,
  Search,
  X,
  XCircle,
  BriefcaseBusiness,
  Wallet,
} from "lucide-react";
import "./jobs-page.css";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

type JobType =
  | "FULL_TIME"
  | "PART_TIME"
  | "CONTRACT"
  | "INTERNSHIP"
  | "REMOTE";

type JobStatus = "DRAFT" | "PUBLISHED" | "CLOSED";

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
  company?: {
    id: number;
    name: string;
    email: string;
    status: string;
    isActive: boolean;
  } | null;
  companyName?: string;
}

type FilterType = "ALL" | JobStatus;
type ModalType = "edit" | null;

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

interface StatusVariables {
  job: Job;
  status: JobStatus;
}

interface EditVariables {
  jobId: number;
  form: JobForm;
}

interface RefreshResponse {
  access_token: string;
  refresh_token: string;
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

const statusOptions: JobStatus[] = [
  "DRAFT",
  "PUBLISHED",
  "CLOSED",
];

export default function JobsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [error, setError] = useToastErrorState();
  const [success, setSuccess] = useToastSuccessState();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [menuOpen, setMenuOpen] = useState(false);

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [modal, setModal] = useState<ModalType>(null);
  const [form, setForm] = useState<JobForm>(emptyForm);

  const clearSession = useCallback(() => {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("user");
    queryClient.clear();
  }, [queryClient]);

  // Refresh access token even when it is missing.
  const refreshAccessToken = useCallback(async (): Promise<string> => {
    const refreshToken = sessionStorage.getItem("refresh_token");

    if (!refreshToken) {
      clearSession();
      router.replace("/login");
      throw new Error("Your session has expired. Please log in again.");
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
      throw new Error("Your session has expired. Please log in again.");
    }

    const refreshed: RefreshResponse = await response.json();

    if (!refreshed.access_token || !refreshed.refresh_token) {
      clearSession();
      router.replace("/login");
      throw new Error("Unable to refresh your session. Please log in again.");
    }

    sessionStorage.setItem("access_token", refreshed.access_token);
    sessionStorage.setItem("refresh_token", refreshed.refresh_token);

    return refreshed.access_token;
  }, [clearSession, router]);

  // API request helper with automatic token refresh.
  const apiRequest = useCallback(
    async (path: string, options: RequestInit = {}) => {
      let token = sessionStorage.getItem("access_token");

      // If the access token is missing, try the refresh token first.
      if (!token) {
        token = await refreshAccessToken();
      }

      const sendRequest = (accessToken: string) =>
        fetch(`${API_URL}${path}`, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            ...options.headers,
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        });

      let response = await sendRequest(token);

      // If access token expired, refresh and retry once.
      if (response.status === 401) {
        token = await refreshAccessToken();
        response = await sendRequest(token);
      }

      if (response.status === 401) {
        clearSession();
        router.replace("/login");
        throw new Error("Your session has expired. Please log in again.");
      }

      if (response.status === 403) {
        throw new Error("You are not authorized to perform this action.");
      }

      return response;
    },
    [clearSession, refreshAccessToken, router],
  );

  // Fetch all jobs for Super Admin.
  const {
    data: jobs = [],
    isLoading,
    isFetching,
    isError,
    error: queryError,
  } = useQuery<Job[]>({
    queryKey: ["admin-jobs"],

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
        throw new Error("Invalid session. Please log in again.");
      }

      if (user.role !== "SUPER_ADMIN") {
        router.replace("/");
        throw new Error("You are not authorized to view jobs.");
      }

      const response = await apiRequest("/jobs/admin/all");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(result.message)
            ? result.message.join(", ")
            : result.message || "Unable to load jobs.",
        );
      }

      if (!Array.isArray(result)) {
        throw new Error("Invalid jobs response from the server.");
      }

      return result as Job[];
    },

    retry: false,
  });

  const showMessage = (message: string) => {
    setSuccess(message);
    setError("");

    window.setTimeout(() => setSuccess(""), 4000);
  };

  const refreshJobs = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["admin-jobs"],
    });
  };

  // Update job status.
  const statusMutation = useMutation({
    onMutate: () => startToastLoading("Updating job status..."),
    mutationFn: async ({
      job,
      status,
    }: StatusVariables) => {
      const response = await apiRequest(
        `/jobs/admin/${job.id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to update job status.",
        );
      }

      return result;
    },

    onSuccess: async () => {
      showMessage("Job status updated successfully.");
      await refreshJobs();
    },

    onError: (err) => {
      setError(
        err instanceof Error
          ? err.message
          : "Status update failed.",
      );
    },
  });

  // Edit any job.
  const editMutation = useMutation({
    onMutate: () => startToastLoading("Saving job..."),
    mutationFn: async ({
      jobId,
      form,
    }: EditVariables) => {
      const payload = {
        title: form.title,
        description: sanitizeRichText(form.description),
        requirements: sanitizeRichText(form.requirements),
        location: form.location,
        jobType: form.jobType,
        salaryMin:
          form.salaryMin === "" ? null : Number(form.salaryMin),
        salaryMax:
          form.salaryMax === "" ? null : Number(form.salaryMax),
        deadline: form.deadline || null,
      };

      const response = await apiRequest(
        `/jobs/admin/${jobId}`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(result.message)
            ? result.message.join(", ")
            : result.message || "Unable to update job.",
        );
      }

      return result;
    },

    onSuccess: async () => {
      setModal(null);
      setSelectedJob(null);
      showMessage("Job updated successfully.");
      await refreshJobs();
    },

    onError: (err) => {
      setError(
        err instanceof Error
          ? err.message
          : "Job update failed.",
      );
    },
  });

  const openModal = useCallback((type: ModalType, job: Job) => {
    setSelectedJob(job);
    setModal(type);
    setError("");
    setSuccess("");

    if (type === "edit") {
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
    }
  }, [setError, setSuccess]);

  const closeModal = () => {
    if (editMutation.isPending) return;

    setModal(null);
    setSelectedJob(null);
  };

  const changeStatus = (job: Job, status: JobStatus) => {
    if (job.status === status) return;

    if (
      !window.confirm(
        `Are you sure you want to change this job to ${status}?`,
      )
    ) {
      return;
    }

    setError("");
    statusMutation.mutate({ job, status });
  };

  const submitEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedJob) return;

    if (
      !richTextHasContent(form.description) ||
      !richTextHasContent(form.requirements)
    ) {
      setError("Description and requirements are required.");
      return;
    }

    if (
      form.salaryMin !== "" &&
      Number(form.salaryMin) < 0
    ) {
      setError("Minimum salary cannot be negative.");
      return;
    }

    if (
      form.salaryMax !== "" &&
      Number(form.salaryMax) < 0
    ) {
      setError("Maximum salary cannot be negative.");
      return;
    }

    if (
      form.salaryMin !== "" &&
      form.salaryMax !== "" &&
      Number(form.salaryMin) > Number(form.salaryMax)
    ) {
      setError(
        "Minimum salary cannot be greater than maximum salary.",
      );
      return;
    }

    setError("");

    editMutation.mutate({
      jobId: selectedJob.id,
      form,
    });
  };

  const filteredJobs = useMemo(() => {
    const searchTerm = search.toLowerCase();

    return jobs.filter((job) => {
      const companyName =
        job.company?.name || job.companyName || "";

      const matchesSearch =
        job.title.toLowerCase().includes(searchTerm) ||
        job.location.toLowerCase().includes(searchTerm) ||
        companyName.toLowerCase().includes(searchTerm) ||
        String(job.companyId).includes(searchTerm);

      const matchesFilter =
        filter === "ALL" || job.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [jobs, search, filter]);

  const counts = {
    total: jobs.length,
    draft: jobs.filter((job) => job.status === "DRAFT").length,
    published: jobs.filter((job) => job.status === "PUBLISHED").length,
    closed: jobs.filter((job) => job.status === "CLOSED").length,
  };
  const statusCounts: Record<JobStatus, number> = {
    DRAFT: counts.draft,
    PUBLISHED: counts.published,
    CLOSED: counts.closed,
  };

  const displayError =
    error ||
    (isError
      ? queryError instanceof Error
        ? queryError.message
        : "Unable to load jobs."
      : "");

  const formatDate = (date: string | null) => {
    if (!date) return "No deadline";

    return new Date(
      `${date.slice(0, 10)}T00:00:00`,
    ).toLocaleDateString();
  };

  const formatSalary = (job: Job) => {
    if (job.salaryMin == null && job.salaryMax == null) {
      return "Not specified";
    }

    const currency = new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      maximumFractionDigits: 0,
    });
    const min = job.salaryMin == null ? null : currency.format(job.salaryMin);
    const max = job.salaryMax == null ? null : currency.format(job.salaryMax);

    return min && max ? `${min} – ${max}` : min || max || "Not specified";
  };
  const companyLabel = (job: Job) =>
    job.company?.name ||
    job.companyName ||
    `Company #${job.companyId}`;

  const overviewJob = filteredJobs[0] ?? null;

  return (
    <div className="admin-layout admin-pages-theme admin-jobs-theme">
      <AdminSidebar
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />

      {/* Main content */}
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
            <h1>Job Management</h1>
            <p>
              Manage and monitor all jobs across registered companies.
            </p>
          </div>
          <AdminNotifications />
        </header>

        <section className="admin-content">
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

          <section className="admin-jobs-hero">
            <span className="admin-jobs-eyebrow">SUPER ADMIN / JOBS</span>
            <h2>Manage every opportunity</h2>
            <p>
              Review job postings, update listing details, and manage
              publication status across companies.
            </p>
            <a href="#admin-jobs-list" className="admin-jobs-hero-link">
              Explore job listings <ArrowRight size={16} />
            </a>
          </section>

          <div className="company-summary-grid admin-jobs-summary">
            <button
              className={`company-summary-card ${
                filter === "ALL" ? "selected" : ""
              }`}
              onClick={() => setFilter("ALL")}
            >
              <span className="company-summary-icon blue">
                <BriefcaseBusiness size={21} />
              </span>
              <span className="company-summary-label">Total Jobs</span>
              <strong>{isLoading || isFetching ? <Skeleton variant="number" width={56} /> : counts.total}</strong>
            </button>

            <button
              className={`company-summary-card ${
                filter === "DRAFT" ? "selected" : ""
              }`}
              onClick={() => setFilter("DRAFT")}
            >
              <span className="company-summary-icon orange">
                <Clock size={21} />
              </span>
              <span className="company-summary-label">Draft</span>
              <strong>{isLoading || isFetching ? <Skeleton variant="number" width={56} /> : counts.draft}</strong>
            </button>

            <button
              className={`company-summary-card ${
                filter === "PUBLISHED" ? "selected" : ""
              }`}
              onClick={() => setFilter("PUBLISHED")}
            >
              <span className="company-summary-icon green">
                <CheckCircle size={21} />
              </span>
              <span className="company-summary-label">Published</span>
              <strong>{isLoading || isFetching ? <Skeleton variant="number" width={56} /> : counts.published}</strong>
            </button>

            <button
              className={`company-summary-card ${
                filter === "CLOSED" ? "selected" : ""
              }`}
              onClick={() => setFilter("CLOSED")}
            >
              <span className="company-summary-icon red">
                <XCircle size={21} />
              </span>
              <span className="company-summary-label">Closed</span>
              <strong>{isLoading || isFetching ? <Skeleton variant="number" width={56} /> : counts.closed}</strong>
            </button>
          </div>

          <div className="admin-jobs-workspace" id="admin-jobs-list">
            <section className="admin-jobs-results" aria-labelledby="admin-jobs-heading">
              <div className="company-toolbar admin-jobs-toolbar">
                <div>
                  <h2 id="admin-jobs-heading">Recent job postings</h2>
                  <p>Search and manage listings from every company.</p>
                </div>

                <label className="company-search">
                  <Search size={18} />
                  <span className="sr-only">Search jobs</span>
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search jobs..."
                  />
                </label>
              </div>

              <div className="company-filter-row admin-jobs-filter-row" aria-label="Filter by status">
                {(["ALL", ...statusOptions] as FilterType[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`company-filter ${filter === item ? "active" : ""}`}
                    onClick={() => setFilter(item)}
                  >
                    {item === "ALL"
                      ? "All Jobs"
                      : item.charAt(0) + item.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>

              {isLoading ? (
                <div className="admin-job-card-list" aria-label="Loading jobs" aria-busy="true">
                  {Array.from({ length: 4 }, (_, index) => (
                    <div className="admin-job-card-skeleton" key={index} />
                  ))}
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="company-empty admin-jobs-empty">
                  <BriefcaseBusiness size={35} />
                  <h3>No jobs found</h3>
                  <p>Try changing your search or status filter.</p>
                </div>
              ) : (
                <div className="admin-job-card-list">
                  {filteredJobs.map((job) => (
                    <article className="admin-job-card" id={`job-${job.id}`} key={job.id}>
                      <span className="admin-job-age">
                        Posted {formatDate(job.createdAt)}
                      </span>
                      <Bookmark
                        className="admin-job-bookmark"
                        size={19}
                        aria-hidden="true"
                      />
                      <div className="admin-job-card-heading">
                        <span className="admin-job-company-mark" aria-hidden="true">
                          {companyLabel(job).trim().charAt(0).toUpperCase() || "C"}
                        </span>
                        <div className="admin-job-title">
                          <h3>{job.title}</h3>
                          <p>{companyLabel(job)}</p>
                        </div>
                        <span className={`company-status ${job.status.toLowerCase()}`}>
                          {job.status}
                        </span>
                      </div>

                      <div className="admin-job-card-meta">
                        <span><BriefcaseBusiness size={16} />{job.jobType.replaceAll("_", " ")}</span>
                        <span><Building2 size={16} />{companyLabel(job)}</span>
                        <span><Wallet size={16} />{formatSalary(job)}</span>
                        <span><MapPin size={16} />{job.location}</span>
                      </div>

                      <div className="admin-job-card-footer">
                        <span className="admin-job-deadline">
                          <CalendarDays size={15} />Deadline: {formatDate(job.deadline)}
                        </span>
                        <div className="admin-job-card-actions">
                          <label className="admin-job-status-select">
                            <span className="sr-only">Change status for {job.title}</span>
                            <select
                              value={job.status}
                              disabled={statusMutation.isPending}
                              onChange={(event) =>
                                changeStatus(job, event.target.value as JobStatus)
                              }
                            >
                              {statusOptions.map((status) => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                          </label>
                          <button
                            type="button"
                            className="admin-job-details-button"
                            onClick={() => router.push(`/admin/jobs/${job.id}`)}
                          >
                            Job details
                          </button>
                          <button
                            type="button"
                            className="admin-job-edit-button"
                            aria-label={`Edit ${job.title}`}
                            onClick={() => openModal("edit", job)}
                          >
                            <Pencil size={15} />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <aside className="admin-jobs-sidebar" aria-label="Job overview and status summary">
              <section className="admin-jobs-overview">
                <div className="admin-jobs-sidebar-heading">
                  <span className="admin-jobs-sidebar-icon"><BriefcaseBusiness size={17} /></span>
                  <h2>Job Overview</h2>
                </div>

                {overviewJob ? (
                  <>
                    <div className="admin-jobs-overview-title">
                      <strong>{overviewJob.title}</strong>
                      <span>{companyLabel(overviewJob)}</span>
                    </div>
                    <dl className="admin-jobs-overview-list">
                      <div><dt><Clock size={16} />Job Type</dt><dd>{overviewJob.jobType.replaceAll("_", " ")}</dd></div>
                      <div><dt><Building2 size={16} />Company</dt><dd>{companyLabel(overviewJob)}</dd></div>
                      <div><dt><Wallet size={16} />Offered Salary</dt><dd>{formatSalary(overviewJob)}</dd></div>
                      <div><dt><CalendarDays size={16} />Deadline</dt><dd>{formatDate(overviewJob.deadline)}</dd></div>
                      <div><dt><MapPin size={16} />Location</dt><dd>{overviewJob.location}</dd></div>
                    </dl>
                    <button
                      type="button"
                      className="admin-jobs-overview-button"
                      onClick={() => router.push(`/admin/jobs/${overviewJob.id}`)}
                    >
                      View full details <ArrowRight size={15} />
                    </button>
                  </>
                ) : (
                  <p className="admin-jobs-sidebar-empty">Job overview will appear when listings are available.</p>
                )}
              </section>

              <section className="admin-jobs-status-panel">
                <span className="admin-jobs-eyebrow">LISTING STATUS</span>
                <h2>Manage job statuses</h2>
                <p>Choose a status below to filter postings. You can also update a listing directly from its card.</p>
                <div className="admin-jobs-status-links">
                  {statusOptions.map((status) => (
                    <button
                      type="button"
                      key={status}
                      className={filter === status ? "active" : ""}
                      onClick={() => setFilter(status)}
                    >
                      <span className={`admin-jobs-status-dot ${status.toLowerCase()}`} />
                      {status.charAt(0) + status.slice(1).toLowerCase()}
                      <strong>{isLoading ? "—" : statusCounts[status]}</strong>
                    </button>
                  ))}
                </div>
              </section>
            </aside>
          </div>

          <footer className="admin-jobs-footer">
            <div className="admin-jobs-footer-main">
              <div className="admin-jobs-footer-about">
                <span className="admin-jobs-footer-brand"><BriefcaseBusiness size={19} />CareerHub Admin</span>
                <p>Managing opportunities and keeping hiring moving forward.</p>
              </div>
              <nav className="admin-jobs-footer-links" aria-label="Admin links">
                <h3>Workspace</h3>
                <Link href="/admin">Dashboard</Link>
                <Link href="/admin/companies">Companies</Link>
                <Link href="/admin/applications">Applications</Link>
              </nav>
              <div className="admin-jobs-footer-links">
                <h3>Job status</h3>
                {(["ALL", ...statusOptions] as FilterType[]).map((status) => (
                  <button
                    type="button"
                    key={status}
                    onClick={() => {
                      setFilter(status);
                      document.getElementById("admin-jobs-list")?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    {status === "ALL" ? "All jobs" : status.charAt(0) + status.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="admin-jobs-footer-bottom">
              <span>© {new Date().getFullYear()} CareerHub. All rights reserved.</span>
              <span>Super Admin workspace</span>
            </div>
          </footer>
        </section>
      </main>

      {/* Job edit modal */}
      {modal && selectedJob && (
        <div
          className="company-modal-backdrop"
          onClick={closeModal}
        >
          <div
            className="company-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-job-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="company-modal-header">
              <div>
                <h2 id="admin-job-modal-title">Edit Job</h2>
                <p>{selectedJob.title}</p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {modal === "edit" && (
              <form onSubmit={submitEdit} className="company-form">
                <label className="full">
                  Job Title
                  <input
                    required
                    maxLength={200}
                    value={form.title}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        title: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Location
                  <input
                    required
                    maxLength={200}
                    value={form.location}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        location: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Job Type
                  <select
                    value={form.jobType}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        jobType: event.target.value as JobType,
                      })
                    }
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="INTERNSHIP">Internship</option>
                    <option value="REMOTE">Remote</option>
                  </select>
                </label>

                <label>
                  Minimum Salary
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.salaryMin}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        salaryMin: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Maximum Salary
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.salaryMax}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        salaryMax: event.target.value,
                      })
                    }
                  />
                </label>

                <label className="full">
                  Application Deadline
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        deadline: event.target.value,
                      })
                    }
                  />
                </label>

                <div className="full rich-text-form-field">
                  <span>Description</span>
                  <RichTextEditor
                    label="Job description"
                    value={form.description}
                    onChange={(value) =>
                      setForm({ ...form, description: value })
                    }
                  />
                </div>

                <div className="full rich-text-form-field">
                  <span>Requirements</span>
                  <RichTextEditor
                    label="Job requirements"
                    value={form.requirements}
                    onChange={(value) =>
                      setForm({ ...form, requirements: value })
                    }
                  />
                </div>

                <div className="company-modal-actions full">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={editMutation.isPending}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={editMutation.isPending}
                  >
                    {editMutation.isPending
                      ? "Saving..."
                      : "Save Changes"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
