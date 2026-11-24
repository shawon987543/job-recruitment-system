"use client";
import { useToastErrorState } from "@/components/ui/toast-message-state";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
  Building2,
  Wallet,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import Skeleton from "@/components/ui/skeleton";
import "./jobs.css";

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
};

type JobFilters = {
  title?: string;
  location?: string;
  jobType?: string;
};

const jobTypes = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERNSHIP",
  "REMOTE",
];

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

function formatDate(date: string | null) {
  if (!date) return "Not specified";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Not specified";
  }

  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatPostedTime(date: string) {
  const postedAt = new Date(date).getTime();
  if (Number.isNaN(postedAt)) return "Recently posted";

  const minutes = Math.max(0, Math.floor((Date.now() - postedAt) / 60_000));
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;

  return formatDate(date);
}

function JobResultsSkeleton() {
  return (
    <div className="browse-job-list" aria-label="Loading jobs" aria-busy="true">
      {[0, 1, 2, 3].map((item) => (
        <article className="browse-job-card" key={item}>
          <div className="browse-job-main" style={{ flex: 1 }}>
            <Skeleton variant="rectangle" width={52} height={52} />
            <div className="browse-job-information" style={{ flex: 1, display: "grid", gap: 10 }}>
              <Skeleton variant="rectangle" width={95} height={20} />
              <Skeleton variant="text" width="60%" height={19} />
              <Skeleton variant="text" width="38%" height={13} />
              <Skeleton variant="text" width="75%" height={13} />
            </div>
          </div>
          <div className="browse-job-side" style={{ display: "grid", gap: 10 }}>
            <Skeleton variant="text" width={105} height={11} />
            <Skeleton variant="text" width={135} height={17} />
            <Skeleton variant="rectangle" width={118} height={38} />
          </div>
        </article>
      ))}
    </div>
  );
}

export default function BrowseJobsPage() {
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useToastErrorState();

  const fetchJobs = useCallback(
    async (filters: JobFilters = {}) => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();

        if (filters.title?.trim()) {
          params.set("title", filters.title.trim());
        }

        if (filters.location?.trim()) {
          params.set("location", filters.location.trim());
        }

        if (filters.jobType) {
          params.set("jobType", filters.jobType);
        }

        const query = params.toString();
        const endpoint = query ? `/jobs?${query}` : "/jobs";

        const response = await apiRequest(endpoint);

        if (!Array.isArray(response)) {
          throw new Error("Unexpected response from the server.");
        }

        setJobs(response as Job[]);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load jobs. Please try again."
        );
      } finally {
        setLoading(false);
      }
    },
    [setError]
  );

  // Load jobs and read any initial title from the URL.
  useEffect(() => {
    const initialTitle =
      new URLSearchParams(window.location.search).get("title") || "";

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTitle(initialTitle);
    void fetchJobs({ title: initialTitle });
  }, [fetchJobs]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    void fetchJobs({
      title,
      location,
      jobType,
    });
  }

  function clearFilters() {
    setTitle("");
    setLocation("");
    setJobType("");

    router.replace("/candidate/jobs");
    void fetchJobs({});
  }

  return (
    <main className="browse-page">
      <header className="browse-header">
        <Link href="/candidate" className="browse-brand">
          <span className="browse-brand-icon"><BriefcaseBusiness size={19} /></span>
          <span>CareerHub</span>
        </Link>

        <nav className="browse-navigation" aria-label="Candidate navigation">
          <Link href="/candidate">Dashboard</Link>
          <Link href="/candidate/jobs" aria-current="page">Browse Jobs</Link>
          <Link href="/candidate/applications">My Applications</Link>
        </nav>

        <div className="browse-header-right">
          <Link href="/candidate/profile" className="browse-profile-link">My Profile</Link>
        </div>
      </header>

      <section className="browse-hero">
        <div className="browse-hero-content">
          <span className="browse-eyebrow">CAREERHUB / OPPORTUNITIES</span>
          <h1>Find your next opportunity</h1>
          <p>Discover roles from approved companies and take the next step in your career.</p>
        </div>
        <div className="browse-hero-icon">
          <BriefcaseBusiness size={76} strokeWidth={1.2} />
        </div>
      </section>

      <div className="browse-content-grid">
        <aside className="browse-search-section">
          <form className="browse-filter-form" onSubmit={handleSearch}>
            <div className="browse-filter-title">
              <span><SlidersHorizontal size={17} /></span>
              <h2>Refine your search</h2>
            </div>

            <div className="browse-filter-grid">
              <div className="browse-input-group">
                <label htmlFor="job-title">Job title or keyword</label>
                <div className="browse-input-wrapper">
                  <Search size={18} />
                  <input
                    id="job-title"
                    type="text"
                    placeholder="e.g. Frontend Developer"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                </div>
              </div>

              <div className="browse-input-group">
                <label htmlFor="job-location">Location</label>
                <div className="browse-input-wrapper">
                  <MapPin size={18} />
                  <input
                    id="job-location"
                    type="text"
                    placeholder="e.g. Dhaka"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                  />
                </div>
              </div>

              <div className="browse-input-group">
                <label htmlFor="job-type">Job type</label>
                <select
                  id="job-type"
                  value={jobType}
                  onChange={(event) => setJobType(event.target.value)}
                >
                  <option value="">All job types</option>
                  {jobTypes.map((type) => (
                    <option key={type} value={type}>
                      {formatJobType(type)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="browse-filter-actions">
                <button
                  type="submit"
                  className="browse-search-button"
                  disabled={loading}
                >
                  <Search size={17} />
                  Search jobs
                </button>
                <button
                  type="button"
                  className="browse-clear-button"
                  onClick={clearFilters}
                >
                  <X size={16} />
                  Clear filters
                </button>
              </div>
            </div>
          </form>

          <section className="browse-aside-card">
            <span className="browse-aside-icon"><BriefcaseBusiness size={19} /></span>
            <h2>Make your next move</h2>
            <p>A complete profile helps employers learn more about your experience and skills.</p>
            <Link href="/candidate/profile">Update your profile <ArrowLeft size={15} /></Link>
          </section>
        </aside>

        <section className="browse-results-section">
        <div className="browse-results-heading">
          <div>
            <span className="browse-section-label">OPPORTUNITIES</span>
            <h2>Available jobs</h2>
            <p>Explore current openings from companies on CareerHub.</p>
          </div>

          {!loading && !error && (
            <span className="browse-result-count">
              {jobs.length} {jobs.length === 1 ? "job" : "jobs"} found
            </span>
          )}
        </div>

        {loading ? (
          <JobResultsSkeleton />
        ) : error ? (
          <div className="browse-state browse-error">
            <BriefcaseBusiness size={36} />
            <h3>Unable to load jobs</h3>
            <p>{error}</p>

            <button
              type="button"
              onClick={() =>
                void fetchJobs({ title, location, jobType })
              }
            >
              Try Again
            </button>
          </div>
        ) : jobs.length === 0 ? (
          <div className="browse-state">
            <Search size={38} />
            <h3>No jobs found</h3>

            <p>
              We couldn&apos;t find any jobs matching your search.
              Try changing your filters.
            </p>

            <button type="button" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="browse-job-list">
            {jobs.map((job) => (
              <article className="browse-job-card" key={job.id}>
                <div className="browse-job-posted"><Clock3 size={13} />{formatPostedTime(job.createdAt)}</div>
                <div className="browse-job-main">
                  <div className="browse-company-icon">
                    <Building2 size={25} />
                  </div>

                  <div className="browse-job-information">
                    <h3>{job.title}</h3>
                    <p className="browse-company-name">
                      {job.companyName || "Company"}
                    </p>

                    <div className="browse-job-meta">
                      <span><BriefcaseBusiness size={16} />{formatJobType(job.jobType)}</span>
                      <span><Wallet size={16} />{formatSalary(job)}</span>
                      <span><MapPin size={16} />{job.location || "Location not specified"}</span>
                      {job.deadline && (
                        <span className="browse-job-deadline"><CalendarDays size={15} />Apply by {formatDate(job.deadline)}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="browse-job-side">
                  <Link
                    href={`/candidate/jobs/${job.id}`}
                    className="browse-details-button"
                  >
                    View details
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
        </section>
      </div>

      <footer className="browse-footer">
        <div className="browse-footer-main">
          <div className="browse-footer-brand">
            <Link href="/candidate" className="browse-brand">
              <span className="browse-brand-icon"><BriefcaseBusiness size={19} /></span>
              <span>CareerHub</span>
            </Link>
            <p>Connecting people with opportunities to build the future they want.</p>
          </div>
          <div className="browse-footer-links">
            <h2>For candidates</h2>
            <Link href="/candidate/jobs">Browse jobs</Link>
            <Link href="/candidate/applications">My applications</Link>
            <Link href="/candidate/profile">My profile</Link>
          </div>
          <div className="browse-footer-links">
            <h2>Your account</h2>
            <Link href="/candidate">Dashboard</Link>
            <Link href="/candidate/profile">Profile settings</Link>
          </div>
        </div>
        <div className="browse-footer-bottom">
          <p>© {new Date().getFullYear()} CareerHub. All rights reserved.</p>
          <span>Build your future, one opportunity at a time.</span>
        </div>
      </footer>
    </main>
  );
}
