"use client";
import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export default function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToken(params.get("token") || "");
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!token) {
      setError("Invalid or missing password reset link.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (
      newPassword.length < 8 ||
      newPassword.length > 72 ||
      !/[a-z]/.test(newPassword) ||
      !/[A-Z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword)
    ) {
      setError(
        "Password must contain 8–72 characters, including uppercase, lowercase, and a number."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "Password reset failed."
        );
      }

      setSuccess(
        "Your password has been reset successfully. You can now log in."
      );

      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="reset-page">
      <section className="reset-card">
        <Link href="/login" className="reset-brand">
          Career<span>Hub</span>
        </Link>

        <div className="reset-icon">🔐</div>

        <h1>Reset your password</h1>

        <p className="reset-description">
          Create a new password for your CareerHub account.
        </p>

        {error && (
          <div className="reset-message reset-error">
            {error}
          </div>
        )}

        {success && (
          <div className="reset-message reset-success">
            {success}
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit}>
            <div className="reset-field">
              <label htmlFor="newPassword">New Password</label>
              <input
                id="newPassword"
                type="password"
                placeholder="Enter your new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
              />
            </div>

            <div className="reset-field">
              <label htmlFor="confirmPassword">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
              />
            </div>

            <p className="reset-hint">
              Use at least 8 characters with an uppercase letter,
              a lowercase letter, and a number.
            </p>

            <button
              type="submit"
              disabled={loading || !token}
              className="reset-button"
            >
              {loading ? "Resetting Password..." : "Reset Password"}
            </button>
          </form>
        )}

        {success ? (
          <Link href="/login" className="reset-login-link">
            Go to Login →
          </Link>
        ) : (
          <Link href="/login" className="reset-back-link">
            ← Back to Login
          </Link>
        )}

        <div className="reset-footer">
          © {new Date().getFullYear()} CareerHub. All rights reserved.
        </div>
      </section>

      <style jsx>{`
        .reset-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 30px 18px;
          background: linear-gradient(135deg, #eef4ff, #f8faff);
        }

        .reset-card {
          width: 100%;
          max-width: 460px;
          padding: 42px 38px;
          background: #ffffff;
          border: 1px solid #e8edf5;
          border-radius: 20px;
          box-shadow: 0 15px 50px rgba(25, 45, 85, 0.09);
          text-align: center;
        }

        .reset-brand {
          display: inline-block;
          margin-bottom: 28px;
          color: #172554;
          font-size: 27px;
          font-weight: 800;
          text-decoration: none;
          letter-spacing: -1px;
        }

        .reset-brand span {
          color: #2563eb;
        }

        .reset-icon {
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          border-radius: 18px;
          background: #eff6ff;
          font-size: 29px;
        }

        h1 {
          margin: 0 0 10px;
          color: #172554;
          font-size: 27px;
          font-weight: 750;
        }

        .reset-description {
          margin: 0 0 28px;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
        }

        .reset-field {
          margin-bottom: 20px;
          text-align: left;
        }

        .reset-field label {
          display: block;
          margin-bottom: 8px;
          color: #334155;
          font-size: 13px;
          font-weight: 650;
        }

        .reset-field input {
          width: 100%;
          height: 49px;
          box-sizing: border-box;
          padding: 0 14px;
          border: 1px solid #dbe3ef;
          border-radius: 9px;
          outline: none;
          background: #fff;
          color: #172554;
          font-size: 14px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .reset-field input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .reset-hint {
          margin: -5px 0 22px;
          color: #64748b;
          font-size: 12px;
          line-height: 1.6;
          text-align: left;
        }

        .reset-button {
          width: 100%;
          height: 50px;
          border: none;
          border-radius: 9px;
          background: #2563eb;
          color: #fff;
          font-size: 15px;
          font-weight: 650;
          cursor: pointer;
          transition: background 0.2s;
        }

        .reset-button:hover {
          background: #1d4ed8;
        }

        .reset-button:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .reset-message {
          margin-bottom: 20px;
          padding: 13px;
          border-radius: 9px;
          font-size: 13px;
          line-height: 1.6;
          text-align: left;
        }

        .reset-error {
          border: 1px solid #fecaca;
          background: #fef2f2;
          color: #b91c1c;
        }

        .reset-success {
          border: 1px solid #bbf7d0;
          background: #f0fdf4;
          color: #166534;
        }

        .reset-back-link,
        .reset-login-link {
          display: inline-block;
          margin-top: 25px;
          color: #2563eb;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
        }

        .reset-footer {
          margin-top: 35px;
          color: #94a3b8;
          font-size: 11px;
        }

        @media (max-width: 480px) {
          .reset-card {
            padding: 32px 22px;
          }

          h1 {
            font-size: 24px;
          }
        }
      `}</style>
    </main>
  );
}
