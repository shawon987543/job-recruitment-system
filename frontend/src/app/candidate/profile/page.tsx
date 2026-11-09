
"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  apiRequest,
  apiUpload,
} from "@/lib/api";
import "./profile.css";

type Education = {
  id: number;
  institution: string;
  degree: string;
  fieldOfStudy?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isCurrentlyStudying: boolean;
  description?: string | null;
};

type Experience = {
  id: number;
  companyName: string;
  jobTitle: string;
  employmentType?: string | null;
  location?: string | null;
  startDate: string;
  endDate?: string | null;
  isCurrentlyWorking: boolean;
  description?: string | null;
};

type CandidateProfile = {
  id: number;
  user?: {
    name?: string;
    email?: string;
  };
  phone?: string | null;
  address?: string | null;
  dateOfBirth?: string | null;
  bio?: string | null;
  skills?: string[];
  resumeUrl?: string | null;
  educations?: Education[];
  experiences?: Experience[];
};

const emptyEducation = {
  institution: "",
  degree: "",
  fieldOfStudy: "",
  startDate: "",
  endDate: "",
  isCurrentlyStudying: false,
  description: "",
};

const emptyExperience = {
  companyName: "",
  jobTitle: "",
  employmentType: "",
  location: "",
  startDate: "",
  endDate: "",
  isCurrentlyWorking: false,
  description: "",
};

function dateValue(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function resumeHref(resumeUrl?: string | null) {
  if (!resumeUrl) return "#";

  if (resumeUrl.startsWith("http://") || resumeUrl.startsWith("https://")) {
    return resumeUrl;
  }

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

  const serverUrl = apiUrl.replace(/\/api\/?$/, "");

  return `${serverUrl}${resumeUrl.startsWith("/") ? "" : "/"}${resumeUrl}`;
}

export default function CandidateProfilePage() {
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [personal, setPersonal] = useState({
    phone: "",
    address: "",
    dateOfBirth: "",
    bio: "",
  });

  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  const [educationForm, setEducationForm] = useState(emptyEducation);
  const [editingEducationId, setEditingEducationId] = useState<number | null>(null);
  const [savingEducation, setSavingEducation] = useState(false);

  const [experienceForm, setExperienceForm] = useState(emptyExperience);
  const [editingExperienceId, setEditingExperienceId] = useState<number | null>(null);
  const [savingExperience, setSavingExperience] = useState(false);

  async function loadProfile() {
    try {
      setError("");
      const data = await apiRequest("/candidate-profile");

      setProfile(data);
      setPersonal({
        phone: data.phone || "",
        address: data.address || "",
        dateOfBirth: dateValue(data.dateOfBirth),
        bio: data.bio || "",
      });
      setSkills(data.skills || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProfile();
  }, []);

  async function savePersonalInfo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSavingProfile(true);
      setMessage("");
      setError("");

      const updated = await apiRequest("/candidate-profile", {
        method: "PATCH",
        body: JSON.stringify({
          ...personal,
          skills,
          dateOfBirth: personal.dateOfBirth || undefined,
        }),
      });

      setProfile((previous) => ({
        ...previous,
        ...updated,
      }));

      setMessage("Personal information saved successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  function addSkill() {
    const newSkill = skillInput.trim();

    if (!newSkill) return;

    if (skills.some((skill) => skill.toLowerCase() === newSkill.toLowerCase())) {
      setSkillInput("");
      return;
    }

    if (skills.length >= 50) {
      setError("You can add a maximum of 50 skills.");
      return;
    }

    setSkills((previous) => [...previous, newSkill]);
    setSkillInput("");
  }

  function removeSkill(skillToRemove: string) {
    setSkills((previous) => previous.filter((skill) => skill !== skillToRemove));
  }

  async function uploadResume(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const fileInput = form.elements.namedItem("resume") as HTMLInputElement;
    const file = fileInput.files?.[0];

    if (!file) {
      setError("Please select a resume file.");
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Only PDF, DOC, and DOCX files are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Resume file must be 5MB or smaller.");
      return;
    }

    try {
      setUploadingResume(true);
      setError("");
      setMessage("");

      const formData = new FormData();
      formData.append("resume", file);

      const result = await apiUpload("/candidate-profile/resume", formData);

      await loadProfile();
      setMessage(result.message || "Resume uploaded successfully.");
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Resume upload failed.");
    } finally {
      setUploadingResume(false);
    }
  }

  async function saveEducation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSavingEducation(true);
      setError("");
      setMessage("");

      const payload = {
        ...educationForm,
        fieldOfStudy: educationForm.fieldOfStudy || undefined,
        startDate: educationForm.startDate || undefined,
        endDate: educationForm.isCurrentlyStudying
          ? undefined
          : educationForm.endDate || undefined,
        description: educationForm.description || undefined,
      };

      if (editingEducationId) {
        await apiRequest(`/candidate-profile/education/${editingEducationId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest("/candidate-profile/education", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      setEducationForm(emptyEducation);
      setEditingEducationId(null);
      await loadProfile();
      setMessage("Education information saved successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save education.");
    } finally {
      setSavingEducation(false);
    }
  }

  function editEducation(item: Education) {
    setEditingEducationId(item.id);
    setEducationForm({
      institution: item.institution || "",
      degree: item.degree || "",
      fieldOfStudy: item.fieldOfStudy || "",
      startDate: dateValue(item.startDate),
      endDate: dateValue(item.endDate),
      isCurrentlyStudying: item.isCurrentlyStudying,
      description: item.description || "",
    });

    document.getElementById("education-form")?.scrollIntoView({
      behavior: "smooth",
    });
  }

  async function deleteEducation(id: number) {
    if (!window.confirm("Are you sure you want to delete this education?")) return;

    try {
      await apiRequest(`/candidate-profile/education/${id}`, {
        method: "DELETE",
      });
      await loadProfile();
      setMessage("Education deleted successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete education.");
    }
  }

  async function saveExperience(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSavingExperience(true);
      setError("");
      setMessage("");

      const payload = {
        ...experienceForm,
        employmentType: experienceForm.employmentType || undefined,
        location: experienceForm.location || undefined,
        endDate: experienceForm.isCurrentlyWorking
          ? undefined
          : experienceForm.endDate || undefined,
        description: experienceForm.description || undefined,
      };

      if (editingExperienceId) {
        await apiRequest(`/candidate-profile/experience/${editingExperienceId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest("/candidate-profile/experience", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      setExperienceForm(emptyExperience);
      setEditingExperienceId(null);
      await loadProfile();
      setMessage("Experience information saved successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save experience.");
    } finally {
      setSavingExperience(false);
    }
  }

  function editExperience(item: Experience) {
    setEditingExperienceId(item.id);
    setExperienceForm({
      companyName: item.companyName || "",
      jobTitle: item.jobTitle || "",
      employmentType: item.employmentType || "",
      location: item.location || "",
      startDate: dateValue(item.startDate),
      endDate: dateValue(item.endDate),
      isCurrentlyWorking: item.isCurrentlyWorking,
      description: item.description || "",
    });

    document.getElementById("experience-form")?.scrollIntoView({
      behavior: "smooth",
    });
  }

  async function deleteExperience(id: number) {
    if (!window.confirm("Are you sure you want to delete this experience?")) return;

    try {
      await apiRequest(`/candidate-profile/experience/${id}`, {
        method: "DELETE",
      });
      await loadProfile();
      setMessage("Experience deleted successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete experience.");
    }
  }

  if (loading) {
    return <main className="profile-page"><p>Loading candidate profile...</p></main>;
  }

  return (
    <main className="profile-page">
      <div className="profile-container">
        <header className="profile-header">
          <div>
            <Link href="/candidate" className="profile-back-link">
              ← Back to Dashboard
            </Link>
            <h1>My Profile</h1>
            <p>Manage your personal information, education, experience and resume.</p>
          </div>
          <div className="profile-avatar">
            {(profile?.user?.name || "C").charAt(0).toUpperCase()}
          </div>
        </header>

        {message && <div className="profile-alert success">{message}</div>}
        {error && <div className="profile-alert error">{error}</div>}

        <section className="profile-card">
          <div className="section-heading">
            <div>
              <h2>Personal Information</h2>
              <p>Keep your contact and personal details up to date.</p>
            </div>
          </div>

          <form onSubmit={savePersonalInfo} className="profile-form">
            <div className="profile-grid">
              <label>
                Full Name
                <input value={profile?.user?.name || ""} disabled />
              </label>

              <label>
                Email Address
                <input value={profile?.user?.email || ""} disabled />
              </label>

              <label>
                Phone Number
                <input
                  value={personal.phone}
                  onChange={(e) => setPersonal({ ...personal, phone: e.target.value })}
                  placeholder="+8801XXXXXXXXX"
                />
              </label>

              <label>
                Date of Birth
                <input
                  type="date"
                  value={personal.dateOfBirth}
                  onChange={(e) => setPersonal({ ...personal, dateOfBirth: e.target.value })}
                />
              </label>

              <label className="full-width">
                Address
                <input
                  value={personal.address}
                  onChange={(e) => setPersonal({ ...personal, address: e.target.value })}
                  placeholder="Your current address"
                />
              </label>

              <label className="full-width">
                Professional Bio
                <textarea
                  rows={4}
                  value={personal.bio}
                  onChange={(e) => setPersonal({ ...personal, bio: e.target.value })}
                  placeholder="Write a short introduction about yourself..."
                />
              </label>
            </div>

            <div className="skills-area">
              <label>Skills</label>
              <div className="skill-input-row">
                <input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                  placeholder="Example: JavaScript, React, NestJS"
                />
                <button type="button" className="secondary-button" onClick={addSkill}>
                  Add Skill
                </button>
              </div>

              <div className="skill-list">
                {skills.map((skill) => (
                  <span className="skill-tag" key={skill}>
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)} aria-label={`Remove ${skill}`}>
                      ×
                    </button>
                  </span>
                ))}
                {skills.length === 0 && <p className="empty-text">No skills added yet.</p>}
              </div>
            </div>

            <button className="primary-button" type="submit" disabled={savingProfile}>
              {savingProfile ? "Saving..." : "Save Personal Information"}
            </button>
          </form>
        </section>

        <section className="profile-card">
          <div className="section-heading">
            <div>
              <h2>Resume</h2>
              <p>Upload your latest resume. PDF, DOC or DOCX, maximum 5MB.</p>
            </div>
          </div>

          {profile?.resumeUrl && (
            <a
              className="resume-link"
              href={resumeHref(profile.resumeUrl)}
              target="_blank"
              rel="noreferrer"
            >
              View Current Resume ↗
            </a>
          )}

          <form onSubmit={uploadResume} className="resume-form">
            <input
              type="file"
              name="resume"
              accept=".pdf,.doc,.docx"
              required
            />
            <button className="primary-button" type="submit" disabled={uploadingResume}>
              {uploadingResume ? "Uploading..." : "Upload Resume"}
            </button>
          </form>
        </section>

        <section className="profile-card">
          <div className="section-heading">
            <div>
              <h2>Education</h2>
              <p>Add your academic qualifications.</p>
            </div>
          </div>

          <div className="profile-items">
            {profile?.educations?.map((item) => (
              <article className="profile-item" key={item.id}>
                <div>
                  <h3>{item.degree}</h3>
                  <p className="item-subtitle">{item.institution}</p>
                  {item.fieldOfStudy && <p>{item.fieldOfStudy}</p>}
                  <p className="item-date">
                    {dateValue(item.startDate) || "Start date not set"} –{" "}
                    {item.isCurrentlyStudying ? "Present" : dateValue(item.endDate) || "Not specified"}
                  </p>
                  {item.description && <p>{item.description}</p>}
                </div>
                <div className="item-actions">
                  <button type="button" onClick={() => editEducation(item)}>Edit</button>
                  <button type="button" className="delete-button" onClick={() => deleteEducation(item.id)}>Delete</button>
                </div>
              </article>
            ))}
            {(!profile?.educations || profile.educations.length === 0) && (
              <p className="empty-text">No education information added yet.</p>
            )}
          </div>

          <form id="education-form" onSubmit={saveEducation} className="profile-form form-divider">
            <h3>{editingEducationId ? "Edit Education" : "Add Education"}</h3>
            <div className="profile-grid">
              <label>
                Institution *
                <input required value={educationForm.institution} onChange={(e) => setEducationForm({ ...educationForm, institution: e.target.value })} />
              </label>
              <label>
                Degree *
                <input required value={educationForm.degree} onChange={(e) => setEducationForm({ ...educationForm, degree: e.target.value })} />
              </label>
              <label>
                Field of Study
                <input value={educationForm.fieldOfStudy} onChange={(e) => setEducationForm({ ...educationForm, fieldOfStudy: e.target.value })} />
              </label>
              <label>
                Start Date
                <input type="date" value={educationForm.startDate} onChange={(e) => setEducationForm({ ...educationForm, startDate: e.target.value })} />
              </label>
              <label>
                End Date
                <input type="date" disabled={educationForm.isCurrentlyStudying} value={educationForm.endDate} onChange={(e) => setEducationForm({ ...educationForm, endDate: e.target.value })} />
              </label>
              <label className="checkbox-label">
                <input type="checkbox" checked={educationForm.isCurrentlyStudying} onChange={(e) => setEducationForm({ ...educationForm, isCurrentlyStudying: e.target.checked })} />
                Currently studying
              </label>
              <label className="full-width">
                Description
                <textarea rows={3} value={educationForm.description} onChange={(e) => setEducationForm({ ...educationForm, description: e.target.value })} />
              </label>
            </div>
            <div className="form-actions">
              <button className="primary-button" type="submit" disabled={savingEducation}>
                {savingEducation ? "Saving..." : editingEducationId ? "Update Education" : "Add Education"}
              </button>
              {editingEducationId && (
                <button type="button" className="secondary-button" onClick={() => { setEditingEducationId(null); setEducationForm(emptyEducation); }}>
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="profile-card">
          <div className="section-heading">
            <div>
              <h2>Work Experience</h2>
              <p>Show employers your professional experience.</p>
            </div>
          </div>

          <div className="profile-items">
            {profile?.experiences?.map((item) => (
              <article className="profile-item" key={item.id}>
                <div>
                  <h3>{item.jobTitle}</h3>
                  <p className="item-subtitle">{item.companyName}</p>
                  {item.location && <p>{item.location}</p>}
                  <p className="item-date">
                    {dateValue(item.startDate)} –{" "}
                    {item.isCurrentlyWorking ? "Present" : dateValue(item.endDate) || "Not specified"}
                  </p>
                  {item.description && <p>{item.description}</p>}
                </div>
                <div className="item-actions">
                  <button type="button" onClick={() => editExperience(item)}>Edit</button>
                  <button type="button" className="delete-button" onClick={() => deleteExperience(item.id)}>Delete</button>
                </div>
              </article>
            ))}
            {(!profile?.experiences || profile.experiences.length === 0) && (
              <p className="empty-text">No work experience added yet.</p>
            )}
          </div>

          <form id="experience-form" onSubmit={saveExperience} className="profile-form form-divider">
            <h3>{editingExperienceId ? "Edit Experience" : "Add Experience"}</h3>
            <div className="profile-grid">
              <label>
                Company Name *
                <input required value={experienceForm.companyName} onChange={(e) => setExperienceForm({ ...experienceForm, companyName: e.target.value })} />
              </label>
              <label>
                Job Title *
                <input required value={experienceForm.jobTitle} onChange={(e) => setExperienceForm({ ...experienceForm, jobTitle: e.target.value })} />
              </label>
              <label>
                Employment Type
                <input value={experienceForm.employmentType} onChange={(e) => setExperienceForm({ ...experienceForm, employmentType: e.target.value })} placeholder="Full-time, Part-time, Internship" />
              </label>
              <label>
                Location
                <input value={experienceForm.location} onChange={(e) => setExperienceForm({ ...experienceForm, location: e.target.value })} />
              </label>
              <label>
                Start Date *
                <input type="date" required value={experienceForm.startDate} onChange={(e) => setExperienceForm({ ...experienceForm, startDate: e.target.value })} />
              </label>
              <label>
                End Date
                <input type="date" disabled={experienceForm.isCurrentlyWorking} value={experienceForm.endDate} onChange={(e) => setExperienceForm({ ...experienceForm, endDate: e.target.value })} />
              </label>
              <label className="checkbox-label">
                <input type="checkbox" checked={experienceForm.isCurrentlyWorking} onChange={(e) => setExperienceForm({ ...experienceForm, isCurrentlyWorking: e.target.checked })} />
                I currently work here
              </label>
              <label className="full-width">
                Description
                <textarea rows={3} value={experienceForm.description} onChange={(e) => setExperienceForm({ ...experienceForm, description: e.target.value })} />
              </label>
            </div>
            <div className="form-actions">
              <button className="primary-button" type="submit" disabled={savingExperience}>
                {savingExperience ? "Saving..." : editingExperienceId ? "Update Experience" : "Add Experience"}
              </button>
              {editingExperienceId && (
                <button type="button" className="secondary-button" onClick={() => { setEditingExperienceId(null); setExperienceForm(emptyExperience); }}>
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
