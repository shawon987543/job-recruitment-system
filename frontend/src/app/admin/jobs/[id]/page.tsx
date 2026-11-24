"use client";

import { use, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminSidebar from "../../../../components/admin/AdminSidebar";
import RichTextContent from "@/components/ui/rich-text-content";
import Skeleton from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/api";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Clock,
  FileText,
  ListChecks,
  MapPin,
  Menu,
  Pencil,
  UserRound,
  Wallet,
} from "lucide-react";
import "../jobs-page.css";
import "./job-detail-page.css";

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

interface PageProps {
  params: Promise<{ id: string }>;
}

const statusOptions: JobStatus[] = ["DRAFT", "PUBLISHED", "CLOSED"];

export default function AdminJobDetailsPage({ params }: PageProps) {
  const { id } = use(params);
  const jobId = Number(id);
  const validJobId = Number.isSafeInteger(jobId) && jobId > 0;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const {
    data: job,
    isLoading,
    isError,
    error: queryError,
    refetch,
  } = useQuery<Job>({
    queryKey: ["admin-job", jobId],
    enabled: validJobId,
    retry: false,
    queryFn: async () => {
      const userData = sessionStorage.getItem("user");
      if (!userData) {
        router.replace("/login");
        throw new Error("Please log in again.");
      }

      let user: { role?: string };
      try {
        user = JSON.parse(userData);
      } catch {
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("refresh_token");
        sessionStorage.removeItem("user");
        router.replace("/login");
        throw new Error("Invalid session. Please log in again.");
      }

      if (user.role !== "SUPER_ADMIN") {
        router.replace("/");
        throw new Error("You are not authorized to view this job.");
      }

      return apiRequest(`/jobs/admin/${jobId}`) as Promise<Job>;
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (status: JobStatus) =>
      apiRequest(`/jobs/admin/${jobId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }) as Promise<Partial<Job>>,
    onSuccess: async (updatedJob, status) => {
      queryClient.setQueryData<Job>(["admin-job", jobId], (currentJob) =>
        currentJob ? { ...currentJob, ...updatedJob } : currentJob,
      );
      await queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
      setError("");
      setSuccess(`Job status changed to ${status.toLowerCase()}.`);
    },
    onError: (mutationError) => {
      setSuccess("");
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Unable to update job status.",
      );
    },
  });

  const formatDate = (date: string | null) => {
    if (!date) return "No deadline";

    return new Date(`${date.slice(0, 10)}T00:00:00`).toLocaleDateString();
  };

  const formatSalary = (currentJob: Job) => {
    if (currentJob.salaryMin == null && currentJob.salaryMax == null) {
      return "Not specified";
    }

    const min = currentJob.salaryMin?.toLocaleString() ?? "—";
    const max = currentJob.salaryMax?.toLocaleString() ?? "—";

    return `৳${min} - ৳${max}`;
  };

  const companyLabel = (currentJob: Job) =>
    currentJob.company?.name ||
    currentJob.companyName ||
    `Company #${currentJob.companyId}`;

  const loadError = !validJobId
    ? "This job link is invalid."
    : isError
      ? queryError instanceof Error
        ? queryError.message
        : "Unable to load this job."
      : "";

  const changeStatus = (status: JobStatus) => {
    if (!job || job.status === status || statusMutation.isPending) return;

    if (!window.confirm(`Are you sure you want to change this job to ${status}?`)) {
      return;
    }

    setError("");
    setSuccess("");
    statusMutation.mutate(status);
  };

  return (
    <div className="admin-layout admin-pages-theme admin-jobs-theme admin-job-page">
      <AdminSidebar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

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
            <h1>Job details</h1>
            <p>Review and manage this job listing.</p>
          </div>
          <Link className="admin-job-page-back-top" href="/admin/jobs">
            <ArrowLeft size={16} />
            All jobs
          </Link>
        </header>

        <section className="admin-job-page-content">
          {success && <div className="admin-job-page-notice success" role="status">{success}</div>}
          {error && !loadError && (
            <div className="admin-job-page-error" role="alert">
              <p>{error}</p>
            </div>
          )}
          {loadError && (
            <div className="admin-job-page-error" role="alert">
              <p>{loadError}</p>
              {validJobId && isError ? (
                <button type="button" onClick={() => void refetch()}>Try again</button>
              ) : null}
              <Link href="/admin/jobs">Back to job listings</Link>
            </div>
          )}

          {isLoading && validJobId && (
            <div className="admin-job-page-loading" aria-label="Loading job details">
              <Skeleton variant="rectangle" height={225} rounded />
              <div>
                <Skeleton variant="rectangle" height={205} rounded />
                <Skeleton variant="rectangle" height={205} rounded />
              </div>
            </div>
          )}

          {job && !loadError && (
            <>
              <header className="admin-job-detail-hero admin-job-page-hero">
                <div className="admin-job-detail-hero-top">
                  <span>JOB DETAILS <span aria-hidden="true">/</span> #{job.id}</span>
                  <Link href="/admin/jobs" className="admin-job-page-hero-back">
                    <ArrowLeft size={15} />Back to jobs
                  </Link>
                </div>

                <div className="admin-job-detail-title">
                  <span className="admin-job-detail-company-icon">
                    <Building2 size={28} />
                  </span>
                  <div>
                    <span className={`company-status ${job.status.toLowerCase()}`}>
                      {job.status}
                    </span>
                    <h2>{job.title}</h2>
                    <p>{companyLabel(job)}</p>
                  </div>
                </div>

                <div className="admin-job-detail-hero-meta">
                  <span><MapPin size={16} />{job.location || "Location not specified"}</span>
                  <span><BriefcaseBusiness size={16} />{job.jobType.replaceAll("_", " ")}</span>
                  <span><CalendarDays size={16} />Posted {formatDate(job.createdAt)}</span>
                </div>
              </header>

              <div className="admin-job-detail-layout admin-job-page-layout">
                <div className="admin-job-detail-main">
                  <section className="admin-job-detail-card">
                    <div className="admin-job-detail-section-heading">
                      <span><FileText size={19} /></span>
                      <h3>Job Description</h3>
                    </div>
                    {job.description?.trim() ? (
                      <RichTextContent
                        html={job.description}
                        className="admin-job-rich-text admin-job-detail-rich-text"
                      />
                    ) : (
                      <p className="admin-job-detail-empty">No job description provided.</p>
                    )}
                  </section>

                  <section className="admin-job-detail-card">
                    <div className="admin-job-detail-section-heading">
                      <span><ListChecks size={19} /></span>
                      <h3>Job Requirements</h3>
                    </div>
                    {job.requirements?.trim() ? (
                      <RichTextContent
                        html={job.requirements}
                        className="admin-job-rich-text admin-job-detail-rich-text"
                      />
                    ) : (
                      <p className="admin-job-detail-empty">No specific requirements provided.</p>
                    )}
                  </section>
                </div>

                <aside className="admin-job-detail-sidebar">
                  <section className="admin-job-detail-overview">
                    <h3>Job Overview</h3>
                    <div className="admin-job-overview-item">
                      <span><Wallet size={18} /></span>
                      <div><small>Offered Salary</small><strong>{formatSalary(job)}</strong></div>
                    </div>
                    <div className="admin-job-overview-item">
                      <span><MapPin size={18} /></span>
                      <div><small>Location</small><strong>{job.location || "Not specified"}</strong></div>
                    </div>
                    <div className="admin-job-overview-item">
                      <span><BriefcaseBusiness size={18} /></span>
                      <div><small>Job Type</small><strong>{job.jobType.replaceAll("_", " ")}</strong></div>
                    </div>
                    <div className="admin-job-overview-item">
                      <span><Building2 size={18} /></span>
                      <div><small>Company</small><strong>{companyLabel(job)}</strong></div>
                    </div>
                    <div className="admin-job-overview-item">
                      <span><CalendarDays size={18} /></span>
                      <div><small>Application Deadline</small><strong>{formatDate(job.deadline)}</strong></div>
                    </div>
                  </section>

                  <section className="admin-job-detail-actions">
                    <h3>Manage listing</h3>
                    <p>Update this posting or change its publication status.</p>
                    <label>
                      Job status
                      <select
                        value={job.status}
                        disabled={statusMutation.isPending}
                        onChange={(event) => changeStatus(event.target.value as JobStatus)}
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </label>
                    <Link
                      className="admin-job-detail-edit-button admin-job-page-edit-link"
                      href={`/admin/jobs#job-${job.id}`}
                    >
                      <Pencil size={16} />Edit in job list
                    </Link>
                  </section>

                  <section className="admin-job-detail-meta">
                    <div><UserRound size={15} /><span>Created by</span><strong>User #{job.createdBy}</strong></div>
                    <div><Clock size={15} /><span>Created</span><strong>{formatDate(job.createdAt)}</strong></div>
                    <div><Clock size={15} /><span>Last updated</span><strong>{formatDate(job.updatedAt)}</strong></div>
                  </section>
                </aside>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
