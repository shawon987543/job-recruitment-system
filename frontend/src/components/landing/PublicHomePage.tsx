"use client";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronDown,
  Cog,
  GraduationCap,
  HardHat,
  Hotel,
  Landmark,
  MapPin,
  Menu,
  Search,
  ShoppingBag,
  Sprout,
  Star,
  Truck,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

type PublicJob = {
  id: number;
  title: string;
  location: string;
  jobType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  companyId: number;
  companyName?: string;
  createdAt: string;
};

type JobFilters = {
  title: string;
  location: string;
  jobType: string;
};

const JOB_TYPES = [
  { value: "FULL_TIME", label: "Full time" },
  { value: "PART_TIME", label: "Part time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "INTERNSHIP", label: "Internship" },
  { value: "REMOTE", label: "Remote" },
];

type Category = {
  title: string;
  searchTerm: string;
  icon: LucideIcon;
};

const CATEGORIES: Category[] = [
  { title: "Agriculture", searchTerm: "agriculture", icon: Sprout },
  { title: "Metal Production", searchTerm: "metal", icon: Cog },
  { title: "Commerce", searchTerm: "commerce", icon: ShoppingBag },
  { title: "Construction", searchTerm: "construction", icon: HardHat },
  { title: "Hotels & Tourism", searchTerm: "tourism", icon: Hotel },
  { title: "Education", searchTerm: "education", icon: GraduationCap },
  { title: "Financial Services", searchTerm: "finance", icon: Landmark },
  { title: "Transport", searchTerm: "transport", icon: Truck },
];

const PARTNERS = ["spotify", "slack", "Adobe", "asana", "Linear"];

const TESTIMONIALS = [
  {
    quote: "Finding opportunities and comparing the details feels simple and clear.",
    name: "Candidate",
    role: "Job seeker experience",
    initials: "C",
  },
  {
    quote: "CareerHub brings job posts and candidate applications together in one place.",
    name: "Company admin",
    role: "Employer experience",
    initials: "CA",
  },
  {
    quote: "I can explore current roles and keep my next career move in focus.",
    name: "Candidate",
    role: "Job seeker experience",
    initials: "C",
  },
];

const ARTICLES = [
  {
    category: "News",
    date: "Career insights",
    title: "Make your next career move with confidence",
    visual: "article-visual-one",
  },
  {
    category: "Blog",
    date: "Hiring insights",
    title: "How to make your next job interview count",
    visual: "article-visual-two",
  },
];

function formatJobType(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatSalary(job: PublicJob) {
  const currency = (amount: number) =>
    `৳${amount.toLocaleString("en-BD")}`;

  if (job.salaryMin != null && job.salaryMax != null) {
    return `${currency(job.salaryMin)} – ${currency(job.salaryMax)}`;
  }
  if (job.salaryMin != null) return `From ${currency(job.salaryMin)}`;
  if (job.salaryMax != null) return `Up to ${currency(job.salaryMax)}`;
  return "Salary not listed";
}

function timeSince(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Recently posted";

  const minutes = Math.max(1, Math.floor((Date.now() - date.getTime()) / 60_000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString("en", { day: "numeric", month: "short" });
}

function JobCard({ job }: { job: PublicJob }) {
  const company = job.companyName || "Company";

  return (
    <article className="home-job-card">
      <span className="home-job-age">{timeSince(job.createdAt)}</span>
      <span className="home-job-bookmark" aria-hidden="true">
        <Bookmark size={19} strokeWidth={1.8} />
      </span>
      <div className="home-job-heading">
        <span className="home-company-mark" aria-hidden="true">
          {company.trim().charAt(0).toUpperCase() || "C"}
        </span>
        <div className="home-job-title-wrap">
          <h3>{job.title}</h3>
          <p>{company}</p>
        </div>
      </div>
      <div className="home-job-meta">
        <span><BriefcaseBusiness size={18} />{formatJobType(job.jobType)}</span>
        <span><Check size={18} />Approved employer</span>
        <span><Wallet size={18} />{formatSalary(job)}</span>
        <span><MapPin size={18} />{job.location || "Location not listed"}</span>
      </div>
      <Link className="home-button home-job-link" href={`/candidate/jobs/${job.id}`}>
        Job details
      </Link>
    </article>
  );
}

function SectionHeading({
  title,
  description,
  centered = false,
  action,
}: {
  title: string;
  description?: string;
  centered?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div className={`home-section-heading${centered ? " is-centered" : ""}`}>
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

function CategorySection({
  id,
  description,
  counts,
  onSelect,
}: {
  id: string;
  description: string;
  counts: Map<string, number>;
  onSelect: (category: Category) => Promise<void>;
}) {
  return (
    <section className="home-category-section" id={id}>
      <div className="home-container">
        <SectionHeading
          title="Browse by Category"
          description={description}
          centered
        />
        <div className="home-category-grid">
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            return (
              <button
                className="home-category-card"
                key={category.title}
                type="button"
                onClick={() => onSelect(category)}
              >
                <Icon size={29} strokeWidth={1.65} />
                <strong>{category.title}</strong>
                <span>{(counts.get(category.title) ?? 0).toLocaleString()} jobs</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({
  testimonial,
}: {
  testimonial: (typeof TESTIMONIALS)[number];
}) {
  return (
    <article className="home-testimonial-card">
      <div className="home-testimonial-stars" aria-label="5 out of 5 stars">
        {Array.from({ length: 5 }, (_, index) => (
          <Star key={index} size={15} fill="currentColor" />
        ))}
      </div>
      <p className="home-testimonial-quote">{testimonial.quote}</p>
      <div className="home-testimonial-person">
        <span className="home-testimonial-avatar" aria-hidden="true">
          {testimonial.initials}
        </span>
        <span>
          <strong>{testimonial.name}</strong>
          <small>{testimonial.role}</small>
        </span>
        <span className="home-testimonial-mark" aria-hidden="true">“</span>
      </div>
    </article>
  );
}

export default function PublicHomePage() {
  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [visibleJobs, setVisibleJobs] = useState<PublicJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [searchError, setSearchError] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [filters, setFilters] = useState<JobFilters>({ title: "", location: "", jobType: "" });

  const loadJobs = useCallback(async (params = new URLSearchParams()) => {
    const suffix = params.size ? `?${params.toString()}` : "";
    const response = await fetch(`${API_URL}/jobs${suffix}`, { cache: "no-store" });
    if (!response.ok) throw new Error("We couldn’t load jobs right now.");
    const result: unknown = await response.json();
    if (!Array.isArray(result)) throw new Error("The jobs response was not recognized.");
    return result as PublicJob[];
  }, []);

  useEffect(() => {
    let active = true;
    void loadJobs()
      .then((result) => {
        if (!active) return;
        setJobs(result);
        setVisibleJobs(result.slice(0, 5));
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load jobs.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [loadJobs]);

  const companyCount = useMemo(
    () => new Set(jobs.map((job) => job.companyId)).size,
    [jobs],
  );
  const jobTypeCount = useMemo(
    () => new Set(jobs.map((job) => job.jobType)).size,
    [jobs],
  );
  const categoryCounts = useMemo(
    () =>
      new Map(
        CATEGORIES.map(
          (category): [string, number] => [
            category.title,
            jobs.filter((job) =>
              job.title.toLowerCase().includes(category.searchTerm),
            ).length,
          ],
        ),
      ),
    [jobs],
  );

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearching(true);
    setSearchError("");
    const params = new URLSearchParams();
    if (filters.title.trim()) params.set("title", filters.title.trim());
    if (filters.location.trim()) params.set("location", filters.location.trim());
    if (filters.jobType) params.set("jobType", filters.jobType);

    try {
      const result = await loadJobs(params);
      setVisibleJobs(result.slice(0, 5));
      document.getElementById("recent-jobs")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (reason) {
      setSearchError(reason instanceof Error ? reason.message : "Unable to search jobs.");
    } finally {
      setSearching(false);
    }
  }

  async function handleTypeSelect(value: string) {
    setFilters((current) => ({ ...current, jobType: value }));
    const nextFilters = { ...filters, jobType: value };
    const params = new URLSearchParams();
    if (nextFilters.title.trim()) params.set("title", nextFilters.title.trim());
    if (nextFilters.location.trim()) params.set("location", nextFilters.location.trim());
    if (nextFilters.jobType) params.set("jobType", nextFilters.jobType);
    setSearching(true);
    setSearchError("");
    try {
      const result = await loadJobs(params);
      setVisibleJobs(result.slice(0, 5));
    } catch (reason) {
      setSearchError(reason instanceof Error ? reason.message : "Unable to search jobs.");
    } finally {
      setSearching(false);
    }
  }

  async function handleCategorySelect(category: Category) {
    const nextFilters = { title: category.searchTerm, location: "", jobType: "" };
    setFilters(nextFilters);
    setSearching(true);
    setSearchError("");
    const params = new URLSearchParams({ title: category.searchTerm });

    try {
      const result = await loadJobs(params);
      setVisibleJobs(result.slice(0, 5));
      document.getElementById("recent-jobs")?.scrollIntoView({ behavior: "smooth" });
    } catch (reason) {
      setSearchError(reason instanceof Error ? reason.message : "Unable to search jobs.");
    } finally {
      setSearching(false);
    }
  }

  function clearSearch() {
    const cleared = { title: "", location: "", jobType: "" };
    setFilters(cleared);
    setSearchError("");
    setVisibleJobs(jobs.slice(0, 5));
  }

  return (
    <main className="public-home">
      <section className="home-hero" id="top">
        <header className="home-nav home-container">
          <Link href="/" className="home-brand" aria-label="CareerHub home">
            <span className="home-brand-icon"><BriefcaseBusiness size={21} /></span>
            <span>CareerHub</span>
          </Link>
          <button
            className="home-nav-toggle"
            type="button"
            aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            {mobileNavOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <nav className={`home-nav-links${mobileNavOpen ? " is-open" : ""}`} aria-label="Main navigation">
            <a href="#top" onClick={() => setMobileNavOpen(false)}>Home</a>
            <a href="#recent-jobs" onClick={() => setMobileNavOpen(false)}>Jobs</a>
            <Link href="/about" onClick={() => setMobileNavOpen(false)}>About us</Link>
            <Link href="/contact" onClick={() => setMobileNavOpen(false)}>Contact us</Link>
          </nav>
          <div className="home-nav-actions">
            <Link className="home-login-link" href="/login">Login</Link>
            <Link className="home-button home-nav-register" href="/signup/candidate">Register</Link>
          </div>
        </header>

        <div className="home-hero-content home-container">
          <p className="home-eyebrow"><span />A better way to find your next step</p>
          <h1>Find Your Dream Job Today!</h1>
          <p className="home-hero-subtitle">Connecting talent with opportunity. Your gateway to career success.</p>

          <form className="home-search" onSubmit={handleSearch}>
            <label className="home-search-field home-search-keyword">
              <span className="sr-only">Job title</span>
              <Search size={18} />
              <input
                value={filters.title}
                onChange={(event) => setFilters((current) => ({ ...current, title: event.target.value }))}
                placeholder="Job title"
              />
            </label>
            <label className="home-search-field">
              <span className="sr-only">Location</span>
              <MapPin size={18} />
              <input
                value={filters.location}
                onChange={(event) => setFilters((current) => ({ ...current, location: event.target.value }))}
                placeholder="Select location"
              />
            </label>
            <label className="home-search-field home-search-select">
              <span className="sr-only">Job type</span>
              <select value={filters.jobType} onChange={(event) => void handleTypeSelect(event.target.value)}>
                <option value="">Select category</option>
                {JOB_TYPES.map((type) => <option value={type.value} key={type.value}>{type.label}</option>)}
              </select>
              <ChevronDown size={17} aria-hidden="true" />
            </label>
            <button className="home-button home-search-submit" type="submit" disabled={searching}>
              <Search size={17} />{searching ? "Searching…" : "Search jobs"}
            </button>
          </form>

          {searchError && <p className="home-search-error" role="status">{searchError}</p>}

          <div className="home-hero-stats" aria-label="Live job marketplace counts">
            <div className="home-hero-stat">
              <span className="home-stat-icon"><BriefcaseBusiness size={22} /></span>
              <span><strong>{loading ? "—" : jobs.length.toLocaleString()}</strong><small>Open jobs</small></span>
            </div>
            <div className="home-hero-stat">
              <span className="home-stat-icon"><Building2 size={22} /></span>
              <span><strong>{loading ? "—" : companyCount.toLocaleString()}</strong><small>Hiring companies</small></span>
            </div>
            <div className="home-hero-stat">
              <span className="home-stat-icon"><BriefcaseBusiness size={22} /></span>
              <span><strong>{loading ? "—" : jobTypeCount.toLocaleString()}</strong><small>Job types</small></span>
            </div>
          </div>
        </div>
      </section>

      <section className="home-partners" aria-label="Example employer wordmarks">
        <div className="home-container home-partner-row">
          {PARTNERS.map((partner, index) => (
            <span className={`home-partner-wordmark partner-${index + 1}`} key={partner}>
              {index === 0 && <span className="partner-round-mark">◉</span>}
              {index === 1 && <span className="partner-slack-mark">✣</span>}
              {index === 2 && <span className="partner-adobe-mark">◢</span>}
              {index === 3 && <span className="partner-asana-mark">●</span>}
              {index === 4 && <span className="partner-linear-mark">◉</span>}
              {partner}
            </span>
          ))}
        </div>
      </section>

      <section className="home-section home-recent-section" id="recent-jobs">
        <div className="home-container">
          <SectionHeading
            title="Recent jobs available"
            description="Find a role where your next chapter can begin."
            action={<a className="home-text-link" href="#recent-jobs">View all <ArrowRight size={16} /></a>}
          />
          {error ? (
            <div className="home-empty-state" role="status">
              <BriefcaseBusiness size={25} />
              <strong>Job listings are temporarily unavailable.</strong>
              <span>{error}</span>
            </div>
          ) : loading || searching ? (
            <div className="home-job-list" aria-label="Loading jobs" aria-busy="true">
              {[0, 1, 2].map((item) => <div className="home-job-skeleton" key={item} />)}
            </div>
          ) : visibleJobs.length ? (
            <div className="home-job-list">
              {visibleJobs.map((job) => <JobCard key={job.id} job={job} />)}
            </div>
          ) : (
            <div className="home-empty-state">
              <Search size={25} />
              <strong>No matching jobs found</strong>
              <span>Try another title, location, or job type.</span>
              <button className="home-text-link" type="button" onClick={clearSearch}>Clear search</button>
            </div>
          )}
          {!error && !loading && visibleJobs.length > 0 && (
            <div className="home-recent-footer">
              <span>{searching ? "Updating results…" : `Showing ${visibleJobs.length} of ${jobs.length} open roles`}</span>
              <Link className="home-outline-button" href="/candidate/jobs">Browse all jobs <ArrowRight size={16} /></Link>
            </div>
          )}
        </div>
      </section>

      <CategorySection
        id="categories"
        description="Explore opportunities in an industry that interests you."
        counts={categoryCounts}
        onSelect={handleCategorySelect}
      />

      <CategorySection
        id="more-categories"
        description="Discover more industries and find a role that fits."
        counts={categoryCounts}
        onSelect={handleCategorySelect}
      />

      <section className="home-section home-company-section" id="about">
        <div className="home-container">
          <div className="home-company-feature">
            <div className="home-company-art" aria-hidden="true">
              <div className="home-art-orb home-art-orb-one" />
              <div className="home-art-orb home-art-orb-two" />
              <div className="home-art-window">
                <span /><span /><span />
                <div className="home-art-window-content">
                  <div className="home-art-person"><span /></div>
                  <div><i /><i /><i /></div>
                </div>
              </div>
              <div className="home-art-check"><Check size={19} /></div>
            </div>
            <div className="home-company-copy">
              <span className="home-kicker">YOUR CAREER, YOUR WAY</span>
              <h2>Good life begins with a good company</h2>
              <p>Discover employers who are building teams, creating opportunities, and helping people do their best work.</p>
              <div className="home-company-actions">
                <a className="home-button" href="#recent-jobs">Search jobs</a>
                <Link className="home-text-link" href="/signup/company-admin">For employers <ArrowRight size={16} /></Link>
              </div>
            </div>
          </div>
          <div className="home-proof-stats">
            <div><strong>{loading ? "—" : jobs.length.toLocaleString()}<span>+</span></strong><h3>Open opportunities</h3><p>Published roles from approved companies on CareerHub.</p></div>
            <div><strong>{loading ? "—" : companyCount.toLocaleString()}<span>+</span></strong><h3>Hiring companies</h3><p>Employers represented in the current public job listings.</p></div>
            <div><strong>{loading ? "—" : jobTypeCount.toLocaleString()}<span></span></strong><h3>Ways to work</h3><p>Different job types to help you find an opportunity that fits.</p></div>
          </div>
          <div className="home-promo-banner">
            <div className="home-promo-copy">
              <span className="home-kicker">TAKE THE NEXT STEP</span>
              <h2>Create a better future for yourself</h2>
              <p>Start with a search. Your next opportunity could be closer than you think.</p>
              <a className="home-button" href="#recent-jobs">Explore jobs <ArrowRight size={16} /></a>
            </div>
            <div className="home-promo-art" aria-hidden="true">
              <div className="home-promo-sun" />
              <div className="home-promo-person person-one"><span /></div>
              <div className="home-promo-person person-two"><span /></div>
              <div className="home-promo-person person-three"><span /></div>
              <div className="home-promo-person person-four"><span /></div>
              <div className="home-promo-person person-five"><span /></div>
              <div className="home-promo-ground" />
            </div>
          </div>
        </div>
      </section>

      <section className="home-testimonials-section">
        <div className="home-container">
          <SectionHeading
            title="Testimonials from Our Customers"
            description="Sample stories showing how CareerHub supports candidates and employers."
            centered
          />
          <div className="home-testimonial-grid">
            {TESTIMONIALS.map((testimonial, index) => (
              <TestimonialCard
                testimonial={testimonial}
                key={`${testimonial.name}-${index}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="home-section home-stories-section">
        <div className="home-container">
          <SectionHeading
            title="News and Blog"
            description="Ideas for candidates and growing teams."
            action={<a className="home-text-link" href="#stories">View all <ArrowRight size={16} /></a>}
          />
          <div className="home-story-grid" id="stories">
            {ARTICLES.map((article) => (
              <article className="home-story-card" key={article.title}>
                <div className={`home-story-visual ${article.visual}`} aria-hidden="true">
                  <span className="home-story-label">{article.category}</span>
                  <div className="home-story-art-shape"><BriefcaseBusiness size={46} strokeWidth={1.1} /></div>
                </div>
                <p className="home-story-date">{article.date}</p>
                <h3>{article.title}</h3>
                <Link className="home-text-link" href={article.category === "For employers" ? "/signup/company-admin" : "/signup/candidate"}>
                  Learn more <ArrowRight size={16} />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="home-footer" id="footer">
        <div className="home-container">
          <div className="home-footer-main">
            <div className="home-footer-about">
              <Link href="/" className="home-brand">
                <span className="home-brand-icon"><BriefcaseBusiness size={20} /></span>
                <span>CareerHub</span>
              </Link>
              <p>Connecting people with meaningful opportunities and helping teams find the talent they need.</p>
            </div>
            <div className="home-footer-links">
              <h3>Company</h3>
              <Link href="/about">About us</Link>
              <Link href="/signup/company-admin">For employers</Link>
              <Link href="/signup/candidate">For candidates</Link>
              <Link href="/contact">Contact us</Link>
            </div>
            <div className="home-footer-links">
              <h3>Explore jobs</h3>
              <a href="#recent-jobs">Recent jobs</a>
              <a href="#categories">Job types</a>
              <Link href="/candidate/jobs">Browse all jobs</Link>
              <Link href="/login">Sign in</Link>
            </div>
            <div className="home-footer-newsletter">
              <h3>Newsletter</h3>
              <p>Create a candidate account to keep track of applications and opportunities.</p>
              <Link className="home-button" href="/signup/candidate">Join CareerHub <ArrowRight size={16} /></Link>
            </div>
          </div>
          <div className="home-footer-bottom">
            <span>© {new Date().getFullYear()} CareerHub. All rights reserved.</span>
            <div><a href="#footer">Privacy policy</a><a href="#footer">Terms &amp; conditions</a></div>
          </div>
        </div>
      </footer>
    </main>
  );
}
