"use client";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
  Building2,
  RefreshCw,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
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

export default function BrowseJobsPage() {
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    []
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
        <Link href="/candidate" className="browse-back">
          <ArrowLeft size={18} />
          Dashboard
        </Link>

        <div className="browse-header-right">
          <span className="browse-header-label">
            <BriefcaseBusiness size={17} />
            CareerHub
          </span>
        </div>
      </header>

      <section className="browse-hero">
        <div className="browse-hero-content">
          <span className="browse-eyebrow">
            YOUR NEXT OPPORTUNITY STARTS HERE
          </span>

          <h1>Find a job that moves you forward.</h1>

          <p>
            Explore opportunities from approved companies and discover
            the next step in your career.
          </p>
        </div>

        <div className="browse-hero-icon">
          <BriefcaseBusiness size={76} strokeWidth={1.2} />
        </div>
      </section>

      <section className="browse-search-section">
        <form className="browse-filter-form" onSubmit={handleSearch}>
          <div className="browse-filter-title">
            <SlidersHorizontal size={19} />
            <h2>Find your opportunity</h2>
          </div>

          <div className="browse-filter-grid">
            <div className="browse-input-group">
              <label htmlFor="job-title">Job title or keyword</label>

              <div className="browse-input-wrapper">
                <Search size={19} />

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
                <MapPin size={19} />

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
                <Search size={18} />
                Search Jobs
              </button>

              <button
                type="button"
                className="browse-clear-button"
                onClick={clearFilters}
              >
                <X size={16} />
                Clear
              </button>
            </div>
          </div>
        </form>
      </section>

      <section className="browse-results-section">
        <div className="browse-results-heading">
          <div>
            <span className="browse-section-label">OPPORTUNITIES</span>
            <h2>Available Jobs</h2>
            <p>Explore the latest published job opportunities.</p>
          </div>

          {!loading && !error && (
            <span className="browse-result-count">
              {jobs.length} {jobs.length === 1 ? "job" : "jobs"} found
            </span>
          )}
        </div>

        {loading ? (
          <div className="browse-state">
            <RefreshCw className="browse-spinner" size={30} />
            <h3>Finding opportunities...</h3>
            <p>Please wait while we load available jobs.</p>
          </div>
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
                <div className="browse-job-main">
                  <div className="browse-company-icon">
                    <Building2 size={25} />
                  </div>

                  <div className="browse-job-information">
                    <span className="browse-job-type">
                      {formatJobType(job.jobType)}
                    </span>

                    <h3>{job.title}</h3>

                    <p className="browse-company-name">
                      {job.companyName || "Company"}
                    </p>

                    <div className="browse-job-meta">
                      <span>
                        <MapPin size={15} />
                        {job.location || "Location not specified"}
                      </span>

                      <span>
                        <BriefcaseBusiness size={15} />
                        {formatJobType(job.jobType)}
                      </span>

                      <span>
                        <CalendarDays size={15} />
                        Deadline: {formatDate(job.deadline)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="browse-job-side">
                  <strong>{formatSalary(job)}</strong>

                  <span className="browse-salary-label">
                    Salary offered
                  </span>

                  <Link
                    href={`/candidate/jobs/${job.id}`}
                    className="browse-details-button"
                  >
                    View Details
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="browse-footer">
        <p>© {new Date().getFullYear()} CareerHub. Build your future.</p>
      </footer>
    </main>
  );
}
