
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

interface CompanyAdminForm {
  name: string;
  email: string;
  adminName: string;
  adminEmail: string;
  contactPhone: string;
  website: string;
  address: string;
  description: string;
}

const initialForm: CompanyAdminForm = {
  name: "",
  email: "",
  adminName: "",
  adminEmail: "",
  contactPhone: "",
  website: "",
  address: "",
  description: "",
};

export default function CompanyAdminSignupPage() {
  const [form, setForm] = useState<CompanyAdminForm>(initialForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (
      form.email.trim().toLowerCase() ===
      form.adminEmail.trim().toLowerCase()
    ) {
      setError(
        "Company email and Admin email must be different."
      );
      return;
    }

    setLoading(true);

    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:3000/api";

      const response = await fetch(
        `${baseUrl}/companies/register-admin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            adminName: form.adminName.trim(),
            adminEmail: form.adminEmail.trim(),
            contactPhone: form.contactPhone.trim(),
            website: form.website.trim() || undefined,
            address: form.address.trim() || undefined,
            description: form.description.trim() || undefined,
          }),
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMessage = Array.isArray(result.message)
          ? result.message.join(", ")
          : result.message;

        throw new Error(
          errorMessage || "Unable to submit your application."
        );
      }

      setMessage(
        result.message ||
          "Your Company Admin registration request has been submitted successfully. Please wait for Super Admin approval."
      );

      setForm(initialForm);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #d1d5db",
    borderRadius: "9px",
    fontSize: "14px",
    outline: "none",
    background: "#ffffff",
    color: "#111827",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "7px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#374151",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 16px",
        background:
          "linear-gradient(135deg, #eff6ff 0%, #f8fafc 55%, #eef2ff 100%)",
      }}
    >
      <div
        style={{
          maxWidth: "760px",
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: "18px",
          padding: "36px",
          boxShadow: "0 12px 40px rgba(15, 23, 42, 0.08)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              margin: "0 auto 14px",
              borderRadius: "14px",
              background: "#2563eb",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "25px",
              fontWeight: 800,
            }}
          >
            C
          </div>

          <h1
            style={{
              fontSize: "27px",
              fontWeight: 800,
              color: "#111827",
              margin: "0 0 10px",
            }}
          >
            Company Admin Registration
          </h1>

          <p
            style={{
              color: "#6b7280",
              fontSize: "14px",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Register your company and apply for a Company Admin
            account. Your request will be reviewed by the Super Admin.
          </p>
        </div>

        {message && (
          <div
            role="status"
            style={{
              padding: "14px",
              borderRadius: "9px",
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              color: "#047857",
              fontSize: "14px",
              marginBottom: "20px",
            }}
          >
            {message}
          </div>
        )}

        {error && (
          <div
            role="alert"
            style={{
              padding: "14px",
              borderRadius: "9px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              fontSize: "14px",
              marginBottom: "20px",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <h2
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#1f2937",
              marginBottom: "18px",
            }}
          >
            Company Information
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "18px",
            }}
          >
            <div>
              <label style={labelStyle} htmlFor="name">
                Company Name *
              </label>
              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter company name"
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={labelStyle} htmlFor="email">
                Company Email *
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="company@example.com"
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={labelStyle} htmlFor="contactPhone">
                Contact Phone *
              </label>
              <input
                id="contactPhone"
                type="tel"
                name="contactPhone"
                value={form.contactPhone}
                onChange={handleChange}
                placeholder="Enter contact phone"
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={labelStyle} htmlFor="website">
                Company Website
              </label>
              <input
                id="website"
                type="url"
                name="website"
                value={form.website}
                onChange={handleChange}
                placeholder="https://example.com"
                style={inputStyle}
              />
            </div>
          </div>

          <hr
            style={{
              border: 0,
              borderTop: "1px solid #e5e7eb",
              margin: "28px 0",
            }}
          />

          <h2
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#1f2937",
              marginBottom: "18px",
            }}
          >
            Admin Account Information
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "18px",
            }}
          >
            <div>
              <label style={labelStyle} htmlFor="adminName">
                Admin Full Name *
              </label>
              <input
                id="adminName"
                name="adminName"
                value={form.adminName}
                onChange={handleChange}
                placeholder="Enter admin full name"
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={labelStyle} htmlFor="adminEmail">
                Admin Email *
              </label>
              <input
                id="adminEmail"
                type="email"
                name="adminEmail"
                value={form.adminEmail}
                onChange={handleChange}
                placeholder="admin@example.com"
                style={inputStyle}
                required
              />
            </div>
          </div>

          <hr
            style={{
              border: 0,
              borderTop: "1px solid #e5e7eb",
              margin: "28px 0",
            }}
          />

          <h2
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#1f2937",
              marginBottom: "18px",
            }}
          >
            Additional Information
          </h2>

          <div style={{ marginBottom: "18px" }}>
            <label style={labelStyle} htmlFor="address">
              Company Address
            </label>
            <textarea
              id="address"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Enter company address"
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={labelStyle} htmlFor="description">
              Company Description
            </label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Tell us about your company"
              rows={4}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              border: "none",
              borderRadius: "9px",
              background: loading ? "#93c5fd" : "#2563eb",
              color: "#ffffff",
              fontSize: "15px",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Submitting Request..." : "Submit Registration"}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: "24px",
            color: "#6b7280",
            fontSize: "14px",
          }}
        >
          Already have an account?{" "}
          <Link
            href="/"
            style={{
              color: "#2563eb",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Back to Login
          </Link>
        </p>
      </div>
    </main>
  );
}
