"use client";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import AdminSidebar from "../../../components/admin/AdminSidebar";
import Skeleton from "@/components/ui/skeleton";
import {
  Building2,
  Search,
  Plus,
  Eye,
  Pencil,
  CheckCircle,
  XCircle,
  Power,
  X,
  Menu,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

interface CompanyAdmin {
  id: number;
  name: string;
  email: string;
  role: string;
  companyId: number;
  isActive: boolean;
}

interface Company {
  id: number;
  name: string;
  email: string;
  contactName: string;
  contactPhone: string;
  website: string | null;
  address: string | null;
  description: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  isActive: boolean;
  rejectionReason: string | null;
  createdAt: string;
  admins: CompanyAdmin[];
}

type ModalType =
  | "view"
  | "edit"
  | "reject"
  | "admin"
  | "create"
  | null;

type FilterType = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

interface CompanyForm {
  name: string;
  email: string;
  contactName: string;
  contactPhone: string;
  website: string;
  address: string;
  description: string;
}

type CompanyAction = "approve" | "activate" | "deactivate";

interface ActionVariables {
  company: Company;
  action: CompanyAction;
}

interface ModalVariables {
  company: Company | null;
  modal: Exclude<ModalType, null | "view">;
  form: CompanyForm;
  rejectReason: string;
  adminName: string;
  adminEmail: string;
}

const emptyForm: CompanyForm = {
  name: "",
  email: "",
  contactName: "",
  contactPhone: "",
  website: "",
  address: "",
  description: "",
};

/** Skeleton component for the companies page */
function CompaniesPageSkeleton() {
  return (
    <div className="company-table-scroll">
      <table className="company-table">
        <thead>
          <tr>
            <th>Company</th>
            <th>Contact Person</th>
            <th>Status</th>
            <th>Account</th>
            <th>Admins</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {[1, 2, 3, 4, 5].map((item) => (
            <tr key={item}>
              <td>
                <div className="company-name-cell">
                  <Skeleton variant="circle" width={38} height={38} />
                  <div style={{ flex: 1 }}>
                    <Skeleton variant="text" width="70%" />
                    <Skeleton variant="text" width="85%" />
                  </div>
                </div>
              </td>

              <td>
                <div className="company-contact-cell">
                  <Skeleton variant="text" width="75%" />
                  <Skeleton variant="text" width="60%" />
                </div>
              </td>

              <td>
                <Skeleton variant="rectangle" width={85} height={25} />
              </td>

              <td>
                <Skeleton variant="rectangle" width={70} height={25} />
              </td>

              <td>
                <Skeleton variant="text" width="65%" />
              </td>

              <td>
                <div style={{ display: "flex", gap: 8 }}>
                  <Skeleton variant="rectangle" width={28} height={28} />
                  <Skeleton variant="rectangle" width={28} height={28} />
                  <Skeleton variant="rectangle" width={28} height={28} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CompaniesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // UI state
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [menuOpen, setMenuOpen] = useState(false);

  // Debounced search state
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);

    return () => window.clearTimeout(timer);
  }, [search]);

  // Modal state
  const [selectedCompany, setSelectedCompany] =
    useState<Company | null>(null);

  const [modal, setModal] = useState<ModalType>(null);
  const [form, setForm] = useState<CompanyForm>(emptyForm);
  const [rejectReason, setRejectReason] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");

  // Authentication helpers
  const clearSession = useCallback(() => {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("user");
  }, []);

  const apiRequest = useCallback(
    async (path: string, options: RequestInit = {}) => {
      let token = sessionStorage.getItem("access_token");
      const refreshToken = sessionStorage.getItem("refresh_token");

      if (!token) {
        clearSession();
        router.replace("/login");

        throw new Error(
          "Your session has expired. Please log in again."
        );
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

      // Refresh access token if expired.
      if (response.status === 401 && refreshToken) {
        const refreshResponse = await fetch(
          `${API_URL}/auth/refresh`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ refreshToken }),
          }
        );

        if (!refreshResponse.ok) {
          clearSession();
          router.replace("/login");

          throw new Error(
            "Your session has expired. Please log in again."
          );
        }

        const refreshed: {
          access_token: string;
          refresh_token: string;
        } = await refreshResponse.json();

        token = refreshed.access_token;

        sessionStorage.setItem(
          "access_token",
          refreshed.access_token
        );

        sessionStorage.setItem(
          "refresh_token",
          refreshed.refresh_token
        );

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
    [clearSession, router]
  );

  // Common company fetching function.
  const fetchCompanies = useCallback(
    async (path: string): Promise<Company[]> => {
      const userData = sessionStorage.getItem("user");
      const token = sessionStorage.getItem("access_token");

      if (!userData || !token) {
        clearSession();
        router.replace("/login");

        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      let user: { role?: string };

      try {
        user = JSON.parse(userData);
      } catch {
        clearSession();
        router.replace("/login");

        throw new Error("Invalid session. Please log in again.");
      }

      if (user.role !== "SUPER_ADMIN") {
        router.replace("/");

        throw new Error(
          "You are not authorized to view companies."
        );
      }

      const response = await apiRequest(path);

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));

        throw new Error(
          result.message || "Unable to load companies."
        );
      }

      const data = await response.json();

      // Support either a direct array or a wrapped response.
      return Array.isArray(data)
        ? (data as Company[])
        : (data.data || []) as Company[];
    },
    [apiRequest, clearSession, router]
  );

  // Fetch all companies once for summary cards and local filtering.
  const {
    data: allCompanies = [],
    isLoading,
    isError: isCompaniesError,
    error: companiesError,
  } = useQuery<Company[]>({
    queryKey: ["companies", "summary"],
    queryFn: () => fetchCompanies("/companies"),
    retry: false,
  });

  // LOCAL SEARCH + STATUS FILTER
  // Only matching companies are displayed in the table.
  const filteredCompanies = allCompanies.filter((company) => {
    const searchTerm = debouncedSearch.toLowerCase();

    const matchesSearch =
      !searchTerm ||
      (company.name || "").toLowerCase().includes(searchTerm) ||
      (company.email || "").toLowerCase().includes(searchTerm) ||
      (company.contactName || "").toLowerCase().includes(searchTerm);

    const matchesStatus =
      filter === "ALL" || company.status === filter;

    return matchesSearch && matchesStatus;
  });

  // Display messages.
  const showMessage = (message: string) => {
    setSuccess(message);
    setError("");

    window.setTimeout(() => {
      setSuccess("");
    }, 4000);
  };

  // Refresh company data.
  const refreshCompanies = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["companies"],
    });
  };

  // Approve, activate, or deactivate company.
  const companyActionMutation = useMutation({
    mutationFn: async ({
      company,
      action,
    }: ActionVariables) => {
      const response =
        action === "approve"
          ? await apiRequest(
              `/companies/${company.id}/approve`,
              { method: "PATCH" }
            )
          : await apiRequest(
              `/companies/${company.id}/active-status`,
              {
                method: "PATCH",
                body: JSON.stringify({
                  isActive: action === "activate",
                }),
              }
            );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Company action failed."
        );
      }

      return result;
    },

    onSuccess: async (result) => {
      showMessage(
        result.message || "Company updated successfully."
      );

      await refreshCompanies();
    },

    onError: (err) => {
      setError(
        err instanceof Error
          ? err.message
          : "Company action failed."
      );
    },
  });

  // Edit company, reject registration, create admin,
  // or manually create a company.
  const modalMutation = useMutation({
    mutationFn: async (variables: ModalVariables) => {
      const {
        company,
        modal: modalType,
        form: companyForm,
        rejectReason: reason,
        adminName: name,
        adminEmail: email,
      } = variables;

      let path = "";
      let options: RequestInit = {};

      if (modalType === "create") {
        path = "/companies";

        options = {
          method: "POST",
          body: JSON.stringify(companyForm),
        };
      } else {
        if (!company) {
          throw new Error("Company information is missing.");
        }

        if (modalType === "edit") {
          path = `/companies/${company.id}`;

          options = {
            method: "PUT",
            body: JSON.stringify(companyForm),
          };
        } else if (modalType === "reject") {
          path = `/companies/${company.id}/reject`;

          options = {
            method: "PATCH",
            body: JSON.stringify({ reason }),
          };
        } else if (modalType === "admin") {
          path = `/companies/${company.id}/admin`;

          options = {
            method: "POST",
            body: JSON.stringify({
              name,
              email,
            }),
          };
        }
      }

      const response = await apiRequest(path, options);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(result.message)
            ? result.message.join(", ")
            : result.message || "Request failed."
        );
      }

      return result;
    },

    onSuccess: async (result) => {
      setModal(null);
      setSelectedCompany(null);
      setForm(emptyForm);

      showMessage(
        result.message || "Operation completed successfully."
      );

      await refreshCompanies();
    },

    onError: (err) => {
      setError(
        err instanceof Error
          ? err.message
          : "Request failed."
      );
    },
  });

  // Open an existing company modal.
  const openModal = (
    type: ModalType,
    company: Company
  ) => {
    setSelectedCompany(company);
    setModal(type);
    setError("");
    setSuccess("");

    if (type === "edit") {
      setForm({
        name: company.name,
        email: company.email,
        contactName: company.contactName,
        contactPhone: company.contactPhone,
        website: company.website || "",
        address: company.address || "",
        description: company.description || "",
      });
    }

    if (type === "reject") {
      setRejectReason("");
    }

    if (type === "admin") {
      setAdminName("");
      setAdminEmail("");
    }
  };

  // Open manual company creation modal.
  const openCreateModal = () => {
    setSelectedCompany(null);
    setForm(emptyForm);
    setModal("create");
    setError("");
    setSuccess("");
  };

  // Close modal.
  const closeModal = () => {
    if (modalMutation.isPending) return;

    setModal(null);
    setSelectedCompany(null);
  };

  // Company actions.
  const runCompanyAction = (
    company: Company,
    action: CompanyAction
  ) => {
    const messages: Record<CompanyAction, string> = {
      approve: "Are you sure you want to approve this company?",
      activate: "Are you sure you want to activate this company?",
      deactivate: "Are you sure you want to deactivate this company?",
    };

    if (!window.confirm(messages[action])) return;

    setError("");

    companyActionMutation.mutate({
      company,
      action,
    });
  };

  // Submit modal form.
  const submitModal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!modal || modal === "view") return;

    if (modal !== "create" && !selectedCompany) {
      setError("Please select a company.");
      return;
    }

    setError("");

    modalMutation.mutate({
      company: selectedCompany,
      modal,
      form,
      rejectReason,
      adminName,
      adminEmail,
    });
  };

  // Summary counts always use all companies.
  const counts = {
    total: allCompanies.length,

    pending: allCompanies.filter(
      (company) => company.status === "PENDING"
    ).length,

    approved: allCompanies.filter(
      (company) => company.status === "APPROVED"
    ).length,

    rejected: allCompanies.filter(
      (company) => company.status === "REJECTED"
    ).length,
  };

  const displayError =
    error ||
    (isCompaniesError
      ? companiesError instanceof Error
        ? companiesError.message
        : "Unable to load companies."
      : "");

  return (
    <div className="admin-layout">
      {/* Shared Super Admin Sidebar */}
      <AdminSidebar
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />

      {/* Main content */}
      <main className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-menu-button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          <div>
            <h1>Company Management</h1>
            <p>
              Manage registrations, company accounts and approvals.
            </p>
          </div>
        </header>

        <section className="admin-content">
          {/* Error message */}
          {displayError && (
            <div className="company-alert error">
              <span>{displayError}</span>

              <button onClick={() => setError("")}>
                <X size={16} />
              </button>
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="company-alert success">
              <span>{success}</span>

              <button onClick={() => setSuccess("")}>
                <X size={16} />
              </button>
            </div>
          )}

          {/* Welcome section */}
          <div className="company-welcome">
            <div>
              <span>SUPER ADMIN / COMPANIES</span>
              <h2>Manage registered companies</h2>
              <p>
                Review registrations, manage company access and create
                company administrator accounts.
              </p>
            </div>

            <div className="company-welcome-icon">
              <Building2 size={55} />
            </div>
          </div>

          {/* Summary cards */}
          <div className="company-summary-grid">
            <button
              className={`company-summary-card ${
                filter === "ALL" ? "selected" : ""
              }`}
              onClick={() => setFilter("ALL")}
            >
              <span className="company-summary-icon blue">
                <Building2 size={21} />
              </span>

              <span className="company-summary-label">
                Total Companies
              </span>

              <strong>{counts.total}</strong>
            </button>

            <button
              className={`company-summary-card ${
                filter === "PENDING" ? "selected" : ""
              }`}
              onClick={() => setFilter("PENDING")}
            >
              <span className="company-summary-icon orange"></span>

              <span className="company-summary-label">Pending</span>

              <strong>{counts.pending}</strong>
            </button>

            <button
              className={`company-summary-card ${
                filter === "APPROVED" ? "selected" : ""
              }`}
              onClick={() => setFilter("APPROVED")}
            >
              <span className="company-summary-icon green">
                <CheckCircle size={21} />
              </span>

              <span className="company-summary-label">Approved</span>

              <strong>{counts.approved}</strong>
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

              <span className="company-summary-label">Rejected</span>

              <strong>{counts.rejected}</strong>
            </button>
          </div>

          {/* Toolbar */}
          <div className="company-toolbar">
            <div>
              <h2>All Companies</h2>
              <p>Review and manage company registrations.</p>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div className="company-search">
                <Search size={18} />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search companies..."
                />
              </div>

              <button
                type="button"
                onClick={openCreateModal}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "11px 16px",
                  border: "none",
                  borderRadius: 8,
                  background: "#2563eb",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Plus size={17} />
                Add Company
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="company-filter-row">
            {(
              ["ALL", "PENDING", "APPROVED", "REJECTED"] as FilterType[]
            ).map((item) => (
              <button
                key={item}
                className={`company-filter ${
                  filter === item ? "active" : ""
                }`}
                onClick={() => setFilter(item)}
              >
                {item === "ALL"
                  ? "All Companies"
                  : item.charAt(0) +
                    item.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Company table */}
          <div className="company-table-card">
            {isLoading ? (
              <CompaniesPageSkeleton />
            ) : filteredCompanies.length === 0 ? (
              <div className="company-empty">
                <Building2 size={35} />

                <h3>
                  {debouncedSearch
                    ? "No matching companies found"
                    : "No companies found"}
                </h3>

                <p>
                  {debouncedSearch
                    ? `No companies match "${debouncedSearch}". Try another search term.`
                    : "Try changing your status filter."}
                </p>
              </div>
            ) : (
              <div className="company-table-scroll">
                <table className="company-table">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Contact Person</th>
                      <th>Status</th>
                      <th>Account</th>
                      <th>Admins</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCompanies.map((company) => (
                      <tr key={company.id}>
                        <td>
                          <div className="company-name-cell">
                            <div className="company-table-avatar">
                              {company.name.charAt(0).toUpperCase()}
                            </div>

                            <div>
                              <strong>{company.name}</strong>
                              <span>{company.email}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="company-contact-cell">
                            <strong>{company.contactName}</strong>
                            <span>{company.contactPhone}</span>
                          </div>
                        </td>

                        <td>
                          <span
                            className={`company-status ${company.status.toLowerCase()}`}
                          >
                            {company.status}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`company-account-status ${
                              company.isActive ? "active" : "inactive"
                            }`}
                          >
                            {company.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td>
                          <span className="company-admin-count">
                            {company.admins?.length || 0} Admin(s)
                          </span>
                        </td>

                        <td>
                          <div className="company-actions">
                            <button
                              title="View details"
                              onClick={() =>
                                router.push(
                                  `/admin/companies/${company.id}`
                                )
                              }
                            >
                              <Eye size={16} />
                            </button>

                            <button
                              title="Edit company"
                              onClick={() =>
                                openModal("edit", company)
                              }
                            >
                              <Pencil size={16} />
                            </button>

                            {company.status === "PENDING" && (
                              <>
                                <button
                                  className="approve"
                                  title="Approve company"
                                  disabled={
                                    companyActionMutation.isPending
                                  }
                                  onClick={() =>
                                    runCompanyAction(
                                      company,
                                      "approve"
                                    )
                                  }
                                >
                                  <CheckCircle size={16} />
                                </button>

                                <button
                                  className="reject"
                                  title="Reject company"
                                  onClick={() =>
                                    openModal("reject", company)
                                  }
                                >
                                  <XCircle size={16} />
                                </button>
                              </>
                            )}

                            <button
                              className={
                                company.isActive
                                  ? "reject"
                                  : "approve"
                              }
                              title={
                                company.isActive
                                  ? "Deactivate company"
                                  : "Activate company"
                              }
                              disabled={
                                companyActionMutation.isPending
                              }
                              onClick={() =>
                                runCompanyAction(
                                  company,
                                  company.isActive
                                    ? "deactivate"
                                    : "activate"
                                )
                              }
                            >
                              <Power size={16} />
                            </button>

                            {company.status === "APPROVED" && (
                              <button
                                className="admin-create-button"
                                title="Create Company Admin"
                                onClick={() =>
                                  openModal("admin", company)
                                }
                              >
                                <Plus size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Modal */}
      {modal && (selectedCompany || modal === "create") && (
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
                  {modal === "view" && "Company Details"}
                  {modal === "edit" && "Edit Company"}
                  {modal === "reject" && "Reject Registration"}
                  {modal === "admin" && "Create Company Admin"}
                  {modal === "create" && "Add New Company"}
                </h2>

                <p>
                  {selectedCompany?.name ||
                    "Register a company manually"}
                </p>
              </div>

              <button
                onClick={closeModal}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Create company manually */}
            {modal === "create" && (
              <form
                onSubmit={submitModal}
                className="company-form"
              >
                <p className="company-admin-note">
                  Manually created companies will be approved and
                  activated immediately. You can create their Company
                  Admin account afterward.
                </p>

                <label>
                  Company Name
                  <input
                    required
                    minLength={2}
                    value={form.name}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        name: event.target.value,
                      })
                    }
                    placeholder="Enter company name"
                  />
                </label>

                <label>
                  Company Email
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        email: event.target.value,
                      })
                    }
                    placeholder="company@example.com"
                  />
                </label>

                <label>
                  Contact Person
                  <input
                    required
                    minLength={2}
                    value={form.contactName}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        contactName: event.target.value,
                      })
                    }
                    placeholder="Enter contact person's name"
                  />
                </label>

                <label>
                  Contact Phone
                  <input
                    required
                    value={form.contactPhone}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        contactPhone: event.target.value,
                      })
                    }
                    placeholder="Enter phone number"
                  />
                </label>

                <label>
                  Website
                  <input
                    value={form.website}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        website: event.target.value,
                      })
                    }
                    placeholder="https://example.com"
                  />
                </label>

                <label>
                  Address
                  <input
                    value={form.address}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        address: event.target.value,
                      })
                    }
                    placeholder="Enter company address"
                  />
                </label>

                <label className="full">
                  Description
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        description: event.target.value,
                      })
                    }
                    placeholder="Enter company description"
                  />
                </label>

                <div className="company-modal-actions full">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={modalMutation.isPending}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={modalMutation.isPending}
                  >
                    {modalMutation.isPending
                      ? "Creating..."
                      : "Create Company"}
                  </button>
                </div>
              </form>
            )}

            {/* View details */}
            {modal === "view" && selectedCompany && (
              <div className="company-details">
                <div>
                  <span>Company Name</span>
                  <strong>{selectedCompany.name}</strong>
                </div>

                <div>
                  <span>Email</span>
                  <strong>{selectedCompany.email}</strong>
                </div>

                <div>
                  <span>Contact Person</span>
                  <strong>{selectedCompany.contactName}</strong>
                </div>

                <div>
                  <span>Phone</span>
                  <strong>{selectedCompany.contactPhone}</strong>
                </div>

                <div>
                  <span>Website</span>
                  <strong>
                    {selectedCompany.website || "Not provided"}
                  </strong>
                </div>

                <div>
                  <span>Address</span>
                  <strong>
                    {selectedCompany.address || "Not provided"}
                  </strong>
                </div>

                <div>
                  <span>Status</span>
                  <strong>{selectedCompany.status}</strong>
                </div>

                <div>
                  <span>Account</span>
                  <strong>
                    {selectedCompany.isActive ? "Active" : "Inactive"}
                  </strong>
                </div>

                <div className="full">
                  <span>Description</span>
                  <p>
                    {selectedCompany.description ||
                      "No description provided."}
                  </p>
                </div>

                {selectedCompany.rejectionReason && (
                  <div className="full">
                    <span>Rejection Reason</span>
                    <p>{selectedCompany.rejectionReason}</p>
                  </div>
                )}

                <div className="full">
                  <span>Assigned Company Admins</span>

                  {selectedCompany.admins?.length ? (
                    selectedCompany.admins.map((admin) => (
                      <p key={admin.id}>
                        {admin.name} — {admin.email} (
                        {admin.isActive ? "Active" : "Inactive"})
                      </p>
                    ))
                  ) : (
                    <p>No administrators assigned.</p>
                  )}
                </div>
              </div>
            )}

            {/* Edit company */}
            {modal === "edit" && selectedCompany && (
              <form
                onSubmit={submitModal}
                className="company-form"
              >
                <label>
                  Company Name
                  <input
                    required
                    minLength={2}
                    value={form.name}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        name: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Company Email
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        email: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Contact Person
                  <input
                    required
                    minLength={2}
                    value={form.contactName}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        contactName: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Contact Phone
                  <input
                    value={form.contactPhone}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        contactPhone: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Website
                  <input
                    value={form.website}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        website: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Address
                  <input
                    value={form.address}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        address: event.target.value,
                      })
                    }
                  />
                </label>

                <label className="full">
                  Description
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        description: event.target.value,
                      })
                    }
                  />
                </label>

                <div className="company-modal-actions full">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={modalMutation.isPending}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={modalMutation.isPending}
                  >
                    {modalMutation.isPending
                      ? "Saving..."
                      : "Save Changes"}
                  </button>
                </div>
              </form>
            )}

            {/* Reject company */}
            {modal === "reject" && selectedCompany && (
              <form
                onSubmit={submitModal}
                className="company-form"
              >
                <label className="full">
                  Reason for rejection
                  <textarea
                    required
                    minLength={3}
                    rows={4}
                    value={rejectReason}
                    onChange={(event) =>
                      setRejectReason(event.target.value)
                    }
                    placeholder="Explain why this company registration is rejected..."
                  />
                </label>

                <div className="company-modal-actions full">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={modalMutation.isPending}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="danger"
                    disabled={modalMutation.isPending}
                  >
                    {modalMutation.isPending
                      ? "Rejecting..."
                      : "Reject Company"}
                  </button>
                </div>
              </form>
            )}

            {/* Create company admin */}
            {modal === "admin" && selectedCompany && (
              <form
                onSubmit={submitModal}
                className="company-form"
              >
                <p className="company-admin-note">
                  A temporary password will be generated and sent to
                  the administrator&apos;s email address. They will
                  need to change it after signing in.
                </p>

                <label className="full">
                  Admin Name
                  <input
                    required
                    minLength={2}
                    maxLength={150}
                    value={adminName}
                    onChange={(event) =>
                      setAdminName(event.target.value)
                    }
                    placeholder="Enter administrator name"
                  />
                </label>

                <label className="full">
                  Admin Email
                  <input
                    required
                    type="email"
                    value={adminEmail}
                    onChange={(event) =>
                      setAdminEmail(event.target.value)
                    }
                    placeholder="admin@company.com"
                  />
                </label>

                <div className="company-modal-actions full">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={modalMutation.isPending}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={modalMutation.isPending}
                  >
                    {modalMutation.isPending
                      ? "Creating..."
                      : "Create Admin"}
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
