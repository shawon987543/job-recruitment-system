"use client";
import { useToastErrorState } from "@/components/ui/toast-message-state";
import toast from "react-hot-toast";

import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  Mail,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useToastErrorState();
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);
    const loadingToast = toast.loading("Sending reset instructions...");

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "Unable to process your request.",
        );
      }

      toast.success("If an account exists for this email, password reset instructions have been sent.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      toast.dismiss(loadingToast);
      setLoading(false);
    }
  }

  return (
    <main className="forgot-page">
      <style>{`
        .forgot-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 30px 18px;
          background: linear-gradient(135deg, #eef4ff, #f8faff);
          box-sizing: border-box;
        }

        .forgot-page .forgot-card {
          width: 100%;
          max-width: 440px;
          padding: 40px 36px 28px;
          background: #ffffff;
          border: 1px solid #e8edf5;
          border-radius: 20px;
          box-shadow: 0 15px 50px rgba(25, 45, 85, 0.09);
          box-sizing: border-box;
          text-align: center;
        }

        .forgot-page .forgot-brand {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 32px;
          color: #172554;
          font-size: 22px;
          font-weight: 800;
        }

        .forgot-page .forgot-brand-icon,
        .forgot-page .forgot-icon,
        .forgot-page .forgot-success-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
        }

        .forgot-page .forgot-brand-icon {
          width: 42px;
          height: 42px;
          background: #2563eb;
          color: #ffffff;
        }

        .forgot-page .forgot-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 20px;
          border-radius: 16px;
          background: #eff6ff;
          color: #2563eb;
        }

        .forgot-page h1 {
          margin: 0 0 10px;
          color: #172554;
          font-size: 26px;
          font-weight: 700;
        }

        .forgot-page .forgot-text {
          margin: 0 auto 28px;
          max-width: 340px;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
        }

        .forgot-page .forgot-form {
          text-align: left;
        }

        .forgot-page .forgot-label {
          display: block;
          margin-bottom: 8px;
          color: #334155;
          font-size: 13px;
          font-weight: 600;
        }

        .forgot-page .forgot-input {
          display: flex;
          align-items: center;
          gap: 10px;
          height: 48px;
          padding: 0 14px;
          margin-bottom: 20px;
          border: 1px solid #dbe3ef;
          border-radius: 10px;
          background: #ffffff;
          color: #94a3b8;
          box-sizing: border-box;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .forgot-page .forgot-input:focus-within {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }

        .forgot-page .forgot-input input {
          flex: 1;
          min-width: 0;
          height: 100%;
          border: none;
          outline: none;
          background: transparent;
          color: #172554;
          font-size: 14px;
        }

        .forgot-page .forgot-input input::placeholder {
          color: #94a3b8;
        }

        .forgot-page .forgot-submit {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 48px;
          margin: 0;
          padding: 0;
          border: none;
          border-radius: 10px;
          background: #2563eb;
          color: #ffffff;
          font-size: 15px;
          font-weight: 600;
          line-height: 1;
          cursor: pointer;
          transition: background 0.2s;
        }

        .forgot-page .forgot-submit:hover {
          background: #1d4ed8;
        }

        .forgot-page .forgot-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .forgot-page .forgot-error {
          margin-bottom: 18px;
          padding: 12px;
          border: 1px solid #fecaca;
          border-radius: 10px;
          background: #fef2f2;
          color: #b91c1c;
          font-size: 13px;
          text-align: left;
        }

        .forgot-page .forgot-success-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 20px;
          border-radius: 50%;
          background: #ecfdf5;
          color: #059669;
        }

        .forgot-page .forgot-back {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 24px;
          color: #2563eb;
          font-size: 14px;
          font-weight: 600;
          line-height: 1;
          text-decoration: none;
        }

        .forgot-page .forgot-back:hover {
          text-decoration: underline;
        }

        .forgot-page .forgot-footer {
          margin-top: 28px;
          color: #94a3b8;
          font-size: 12px;
          text-align: center;
        }

        @media (max-width: 480px) {
          .forgot-page .forgot-card {
            padding: 32px 22px 24px;
          }
        }
      `}</style>

      <section className="forgot-card">
        <div className="forgot-brand">
          <div className="forgot-brand-icon">
            <BriefcaseBusiness size={24} />
          </div>
          <span>CareerHub</span>
        </div>

        {!success ? (
          <>
            <div className="forgot-icon">
              <Mail size={28} />
            </div>

            <h1>Forgot Password?</h1>
            <p className="forgot-text">
              No worries! Enter your registered email address and we&apos;ll
              send you instructions to reset your password.
            </p>

            {error && <div className="forgot-error">{error}</div>}

            <form className="forgot-form" onSubmit={handleSubmit}>
              <label className="forgot-label" htmlFor="email">
                Email address
              </label>

              <div className="forgot-input">
                <Mail size={18} />
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  maxLength={255}
                  autoComplete="email"
                />
              </div>

              <button
                type="submit"
                className="forgot-submit"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="forgot-success-icon">
              <CheckCircle2 size={32} />
            </div>

            <h1>Check Your Email</h1>
            <p className="forgot-text">
              If an account with that email exists, password reset instructions
              have been sent. Please check your inbox and spam folder.
            </p>

            <button
              type="button"
              className="forgot-submit"
              onClick={() => {
                setSuccess(false);
                setEmail("");
              }}
            >
              Try Another Email
            </button>
          </>
        )}

        <Link href="/login" className="forgot-back">
          <ArrowLeft size={16} />
          <span>Back to Login</span>
        </Link>

        <div className="forgot-footer">
          © {new Date().getFullYear()} CareerHub. All rights reserved.
        </div>
      </section>
    </main>
  );
}
