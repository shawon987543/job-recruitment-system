"use client";
import { useCallback, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import AdminSidebar from "../../../components/admin/AdminSidebar";
import {
  Search,
  RefreshCw,
  Eye,
  Pencil,
  X,
  Menu,
  CheckCircle,
  Clock,
  XCircle,
  BriefcaseBusiness,
} from "lucide-react";

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
type ModalType = "view" | "edit" | null;

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

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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
    refetch,
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
    mutationFn: async ({
      jobId,
      form,
    }: EditVariables) => {
      const payload = {
        title: form.title,
        description: form.description,
        requirements: form.requirements,
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

  const openModal = (type: ModalType, job: Job) => {
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
  };

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

    const min = job.salaryMin?.toLocaleString() ?? "—";
    const max = job.salaryMax?.toLocaleString() ?? "—";

    return `৳${min} - ৳${max}`;
  };

  const companyLabel = (job: Job) =>
    job.company?.name ||
    job.companyName ||
    `Company #${job.companyId}`;

  return (
    <div className="admin-layout">
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

          {/* Welcome section */}
          <div className="company-welcome">
            <div>
              <span>SUPER ADMIN / JOBS</span>
              <h2>Manage all job postings</h2>
              <p>
                Review job postings, update job information,
                and manage publication status across companies.
              </p>
            </div>

            <div className="company-welcome-icon">
              <BriefcaseBusiness size={55} />
            </div>
          </div>

          {/* Summary cards */}
          <div className="company-summary-grid">
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
              <strong>{counts.total}</strong>
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
              <strong>{counts.draft}</strong>
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
              <strong>{counts.published}</strong>
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
              <strong>{counts.closed}</strong>
            </button>
          </div>

          {/* Toolbar */}
          <div className="company-toolbar">
            <div>
              <h2>All Jobs</h2>
              <p>Search, review, and manage job postings.</p>
            </div>

            <div className="company-search">
              <Search size={18} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search jobs..."
              />
            </div>
          </div>

          {/* Filters */}
          <div className="company-filter-row">
            {(["ALL", ...statusOptions] as FilterType[]).map(
              (item) => (
                <button
                  key={item}
                  className={`company-filter ${
                    filter === item ? "active" : ""
                  }`}
                  onClick={() => setFilter(item)}
                >
                  {item === "ALL"
                    ? "All Jobs"
                    : item.charAt(0) +
                      item.slice(1).toLowerCase()}
                </button>
              ),
            )}
          </div>

          {/* Jobs table */}
          <div className="company-table-card">
            {isLoading ? (
              <div className="admin-loading">Loading jobs...</div>
            ) : filteredJobs.length === 0 ? (
              <div className="company-empty">
                <BriefcaseBusiness size={35} />
                <h3>No jobs found</h3>
                <p>Try changing your search or status filter.</p>
              </div>
            ) : (
              <div className="company-table-scroll">
                <table className="company-table">
                  <thead>
                    <tr>
                      <th>Job</th>
                      <th>Company</th>
                      <th>Job Type</th>
                      <th>Salary</th>
                      <th>Deadline</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredJobs.map((job) => (
                      <tr key={job.id}>
                        <td>
                          <div className="company-name-cell">
                            <div className="company-table-avatar">
                              {job.title.charAt(0).toUpperCase()}
                            </div>

                            <div>
                              <strong>{job.title}</strong>
                              <span>{job.location}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="company-contact-cell">
                            <strong>{companyLabel(job)}</strong>
                            <span>Company ID: {job.companyId}</span>
                          </div>
                        </td>

                        <td>{job.jobType.replace("_", " ")}</td>
                        <td>{formatSalary(job)}</td>
                        <td>{formatDate(job.deadline)}</td>

                        <td>
                          <span
                            className={`company-status ${job.status.toLowerCase()}`}
                          >
                            {job.status}
                          </span>
                        </td>

                        <td>
                          <div className="company-actions">
                            <button
                              title="View job"
                              onClick={() => openModal("view", job)}
                            >
                              <Eye size={16} />
                            </button>

                            <button
                              title="Edit job"
                              onClick={() => openModal("edit", job)}
                            >
                              <Pencil size={16} />
                            </button>

                            <select
                              aria-label={`Change status for ${job.title}`}
                              value={job.status}
                              disabled={statusMutation.isPending}
                              onChange={(event) =>
                                changeStatus(
                                  job,
                                  event.target.value as JobStatus,
                                )
                              }
                            >
                              {statusOptions.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Job modal */}
      {modal && selectedJob && (
        <div
          className="company-modal-backdrop"
          onClick={closeModal}
        >
          <div
            className="company-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="company-modal-header">
              <div>
                <h2>
                  {modal === "view" ? "Job Details" : "Edit Job"}
                </h2>
                <p>{selectedJob.title}</p>
              </div>

              <button
                onClick={closeModal}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {modal === "view" && (
              <div className="company-details">
                <div>
                  <span>Job Title</span>
                  <strong>{selectedJob.title}</strong>
                </div>

                <div>
                  <span>Company</span>
                  <strong>{companyLabel(selectedJob)}</strong>
                </div>

                <div>
                  <span>Location</span>
                  <strong>{selectedJob.location}</strong>
                </div>

                <div>
                  <span>Job Type</span>
                  <strong>
                    {selectedJob.jobType.replace("_", " ")}
                  </strong>
                </div>

                <div>
                  <span>Salary</span>
                  <strong>{formatSalary(selectedJob)}</strong>
                </div>

                <div>
                  <span>Deadline</span>
                  <strong>{formatDate(selectedJob.deadline)}</strong>
                </div>

                <div>
                  <span>Status</span>
                  <strong>{selectedJob.status}</strong>
                </div>

                <div>
                  <span>Created By</span>
                  <strong>User #{selectedJob.createdBy}</strong>
                </div>

                <div className="full">
                  <span>Description</span>
                  <p>{selectedJob.description}</p>
                </div>

                <div className="full">
                  <span>Requirements</span>
                  <p>{selectedJob.requirements}</p>
                </div>

                <div>
                  <span>Created At</span>
                  <strong>
                    {new Date(
                      selectedJob.createdAt,
                    ).toLocaleDateString()}
                  </strong>
                </div>

                <div>
                  <span>Last Updated</span>
                  <strong>
                    {new Date(
                      selectedJob.updatedAt,
                    ).toLocaleDateString()}
                  </strong>
                </div>
              </div>
            )}

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

                <label className="full">
                  Description
                  <textarea
                    required
                    rows={5}
                    value={form.description}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        description: event.target.value,
                      })
                    }
                  />
                </label>

                <label className="full">
                  Requirements
                  <textarea
                    required
                    rows={5}
                    value={form.requirements}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        requirements: event.target.value,
                      })
                    }
                  />
                </label>

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
