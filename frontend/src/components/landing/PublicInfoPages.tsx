"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

function PublicHeader({ active }: { active: "about" | "contact" }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <header className="home-nav home-container info-nav">
      <Link href="/" className="home-brand" aria-label="CareerHub home">
        <span className="home-brand-icon"><BriefcaseBusiness size={20} /></span>
        <span>CareerHub</span>
      </Link>
      <button
        className="home-nav-toggle"
        type="button"
        aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={mobileNavOpen}
        onClick={() => setMobileNavOpen((open) => !open)}
      >
        {mobileNavOpen ? <X size={21} /> : <Menu size={21} />}
      </button>
      <nav className={`home-nav-links${mobileNavOpen ? " is-open" : ""}`} aria-label="Main navigation">
        <Link href="/" onClick={() => setMobileNavOpen(false)}>Home</Link>
        <Link href="/candidate/jobs" onClick={() => setMobileNavOpen(false)}>Jobs</Link>
        <Link className={active === "about" ? "is-current" : ""} href="/about" onClick={() => setMobileNavOpen(false)}>About us</Link>
        <Link className={active === "contact" ? "is-current" : ""} href="/contact" onClick={() => setMobileNavOpen(false)}>Contact us</Link>
      </nav>
      <div className="home-nav-actions">
        <Link className="home-login-link" href="/login">Login</Link>
        <Link className="home-button home-nav-register" href="/signup/candidate">Register</Link>
      </div>
    </header>
  );
}

function PublicFooter() {
  return (
    <footer className="home-footer info-footer">
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
            <Link href="/contact">Contact us</Link>
            <Link href="/signup/company-admin">For employers</Link>
            <Link href="/signup/candidate">For candidates</Link>
          </div>
          <div className="home-footer-links">
            <h3>Explore jobs</h3>
            <Link href="/candidate/jobs">Browse all jobs</Link>
            <Link href="/candidate/applications">My applications</Link>
            <Link href="/login">Sign in</Link>
          </div>
          <div className="home-footer-newsletter">
            <h3>Take your next step</h3>
            <p>Create a candidate account to track applications and opportunities.</p>
            <Link className="home-button" href="/signup/candidate">Join CareerHub <ArrowRight size={16} /></Link>
          </div>
        </div>
        <div className="home-footer-bottom">
          <span>© {new Date().getFullYear()} CareerHub. All rights reserved.</span>
          <div><Link href="/contact">Contact</Link><Link href="/about">About CareerHub</Link></div>
        </div>
      </div>
    </footer>
  );
}

export function AboutUsPage() {
  const steps = [
    { icon: UserRound, title: "Create your account", description: "Set up your candidate profile and tell employers what you do best." },
    { icon: FileText, title: "Prepare your profile", description: "Add your experience, skills, education, and latest resume." },
    { icon: Search, title: "Find a role", description: "Explore open positions by job title, location, and work type." },
    { icon: CheckCircle2, title: "Apply and follow along", description: "Submit an application and keep track of its status in one place." },
  ];

  return (
    <main className="public-home public-info-page">
      <section className="info-hero" id="top">
        <PublicHeader active="about" />
        <div className="home-container info-hero-copy">
          <span className="info-eyebrow"><span /> ABOUT CAREERHUB</span>
          <h1>About Us</h1>
          <p>A clearer path between people ready for their next step and teams ready to grow.</p>
        </div>
      </section>

      <section className="info-story-section">
        <div className="home-container info-story-grid">
          <div className="info-product-visual" aria-label="Illustration of a candidate profile and job listing">
            <div className="info-visual-orbit orbit-one" />
            <div className="info-visual-orbit orbit-two" />
            <div className="info-profile-card">
              <div className="info-profile-avatar"><UserRound size={22} /></div>
              <div className="info-profile-lines"><i /><i /><i /></div>
              <span className="info-profile-check"><Check size={16} /></span>
            </div>
            <div className="info-job-float">
              <span className="info-float-icon"><BriefcaseBusiness size={16} /></span>
              <span><strong>Product Designer</strong><small>New opportunity</small></span>
              <ArrowUpRight size={15} />
            </div>
            <div className="info-visual-caption"><Sparkles size={15} /> Every opportunity starts with a connection</div>
          </div>
          <div className="info-story-copy">
            <span className="info-kicker">A BETTER WAY TO MOVE FORWARD</span>
            <h2>Good work starts with the right connection.</h2>
            <p>Finding a job or building a team can feel harder than it should. CareerHub brings the essential steps together: discover roles, present your experience, apply, and follow your progress.</p>
            <p>We make the hiring journey easier to navigate for candidates and employers, with one shared place to find opportunities and manage applications.</p>
            <Link className="home-button" href="/candidate/jobs">Explore open jobs <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>

      <section className="info-values-section">
        <div className="home-container">
          <div className="home-section-heading is-centered">
            <span className="info-kicker">WHAT GUIDES US</span>
            <h2>Built around the people behind every application</h2>
            <p>Useful tools, clear information, and a more considered hiring experience.</p>
          </div>
          <div className="info-values-grid">
            <article className="info-value-card">
              <span className="info-value-icon"><Target size={21} /></span>
              <h3>Make it clear</h3>
              <p>Keep job details, candidate profiles, and application progress easy to understand.</p>
            </article>
            <article className="info-value-card">
              <span className="info-value-icon"><UsersRound size={21} /></span>
              <h3>Keep people first</h3>
              <p>Give candidates and employers a shared workspace for a more direct connection.</p>
            </article>
            <article className="info-value-card">
              <span className="info-value-icon"><ShieldCheck size={21} /></span>
              <h3>Support every step</h3>
              <p>From profile setup to application review, keep the hiring journey moving forward.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="info-steps-section">
        <div className="home-container">
          <div className="home-section-heading">
            <div>
              <span className="info-kicker">HOW IT WORKS</span>
              <h2>Your next opportunity, step by step</h2>
              <p>CareerHub keeps the process simple from your first visit to your next application.</p>
            </div>
            <Link className="home-text-link" href="/signup/candidate">Create an account <ArrowRight size={16} /></Link>
          </div>
          <div className="info-steps-grid">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <article className="info-step-card" key={step.title}>
                  <span className="info-step-number">0{index + 1}</span>
                  <span className="info-step-icon"><Icon size={22} /></span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="info-faq-section">
        <div className="home-container info-faq-grid">
          <div>
            <span className="info-kicker">A FEW QUICK ANSWERS</span>
            <h2>Questions about CareerHub?</h2>
            <p>Here are a few details to help you get started. If you need more help, send us a message.</p>
            <Link className="home-text-link" href="/contact">Contact our team <ArrowRight size={16} /></Link>
          </div>
          <div className="info-faq-list">
            <details open>
              <summary>Who can use CareerHub?</summary>
              <p>Candidates can discover jobs and manage applications. Employers can register their company and manage job listings and candidates.</p>
            </details>
            <details>
              <summary>How do I apply for a job?</summary>
              <p>Create a candidate account, browse available roles, and submit an application from the job details page.</p>
            </details>
            <details>
              <summary>Can I track my application?</summary>
              <p>Yes. Sign in and open My Applications to review the current status of your submissions.</p>
            </details>
          </div>
        </div>
      </section>

      <section className="info-cta-section">
        <div className="home-container info-cta-card">
          <div><span className="info-kicker">START YOUR NEXT CHAPTER</span><h2>Find the opportunity that moves you forward.</h2></div>
          <Link className="home-button" href="/candidate/jobs">Browse jobs <ArrowRight size={16} /></Link>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}

export function ContactUsPage() {
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
  const [formMessage, setFormMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!contactEmail) {
      setFormMessage("Our message inbox is not configured yet. You can still browse opportunities or register as an employer below.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const subject = encodeURIComponent(`CareerHub enquiry: ${String(form.get("topic"))}`);
    const body = encodeURIComponent(
      `Name: ${String(form.get("name"))}\nEmail: ${String(form.get("email"))}\n\n${String(form.get("message"))}`,
    );
    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
    setFormMessage("Your email app should open with your message ready to send.");
  }

  return (
    <main className="public-home public-info-page">
      <section className="info-hero info-hero-contact" id="top">
        <PublicHeader active="contact" />
        <div className="home-container info-hero-copy">
          <span className="info-eyebrow"><span /> WE’RE HERE TO HELP</span>
          <h1>Contact Us</h1>
          <p>Questions about finding a role or hiring with CareerHub? Send us a note.</p>
        </div>
      </section>

      <section className="contact-main-section">
        <div className="home-container contact-main-grid">
          <div className="contact-info-column">
            <span className="info-kicker">LET’S TALK</span>
            <h2>How can we help?</h2>
            <p className="contact-intro">Choose the path that fits your question, or leave us a message and we’ll help point you in the right direction.</p>

            <Link className="contact-channel-card" href="/candidate/jobs">
              <span className="contact-channel-icon"><Search size={19} /></span>
              <span><strong>Looking for a job?</strong><small>Explore open opportunities and application guidance.</small></span>
              <ArrowUpRight size={17} />
            </Link>
            <Link className="contact-channel-card" href="/signup/company-admin">
              <span className="contact-channel-icon"><BriefcaseBusiness size={19} /></span>
              <span><strong>Hiring a team?</strong><small>Register your company to get started with recruiting.</small></span>
              <ArrowUpRight size={17} />
            </Link>
            <div className="contact-channel-card contact-channel-static">
              <span className="contact-channel-icon"><MessageCircle size={19} /></span>
              <span><strong>Account support</strong><small>Include the email on your account and a short description of the issue.</small></span>
            </div>

            <div className="contact-note"><Clock3 size={17} /><span>Share enough detail for us to understand your question. Please do not include passwords or sensitive account information.</span></div>

            <div className="contact-map-card" aria-label="CareerHub connects candidates and employers online">
              <div className="contact-map-grid" />
              <div className="contact-map-route route-one" />
              <div className="contact-map-route route-two" />
              <div className="contact-map-pin"><MapPin size={20} fill="currentColor" /></div>
              <div className="contact-map-label"><span><span className="contact-map-dot" /> CareerHub</span><small>Connecting talent with opportunity</small></div>
            </div>
          </div>

          <div className="contact-form-card">
            <div className="contact-form-heading">
              <span className="contact-form-icon"><Mail size={20} /></span>
              <div><h2>Send us a message</h2><p>We’ll help direct your enquiry to the right place.</p></div>
            </div>
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="contact-form-row">
                <label>Name<input name="name" type="text" autoComplete="name" placeholder="Your name" required /></label>
                <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
              </div>
              <label>What can we help with?
                <select name="topic" defaultValue="general">
                  <option value="general">General question</option>
                  <option value="candidate">Candidate support</option>
                  <option value="employer">Employer enquiry</option>
                  <option value="account">Account support</option>
                </select>
              </label>
              <label>Message<textarea name="message" rows={6} placeholder="Tell us a little about your question..." required /></label>
              <button className="home-button contact-submit" type="submit">Prepare message <ArrowRight size={16} /></button>
              {formMessage && <p className="contact-form-status" role="status">{formMessage}</p>}
              {!contactEmail && <p className="contact-config-note"><Mail size={14} /> Message delivery will be enabled when a support inbox is configured.</p>}
            </form>
          </div>
        </div>
      </section>

      <section className="contact-bottom-cta">
        <div className="home-container"><span>Ready to get started?</span><Link href="/candidate/jobs">Find your next opportunity <ArrowRight size={16} /></Link></div>
      </section>
      <PublicFooter />
    </main>
  );
}
