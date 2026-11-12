"use client";
import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  FileText,
  User,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { apiRequest } from "@/lib/api";

interface CompanyProfile {
  id: number;
  name: string;
  email: string;
  contactName: string;
  contactPhone: string;
  website: string | null;
  address: string | null;
  description: string | null;
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProfileForm {
  name: string;
  email: string;
  contactName: string;
  contactPhone: string;
  website: string;
  address: string;
  description: string;
}

const emptyForm: ProfileForm = {
  name: "",
  email: "",
  contactName: "",
  contactPhone: "",
  website: "",
  address: "",
  description: "",
};

export default function CompanyProfilePage() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiRequest("/company-admin/profile");
      const data: CompanyProfile = response.company ?? response;

      setProfile(data);
      setForm({
        name: data.name ?? "",
        email: data.email ?? "",
        contactName: data.contactName ?? "",
        contactPhone: data.contactPhone ?? "",
        website: data.website ?? "",
        address: data.address ?? "",
        description: data.description ?? "",
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load company profile.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProfile();
  }, [loadProfile]);

  const handleChange = (
    field: keyof ProfileForm,
    value: string,
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
    setSuccess("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const updated = await apiRequest("/company-admin/profile", {
        method: "PATCH",
        body: JSON.stringify(form),
      });

      const data: CompanyProfile = updated.company ?? updated;
      setProfile(data);
      setForm({
        name: data.name ?? "",
        email: data.email ?? "",
        contactName: data.contactName ?? "",
        contactPhone: data.contactPhone ?? "",
        website: data.website ?? "",
        address: data.address ?? "",
        description: data.description ?? "",
      });

      setSuccess("Company profile updated successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update company profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="ca-content ca-profile-content">
        <div className="ca-profile-loading">
          <RefreshCw size={22} className="ca-profile-spinner" />
          <p>Loading company profile...</p>
        </div>
      </div>
    );
  }

  if (!profile && error) {
    return (
      <div className="ca-content ca-profile-content">
        <div className="ca-profile-alert ca-profile-error">
          <AlertCircle size={18} />
          {error}
        </div>
        <button
          type="button"
          className="ca-profile-secondary-btn"
          onClick={() => void loadProfile()}
        >
          <RefreshCw size={16} />
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="ca-content ca-profile-content">
      <div className="ca-profile-heading">
        <div>
          <h1>Company Profile</h1>
          <p>Manage your company information and contact details.</p>
        </div>

        {profile && (
          <span
            className={`ca-profile-status ${
              profile.isActive ? "active" : "inactive"
            }`}
          >
            {profile.isActive ? "Active" : "Inactive"}
          </span>
        )}
      </div>

      {error && (
        <div className="ca-profile-alert ca-profile-error">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {success && (
        <div className="ca-profile-alert ca-profile-success">
          <CheckCircle size={18} />
          {success}
        </div>
      )}

      <form className="ca-profile-form" onSubmit={handleSubmit}>
        <section className="ca-profile-card">
          <div className="ca-profile-card-heading">
            <div className="ca-profile-icon">
              <Building2 size={20} />
            </div>
            <div>
              <h2>Basic Information</h2>
              <p>Your company&apos;s public information.</p>
            </div>
          </div>

          <div className="ca-profile-grid">
            <div className="ca-profile-field">
              <label htmlFor="companyName">Company Name *</label>
              <input
                id="companyName"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
                maxLength={200}
                placeholder="Enter company name"
              />
            </div>

            <div className="ca-profile-field">
              <label htmlFor="companyEmail">Company Email *</label>
              <div className="ca-profile-input-icon">
                <Mail size={17} />
                <input
                  id="companyEmail"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  required
                  maxLength={255}
                  placeholder="company@example.com"
                />
              </div>
            </div>

            <div className="ca-profile-field">
              <label htmlFor="contactName">Contact Person *</label>
              <div className="ca-profile-input-icon">
                <User size={17} />
                <input
                  id="contactName"
                  value={form.contactName}
                  onChange={(e) => handleChange("contactName", e.target.value)}
                  required
                  maxLength={150}
                  placeholder="Contact person's name"
                />
              </div>
            </div>

            <div className="ca-profile-field">
              <label htmlFor="contactPhone">Contact Phone *</label>
              <div className="ca-profile-input-icon">
                <Phone size={17} />
                <input
                  id="contactPhone"
                  type="tel"
                  value={form.contactPhone}
                  onChange={(e) => handleChange("contactPhone", e.target.value)}
                  required
                  maxLength={30}
                  placeholder="01XXXXXXXXX"
                />
              </div>
            </div>

            <div className="ca-profile-field ca-profile-full">
              <label htmlFor="website">Website</label>
              <div className="ca-profile-input-icon">
                <Globe size={17} />
                <input
                  id="website"
                  type="url"
                  value={form.website}
                  onChange={(e) => handleChange("website", e.target.value)}
                  placeholder="https://www.example.com"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="ca-profile-card">
          <div className="ca-profile-card-heading">
            <div className="ca-profile-icon">
              <MapPin size={20} />
            </div>
            <div>
              <h2>Location & Description</h2>
              <p>Tell candidates about your company.</p>
            </div>
          </div>

          <div className="ca-profile-grid">
            <div className="ca-profile-field ca-profile-full">
              <label htmlFor="address">Company Address</label>
              <textarea
                id="address"
                rows={3}
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Enter your company address"
              />
            </div>

            <div className="ca-profile-field ca-profile-full">
              <label htmlFor="description">Company Description</label>
              <div className="ca-profile-textarea-icon">
                <FileText size={17} />
                <textarea
                  id="description"
                  rows={5}
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Describe your company, services, and work culture..."
                />
              </div>
            </div>
          </div>
        </section>

        <div className="ca-profile-actions">
          
          {/**Refresh button */}

          <button
            type="submit"
            className="ca-profile-save-btn"
            disabled={saving}
          >
            {saving ? (
              <RefreshCw size={17} className="ca-profile-spinner" />
            ) : (
              <Save size={17} />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
