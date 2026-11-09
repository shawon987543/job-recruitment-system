"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  MapPin,
  Wallet,
  Clock,
  FileText,
  ListChecks,
  RefreshCw,
  AlertCircle,
  Send,
  CheckCircle2,
  ClipboardList,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import "./job-details.css";

type Job = {
  id: number;
  title: string;
  description: string;
  requirements: string;
  location: string;
  jobType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  deadline: string | null;
  status: string;
  companyId: number;
  companyName?: string;
  createdAt: string;
  updatedAt?: string;
};

type Application = {
  id: number;
  jobId: number;
  status: string;
};

function formatJobType(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatSalary(job: Job) {
  if (job.salaryMin == null && job.salaryMax == null) {
    return "Negotiable";
  }

  const format = (amount: number) =>
    `৳${amount.toLocaleString("en-BD")}`;

  if (job.salaryMin != null && job.salaryMax != null) {
    return `${format(job.salaryMin)} - ${format(job.salaryMax)}`;
  }

  if (job.salaryMin != null) {
    return `From ${format(job.salaryMin)}`;
  }

  return `Up to ${format(job.salaryMax!)}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not specified";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not specified";
  }

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function JobDetailsPage() {
  const params = useParams<{ id: string }>();
  const jobId = params.id;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [coverLetter, setCoverLetter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [applicationError, setApplicationError] = useState("");
  const [application, setApplication] = useState<Application | null>(null);
  const [checkingApplication, setCheckingApplication] = useState(true);

  const fetchJob = useCallback(async () => {
    if (!jobId || !/^\d+$/.test(jobId)) {
      setError("Invalid job ID.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiRequest(`/jobs/${jobId}`);
      setJob(response as Job);
    } catch (err) {
      setJob(null);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load job details. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  const checkExistingApplication = useCallback(async () => {
    if (!jobId || !/^\d+$/.test(jobId)) {
      setCheckingApplication(false);
      return;
    }

    setCheckingApplication(true);

    try {
      const response = await apiRequest("/applications/mine");

      const applications: Application[] = Array.isArray(response)
        ? response
        : [];

      const existingApplication = applications.find(
        (item) => item.jobId === Number(jobId)
      );

      setApplication(existingApplication || null);
    } catch {
      setApplication(null);
    } finally {
      setCheckingApplication(false);
    }
  }, [jobId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchJob();
  }, [fetchJob]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void checkExistingApplication();
  }, [checkExistingApplication]);

  const handleApply = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!jobId || !job) return;

    setSubmitting(true);
    setApplicationError("");
    setApplicationMessage("");

    try {
      const response = await apiRequest(`/applications/jobs/${jobId}`, {
        method: "POST",
        body: JSON.stringify({
          coverLetter: coverLetter.trim() || undefined,
        }),
      });

      setApplication({
        id: response.id,
        jobId: Number(jobId),
        status: response.status || "PENDING",
      });

      setCoverLetter("");
      setApplicationMessage(
        "Your application has been submitted successfully!"
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to submit your application.";

      setApplicationError(message);

      if (message.toLowerCase().includes("already applied")) {
        void checkExistingApplication();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="job-details-page">
      <header className="job-details-header">
        <Link href="/candidate/jobs" className="job-details-back">
          <ArrowLeft size={18} />
          Back to Jobs
        </Link>

        <Link href="/candidate" className="job-details-brand">
          <BriefcaseBusiness size={19} />
          CareerHub
        </Link>
      </header>

      {loading ? (
        <div className="job-details-state">
          <RefreshCw className="job-details-spinner" size={34} />
          <h2>Loading job details...</h2>
          <p>Please wait while we retrieve the job information.</p>
        </div>
      ) : error || !job ? (
        <div className="job-details-state job-details-error">
          <AlertCircle size={42} />
          <h2>Unable to load this job</h2>
          <p>{error || "The requested job could not be found."}</p>

          <div className="job-details-state-actions">
            <button type="button" onClick={() => void fetchJob()}>
              Try Again
            </button>

            <Link href="/candidate/jobs">Browse Jobs</Link>
          </div>
        </div>
      ) : (
        <>
          <section className="job-details-hero">
            <div className="job-details-hero-top">
              <span className="job-details-eyebrow">
                JOB OPPORTUNITY
              </span>

              <span className="job-details-status">
                {formatJobType(job.jobType)}
              </span>
            </div>

            <div className="job-details-title-row">
              <div className="job-details-company-icon">
                <Building2 size={34} />
              </div>

              <div>
                <h1>{job.title}</h1>
                <p className="job-details-company-name">
                  {job.companyName || "Company"}
                </p>
              </div>
            </div>

            <div className="job-details-hero-meta">
              <span>
                <MapPin size={17} />
                {job.location || "Location not specified"}
              </span>

              <span>
                <BriefcaseBusiness size={17} />
                {formatJobType(job.jobType)}
              </span>

              <span>
                <CalendarDays size={17} />
                Posted {formatDate(job.createdAt)}
              </span>
            </div>
          </section>

          <div className="job-details-layout">
            <div className="job-details-main">
              <section className="job-details-card">
                <div className="job-details-section-heading">
                  <div className="job-details-section-icon">
                    <FileText size={21} />
                  </div>
                  <h2>Job Description</h2>
                </div>

                <div className="job-details-content">
                  {job.description?.trim() ? (
                    <p className="job-details-text">
                      {job.description}
                    </p>
                  ) : (
                    <p className="job-details-muted">
                      No job description provided.
                    </p>
                  )}
                </div>
              </section>

              <section className="job-details-card">
                <div className="job-details-section-heading">
                  <div className="job-details-section-icon">
                    <ListChecks size={21} />
                  </div>
                  <h2>Job Requirements</h2>
                </div>

                <div className="job-details-content">
                  {job.requirements?.trim() ? (
                    <p className="job-details-text">
                      {job.requirements}
                    </p>
                  ) : (
                    <p className="job-details-muted">
                      No specific requirements provided.
                    </p>
                  )}
                </div>
              </section>
            </div>

            <aside className="job-details-sidebar">
              <section className="job-details-card job-overview-card">
                <h2>Job Overview</h2>

                <div className="job-overview-item">
                  <div className="job-overview-icon">
                    <Wallet size={19} />
                  </div>
                  <div>
                    <span>Salary</span>
                    <strong>{formatSalary(job)}</strong>
                  </div>
                </div>

                <div className="job-overview-item">
                  <div className="job-overview-icon">
                    <MapPin size={19} />
                  </div>
                  <div>
                    <span>Location</span>
                    <strong>{job.location || "Not specified"}</strong>
                  </div>
                </div>

                <div className="job-overview-item">
                  <div className="job-overview-icon">
                    <BriefcaseBusiness size={19} />
                  </div>
                  <div>
                    <span>Job Type</span>
                    <strong>{formatJobType(job.jobType)}</strong>
                  </div>
                </div>

                <div className="job-overview-item">
                  <div className="job-overview-icon">
                    <CalendarDays size={19} />
                  </div>
                  <div>
                    <span>Application Deadline</span>
                    <strong>{formatDate(job.deadline)}</strong>
                  </div>
                </div>

                <div className="job-overview-item">
                  <div className="job-overview-icon">
                    <Clock size={19} />
                  </div>
                  <div>
                    <span>Posted Date</span>
                    <strong>{formatDate(job.createdAt)}</strong>
                  </div>
                </div>

                <Link
                  href="/candidate/jobs"
                  className="job-details-browse-button"
                >
                  <ArrowLeft size={17} />
                  Back to All Jobs
                </Link>
              </section>

              <section className="job-details-card apply-job-card">
                <div className="apply-job-heading">
                  <div className="job-details-section-icon">
                    <Send size={20} />
                  </div>
                  <div>
                    <h2>Apply for This Job</h2>
                    <p>Take the next step in your career.</p>
                  </div>
                </div>

                {checkingApplication ? (
                  <div className="apply-job-loading">
                    <RefreshCw size={19} className="job-details-spinner" />
                    Checking your application...
                  </div>
                ) : application ? (
                  <div className="already-applied">
                    <CheckCircle2 size={27} />
                    <h3>Application Submitted</h3>
                    <p>
                      You have already applied for this job.
                    </p>
                    <span>
                      Status: {application.status.replaceAll("_", " ")}
                    </span>

                    <Link href="/candidate/applications">
                      <ClipboardList size={17} />
                      View My Applications
                    </Link>
                  </div>
                ) : (
                  <form className="apply-job-form" onSubmit={handleApply}>
                    <label htmlFor="coverLetter">
                      Cover Letter
                      <span> (Optional)</span>
                    </label>

                    <textarea
                      id="coverLetter"
                      value={coverLetter}
                      onChange={(event) =>
                        setCoverLetter(event.target.value)
                      }
                      placeholder="Introduce yourself and explain why you are suitable for this position..."
                      maxLength={10000}
                      rows={7}
                    />

                    <div className="cover-letter-count">
                      {coverLetter.length}/10000 characters
                    </div>

                    {applicationError && (
                      <div className="apply-message apply-error">
                        <AlertCircle size={17} />
                        {applicationError}
                      </div>
                    )}

                    {applicationMessage && (
                      <div className="apply-message apply-success">
                        <CheckCircle2 size={17} />
                        {applicationMessage}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="apply-now-button"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <RefreshCw
                            size={18}
                            className="job-details-spinner"
                          />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send size={18} />
                          Apply Now
                        </>
                      )}
                    </button>

                    <p className="apply-job-note">
                      Please review the job requirements before submitting.
                    </p>
                  </form>
                )}
              </section>
            </aside>
          </div>
        </>
      )}

      <footer className="job-details-footer">
        <p>© {new Date().getFullYear()} CareerHub. Build your future.</p>
      </footer>
    </main>
  );
}
