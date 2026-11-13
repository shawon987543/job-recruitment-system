
"use client";
import { useToastErrorState } from "@/components/ui/toast-message-state";
import toast from "react-hot-toast";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export default function CandidateSignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useToastErrorState();
  const [loading, setLoading] = useState(false);

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (
      password.length < 8 ||
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      setError(
        "Password must contain at least 8 characters, including uppercase, lowercase and a number.",
      );
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading("Creating your account...");

    try {
      // 1. Register candidate account.
      const registerResponse = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const registerData = await registerResponse.json();

      if (!registerResponse.ok) {
        throw new Error(
          Array.isArray(registerData.message)
            ? registerData.message.join(", ")
            : registerData.message || "Registration failed.",
        );
      }

      // 2. Automatically log in after registration.
      const loginResponse = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const loginData = await loginResponse.json();

      if (!loginResponse.ok) {
        throw new Error(
          Array.isArray(loginData.message)
            ? loginData.message.join(", ")
            : loginData.message ||
                "Account created, but automatic login failed. Please log in.",
        );
      }

      if (
        !loginData.access_token ||
        !loginData.refresh_token ||
        loginData.user?.role !== "CANDIDATE"
      ) {
        throw new Error(
          "Account created, but the login response is incomplete or the account role is incorrect. Please log in.",
        );
      }

      // 3. Save authentication information.
      sessionStorage.setItem("access_token", loginData.access_token);
      sessionStorage.setItem("refresh_token", loginData.refresh_token);
      sessionStorage.setItem("user", JSON.stringify(loginData.user));
      toast.success("Your account is ready.");

      // 4. Redirect to existing Candidate Dashboard.
      window.location.href = "/candidate";
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create your account.",
      );
    } finally {
      toast.dismiss(loadingToast);
      setLoading(false);
    }
  }

  return (
    <main className="signup-page">
      <div className="signup-card">
        <Link href="/" className="brand">
          CareerHub
        </Link>

        <div className="heading">
          <h1>Create Candidate Account</h1>
          <p>Join CareerHub and find your next opportunity.</p>
        </div>

        <form onSubmit={handleSignup}>
          {/* Full Name */}
          <div className="form-group">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              type="text"
              name="signup-name"
              autoComplete="name"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={150}
              required
            />
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              name="signup-email"
              autoComplete="off"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={255}
              required
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password">Password</label>

            <div className="password-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="signup-password"
                autoComplete="new-password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                maxLength={72}
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

            <small>
              Minimum 8 characters, with uppercase, lowercase and a number.
            </small>
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm password</label>

            <div className="password-wrapper">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                name="confirm-password"
                autoComplete="new-password"
                placeholder="Enter your password again"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                maxLength={72}
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && <div className="error-message">{error}</div>}

          {/* Submit */}
          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create Candidate Account"}
          </button>
        </form>

        <p className="login-link">
          Already have an account? <Link href="/">Sign in</Link>
        </p>
      </div>

      <style jsx>{`
        .signup-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 16px;
          background: #f4f7fb;
        }

        .signup-card {
          width: 100%;
          max-width: 460px;
          padding: 36px;
          background: white;
          border: 1px solid #e5eaf1;
          border-radius: 16px;
          box-shadow: 0 12px 40px rgba(15, 23, 42, 0.07);
        }

        .brand {
          display: inline-block;
          margin-bottom: 28px;
          color: #2563eb;
          font-size: 25px;
          font-weight: 800;
          text-decoration: none;
        }

        .heading {
          margin-bottom: 28px;
        }

        .heading h1 {
          margin: 0 0 8px;
          color: #172033;
          font-size: 25px;
          font-weight: 750;
        }

        .heading p {
          margin: 0;
          color: #64748b;
          font-size: 14px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 19px;
        }

        .form-group label {
          color: #334155;
          font-size: 14px;
          font-weight: 600;
        }

        .form-group input {
          width: 100%;
          box-sizing: border-box;
          padding: 13px 14px;
          border: 1px solid #dbe2ea;
          border-radius: 9px;
          outline: none;
          color: #172033;
          font-size: 14px;
        }

        .form-group input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .form-group small {
          color: #64748b;
          font-size: 12px;
        }

        .password-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .password-wrapper input {
          padding-right: 48px;
        }

        .password-toggle {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          width: 32px;
          height: 32px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          color: #64748b;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }

        .password-toggle:hover {
          background: #eff6ff;
          color: #2563eb;
        }

        .submit-button {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 9px;
          background: #2563eb;
          color: white;
          font-size: 15px;
          font-weight: 650;
          cursor: pointer;
        }

        .submit-button:hover {
          background: #1d4ed8;
        }

        .submit-button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .error-message {
          margin-bottom: 18px;
          padding: 12px;
          border-radius: 8px;
          background: #fef2f2;
          color: #b91c1c;
          font-size: 13px;
        }

        .login-link {
          margin: 24px 0 0;
          text-align: center;
          color: #64748b;
          font-size: 14px;
        }

        .login-link a {
          color: #2563eb;
          font-weight: 600;
          text-decoration: none;
        }

        @media (max-width: 480px) {
          .signup-card {
            padding: 25px 20px;
          }
        }
      `}</style>
    </main>
  );
}
