"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Plus, RefreshCw, XCircle } from "lucide-react";
import RichTextEditor from "@/components/ui/rich-text-editor";
import { apiRequest } from "@/lib/api";
import { richTextHasContent, sanitizeRichText } from "@/lib/rich-text";

type JobType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "REMOTE";

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

interface PublishedJob {
  id: number;
  title: string;
  location: string;
  jobType: JobType;
  salaryMin: number | null;
  salaryMax: number | null;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
}

const initialForm: JobForm = {
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
  return new Date(`${date.slice(0, 10)}T00:00:00`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatSalary(min: string, max: string) {
  if (!min && !max) return "Negotiable";
  const currency = new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  });
  const lower = min ? currency.format(Number(min)) : null;
  const upper = max ? currency.format(Number(max)) : null;
  if (lower && upper) return `${lower} – ${upper}`;
  return lower ? `From ${lower}` : `Up to ${upper}`;
}

export default function NewCompanyJobPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [companyName, setCompanyName] = useState("Your company");
  const [publishedJobs, setPublishedJobs] = useState<PublishedJob[]>([]);
  const [liveJobsLoading, setLiveJobsLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    const loadCompanyName = async () => {
      try {
        const profile = await apiRequest("/company-admin/profile");
        const company = profile.company ?? profile;
        if (active && typeof company.name === "string" && company.name.trim()) {
          setCompanyName(company.name.trim());
        }
      } catch {
        // The preview keeps its generic company label if profile data is unavailable.
      }
    };

    const loadPublishedJobs = async () => {
      try {
        const jobs = await apiRequest("/jobs/mine");
        if (active && Array.isArray(jobs)) {
          setPublishedJobs(jobs.filter((job: PublishedJob) => job.status === "PUBLISHED"));
        }
      } catch {
        if (active) setPublishedJobs([]);
      } finally {
        if (active) setLiveJobsLoading(false);
      }
    };

    void loadCompanyName();
    void loadPublishedJobs();
    const refreshTimer = window.setInterval(() => void loadPublishedJobs(), 30000);

    return () => {
      active = false;
      window.clearInterval(refreshTimer);
    };
  }, []);

  function updateForm<K extends keyof JobForm>(field: K, value: JobForm[K]) {
    setForm((previous) => ({ ...previous, [field]: value }));
    setError("");
  }

  async function submitJob(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (step === 1) {
      if (!form.title.trim() || !form.location.trim() || !richTextHasContent(sanitizeRichText(form.description))) {
        setError("Add a job title, location, and description before continuing.");
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!richTextHasContent(sanitizeRichText(form.requirements))) {
        setError("Add the requirements for this role before continuing.");
        return;
      }
      setStep(3);
      return;
    }

    const title = form.title.trim();
    const location = form.location.trim();
    const description = sanitizeRichText(form.description);
    const requirements = sanitizeRichText(form.requirements);
    const salaryMin = form.salaryMin ? Number(form.salaryMin) : undefined;
    const salaryMax = form.salaryMax ? Number(form.salaryMax) : undefined;

    if (title.length > 200 || location.length > 200) {
      setError("Title and location must not exceed 200 characters.");
      setStep(1);
      return;
    }
    if (
      (salaryMin !== undefined && (!Number.isInteger(salaryMin) || salaryMin < 0)) ||
      (salaryMax !== undefined && (!Number.isInteger(salaryMax) || salaryMax < 0))
    ) {
      setError("Salary must be a valid non-negative whole number.");
      setStep(1);
      return;
    }
    if (salaryMin !== undefined && salaryMax !== undefined && salaryMin > salaryMax) {
      setError("Minimum salary cannot exceed maximum salary.");
      setStep(1);
      return;
    }

    try {
      setSaving(true);
      await apiRequest("/jobs", {
        method: "POST",
        body: JSON.stringify({
          title,
          location,
          description,
          requirements,
          jobType: form.jobType,
          salaryMin,
          salaryMax,
          deadline: form.deadline || null,
        }),
      });
      toast.success("Job draft created successfully.");
      router.push("/company-admin/jobs");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create this job.");
    } finally {
      setSaving(false);
    }
  }

  const plainDescription = form.description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const plainRequirements = form.requirements.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

  return (
    <main className="ca-content jm-posting-page">
      <div className="jm-posting-page-heading">
        <button type="button" className="jm-posting-cancel" onClick={() => router.push("/company-admin/jobs")}>
          <ArrowLeft size={16} /> Cancel
        </button>
        <div>
          <span className="jm-eyebrow">JOB POSTING WORKSPACE</span>
          <h2>Post a new job</h2>
          <p>About 5 minutes. You can create a draft and publish it when it is ready.</p>
        </div>
      </div>

      <nav className="jm-wizard-steps" aria-label="Job posting steps">
        {["Job details", "Requirements", "Review & publish"].map((label, index) => {
          const current = index + 1;
          return (
            <button
              key={label}
              type="button"
              className={`jm-wizard-step ${step === current ? "active" : ""} ${step > current ? "complete" : ""}`}
              onClick={() => current < step && setStep(current)}
              disabled={current > step || saving}
              aria-current={step === current ? "step" : undefined}
            >
              <span>{step > current ? "✓" : current}</span>{label}
            </button>
          );
        })}
      </nav>

      <form className="jm-wizard-form" onSubmit={submitJob}>
        <div className="jm-wizard-layout">
          <section className="jm-wizard-form-card">
            {step === 1 && (
              <>
                <div className="jm-wizard-section-heading"><h3>Basic information</h3><p>Start with the details candidates use to decide if a role is right for them.</p></div>
                <div className="jm-wizard-fields">
                  <label className="jm-field jm-full">Job title *<input required maxLength={200} placeholder="e.g. Senior Product Designer" value={form.title} onChange={(event) => updateForm("title", event.target.value)} /></label>
                  <label className="jm-field">Location *<input required maxLength={200} placeholder="e.g. Dhaka, Bangladesh" value={form.location} onChange={(event) => updateForm("location", event.target.value)} /></label>
                  <label className="jm-field">Employment type<select value={form.jobType} onChange={(event) => updateForm("jobType", event.target.value as JobType)}><option value="FULL_TIME">Full-time</option><option value="PART_TIME">Part-time</option><option value="CONTRACT">Contract</option><option value="INTERNSHIP">Internship</option><option value="REMOTE">Remote</option></select></label>
                  <label className="jm-field">Minimum salary (BDT)<input type="number" min="0" step="1" placeholder="e.g. 40000" value={form.salaryMin} onChange={(event) => updateForm("salaryMin", event.target.value)} /></label>
                  <label className="jm-field">Maximum salary (BDT)<input type="number" min="0" step="1" placeholder="e.g. 80000" value={form.salaryMax} onChange={(event) => updateForm("salaryMax", event.target.value)} /></label>
                  <label className="jm-field jm-full">Application deadline<input type="date" value={form.deadline} onChange={(event) => updateForm("deadline", event.target.value)} /></label>
                  <div className="jm-field jm-full"><span>Job description *</span><RichTextEditor label="Job description" placeholder="Describe the role, responsibilities, and what success looks like..." value={form.description} onChange={(value) => updateForm("description", value)} /></div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="jm-wizard-section-heading"><h3>Role requirements</h3><p>Share the experience, skills, and qualifications someone needs to succeed.</p></div>
                <div className="jm-field jm-wizard-requirements"><span>Requirements *</span><RichTextEditor label="Job requirements" placeholder="List the essential skills, experience, and qualifications..." value={form.requirements} onChange={(value) => updateForm("requirements", value)} /></div>
                <div className="jm-wizard-tip"><strong>Keep the essentials clear</strong><p>Use short, specific points. Focus on must-have qualifications and responsibilities for this role.</p></div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="jm-wizard-section-heading"><h3>Review your job posting</h3><p>Check the details before creating the draft. You can publish it from your job list when it is ready.</p></div>
                <dl className="jm-review-details">
                  <div><dt>Job title</dt><dd>{form.title || "Not added"}</dd></div>
                  <div><dt>Location</dt><dd>{form.location || "Not added"}</dd></div>
                  <div><dt>Employment type</dt><dd>{form.jobType.replaceAll("_", " ")}</dd></div>
                  <div><dt>Salary range</dt><dd>{formatSalary(form.salaryMin, form.salaryMax)}</dd></div>
                  <div><dt>Application deadline</dt><dd>{form.deadline ? formatDate(form.deadline) : "No deadline set"}</dd></div>
                </dl>
                <div className="jm-review-copy"><h4>Job description</h4><p>{plainDescription || "No description added."}</p></div>
                <div className="jm-review-copy"><h4>Requirements</h4><p>{plainRequirements || "No requirements added."}</p></div>
              </>
            )}

            {error && <div className="jm-form-error"><XCircle size={17} />{error}</div>}
            <div className="jm-wizard-footer">
              <button type="button" className="jm-cancel-button" onClick={() => step === 1 ? router.push("/company-admin/jobs") : setStep(step - 1)} disabled={saving}>{step === 1 ? "Cancel" : "Back"}</button>
              <button type="submit" className="jm-create-button" disabled={saving}>{saving ? <><RefreshCw size={16} className="ca-spinning" />Saving...</> : step < 3 ? <>Continue <span aria-hidden="true">→</span></> : <><Plus size={16} />Create job draft</>}</button>
            </div>
          </section>

          <aside className="jm-wizard-aside">
            <section className="jm-wizard-tips"><h3>{step === 2 ? "Writing requirements" : step === 3 ? "Before you create" : "Tips for a great posting"}</h3>
              <div><strong>{step === 2 ? "Be specific" : "Lead with impact"}</strong><p>{step === 2 ? "Describe the experience and skills a candidate will use in this role." : "Describe what this person will own and contribute to the team."}</p></div>
              <div><strong>{step === 3 ? "Check the details" : "Keep it focused"}</strong><p>{step === 3 ? "Review the salary, location, and deadline before creating the draft." : "Clear, concise posts help the right candidates understand the opportunity."}</p></div>
              <div><strong>Share a pay range</strong><p>Including compensation helps candidates decide whether to apply.</p></div>
            </section>
            <section className="jm-wizard-preview"><div className="jm-live-preview-heading"><h3>Live preview</h3><span>UPDATING LIVE</span></div><p className="jm-preview-subtitle">Your candidate-facing post updates as you type.</p>
              <article className="jm-preview-job" aria-live="polite">
                <div className="jm-preview-company"><span>{companyName.charAt(0).toUpperCase() || "C"}</span><div><strong>{companyName}</strong><small>{form.location || "Location not set"}</small></div></div>
                <h4>{form.title || "Your job title"}</h4>
                <div className="jm-preview-tags"><span>{form.jobType.replaceAll("_", " ")}</span><span>{form.salaryMin || form.salaryMax ? formatSalary(form.salaryMin, form.salaryMax) : "Salary not specified"}</span></div>
                <p>{plainDescription.slice(0, 190) || "Your job description will appear here once you add it."}</p>
                <span className="jm-preview-apply">Apply now</span>
              </article>
            </section>
            <section className="jm-live-jobs-panel" aria-live="polite">
              <div className="jm-live-jobs-title"><h3>Your live jobs</h3><span>{publishedJobs.length}</span></div>
              <p>Published roles currently visible to candidates.</p>
              {liveJobsLoading ? (
                <div className="jm-live-jobs-loading">Updating published jobs...</div>
              ) : publishedJobs.length ? (
                <div className="jm-live-jobs-list">
                  {publishedJobs.slice(0, 3).map((job) => (
                    <article key={job.id} className="jm-live-job-item">
                      <span className="jm-live-job-icon">{job.title.trim().charAt(0).toUpperCase() || "J"}</span>
                      <div><strong>{job.title}</strong><small>{job.location} · {job.jobType.replaceAll("_", " ")}</small><small>{formatSalary(job.salaryMin?.toString() ?? "", job.salaryMax?.toString() ?? "")}</small></div>
                      <span className="jm-live-status">Live</span>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="jm-live-jobs-empty">No published jobs yet. After you publish a draft, it will appear here.</div>
              )}
            </section>
          </aside>
        </div>
      </form>
    </main>
  );
}
