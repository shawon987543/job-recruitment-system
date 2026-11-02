"use client";
import {
  Activity,
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  GraduationCap,
  LayoutDashboard,
  MapPin,
  Search,
  Settings,
  Sparkles,
  UserRound,
  Wallet,
} from "lucide-react";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Browse Jobs", icon: BriefcaseBusiness },
  { label: "My Applications", icon: FileText },
  { label: "My Profile", icon: UserRound },
];

const stats = [
  {
    label: "Total Applications",
    value: "12",
    icon: FileText,
    color: "#315efb",
    background: "#eef2ff",
    note: "Applications submitted",
  },
  {
    label: "Pending Review",
    value: "05",
    icon: Clock3,
    color: "#d58b16",
    background: "#fff5df",
    note: "Waiting for response",
  },
  {
    label: "Shortlisted",
    value: "04",
    icon: CheckCircle2,
    color: "#0b9b70",
    background: "#e5f8f0",
    note: "Moving forward",
  },
  {
    label: "Rejected",
    value: "03",
    icon: Activity,
    color: "#dc5263",
    background: "#fff0f1",
    note: "Closed applications",
  },
];

const jobs = [
  {
    company: "T",
    companyName: "Tech Solutions",
    title: "Frontend Developer",
    location: "Dhaka, Bangladesh",
    type: "Full Time",
    salary: "৳25k – ৳40k",
    color: "#eef2ff",
  },
  {
    company: "D",
    companyName: "Digital Agency",
    title: "React Developer",
    location: "Remote",
    type: "Full Time",
    salary: "৳30k – ৳50k",
    color: "#e9f8f3",
  },
  {
    company: "C",
    companyName: "Creative Studio",
    title: "UI/UX Designer",
    location: "Dhaka, Bangladesh",
    type: "Contract",
    salary: "৳20k – ৳35k",
    color: "#fff2e7",
  },
];

const activities = [
  {
    title: "Frontend Developer",
    company: "ABC Technologies",
    date: "Applied recently",
    status: "Pending",
  },
  {
    title: "React Developer",
    company: "Digital Agency",
    date: "Application reviewed",
    status: "Shortlisted",
  },
  {
    title: "UI Developer",
    company: "Creative Studio",
    date: "Application update",
    status: "Rejected",
  },
];

export default function CandidateDashboard() {
  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <BriefcaseBusiness size={21} />
          </div>
          <span>CareerHub</span>
        </div>

        <div className="sidebar-label">WORKSPACE</div>

        <nav className="nav-list">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <a
                key={item.label}
                href="#"
                className={`nav-link ${item.active ? "active" : ""}`}
              >
                <Icon size={18} />
                {item.label}
                {item.active && <ChevronRight size={15} />}
              </a>
            );
          })}
        </nav>

        <div className="sidebar-label">PREFERENCES</div>

        <nav className="nav-list">
          <a href="#" className="nav-link">
            <Settings size={18} />
            Settings
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div
            style={{
              padding: 16,
              background: "#f3f5ff",
              borderRadius: 13,
            }}
          >
            <Sparkles size={20} color="#315efb" />
            <p style={{ fontSize: 12, fontWeight: 800, margin: "12px 0 5px" }}>
              Build your career
            </p>
            <p style={{ color: "#7b8498", fontSize: 10, lineHeight: 1.6 }}>
              Keep your profile updated to discover better opportunities.
            </p>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="top-search">
            <Search size={17} />
            <input placeholder="Search jobs, companies..." />
          </div>

          <div className="topbar-right">
            <button className="icon-button" aria-label="Notifications">
              <Bell size={17} />
            </button>

            <div className="profile-mini">
              <div className="avatar">SH</div>
              <div className="profile-details">
                <div style={{ fontSize: 12, fontWeight: 800 }}>Sazzad Hossain</div>
                <div style={{ marginTop: 3, color: "#8992a4", fontSize: 10 }}>
                  Candidate
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="content">
          <section className="welcome-banner">
            <div className="welcome-content">
              <h1>Welcome back, Sazzad! 👋</h1>
              <p>
                Your next opportunity could be just around the corner.
                Explore new jobs, track your applications, and take the next
                step in your career journey.
              </p>

              <button className="primary-light-button">
                Explore opportunities
                <ArrowRight size={15} />
              </button>
            </div>

            <div className="welcome-art">
              <GraduationCap size={55} strokeWidth={1.5} />
            </div>
          </section>

          <div className="section-heading">
            <div>
              <h2>Application Overview</h2>
              <p>Keep track of your job application progress.</p>
            </div>
            <a href="#" className="text-link">
              View all <ArrowRight size={13} />
            </a>
          </div>

          <section className="stats-grid">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <article className="stat-card" key={stat.label}>
                  <div className="stat-top">
                    <div
                      className="stat-icon"
                      style={{
                        color: stat.color,
                        background: stat.background,
                      }}
                    >
                      <Icon size={20} />
                    </div>
                    <ChevronRight size={16} color="#aab2c0" />
                  </div>

                  <div className="stat-number">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                  <p style={{ color: "#9aa2b2", fontSize: 10, marginBottom: 0 }}>
                    {stat.note}
                  </p>
                </article>
              );
            })}
          </section>

          <div className="dashboard-grid">
            <section>
              <div className="section-heading">
                <div>
                  <h2>Recommended Jobs</h2>
                  <p>Opportunities you might be interested in.</p>
                </div>
                <a href="#" className="text-link">
                  Explore all <ArrowRight size={13} />
                </a>
              </div>

              <div className="panel">
                <div className="job-list">
                  {jobs.map((job) => (
                    <article className="job-card" key={job.title}>
                      <div
                        className="company-logo"
                        style={{ background: job.color }}
                      >
                        {job.company}
                      </div>

                      <div className="job-info">
                        <h3>{job.title}</h3>
                        <p>{job.companyName}</p>

                        <div className="job-tags">
                          <span className="job-tag">
                            <MapPin size={11} />
                            {job.location}
                          </span>
                          <span className="job-tag">{job.type}</span>
                          <span className="job-tag">
                            <Wallet size={11} />
                            {job.salary}
                          </span>
                        </div>
                      </div>

                      <button
                        className="icon-button"
                        aria-label={`View ${job.title}`}
                      >
                        <ArrowRight size={16} />
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section>
              <div className="section-heading">
                <div>
                  <h2>Recent Activity</h2>
                  <p>Your latest application updates.</p>
                </div>
                <a href="#" className="text-link">
                  View all
                </a>
              </div>

              <div className="panel">
                <div className="activity-list">
                  {activities.map((activity) => (
                    <article className="activity-item" key={activity.title}>
                      <div className="activity-dot">
                        <Building2 size={16} />
                      </div>

                      <div>
                        <h3>{activity.title}</h3>
                        <p>{activity.company}</p>
                        <p style={{ marginTop: 3 }}>
                          <CalendarDays
                            size={11}
                            style={{
                              display: "inline",
                              verticalAlign: "middle",
                              marginRight: 4,
                            }}
                          />
                          {activity.date}
                        </p>

                        <span
                          className={`status ${activity.status.toLowerCase()}`}
                        >
                          {activity.status}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
