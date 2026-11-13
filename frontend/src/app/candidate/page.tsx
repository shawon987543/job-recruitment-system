
"use client";

import { FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import Skeleton from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/api";
import "./candidate-dashboard.css";

interface LoggedInUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface CandidateProfilePicture {
  profilePictureUrl?: string | null;
}

function profilePictureSrc(pictureUrl?: string | null) {
  if (!pictureUrl) return "";
  if (pictureUrl.startsWith("http://") || pictureUrl.startsWith("https://")) {
    return pictureUrl;
  }

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
  const serverUrl = apiUrl.replace(/\/api\/?$/, "");

  return `${serverUrl}${pictureUrl.startsWith("/") ? "" : "/"}${pictureUrl}`;
}

export default function CandidateDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let isMounted = true;
    const token = sessionStorage.getItem("access_token");
    const savedUser = sessionStorage.getItem("user");

    if (!token || !savedUser) {
      router.replace("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(savedUser) as LoggedInUser;

      if (parsedUser.role !== "CANDIDATE") {
        router.replace("/login");
        return;
      }

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(parsedUser);

      setLoading(false);
      void apiRequest("/candidate-profile")
        .then((profile: CandidateProfilePicture) => {
          if (isMounted) {
            setProfilePictureUrl(profile.profilePictureUrl ?? null);
          }
        })
        .catch(() => {
          // Keep the initials avatar if the profile picture cannot be loaded.
        });
    } catch {
      router.replace("/login");
    } finally {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [router]);

  function handleLogout() {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("user");
    toast.success("Signed out.");
    router.replace("/login");
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const query = searchTerm.trim();
    router.push(
      query
        ? `/candidate/jobs?title=${encodeURIComponent(query)}`
        : "/candidate/jobs",
    );
  }

  if (!loading && !user) return null;

  const firstName = user?.name?.trim().split(/\s+/)[0] || "Candidate";
  const initial = user?.name?.trim().charAt(0).toUpperCase() || "C";

  return (
    <div className="candidate-layout">
      {mobileMenuOpen && (
        <button
          className="candidate-mobile-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`candidate-sidebar ${
          mobileMenuOpen ? "candidate-sidebar-open" : ""
        }`}
      >
        <div className="candidate-brand">
          <div className="candidate-brand-icon">
            <BriefcaseBusiness size={22} />
          </div>
          <span>CareerHub</span>
          <button
            className="candidate-mobile-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={21} />
          </button>
        </div>

        <div className="candidate-sidebar-label">MENU</div>

        <nav className="candidate-nav">
          <Link
            href="/candidate"
            className="candidate-nav-link candidate-nav-active"
            onClick={() => setMobileMenuOpen(false)}
          >
            <LayoutDashboard size={19} />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/candidate/jobs"
            className="candidate-nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Search size={19} />
            <span>Browse Jobs</span>
          </Link>

          <Link
            href="/candidate/applications"
            className="candidate-nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            <FileText size={19} />
            <span>My Applications</span>
          </Link>

          <Link
            href="/candidate/profile"
            className="candidate-nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            <UserRound size={19} />
            <span>My Profile</span>
          </Link>
        </nav>

        <div className="candidate-sidebar-bottom">
          <div className="candidate-sidebar-tip">
            <div className="candidate-tip-icon">
              <Sparkles size={18} />
            </div>
            <h4>Build your career</h4>
            <p>Keep your profile updated to make a strong impression.</p>
            <Link href="/candidate/profile">
              Update profile <ArrowRight size={14} />
            </Link>
          </div>

          <button
            className="candidate-logout-link"
            onClick={handleLogout}
          >
            <LogOut size={19} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <main className="candidate-main">
        <header className="candidate-topbar">
          <div className="candidate-topbar-left">
            <button
              className="candidate-menu-button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={22} />
            </button>
            <div>
              <p className="candidate-breadcrumb">Workspace / Dashboard</p>
              <h2>Dashboard</h2>
            </div>
          </div>

          <div className="candidate-topbar-right">
            <button
              className="candidate-icon-button"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={19} />
            </button>

            <div className="candidate-user-info">
              <div className="candidate-avatar">
                {profilePictureUrl ? (
                  <Image
                    src={profilePictureSrc(profilePictureUrl)}
                    alt=""
                    width={39}
                    height={39}
                    unoptimized
                  />
                ) : (
                  loading ? "C" : initial
                )}
              </div>
              <div className="candidate-user-text">
                <strong>{loading ? "Candidate" : user?.name}</strong>
                <span>Candidate</span>
              </div>
            </div>
          </div>
        </header>

        <div className="candidate-content">
          <section className="candidate-hero">
            <div className="candidate-hero-content">
              <span className="candidate-hero-eyebrow">
                <Sparkles size={15} /> YOUR CAREER JOURNEY STARTS HERE
              </span>

              <h1>
                Hello, {firstName}! <span>👋</span>
              </h1>

              <p>
                Find the right opportunity, showcase your skills, and take
                the next step toward your dream career.
              </p>

              <form className="candidate-search-form" onSubmit={handleSearch}>
                <Search size={20} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search job titles, skills, or keywords..."
                  aria-label="Search jobs"
                />
                <button type="submit">
                  Find Jobs <ArrowRight size={17} />
                </button>
              </form>
            </div>

            <div className="candidate-hero-decoration">
              <div className="candidate-hero-circle candidate-circle-one" />
              <div className="candidate-hero-circle candidate-circle-two" />
              <div className="candidate-hero-illustration">
                <BriefcaseBusiness size={76} strokeWidth={1.2} />
                <Sparkles className="candidate-hero-sparkle" size={27} />
              </div>
            </div>
          </section>

          <section className="candidate-section">
            <div className="candidate-section-heading">
              <div>
                <h2>Quick access</h2>
                <p>Everything you need for your job search.</p>
              </div>
            </div>

            <div className="candidate-action-grid">
              {loading ? (
                [0, 1, 2].map((item) => (
                  <div className="candidate-action-card" key={item} aria-hidden="true">
                    <Skeleton variant="circle" width={45} height={45} />
                    <div style={{ flex: 1, display: "grid", gap: 9 }}>
                      <Skeleton variant="text" width="65%" height={16} />
                      <Skeleton variant="text" width="85%" height={12} />
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <Link
                    href="/candidate/jobs"
                    className="candidate-action-card action-blue"
                  >
                    <div className="candidate-action-icon">
                      <Search size={23} />
                    </div>
                    <div className="candidate-action-text">
                      <h3>Explore Jobs</h3>
                      <p>Discover opportunities that match your skills.</p>
                    </div>
                    <ArrowRight className="candidate-action-arrow" size={19} />
                  </Link>

                  <Link
                    href="/candidate/applications"
                    className="candidate-action-card action-green"
                  >
                    <div className="candidate-action-icon">
                      <FileText size={23} />
                    </div>
                    <div className="candidate-action-text">
                      <h3>My Applications</h3>
                      <p>Review and track your submitted applications.</p>
                    </div>
                    <ArrowRight className="candidate-action-arrow" size={19} />
                  </Link>

                  <Link
                    href="/candidate/profile"
                    className="candidate-action-card action-purple"
                  >
                    <div className="candidate-action-icon">
                      <UserRound size={23} />
                    </div>
                    <div className="candidate-action-text">
                      <h3>My Profile</h3>
                      <p>Update your personal details and professional skills.</p>
                    </div>
                    <ArrowRight className="candidate-action-arrow" size={19} />
                  </Link>
                </>
              )}

              {/* Removed the old Education & Experience dashboard card. */}
              
            </div>
          </section>

          <section className="candidate-bottom-grid">
            {loading ? (
              <>
                {[0, 1].map((panel) => (
                  <div
                    className="candidate-panel"
                    key={panel}
                    aria-hidden="true"
                    style={{ display: "grid", gap: 18 }}
                  >
                    <Skeleton variant="text" width="45%" height={20} />
                    {[0, 1, 2].map((row) => (
                      <Skeleton key={row} variant="rectangle" height={48} />
                    ))}
                  </div>
                ))}
              </>
            ) : (
              <>
            <div className="candidate-panel candidate-getting-started">
              <div className="candidate-panel-heading">
                <div>
                  <h2>Get started</h2>
                  <p>Make the most of your CareerHub account.</p>
                </div>
                <Sparkles size={21} />
              </div>

              <div className="candidate-start-item">
                <div className="candidate-start-number">01</div>
                <div>
                  <h3>Complete your profile</h3>
                  <p>Add your contact details, skills, and professional bio.</p>
                </div>
                <Link href="/candidate/profile" aria-label="Complete profile">
                  <ArrowRight size={18} />
                </Link>
              </div>

              <div className="candidate-start-item">
                <div className="candidate-start-number">02</div>
                <div>
                  <h3>Upload your resume</h3>
                  <p>Give employers a better understanding of your experience.</p>
                </div>
                <Link href="/candidate/profile" aria-label="Upload resume">
                  <ArrowRight size={18} />
                </Link>
              </div>

              <div className="candidate-start-item">
                <div className="candidate-start-number">03</div>
                <div>
                  <h3>Find your next opportunity</h3>
                  <p>Browse published jobs and apply for suitable positions.</p>
                </div>
                <Link href="/candidate/jobs" aria-label="Browse jobs">
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>

            <div className="candidate-panel candidate-profile-panel">
              <div className="candidate-profile-panel-icon">
                {profilePictureUrl ? (
                  <Image
                    src={profilePictureSrc(profilePictureUrl)}
                    alt=""
                    width={45}
                    height={45}
                    unoptimized
                  />
                ) : (
                  <UserRound size={25} />
                )}
              </div>
              <span className="candidate-profile-label">YOUR ACCOUNT</span>
              <h2>{user?.name}</h2>
              <p>{user?.email}</p>

              <div className="candidate-profile-divider" />

              <div className="candidate-profile-detail">
                <span>Account type</span>
                <strong>Candidate</strong>
              </div>

              <div className="candidate-profile-detail">
                <span>Account status</span>
                <strong className="candidate-status-active">Active</strong>
              </div>

              <Link
                href="/candidate/profile"
                className="candidate-profile-button"
              >
                Manage profile <ArrowRight size={16} />
              </Link>
            </div>
              </>
            )}
          </section>

          <footer className="candidate-footer">
            <span>© {new Date().getFullYear()} CareerHub. All rights reserved.</span>
            <span>Building your future, one opportunity at a time.</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
