"use client";
import { useToastErrorState, useToastSuccessState } from "@/components/ui/toast-message-state";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  ShieldCheck,
  Palette,
  Moon,
  Sun,
  Monitor,
  Eye,
  EyeOff,
  Save,
  LockKeyhole,
  Mail,
  Shield,
  Menu,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

import AdminSidebar from "../../../components/admin/AdminSidebar";
import Skeleton from "@/components/ui/skeleton";
import { apiRequest } from "../../../lib/api";
import {
  useAdminTheme,
  type ThemeMode,
} from "@/providers/admin-theme-provider";

interface AdminUser {
  id?: number;
  name?: string;
  email?: string;
  role?: string;
  companyId?: number | null;
}

interface ProfileResponse {
  id?: number;
  email?: string;
  role?: string;
  companyId?: number | null;
}

type SettingsTab = "account" | "security" | "appearance";

export default function AdminSettingsPage() {
  const router = useRouter();

  const { themeMode, setThemeMode } = useAdminTheme();

  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");

  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  const [themeSaved, setThemeSaved] = useState(false);

  // Password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useToastErrorState();
  const [passwordSuccess, setPasswordSuccess] = useToastSuccessState();

  // Load admin profile
  useEffect(() => {
    let isMounted = true;

    const initializeSettings = async () => {
      const token = sessionStorage.getItem("access_token");
      const userData = sessionStorage.getItem("user");

      if (!token || !userData) {
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("refresh_token");
        sessionStorage.removeItem("user");

        router.replace("/login");
        return;
      }

      try {
        const storedUser: AdminUser = JSON.parse(userData);

        if (storedUser.role !== "SUPER_ADMIN") {
          router.replace("/");
          return;
        }

        if (isMounted) {
          setAdmin(storedUser);
        }

        try {
          const profile = (await apiRequest(
            "/auth/profile"
          )) as ProfileResponse;

          if (isMounted) {
            setAdmin({
              ...storedUser,
              id: profile.id ?? storedUser.id,
              email: profile.email ?? storedUser.email,
              role: profile.role ?? storedUser.role,
              companyId: profile.companyId ?? storedUser.companyId,
            });
          }
        } catch (error) {
          console.error("Unable to refresh admin profile:", error);
        }
      } catch {
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("refresh_token");
        sessionStorage.removeItem("user");

        router.replace("/login");
        return;
      } finally {
        if (isMounted) {
          setPageLoading(false);
        }
      }
    };

    initializeSettings();

    return () => {
      isMounted = false;
    };
  }, [router]);

  // Change theme
  const handleThemeChange = (nextTheme: ThemeMode) => {
    setThemeMode(nextTheme);
    setThemeSaved(true);

    window.setTimeout(() => {
      setThemeSaved(false);
    }, 2500);
  };

  // Change password
  const handlePasswordChange = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setPasswordError("");
    setPasswordSuccess("");

    if (
      !currentPassword.trim() ||
      !newPassword.trim() ||
      !confirmPassword.trim()
    ) {
      setPasswordError("Please complete all password fields.");
      return;
    }

    if (newPassword.length < 8 || newPassword.length > 72) {
      setPasswordError(
        "New password must be between 8 and 72 characters."
      );
      return;
    }

    if (!/[a-z]/.test(newPassword)) {
      setPasswordError(
        "New password must contain at least one lowercase letter."
      );
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      setPasswordError(
        "New password must contain at least one uppercase letter."
      );
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      setPasswordError(
        "New password must contain at least one number."
      );
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError(
        "Your new password must be different from your current password."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(
        "New password and confirmation do not match."
      );
      return;
    }

    setPasswordLoading(true);

    try {
      const result = (await apiRequest("/auth/Change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })) as { message?: string };

      setPasswordSuccess(
        result.message ||
          "Password changed successfully. Please log in again."
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem("refresh_token");
      sessionStorage.removeItem("user");

      window.setTimeout(() => {
        router.replace("/login");
      }, 2000);
    } catch (error) {
      setPasswordError(
        error instanceof Error
          ? error.message
          : "Unable to change your password. Please try again."
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  // Settings tabs
  const tabs = [
    {
      id: "account" as const,
      label: "Account",
      description: "Your administrator information",
      icon: User,
    },
    {
      id: "security" as const,
      label: "Security",
      description: "Manage your password",
      icon: ShieldCheck,
    },
    {
      id: "appearance" as const,
      label: "Appearance",
      description: "Customize your experience",
      icon: Palette,
    },
  ];

  if (pageLoading) {
    return (
      <div className="admin-layout admin-settings-page">
        <AdminSidebar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
        <main className="admin-main">
          <header className="admin-topbar admin-settings-topbar">
            <div>
              <Skeleton variant="text" width={180} height={26} />
              <Skeleton variant="text" width={310} height={14} />
            </div>
          </header>
          <div className="admin-content admin-settings-content">
            <div className="admin-settings-heading">
              <div style={{ flex: 1 }}>
                <Skeleton variant="text" width={170} height={12} />
                <Skeleton variant="text" width={240} height={28} />
                <Skeleton variant="text" width="70%" height={14} />
              </div>
              <Skeleton variant="rectangle" width={58} height={58} />
            </div>
            <div className="admin-settings-grid">
              <div className="admin-settings-tabs">
                {[0, 1, 2].map((item) => (
                  <div key={item} style={{ padding: 16 }}>
                    <Skeleton variant="text" width="78%" height={16} />
                    <Skeleton variant="text" width="58%" height={12} />
                  </div>
                ))}
              </div>
              <div className="admin-settings-panel">
                <Skeleton variant="text" width="35%" height={22} />
                <Skeleton variant="text" width="55%" height={14} />
                <div style={{ display: "grid", gap: 16, marginTop: 28 }}>
                  {[0, 1, 2, 3].map((item) => (
                    <Skeleton key={item} variant="rectangle" height={58} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-layout admin-settings-page">
      <AdminSidebar
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />

      <main className="admin-main">
        {/* Topbar */}
        <header className="admin-topbar admin-settings-topbar">
          <button
            type="button"
            className="admin-menu-button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={22} />
          </button>

          <div>
            <h1>Settings</h1>
            <p>
              Manage your account, security, and preferences.
            </p>
          </div>
        </header>

        <div className="admin-content admin-settings-content">
          {/* Page heading */}
          <div className="admin-settings-heading">
            <div>
              <span className="admin-settings-eyebrow">
                SUPER ADMIN CONTROL
              </span>

              <h2>Account Settings</h2>

              <p>
                Manage your administrator account and personalize CareerHub.
              </p>
            </div>

            <div className="admin-settings-heading-icon">
              <ShieldCheck size={28} />
            </div>
          </div>

          <div className="admin-settings-grid">
            {/* Settings sidebar */}
            <aside className="admin-settings-tabs">
              <div className="admin-settings-tabs-title">
                SETTINGS MENU
              </div>

              {tabs.map((tab) => {
                const Icon = tab.icon;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={`admin-settings-tab ${
                      activeTab === tab.id ? "active" : ""
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <span className="admin-settings-tab-icon">
                      <Icon size={19} />
                    </span>

                    <span className="admin-settings-tab-text">
                      <strong>{tab.label}</strong>
                      <small>{tab.description}</small>
                    </span>
                  </button>
                );
              })}
            </aside>

            {/* Settings content */}
            <section className="admin-settings-panel">

              {/* ACCOUNT TAB */}
              {activeTab === "account" && (
                <div>
                  <div className="admin-settings-panel-heading">
                    <div className="admin-settings-panel-icon">
                      <User size={21} />
                    </div>

                    <div>
                      <h3>Account Information</h3>
                      <p>
                        View your Super Admin account details.
                      </p>
                    </div>
                  </div>

                  <div className="admin-settings-account-card">
                    <div className="admin-settings-large-avatar">
                      {(admin?.name || "Super Admin")
                        .trim()
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <h4>{admin?.name || "Super Admin"}</h4>

                      <span>
                        <ShieldCheck size={14} />
                        Super Administrator
                      </span>
                    </div>
                  </div>

                  <div className="admin-settings-field-list">
                    <div className="admin-settings-info-field">
                      <span className="admin-settings-info-icon">
                        <User size={18} />
                      </span>

                      <div>
                        <label>Full Name</label>
                        <strong>
                          {admin?.name || "Super Admin"}
                        </strong>
                      </div>
                    </div>

                    <div className="admin-settings-info-field">
                      <span className="admin-settings-info-icon">
                        <Mail size={18} />
                      </span>

                      <div>
                        <label>Email Address</label>
                        <strong>
                          {admin?.email || "Not available"}
                        </strong>
                      </div>
                    </div>

                    <div className="admin-settings-info-field">
                      <span className="admin-settings-info-icon">
                        <Shield size={18} />
                      </span>

                      <div>
                        <label>Account Role</label>
                        <strong>SUPER_ADMIN</strong>
                      </div>
                    </div>

                    <div className="admin-settings-info-field">
                      <span className="admin-settings-info-icon">
                        <LockKeyhole size={18} />
                      </span>

                      <div>
                        <label>Account Status</label>

                        <strong className="admin-settings-active-status">
                          <span />
                          Active
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="admin-settings-note">
                    <ShieldCheck size={18} />

                    <p>
                      Your account information is managed by the CareerHub
                      authentication system.
                    </p>
                  </div>
                </div>
              )}

              {/* SECURITY TAB */}
              {activeTab === "security" && (
                <div>
                  <div className="admin-settings-panel-heading">
                    <div className="admin-settings-panel-icon">
                      <ShieldCheck size={21} />
                    </div>

                    <div>
                      <h3>Change Password</h3>
                      <p>
                        Update your password to keep your account secure.
                      </p>
                    </div>
                  </div>

                  {passwordError && (
                    <div className="admin-settings-alert error">
                      <AlertCircle size={18} />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="admin-settings-alert success">
                      <CheckCircle2 size={18} />
                      <span>
                        {passwordSuccess} Redirecting to login...
                      </span>
                    </div>
                  )}

                  <form
                    className="admin-settings-password-form"
                    onSubmit={handlePasswordChange}
                  >
                    {/* Current password */}
                    <div className="admin-settings-form-group">
                      <label htmlFor="currentPassword">
                        Current Password
                      </label>

                      <div className="admin-settings-password-input">
                        <input
                          id="currentPassword"
                          type={
                            showCurrentPassword ? "text" : "password"
                          }
                          value={currentPassword}
                          onChange={(event) =>
                            setCurrentPassword(event.target.value)
                          }
                          placeholder="Enter your current password"
                          minLength={8}
                          maxLength={72}
                          autoComplete="current-password"
                          required
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowCurrentPassword(!showCurrentPassword)
                          }
                          aria-label={
                            showCurrentPassword
                              ? "Hide current password"
                              : "Show current password"
                          }
                        >
                          {showCurrentPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* New password */}
                    <div className="admin-settings-form-group">
                      <label htmlFor="newPassword">
                        New Password
                      </label>

                      <div className="admin-settings-password-input">
                        <input
                          id="newPassword"
                          type={
                            showNewPassword ? "text" : "password"
                          }
                          value={newPassword}
                          onChange={(event) =>
                            setNewPassword(event.target.value)
                          }
                          placeholder="Enter your new password"
                          minLength={8}
                          maxLength={72}
                          autoComplete="new-password"
                          required
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowNewPassword(!showNewPassword)
                          }
                          aria-label={
                            showNewPassword
                              ? "Hide new password"
                              : "Show new password"
                          }
                        >
                          {showNewPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Confirm password */}
                    <div className="admin-settings-form-group">
                      <label htmlFor="confirmPassword">
                        Confirm New Password
                      </label>

                      <div className="admin-settings-password-input">
                        <input
                          id="confirmPassword"
                          type={
                            showConfirmPassword ? "text" : "password"
                          }
                          value={confirmPassword}
                          onChange={(event) =>
                            setConfirmPassword(event.target.value)
                          }
                          placeholder="Confirm your new password"
                          minLength={8}
                          maxLength={72}
                          autoComplete="new-password"
                          required
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          aria-label={
                            showConfirmPassword
                              ? "Hide confirmation password"
                              : "Show confirmation password"
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Password requirements */}
                    <div className="admin-settings-password-rules">
                      <strong>Password requirements</strong>

                      <ul>
                        <li>At least 8 characters</li>
                        <li>At least one uppercase letter (A-Z)</li>
                        <li>At least one lowercase letter (a-z)</li>
                        <li>At least one number (0-9)</li>
                        <li>
                          Must be different from your current password
                        </li>
                      </ul>
                    </div>

                    <button
                      type="submit"
                      className="admin-settings-submit"
                      disabled={
                        passwordLoading || !!passwordSuccess
                      }
                    >
                      {passwordLoading ? (
                        <>
                          <Loader2
                            size={18}
                            className="admin-settings-spinner"
                          />
                          Updating Password...
                        </>
                      ) : (
                        <>
                          <Save size={18} />
                          Change Password
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* APPEARANCE TAB */}
              {activeTab === "appearance" && (
                <div>
                  <div className="admin-settings-panel-heading">
                    <div className="admin-settings-panel-icon">
                      <Palette size={21} />
                    </div>

                    <div>
                      <h3>Appearance</h3>
                      <p>
                        Choose your preferred dashboard appearance.
                      </p>
                    </div>
                  </div>

                  <div className="admin-settings-appearance-section">
                    <h4>Theme Preference</h4>

                    <p>
                      Choose Light, Dark, or let your system decide
                      automatically.
                    </p>

                    <div
                      className="admin-settings-mode-buttons"
                      role="group"
                      aria-label="Theme preference"
                    >
                      <button
                        type="button"
                        className={themeMode === "light" ? "active" : ""}
                        aria-pressed={themeMode === "light"}
                        onClick={() => handleThemeChange("light")}
                      >
                        <Sun size={18} />
                        <span>Light</span>
                      </button>

                      <button
                        type="button"
                        className={themeMode === "dark" ? "active" : ""}
                        aria-pressed={themeMode === "dark"}
                        onClick={() => handleThemeChange("dark")}
                      >
                        <Moon size={18} />
                        <span>Dark</span>
                      </button>

                      <button
                        type="button"
                        className={themeMode === "system" ? "active" : ""}
                        aria-pressed={themeMode === "system"}
                        onClick={() => handleThemeChange("system")}
                      >
                        <Monitor size={18} />
                        <span>System</span>
                      </button>
                    </div>

                    {themeSaved && (
                      <div className="admin-settings-theme-saved">
                        <CheckCircle2 size={17} />
                        Theme preference saved successfully.
                      </div>
                    )}
                  </div>

                  <div className="admin-settings-note">
                    <Palette size={18} />

                    <p>
                      Your theme preference is saved in this browser
                      and applies to the admin dashboard.
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
