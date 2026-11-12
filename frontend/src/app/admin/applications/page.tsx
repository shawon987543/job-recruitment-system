"use client";
import { useCallback, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Skeleton from "@/components/ui/skeleton";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Search,
  Eye,
  Pencil,
  X,
  Menu,
  CheckCircle,
  Clock,
  XCircle,
  UserCheck,
  FileText,
} from "lucide-react";
import AdminSidebar from "../../../components/admin/AdminSidebar";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

type ApplicationStatus =
  | "PENDING"
  | "SHORTLISTED"
  | "INTERVIEW"
  | "SELECTED"
  | "REJECTED"
  | "WITHDRAWN";

type FilterType = "ALL" | ApplicationStatus;

interface Application {
  id: number;
  jobId: number;
  candidateId: number;
  coverLetter: string | null;
  cvUrl: string | null;
  status: ApplicationStatus;
  adminNotes: string | null;
  appliedAt: string;
  updatedAt: string;
  withdrawnAt: string | null;
  candidate?: {
    id: number;
    name: string;
    email: string;
    isActive: boolean;
  } | null;
  job?: {
    id: number;
    title: string;
    location: string;
    jobType: string;
    status: string;
    companyId: number;
  } | null;
  company?: {
    id: number;
    name: string;
    email: string;
  } | null;
}

interface ApplicationForm {
  status: Exclude<ApplicationStatus, "WITHDRAWN">;
  adminNotes: string;
}

interface UpdateVariables {
  applicationId: number;
  form: ApplicationForm;
}

interface RefreshResponse {
  access_token: string;
  refresh_token: string;
}

type ModalType = "view" | "edit" | null;

const statusOptions: Exclude<
  ApplicationStatus,
  "WITHDRAWN"
>[] = [
  "PENDING",
  "SHORTLISTED",
  "INTERVIEW",
  "SELECTED",
  "REJECTED",
];

const emptyForm: ApplicationForm = {
  status: "PENDING",
  adminNotes: "",
};

const formatStatus = (status: string) =>
  status.charAt(0) + status.slice(1).toLowerCase();

// =====================================================
// FULL PAGE SKELETON
// =====================================================

function PageSkeleton() {
  return (
    <>
      {/* Applications Table Skeleton */}
      <div className="company-table-scroll">
        <table className="company-table">
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Job</th>
              <th>Company</th>
              <th>Applied Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {Array.from({ length: 7 }).map((_, index) => (
              <tr key={index}>
                <td>
                  <div className="company-name-cell">
                    <Skeleton
                      variant="circle"
                      width={38}
                      height={38}
                    />

                    <div style={{ flex: 1 }}>
                      <Skeleton variant="text" width="65%" />
                      <Skeleton variant="text" width="85%" />
                    </div>
                  </div>
                </td>

                <td>
                  <Skeleton variant="text" width="80%" />
                  <Skeleton variant="text" width="55%" />
                </td>

                <td>
                  <Skeleton variant="text" width="75%" />
                  <Skeleton variant="text" width="60%" />
                </td>

                <td>
                  <Skeleton variant="text" width="70%" />
                </td>

                <td>
                  <Skeleton
                    variant="rectangle"
                    width={85}
                    height={24}
                  />
                </td>

                <td>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Skeleton
                      variant="rectangle"
                      width={30}
                      height={30}
                    />
                    <Skeleton
                      variant="rectangle"
                      width={30}
                      height={30}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// =====================================================
// WELCOME SECTION SKELETON
// =====================================================

function WelcomeSkeleton() {
  return (
    <div className="company-welcome">
      <div style={{ flex: 1 }}>
        <Skeleton variant="text" width={190} height={14} />

        <div style={{ marginTop: 16 }}>
          <Skeleton variant="text" width="65%" height={30} />
        </div>

        <div style={{ marginTop: 12 }}>
          <Skeleton variant="text" width="90%" height={16} />
          <Skeleton
            variant="text"
            width="65%"
            height={16}
          />
        </div>
      </div>

      <Skeleton
        variant="rectangle"
        width={65}
        height={65}
      />
    </div>
  );
}

// =====================================================
// SUMMARY CARDS SKELETON
// =====================================================

function SummarySkeleton() {
  return (
    <div className="company-summary-grid">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          className="company-summary-card"
          key={index}
        >
          <Skeleton
            variant="circle"
            width={42}
            height={42}
          />

          <div style={{ marginTop: 12 }}>
            <Skeleton variant="text" width="75%" />
          </div>

          <div style={{ marginTop: 8 }}>
            <Skeleton
              variant="number"
              width="45%"
              height={32}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// =====================================================
// TOOLBAR SKELETON
// =====================================================

function ToolbarSkeleton() {
  return (
    <div className="company-toolbar">
      <div style={{ flex: 1 }}>
        <Skeleton variant="text" width={180} height={22} />

        <div style={{ marginTop: 8 }}>
          <Skeleton variant="text" width={250} height={14} />
        </div>
      </div>

      <Skeleton
        variant="rectangle"
        width={280}
        height={42}
      />
    </div>
  );
}

// =====================================================
// FILTER SKELETON
// =====================================================

function FilterSkeleton() {
  return (
    <div className="company-filter-row">
      {Array.from({ length: 7 }).map((_, index) => (
        <Skeleton
          key={index}
          variant="rectangle"
          width={index === 0 ? 125 : 95}
          height={35}
        />
      ))}
    </div>
  );
}

// =====================================================
// MAIN APPLICATION PAGE
// =====================================================

export default function ApplicationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [menuOpen, setMenuOpen] = useState(false);

  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);

  const [modal, setModal] = useState<ModalType>(null);
  const [form, setForm] = useState<ApplicationForm>(emptyForm);

  // Session management
  const clearSession = useCallback(() => {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("user");
    queryClient.clear();
  }, [queryClient]);

  // Refresh access token
  const refreshAccessToken = useCallback(
    async (): Promise<string> => {
      const refreshToken =
        sessionStorage.getItem("refresh_token");

      if (!refreshToken) {
        clearSession();
        router.replace("/login");

        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      const response = await fetch(
        `${API_URL}/auth/refresh`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
          cache: "no-store",
        }
      );

      if (!response.ok) {
        clearSession();
        router.replace("/login");

        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      const refreshed: RefreshResponse =
        await response.json();

      if (
        !refreshed.access_token ||
        !refreshed.refresh_token
      ) {
        clearSession();
        router.replace("/login");

        throw new Error(
          "Unable to refresh your session."
        );
      }

      sessionStorage.setItem(
        "access_token",
        refreshed.access_token
      );

      sessionStorage.setItem(
        "refresh_token",
        refreshed.refresh_token
      );

      return refreshed.access_token;
    },
    [clearSession, router]
  );

  // API request helper
  const apiRequest = useCallback(
    async (
      path: string,
      options: RequestInit = {}
    ) => {
      let token = sessionStorage.getItem("access_token");

      if (!token) {
        token = await refreshAccessToken();
      }

      const sendRequest = (accessToken: string) =>
        fetch(`${API_URL}${path}`, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            ...options.headers,
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        });

      let response = await sendRequest(token);

      if (response.status === 401) {
        token = await refreshAccessToken();
        response = await sendRequest(token);
      }

      if (response.status === 401) {
        clearSession();
        router.replace("/login");

        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      if (response.status === 403) {
        throw new Error(
          "You are not authorized to perform this action."
        );
      }

      return response;
    },
    [clearSession, refreshAccessToken, router]
  );

  // Fetch applications
  const {
    data: applications = [],
    isLoading,
    isError,
    error: queryError,
  } = useQuery<Application[]>({
    queryKey: ["admin-applications"],

    queryFn: async () => {
      const userData = sessionStorage.getItem("user");

      if (!userData) {
        clearSession();
        router.replace("/login");

        throw new Error("Please log in again.");
      }

      let user: { role?: string };

      try {
        user = JSON.parse(userData);
      } catch {
        clearSession();
        router.replace("/login");

        throw new Error(
          "Invalid session. Please log in again."
        );
      }

      if (user.role !== "SUPER_ADMIN") {
        router.replace("/");

        throw new Error(
          "You are not authorized to view applications."
        );
      }

      const response = await apiRequest(
        "/applications/admin/all"
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(result.message)
            ? result.message.join(", ")
            : result.message ||
                "Unable to load applications."
        );
      }

      if (!Array.isArray(result)) {
        throw new Error(
          "Invalid applications response from the server."
        );
      }

      return result as Application[];
    },

    retry: false,
  });

  // Success message
  const showMessage = (message: string) => {
    setSuccess(message);
    setError("");

    window.setTimeout(() => setSuccess(""), 4000);
  };

  // Refresh applications
  const refreshApplications = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["admin-applications"],
    });
  };

  // Update application mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      applicationId,
      form,
    }: UpdateVariables) => {
      const response = await apiRequest(
        `/applications/admin/${applicationId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: form.status,
            adminNotes: form.adminNotes,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(result.message)
            ? result.message.join(", ")
            : result.message ||
                "Unable to update application."
        );
      }

      return result;
    },

    onSuccess: async () => {
      setModal(null);
      setSelectedApplication(null);

      showMessage("Application updated successfully.");

      await refreshApplications();
    },

    onError: (err) => {
      setError(
        err instanceof Error
          ? err.message
          : "Application update failed."
      );
    },
  });

  // Open modal
  const openModal = (
    type: ModalType,
    application: Application
  ) => {
    setSelectedApplication(application);
    setModal(type);
    setError("");
    setSuccess("");

    if (type === "edit") {
      setForm({
        status:
          application.status === "WITHDRAWN"
            ? "PENDING"
            : application.status,
        adminNotes: application.adminNotes || "",
      });
    }
  };

  // Close modal
  const closeModal = () => {
    if (updateMutation.isPending) return;

    setModal(null);
    setSelectedApplication(null);
  };

  // Submit update
  const submitUpdate = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!selectedApplication) return;

    if (selectedApplication.status === "WITHDRAWN") {
      setError(
        "Withdrawn applications cannot be updated."
      );
      return;
    }

    setError("");

    updateMutation.mutate({
      applicationId: selectedApplication.id,
      form,
    });
  };

  // Search and filter
  const filteredApplications = useMemo(() => {
    const searchTerm = search.toLowerCase();

    return applications.filter((application) => {
      const candidateName =
        application.candidate?.name || "";

      const candidateEmail =
        application.candidate?.email || "";

      const jobTitle =
        application.job?.title || "";

      const companyName =
        application.company?.name || "";

      const matchesSearch =
        candidateName.toLowerCase().includes(searchTerm) ||
        candidateEmail.toLowerCase().includes(searchTerm) ||
        jobTitle.toLowerCase().includes(searchTerm) ||
        companyName.toLowerCase().includes(searchTerm) ||
        String(application.id).includes(searchTerm);

      const matchesFilter =
        filter === "ALL" ||
        application.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [applications, search, filter]);

  // Statistics
  const counts = {
    total: applications.length,

    pending: applications.filter(
      (item) => item.status === "PENDING"
    ).length,

    shortlisted: applications.filter(
      (item) => item.status === "SHORTLISTED"
    ).length,

    interview: applications.filter(
      (item) => item.status === "INTERVIEW"
    ).length,

    selected: applications.filter(
      (item) => item.status === "SELECTED"
    ).length,

    rejected: applications.filter(
      (item) => item.status === "REJECTED"
    ).length,

    withdrawn: applications.filter(
      (item) => item.status === "WITHDRAWN"
    ).length,
  };

  const displayError =
    error ||
    (isError
      ? queryError instanceof Error
        ? queryError.message
        : "Unable to load applications."
      : "");

  // Formatting helpers
  const formatDate = (date: string | null) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString();
  };

  const candidateName = (
    application: Application
  ) =>
    application.candidate?.name ||
    `Candidate #${application.candidateId}`;

  const jobTitle = (application: Application) =>
    application.job?.title ||
    `Job #${application.jobId}`;

  const companyName = (application: Application) =>
    application.company?.name ||
    `Company #${application.job?.companyId ?? "—"}`;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="admin-layout">
      <AdminSidebar
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />

      <main className="admin-main">

        {/* TOP HEADER */}
        <header className="admin-topbar">
          <button
            className="admin-menu-button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          <div>
            {isLoading ? (
              <>
                <Skeleton
                  variant="text"
                  width={220}
                  height={25}
                />

                <div style={{ marginTop: 8 }}>
                  <Skeleton
                    variant="text"
                    width={290}
                    height={15}
                  />
                </div>
              </>
            ) : (
              <>
                <h1>Application Management</h1>
                <p>
                  Review and manage applications across all companies.
                </p>
              </>
            )}
          </div>
        </header>

        <section className="admin-content">

          {/* ERROR MESSAGE */}
          {displayError && (
            <div className="company-alert error">
              <span>{displayError}</span>

              <button onClick={() => setError("")}>
                <X size={16} />
              </button>
            </div>
          )}

          {/* SUCCESS MESSAGE */}
          {success && (
            <div className="company-alert success">
              <span>{success}</span>

              <button onClick={() => setSuccess("")}>
                <X size={16} />
              </button>
            </div>
          )}

          {/* WELCOME SECTION */}
          {isLoading ? (
            <WelcomeSkeleton />
          ) : (
            <div className="company-welcome">
              <div>
                <span>
                  SUPER ADMIN / APPLICATIONS
                </span>

                <h2>Manage all applications</h2>

                <p>
                  Monitor candidate applications, review details,
                  and update recruitment progress across companies.
                </p>
              </div>

              <div className="company-welcome-icon">
                <FileText size={55} />
              </div>
            </div>
          )}

          {/* SUMMARY CARDS */}
          {isLoading ? (
            <SummarySkeleton />
          ) : (
            <div className="company-summary-grid">

              <button
                className={`company-summary-card ${
                  filter === "ALL" ? "selected" : ""
                }`}
                onClick={() => setFilter("ALL")}
              >
                <span className="company-summary-icon blue">
                  <FileText size={21} />
                </span>

                <span className="company-summary-label">
                  Total Applications
                </span>

                <strong>{counts.total}</strong>
              </button>

              <button
                className={`company-summary-card ${
                  filter === "PENDING" ? "selected" : ""
                }`}
                onClick={() => setFilter("PENDING")}
              >
                <span className="company-summary-icon orange">
                  <Clock size={21} />
                </span>

                <span className="company-summary-label">
                  Pending
                </span>

                <strong>{counts.pending}</strong>
              </button>

              <button
                className={`company-summary-card ${
                  filter === "SHORTLISTED" ? "selected" : ""
                }`}
                onClick={() => setFilter("SHORTLISTED")}
              >
                <span className="company-summary-icon green">
                  <UserCheck size={21} />
                </span>

                <span className="company-summary-label">
                  Shortlisted
                </span>

                <strong>{counts.shortlisted}</strong>
              </button>

              <button
                className={`company-summary-card ${
                  filter === "INTERVIEW" ? "selected" : ""
                }`}
                onClick={() => setFilter("INTERVIEW")}
              >
                <span className="company-summary-icon blue">
                  <CheckCircle size={21} />
                </span>

                <span className="company-summary-label">
                  Interview
                </span>

                <strong>{counts.interview}</strong>
              </button>

              <button
                className={`company-summary-card ${
                  filter === "SELECTED" ? "selected" : ""
                }`}
                onClick={() => setFilter("SELECTED")}
              >
                <span className="company-summary-icon green">
                  <CheckCircle size={21} />
                </span>

                <span className="company-summary-label">
                  Selected
                </span>

                <strong>{counts.selected}</strong>
              </button>

              <button
                className={`company-summary-card ${
                  filter === "REJECTED" ? "selected" : ""
                }`}
                onClick={() => setFilter("REJECTED")}
              >
                <span className="company-summary-icon red">
                  <XCircle size={21} />
                </span>

                <span className="company-summary-label">
                  Rejected
                </span>

                <strong>{counts.rejected}</strong>
              </button>

            </div>
          )}

          {/* TOOLBAR */}
          {isLoading ? (
            <ToolbarSkeleton />
          ) : (
            <div className="company-toolbar">
              <div>
                <h2>All Applications</h2>

                <p>
                  Search and review candidate applications.
                </p>
              </div>

              <div className="company-search">
                <Search size={18} />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search candidate, job, company..."
                />
              </div>
            </div>
          )}

          {/* FILTER BUTTONS */}
          {isLoading ? (
            <FilterSkeleton />
          ) : (
            <div className="company-filter-row">
              {(
                [
                  "ALL",
                  ...statusOptions,
                  "WITHDRAWN",
                ] as FilterType[]
              ).map((item) => (
                <button
                  key={item}
                  className={`company-filter ${
                    filter === item ? "active" : ""
                  }`}
                  onClick={() => setFilter(item)}
                >
                  {item === "ALL"
                    ? "All Applications"
                    : formatStatus(item)}
                </button>
              ))}
            </div>
          )}

          {/* APPLICATION TABLE */}
          <div className="company-table-card">

            {isLoading ? (
              <PageSkeleton />
            ) : filteredApplications.length === 0 ? (
              <div className="company-empty">
                <FileText size={35} />

                <h3>No applications found</h3>

                <p>
                  Try changing your search or status filter.
                </p>
              </div>
            ) : (
              <div className="company-table-scroll">
                <table className="company-table">

                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Job</th>
                      <th>Company</th>
                      <th>Applied Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredApplications.map(
                      (application) => (
                        <tr key={application.id}>

                          {/* CANDIDATE */}
                          <td>
                            <div className="company-name-cell">
                              <div className="company-table-avatar">
                                {candidateName(application)
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>
                                <strong>
                                  {candidateName(application)}
                                </strong>

                                <span>
                                  {application.candidate?.email ||
                                    "No email available"}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* JOB */}
                          <td>
                            <div className="company-contact-cell">
                              <strong>
                                {jobTitle(application)}
                              </strong>

                              <span>
                                {application.job?.location ||
                                  "Location unavailable"}
                              </span>
                            </div>
                          </td>

                          {/* COMPANY */}
                          <td>
                            <div className="company-contact-cell">
                              <strong>
                                {companyName(application)}
                              </strong>

                              <span>
                                {application.company?.email || ""}
                              </span>
                            </div>
                          </td>

                          {/* DATE */}
                          <td>
                            {formatDate(application.appliedAt)}
                          </td>

                          {/* STATUS */}
                          <td>
                            <span
                              className={`company-status ${application.status.toLowerCase()}`}
                            >
                              {application.status}
                            </span>
                          </td>

                          {/* ACTIONS */}
                          <td>
                            <div className="company-actions">

                              <button
                                title="View application"
                                onClick={() =>
                                  openModal("view", application)
                                }
                              >
                                <Eye size={16} />
                              </button>

                              <button
                                title="Update application"
                                disabled={
                                  application.status === "WITHDRAWN"
                                }
                                onClick={() =>
                                  openModal("edit", application)
                                }
                              >
                                <Pencil size={16} />
                              </button>

                            </div>
                          </td>

                        </tr>
                      )
                    )}
                  </tbody>

                </table>
              </div>
            )}

          </div>

        </section>
      </main>

      {/* =====================================================
          APPLICATION MODAL
      ===================================================== */}

      {modal && selectedApplication && (
        <div
          className="company-modal-backdrop"
          onClick={closeModal}
        >
          <div
            className="company-modal"
            onClick={(event) => event.stopPropagation()}
          >

            <div className="company-modal-header">
              <div>
                <h2>
                  {modal === "view"
                    ? "Application Details"
                    : "Update Application"}
                </h2>

                <p>
                  Application #{selectedApplication.id}
                </p>
              </div>

              <button
                onClick={closeModal}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* VIEW MODAL */}
            {modal === "view" && (
              <div className="company-details">

                <div>
                  <span>Candidate</span>
                  <strong>
                    {candidateName(selectedApplication)}
                  </strong>
                </div>

                <div>
                  <span>Candidate Email</span>
                  <strong>
                    {selectedApplication.candidate?.email || "—"}
                  </strong>
                </div>

                <div>
                  <span>Job Title</span>
                  <strong>
                    {jobTitle(selectedApplication)}
                  </strong>
                </div>

                <div>
                  <span>Company</span>
                  <strong>
                    {companyName(selectedApplication)}
                  </strong>
                </div>

                <div>
                  <span>Applied Date</span>
                  <strong>
                    {formatDate(selectedApplication.appliedAt)}
                  </strong>
                </div>

                <div>
                  <span>Last Updated</span>
                  <strong>
                    {formatDate(selectedApplication.updatedAt)}
                  </strong>
                </div>

                <div>
                  <span>Status</span>
                  <strong>
                    {selectedApplication.status}
                  </strong>
                </div>

                <div>
                  <span>Candidate Account</span>
                  <strong>
                    {selectedApplication.candidate?.isActive
                      ? "Active"
                      : "Inactive"}
                  </strong>
                </div>

                <div className="full">
                  <span>Cover Letter</span>
                  <p>
                    {selectedApplication.coverLetter ||
                      "No cover letter provided."}
                  </p>
                </div>

                <div className="full">
                  <span>CV / Resume</span>

                  {selectedApplication.cvUrl ? (
                    <a
                      href={selectedApplication.cvUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View candidate CV
                    </a>
                  ) : (
                    <p>No CV uploaded.</p>
                  )}
                </div>

                <div className="full">
                  <span>Admin Notes</span>
                  <p>
                    {selectedApplication.adminNotes ||
                      "No admin notes."}
                  </p>
                </div>

                {selectedApplication.withdrawnAt && (
                  <div>
                    <span>Withdrawn Date</span>
                    <strong>
                      {formatDate(
                        selectedApplication.withdrawnAt
                      )}
                    </strong>
                  </div>
                )}

              </div>
            )}

            {/* EDIT MODAL */}
            {modal === "edit" && (
              <form
                onSubmit={submitUpdate}
                className="company-form"
              >

                <div className="full">
                  <span>Candidate</span>
                  <strong>
                    {candidateName(selectedApplication)}
                  </strong>
                </div>

                <div className="full">
                  <span>Job</span>
                  <strong>
                    {jobTitle(selectedApplication)}
                  </strong>
                </div>

                <label className="full">
                  Application Status

                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        status: event.target.value as ApplicationForm["status"],
                      })
                    }
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {formatStatus(status)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="full">
                  Admin Notes

                  <textarea
                    rows={5}
                    maxLength={2000}
                    value={form.adminNotes}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        adminNotes: event.target.value,
                      })
                    }
                    placeholder="Add notes about this candidate or application..."
                  />
                </label>

                <div className="company-modal-actions full">

                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={updateMutation.isPending}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending
                      ? "Saving..."
                      : "Save Changes"}
                  </button>

                </div>

              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
