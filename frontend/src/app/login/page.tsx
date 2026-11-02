"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  LockKeyhole,
  Mail,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "Login failed",
        );
      }

      // Save authentication information.
      sessionStorage.setItem("access_token", data.access_token);
      sessionStorage.setItem("refresh_token", data.refresh_token);
      sessionStorage.setItem("user", JSON.stringify(data.user));

      // First login: require password change.
      if (data.user?.mustChangePassword) {
        router.push("/change-password");
        return;
      }

      // Redirect according to the user's role.
      switch (data.user?.role) {
        case "SUPER_ADMIN":
          router.push("/admin");
          break;

        case "COMPANY_ADMIN":
          router.push("/company");
          break;

        case "CANDIDATE":
          router.push("/");
          break;

        default:
          sessionStorage.clear();
          throw new Error("Your account role is not recognized.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to log in",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
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
          <label>Email address</label>

          <div className="login-input">
            <Mail size={18} />
            <input
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <label>Password</label>

          <div className="login-input">
            <LockKeyhole size={18} />
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="login-error">{error}</p>
          )}

          <button
            className="login-submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="login-footer">
          CareerHub Account Portal
        </p>
      </section>
    </main>
  );
}
