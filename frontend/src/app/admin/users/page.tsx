
"use client";
import { startToastLoading, useToastErrorState, useToastSuccessState } from "@/components/ui/toast-message-state";

import { StatsSkeleton } from "@/components/ui/stats-skeleton";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import Skeleton from "@/components/ui/skeleton";
import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import AdminSidebar from "../../../components/admin/AdminSidebar";
import {
  Search,
  Eye,
  Pencil,
  Power,
  X,
  Menu,
  UserCheck,
  UserX,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Globe,
  Users,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

interface User {
  id: number;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "COMPANY_ADMIN" | "CANDIDATE";
  isActive: boolean;
  mustChangePassword: boolean;
  companyId: number | null;
  createdAt: string;
  updatedAt: string;
}

interface CompanyAdminRequest {
  id: number;
  name: string;
  email: string;
  adminName: string | null;
  adminEmail: string | null;
  contactPhone: string;
  website?: string | null;
  address?: string | null;
  description?: string | null;
  status: string;
  createdAt: string;
}

type RoleFilter = "ALL" | User["role"];
type ModalType = "view" | "edit" | null;

interface UserForm {
  name: string;
  email: string;
}

interface ActionVariables {
  user: User;
  isActive: boolean;
}

interface UpdateVariables {
  user: User;
  form: UserForm;
}

interface RejectVariables {
  request: CompanyAdminRequest;
  reason: string;
}

export default function UsersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [error, setError] = useToastErrorState();
  const [success, setSuccess] = useToastSuccessState();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] =
    useState<RoleFilter>("ALL");
  const [menuOpen, setMenuOpen] = useState(false);

  const [selectedUser, setSelectedUser] =
    useState<User | null>(null);
  const [modal, setModal] = useState<ModalType>(null);

  const [form, setForm] = useState<UserForm>({
    name: "",
    email: "",
  });

  // Authentication helpers
  const clearSession = useCallback(() => {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("user");
  }, []);

  // API request helper with refresh-token support
  const apiRequest = useCallback(
    async (path: string, options: RequestInit = {}) => {
      let token = sessionStorage.getItem("access_token");
      const refreshToken =
        sessionStorage.getItem("refresh_token");

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

      // Refresh access token if expired
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

        if (
          !refreshed.access_token ||
          !refreshed.refresh_token
        ) {
          clearSession();
          router.replace("/login");
          throw new Error(
            "Unable to refresh your session. Please log in again."
          );
        }

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

  // Load all users
  const {
    data: users = [],
    isLoading,
    isFetching,
    isError: isUsersError,
    error: usersError,
    refetch: loadUsers,
  } = useQuery<User[]>({
    queryKey: ["users"],

    queryFn: async () => {
      const userData = sessionStorage.getItem("user");
      const token = sessionStorage.getItem("access_token");

      if (!userData || !token) {
        clearSession();
        router.replace("/login");
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      let loggedInUser: { role?: string };

      try {
        loggedInUser = JSON.parse(userData);
      } catch {
        clearSession();
        router.replace("/login");
        throw new Error("Invalid session. Please log in again.");
      }

      if (loggedInUser.role !== "SUPER_ADMIN") {
        router.replace("/");
        throw new Error(
          "You are not authorized to manage users."
        );
      }

      const response = await apiRequest("/users");
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to load users."
        );
      }

      return result as User[];
    },

    retry: false,
  });

  // Load pending Company Admin registration requests
  const {
    data: companyAdminRequests = [],
    isLoading: isRequestsLoading,
    isFetching: isRequestsFetching,
    isError: isRequestsError,
    error: requestsError,
    refetch: loadCompanyAdminRequests,
  } = useQuery<CompanyAdminRequest[]>({
    queryKey: ["company-admin-requests"],

    queryFn: async () => {
      const response = await apiRequest(
        "/users/company-admin-requests"
      );

      const result = await response.json().catch(() => []);

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Unable to load Company Admin requests."
        );
      }

      return result as CompanyAdminRequest[];
    },

    retry: false,
  });

  // Load one user's details when the details modal opens
  const {
    data: userDetails,
    isLoading: isDetailsLoading,
    isFetching: isDetailsFetching,
  } = useQuery<User>({
    queryKey: ["user", selectedUser?.id],

    queryFn: async () => {
      if (!selectedUser) {
        throw new Error("No user selected.");
      }

      const response = await apiRequest(
        `/users/${selectedUser.id}`
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to load user details."
        );
      }

      return result as User;
    },

    enabled: modal === "view" && !!selectedUser,
    retry: false,
  });

  const showMessage = (message: string) => {
    setSuccess(message);
    setError("");

    window.setTimeout(() => {
      setSuccess("");
    }, 4000);
  };

  // Refresh both users and pending requests
  const refreshUsers = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["users"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["company-admin-requests"],
      }),
    ]);
  };

  // Activate or deactivate a user
  const statusMutation = useMutation({
    onMutate: () => startToastLoading("Updating user status..."),
    mutationFn: async ({
      user,
      isActive,
    }: ActionVariables) => {
      const response = await apiRequest(
        `/users/${user.id}/active-status`,
        {
          method: "PATCH",
          body: JSON.stringify({ isActive }),
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to update user status."
        );
      }

      return result;
    },

    onSuccess: async (result) => {
      showMessage(
        result.message || "User status updated successfully."
      );
      await refreshUsers();
    },

    onError: (err) => {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update user status."
      );
    },
  });

  // Edit user's name and email
  const updateMutation = useMutation({
    onMutate: () => startToastLoading("Saving user..."),
    mutationFn: async ({
      user,
      form: userForm,
    }: UpdateVariables) => {
      const response = await apiRequest(`/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify(userForm),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          Array.isArray(result.message)
            ? result.message.join(", ")
            : result.message || "Unable to update user."
        );
      }

      return result;
    },

    onSuccess: async (result) => {
      setModal(null);
      setSelectedUser(null);

      showMessage(
        result.message || "User updated successfully."
      );

      await refreshUsers();
    },

    onError: (err) => {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update user."
      );
    },
  });

  // Approve a Company Admin registration request
  const approveMutation = useMutation({
    onMutate: () => startToastLoading("Approving user..."),
    mutationFn: async (request: CompanyAdminRequest) => {
      const response = await apiRequest(
        `/companies/${request.id}/approve`,
        {
          method: "PATCH",
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to approve the request."
        );
      }

      return result;
    },

    onSuccess: async (result) => {
      showMessage(
        result.message || "Company Admin request approved."
      );

      if (result.emailSent === false) {
        setError(
          "The account was approved, but the temporary-password email could not be sent. Email delivery needs to be resolved."
        );
      }

      await refreshUsers();
    },

    onError: (err) => {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to approve the request."
      );
    },
  });

  // Reject a Company Admin registration request
  const rejectMutation = useMutation({
    onMutate: () => startToastLoading("Rejecting request..."),
    mutationFn: async ({
      request,
      reason,
    }: RejectVariables) => {
      const response = await apiRequest(
        `/companies/${request.id}/reject`,
        {
          method: "PATCH",
          body: JSON.stringify({ reason }),
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to reject the request."
        );
      }

      return result;
    },

    onSuccess: async (result) => {
      showMessage(
        result.message || "Company Admin request rejected."
      );

      await refreshUsers();
    },

    onError: (err) => {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to reject the request."
      );
    },
  });

  // Approve request after confirmation
  const handleApproveRequest = (
    request: CompanyAdminRequest
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to approve ${request.name} and create a Company Admin account for ${request.adminEmail}?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    approveMutation.mutate(request);
  };

  // Reject request after collecting a reason
  const handleRejectRequest = (
    request: CompanyAdminRequest
  ) => {
    const reason = window.prompt(
      `Enter the rejection reason for ${request.name}:`
    );

    if (reason === null) return;

    if (reason.trim().length < 5) {
      setError(
        "Rejection reason must be at least 5 characters."
      );
      return;
    }

    setError("");
    setSuccess("");

    rejectMutation.mutate({
      request,
      reason: reason.trim(),
    });
  };

  // Open details or edit modal
  const openModal = (type: ModalType, user: User) => {
    setSelectedUser(user);
    setModal(type);
    setError("");
    setSuccess("");

    if (type === "edit") {
      setForm({
        name: user.name,
        email: user.email,
      });
    }
  };

  const closeModal = () => {
    if (updateMutation.isPending) return;

    setModal(null);
    setSelectedUser(null);
  };

  // Change account status
  const toggleUserStatus = (user: User) => {
    if (user.role === "SUPER_ADMIN") {
      setError(
        "Super Admin accounts cannot be deactivated through this page."
      );
      return;
    }

    const nextStatus = !user.isActive;

    const message = nextStatus
      ? `Are you sure you want to activate ${user.name}?`
      : `Are you sure you want to deactivate ${user.name}?`;

    if (!window.confirm(message)) return;

    setError("");

    statusMutation.mutate({
      user,
      isActive: nextStatus,
    });
  };

  // Submit edit form
  const submitEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedUser) return;

    setError("");

    updateMutation.mutate({
      user: selectedUser,
      form: {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
      },
    });
  };

  // Search and role filtering
  const filteredUsers = users.filter((user) => {
    const searchTerm = search.toLowerCase();

    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm) ||
      String(user.id).includes(searchTerm);

    const matchesRole =
      roleFilter === "ALL" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Summary counts
  const counts = {
    total: users.length,
    candidates: users.filter(
      (user) => user.role === "CANDIDATE"
    ).length,
    companyAdmins: users.filter(
      (user) => user.role === "COMPANY_ADMIN"
    ).length,
    active: users.filter((user) => user.isActive).length,
    inactive: users.filter((user) => !user.isActive).length,
  };

  const displayError =
    error ||
    (isUsersError
      ? usersError instanceof Error
        ? usersError.message
        : "Unable to load users."
      : "") ||
    (isRequestsError
      ? requestsError instanceof Error
        ? requestsError.message
        : "Unable to load Company Admin requests."
      : "");

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const roleLabel = (role: User["role"]) =>
    role.replace("_", " ");

  const isRequestActionPending =
    approveMutation.isPending || rejectMutation.isPending;

  return (
    <div className="admin-layout">
      <AdminSidebar
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />

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
            <h1>User Management</h1>
            <p>
              Manage candidates, company administrators and accounts.
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
              <span>SUPER ADMIN / USERS</span>
              <h2>Manage platform users</h2>
              <p>
                View user accounts, update profile information and
                control account access from one place.
              </p>
            </div>

            <div className="company-welcome-icon">
              <Users size={55} />
            </div>
          </div>

          {/* Summary cards */}
          {isLoading || isFetching ? (
            <StatsSkeleton
              count={4}
              containerClassName="company-summary-grid"
              cardClassName="company-summary-card"
            />
          ) : (
            <div className="company-summary-grid">
              <button
                className={`company-summary-card ${
                  roleFilter === "ALL" ? "selected" : ""
                }`}
                onClick={() => setRoleFilter("ALL")}
              >
                <span className="company-summary-icon blue">
                  <Users size={21} />
                </span>
                <span className="company-summary-label">
                  Total Users
                </span>
                <strong>{counts.total}</strong>
              </button>

              <button
                className={`company-summary-card ${
                  roleFilter === "CANDIDATE" ? "selected" : ""
                }`}
                onClick={() => setRoleFilter("CANDIDATE")}
              >
                <span className="company-summary-icon green">
                  <UserCheck size={21} />
                </span>
                <span className="company-summary-label">
                  Candidates
                </span>
                <strong>{counts.candidates}</strong>
              </button>

              <button
                className={`company-summary-card ${
                  roleFilter === "COMPANY_ADMIN" ? "selected" : ""
                }`}
                onClick={() => setRoleFilter("COMPANY_ADMIN")}
              >
                <span className="company-summary-icon orange">
                  <ShieldCheck size={21} />
                </span>
                <span className="company-summary-label">
                  Company Admins
                </span>
                <strong>{counts.companyAdmins}</strong>
              </button>

              <button
                className="company-summary-card"
                onClick={() => setRoleFilter("ALL")}
              >
                <span className="company-summary-icon red">
                  <UserX size={21} />
                </span>
                <span className="company-summary-label">
                  Inactive Users
                </span>
                <strong>{counts.inactive}</strong>
              </button>
            </div>
          )}

          {/* Pending Company Admin registration requests */}
          {(roleFilter === "ALL" ||
            roleFilter === "COMPANY_ADMIN") && (
            <>
              <div className="company-toolbar">
                <div>
                  <h2>Pending Company Admin Requests</h2>
                  <p>
                    {companyAdminRequests.length} pending
                    registration request(s) awaiting review
                  </p>
                </div>
              </div>

              <div className="company-table-card">
                {isRequestsLoading || isRequestsFetching ? (
                  <TableSkeleton rows={4} columns={6} />
                ) : isRequestsError ? (
                  <div className="company-empty">
                    <XCircle size={35} />
                    <h3>Unable to load requests</h3>
                    <p>
                      {requestsError instanceof Error
                        ? requestsError.message
                        : "Please try refreshing the page."}
                    </p>
                    <button
                      className="admin-refresh"
                      onClick={() => loadCompanyAdminRequests()}
                    >
                      Try Again
                    </button>
                  </div>
                ) : companyAdminRequests.length === 0 ? (
                  <div className="company-empty">
                    <CheckCircle size={35} />
                    <h3>No pending requests</h3>
                    <p>
                      There are currently no Company Admin
                      registration requests waiting for approval.
                    </p>
                  </div>
                ) : (
                  <div className="company-table-scroll">
                    <table className="company-table">
                      <thead>
                        <tr>
                          <th>Company</th>
                          <th>Company Email</th>
                          <th>Admin Information</th>
                          <th>Contact</th>
                          <th>Submitted</th>
                          <th>Actions</th>
                        </tr>
                      </thead>

                      <tbody>
                        {companyAdminRequests.map((request) => (
                          <tr key={request.id}>
                            <td>
                              <div className="company-name-cell">
                                <div className="company-table-avatar">
                                  {request.name.charAt(0).toUpperCase()}
                                </div>

                                <div>
                                  <strong>{request.name}</strong>
                                  <span>
                                    Company ID: #{request.id}
                                  </span>

                                  {request.website && (
                                    <span>
                                      <Globe
                                        size={12}
                                        style={{
                                          display: "inline",
                                          marginRight: 4,
                                        }}
                                      />
                                      {request.website}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td>
                              <span>{request.email}</span>
                            </td>

                            <td>
                              <div className="company-name-cell">
                                <div>
                                  <strong>
                                    {request.adminName || "Not provided"}
                                  </strong>
                                  <span>
                                    <Mail
                                      size={12}
                                      style={{
                                        display: "inline",
                                        marginRight: 4,
                                      }}
                                    />
                                    {request.adminEmail || "No email"}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td>
                              <span>
                                <Phone
                                  size={13}
                                  style={{
                                    display: "inline",
                                    marginRight: 4,
                                  }}
                                />
                                {request.contactPhone || "Not provided"}
                              </span>
                            </td>

                            <td>{formatDate(request.createdAt)}</td>

                            <td>
                              <div className="company-actions">
                                <button
                                  className="approve"
                                  title="Approve Company Admin request"
                                  disabled={isRequestActionPending}
                                  onClick={() =>
                                    handleApproveRequest(request)
                                  }
                                >
                                  <CheckCircle size={16} />
                                </button>

                                <button
                                  className="reject"
                                  title="Reject Company Admin request"
                                  disabled={isRequestActionPending}
                                  onClick={() =>
                                    handleRejectRequest(request)
                                  }
                                >
                                  <XCircle size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* All users toolbar */}
          <div className="company-toolbar">
            <div>
              <h2>All Users</h2>
              <p>
                {filteredUsers.length} of {counts.total} users shown
              </p>
            </div>

            <div className="company-search">
              <Search size={18} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, email or ID..."
              />
            </div>
          </div>

          {/* Role filters */}
          <div className="company-filter-row">
            {(
              [
                "ALL",
                "CANDIDATE",
                "COMPANY_ADMIN",
                "SUPER_ADMIN",
              ] as RoleFilter[]
            ).map((item) => (
              <button
                key={item}
                className={`company-filter ${
                  roleFilter === item ? "active" : ""
                }`}
                onClick={() => setRoleFilter(item)}
              >
                {item === "ALL" ? "All Users" : roleLabel(item)}
              </button>
            ))}
          </div>

          {/* All Users table */}
          <div className="company-table-card">
            {isLoading || isFetching ? (
              <TableSkeleton
                rows={5}
                columns={6}
                wrapperClassName="company-table-scroll"
                tableClassName="company-table"
              />
            ) : isUsersError ? (
              <div className="company-empty">
                <XCircle size={35} />
                <h3>Unable to load users</h3>
                <p>
                  {usersError instanceof Error
                    ? usersError.message
                    : "Please try refreshing the page."}
                </p>
                <button
                  className="admin-refresh"
                  onClick={() => loadUsers()}
                >
                  Try Again
                </button>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="company-empty">
                <Users size={35} />
                <h3>No users found</h3>
                <p>
                  Try changing your search or role filter.
                </p>
              </div>
            ) : (
              <div className="company-table-scroll">
                <table className="company-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Account Status</th>
                      <th>Company ID</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div className="company-name-cell">
                            <div className="company-table-avatar">
                              {user.name.charAt(0).toUpperCase()}
                            </div>

                            <div>
                              <strong>{user.name}</strong>
                              <span>{user.email}</span>
                              <span>User ID: #{user.id}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span
                            className={`company-status ${
                              user.role === "SUPER_ADMIN"
                                ? "approved"
                                : user.role === "COMPANY_ADMIN"
                                  ? "pending"
                                  : "rejected"
                            }`}
                          >
                            {roleLabel(user.role)}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`company-account-status ${
                              user.isActive ? "active" : "inactive"
                            }`}
                          >
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td>
                          {user.companyId
                            ? `#${user.companyId}`
                            : "—"}
                        </td>

                        <td>{formatDate(user.createdAt)}</td>

                        <td>
                          <div className="company-actions">
                            <button
                              title="View user details"
                              onClick={() => openModal("view", user)}
                            >
                              <Eye size={16} />
                            </button>

                            <button
                              title="Edit user"
                              onClick={() => openModal("edit", user)}
                            >
                              <Pencil size={16} />
                            </button>

                            {user.role !== "SUPER_ADMIN" && (
                              <button
                                className={
                                  user.isActive ? "reject" : "approve"
                                }
                                title={
                                  user.isActive
                                    ? "Deactivate user"
                                    : "Activate user"
                                }
                                disabled={statusMutation.isPending}
                                onClick={() => toggleUserStatus(user)}
                              >
                                <Power size={16} />
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

      {/* User details / edit modal */}
      {modal && selectedUser && (
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
                    ? "User Details"
                    : "Edit User"}
                </h2>
                <p>{selectedUser.name}</p>
              </div>

              <button
                onClick={closeModal}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* View user details */}
            {modal === "view" && (
              <div className="company-details">
                {isDetailsLoading || isDetailsFetching ? (
                  <div style={{ display: "grid", gap: 14 }} aria-busy="true">
                    {[0, 1, 2, 3].map((item) => (
                      <Skeleton key={item} variant="text" height={18} />
                    ))}
                  </div>
                ) : (
                  <>
                    <div>
                      <span>User ID</span>
                      <strong>
                        #{userDetails?.id ?? selectedUser.id}
                      </strong>
                    </div>

                    <div>
                      <span>Full Name</span>
                      <strong>
                        {userDetails?.name ?? selectedUser.name}
                      </strong>
                    </div>

                    <div>
                      <span>Email</span>
                      <strong>
                        {userDetails?.email ?? selectedUser.email}
                      </strong>
                    </div>

                    <div>
                      <span>Role</span>
                      <strong>
                        {roleLabel(
                          userDetails?.role ?? selectedUser.role
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Account Status</span>
                      <strong>
                        {(userDetails ?? selectedUser).isActive
                          ? "Active"
                          : "Inactive"}
                      </strong>
                    </div>

                    <div>
                      <span>Company ID</span>
                      <strong>
                        {(userDetails ?? selectedUser).companyId
                          ? `#${(userDetails ?? selectedUser).companyId}`
                          : "Not assigned"}
                      </strong>
                    </div>

                    <div>
                      <span>Must Change Password</span>
                      <strong>
                        {(userDetails ?? selectedUser)
                          .mustChangePassword
                          ? "Yes"
                          : "No"}
                      </strong>
                    </div>

                    <div>
                      <span>Joined</span>
                      <strong>
                        {formatDate(
                          (userDetails ?? selectedUser).createdAt
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Last Updated</span>
                      <strong>
                        {formatDate(
                          (userDetails ?? selectedUser).updatedAt
                        )}
                      </strong>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Edit user */}
            {modal === "edit" && (
              <form onSubmit={submitEdit} className="company-form">
                <label className="full">
                  Full Name
                  <input
                    required
                    minLength={2}
                    maxLength={150}
                    value={form.name}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        name: event.target.value,
                      })
                    }
                    placeholder="Enter user's name"
                  />
                </label>

                <label className="full">
                  Email Address
                  <input
                    required
                    type="email"
                    maxLength={255}
                    value={form.email}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        email: event.target.value,
                      })
                    }
                    placeholder="Enter user's email"
                  />
                </label>

                <p className="company-admin-note full">
                  User role and company assignment cannot be changed
                  from this form.
                </p>

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
