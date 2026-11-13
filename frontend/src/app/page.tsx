"use client";
import { useToastErrorState } from "@/components/ui/toast-message-state";
import toast from "react-hot-toast";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BriefcaseBusiness,
  Building2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserPlus,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useToastErrorState();
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await toast.promise(
        (async () => {
          const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
          });
          const result = await response.json();

          if (!response.ok) {
            throw new Error(
              Array.isArray(result.message)
                ? result.message.join(", ")
                : result.message || "Login failed",
            );
          }

          return result;
        })(),
        {
          loading: "Signing in...",
          success: "Signed in successfully.",
          error: (err) =>
            err instanceof Error ? err.message : "Unable to log in.",
        },
      );

      sessionStorage.setItem("access_token", data.access_token);
      sessionStorage.setItem("refresh_token", data.refresh_token);
      sessionStorage.setItem("user", JSON.stringify(data.user));

      if (data.user?.mustChangePassword) {
        router.push("/change-password");
        return;
      }

      switch (data.user?.role) {
        case "SUPER_ADMIN":
          window.location.href = "/admin";
          return;

        case "COMPANY_ADMIN":
          window.location.href = "/company-admin";
          return;

        case "CANDIDATE":
          window.location.href = "/candidate";
          return;

        default:
          sessionStorage.clear();
          toast.error("Your account role is not recognized.");
          throw new Error("Your account role is not recognized.");
      }
    } catch {
      // toast.promise reports login request errors.
    } finally {
        setTimeout(()=>{
          setLoading(false);
        }, 2000);
    }
  }

  return (
    <main className="login-page">
      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%);
          font-family: inherit;
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          padding: 40px 36px 28px;
          background: #ffffff;
          border-radius: 18px;
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
          box-sizing: border-box;
        }

        .login-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 28px;
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
        }

        .login-brand-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #2563eb;
          color: #ffffff;
        }

        .login-heading h1 {
          margin: 0 0 6px;
          font-size: 28px;
          font-weight: 700;
          color: #0f172a;
        }

        .login-heading p {
          margin: 0 0 24px;
          font-size: 14px;
          color: #64748b;
        }

        .login-card label {
          display: block;
          margin: 16px 0 8px;
          font-size: 13px;
          font-weight: 600;
          color: #1e293b;
        }

        .login-input {
          display: flex;
          align-items: center;
          gap: 10px;
          height: 46px;
          padding: 0 14px;
          border: 1px solid #dbe3f0;
          border-radius: 10px;
          background: #ffffff;
          color: #64748b;
          box-sizing: border-box;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .login-input:focus-within {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }

        .login-input input {
          flex: 1;
          min-width: 0;
          height: 100%;
          border: none;
          outline: none;
          background: transparent;
          font-size: 14px;
          color: #0f172a;
        }

        .password-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 30px;
          height: 30px;
          padding: 0;
          border: none;
          border-radius: 6px;
          background: transparent;
          color: #64748b;
          cursor: pointer;
        }

        .password-toggle:hover {
          background: #eff6ff;
          color: #2563eb;
        }

        .forgot-password-wrapper {
          display: flex;
          justify-content: flex-end;
          margin: 10px 0 20px;
        }

        .forgot-password-link {
          color: #2563eb;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
        }

        .forgot-password-link:hover {
          color: #1d4ed8;
          text-decoration: underline;
        }

        .login-error {
          margin: 0 0 14px;
          padding: 10px 12px;
          border-radius: 8px;
          background: #fef2f2;
          color: #b91c1c;
          font-size: 13px;
        }

        .login-submit {
          width: 100%;
          height: 46px;
          border: none;
          border-radius: 10px;
          background: #2563eb;
          color: #ffffff;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .login-submit:hover {
          background: #1d4ed8;
        }

        .login-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .signup-section {
          margin-top: 26px;
        }

        .signup-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          color: #64748b;
          font-size: 12px;
          font-weight: 500;
        }

        .signup-divider::before,
        .signup-divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: #e2e8f0;
        }

        .signup-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .signup-card {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          padding: 12px;
          border: 1px solid #dbe3f0;
          border-radius: 10px;
          background: #ffffff;
          color: #1e293b;
          text-decoration: none;
          box-sizing: border-box;
          transition: all 0.2s ease;
        }

        .signup-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
        }

        .signup-card-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          flex-shrink: 0;
          border-radius: 8px;
        }

        .signup-card-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .signup-card-text strong {
          font-size: 13px;
          font-weight: 600;
          color: #1e293b;
        }

        .signup-card-text small {
          font-size: 11px;
          color: #64748b;
        }

        .signup-card-candidate .signup-card-icon {
          background: #eff6ff;
          color: #2563eb;
        }

        .signup-card-candidate:hover {
          border-color: #2563eb;
        }

        .signup-card-company .signup-card-icon {
          background: #ecfdf5;
          color: #059669;
        }

        .signup-card-company:hover {
          border-color: #059669;
        }

        .login-footer {
          margin: 24px 0 0;
          text-align: center;
          font-size: 12px;
          color: #94a3b8;
        }

        @media (max-width: 420px) {
          .signup-grid {
            grid-template-columns: 1fr;
          }

          .login-card {
            padding: 32px 22px 24px;
          }
        }
      `}</style>

      <section className="login-card">
        <div className="login-brand">
          <div className="login-brand-icon">
            <BriefcaseBusiness size={24} />
          </div>
          <span>CareerHub</span>
        </div>

        <div className="login-heading">
          <h1>Welcome back</h1>
          <p>Sign in to your CareerHub account.</p>
        </div>

        <form onSubmit={handleLogin}>
          <label htmlFor="login-email">Email address</label>

          <div className="login-input">
            <Mail size={18} />
            <input
              id="login-email"
              type="email"
              name="login-email"
              autoComplete="off"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <label htmlFor="login-password">Password</label>

          <div className="login-input">
            <LockKeyhole size={18} />

            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              name="login-password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff size={19} />
              ) : (
                <Eye size={19} />
              )}
            </button>
          </div>

          <div className="forgot-password-wrapper">
            <Link href="/forgot-password" className="forgot-password-link">
              Forgot Password?
            </Link>
          </div>

          {error && <p className="login-error">{error}</p>}

          <button
            type="submit"
            className="login-submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="signup-section">
          <div className="signup-divider">
            <span>New to CareerHub?</span>
          </div>

          <div className="signup-grid">
            <Link
              href="/signup/candidate"
              className="signup-card signup-card-candidate"
            >
              <span className="signup-card-icon">
                <UserPlus size={18} />
              </span>
              <span className="signup-card-text">
                <strong>Sign UP</strong>
              </span>
            </Link>

            <Link
              href="/signup/company-admin"
              className="signup-card signup-card-company"
            >
              <span className="signup-card-icon">
                <Building2 size={18} />
              </span>
              <span className="signup-card-text">
                <strong>Company Admin</strong>
              </span>
            </Link>
          </div>
        </div>

        <p className="login-footer">CareerHub Account Portal</p>
      </section>
    </main>
  );
}
