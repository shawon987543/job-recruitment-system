
"use client";

import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Building2,
  Users,
  BriefcaseBusiness,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Search,
  RefreshCw,
  Eye,
  Pencil,
  Power,
  X,
  Menu,
  UserCheck,
  UserX,
  ShieldCheck,
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

export default function UsersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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
          "Your session has expired. Please log in again.",
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
          },
        );

        if (!refreshResponse.ok) {
          clearSession();
          router.replace("/login");
          throw new Error(
            "Your session has expired. Please log in again.",
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
            "Unable to refresh your session. Please log in again.",
          );
        }

        token = refreshed.access_token;

        sessionStorage.setItem(
          "access_token",
          refreshed.access_token,
        );
        sessionStorage.setItem(
          "refresh_token",
          refreshed.refresh_token,
        );

        response = await sendRequest(token);
      }

      if (response.status === 401) {
        clearSession();
        router.replace("/login");
        throw new Error(
          "Your session has expired. Please log in again.",
        );
      }

      if (response.status === 403) {
        throw new Error(
          "You are not authorized to perform this action.",
        );
      }

      return response;
    },
    [clearSession, router],
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
          "Your session has expired. Please log in again.",
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
          "You are not authorized to manage users.",
        );
      }

      const response = await apiRequest("/users");
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to load users.",
        );
      }

      return result as User[];
    },

    retry: false,
  });

  // Load one user's details when the details modal opens
  const {
    data: userDetails,
    isLoading: isDetailsLoading,
  } = useQuery<User>({
    queryKey: ["user", selectedUser?.id],

    queryFn: async () => {
      if (!selectedUser) {
        throw new Error("No user selected.");
      }

      const response = await apiRequest(
        `/users/${selectedUser.id}`,
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to load user details.",
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

  const refreshUsers = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["users"],
    });
  };

  // Activate or deactivate a user
  const statusMutation = useMutation({
    mutationFn: async ({
      user,
      isActive,
    }: ActionVariables) => {
      const response = await apiRequest(
        `/users/${user.id}/active-status`,
        {
          method: "PATCH",
          body: JSON.stringify({ isActive }),
        },
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to update user status.",
        );
      }

      return result;
    },

    onSuccess: async (result) => {
      showMessage(
        result.message || "User status updated successfully.",
      );
      await refreshUsers();
    },

    onError: (err) => {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update user status.",
      );
    },
  });

  // Edit user's name and email
  const updateMutation = useMutation({
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
            : result.message || "Unable to update user.",
        );
      }

      return result;
    },

    onSuccess: async (result) => {
      setModal(null);
      setSelectedUser(null);

      showMessage(
        result.message || "User updated successfully.",
      );

      await refreshUsers();
    },

    onError: (err) => {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update user.",
      );
    },
  });

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
        "Super Admin accounts cannot be deactivated through this page.",
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

  // Logout
  const logout = async () => {
    const token = sessionStorage.getItem("access_token");

    try {
      if (token) {
        await fetch(`${API_URL}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch {
      // Clear local session even if the API request fails.
    } finally {
      clearSession();
      queryClient.clear();
      router.push("/login");
    }
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
      (user) => user.role === "CANDIDATE",
    ).length,
    companyAdmins: users.filter(
      (user) => user.role === "COMPANY_ADMIN",
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
      : "");

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const roleLabel = (role: User["role"]) =>
    role.replace("_", " ");

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside
        className={`admin-sidebar ${menuOpen ? "open" : ""}`}
      >
        <div className="admin-brand">
          <div className="admin-brand-icon">C</div>

          <div>
            <h2>CareerHub</h2>
            <span>Admin Portal</span>
          </div>

          <button
            className="admin-close-menu"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="admin-nav-label">MENU</div>

        <nav className="admin-navigation">
          <Link
            href="/admin"
            className="admin-nav-item"
            onClick={() => setMenuOpen(false)}
          >
            <LayoutDashboard size={19} />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/admin/companies"
            className="admin-nav-item"
            onClick={() => setMenuOpen(false)}
          >
            <Building2 size={19} />
            <span>Companies</span>
          </Link>

          <Link
            href="/admin/users"
            className="admin-nav-item active"
            onClick={() => setMenuOpen(false)}
          >
            <Users size={19} />
            <span>Users</span>
          </Link>

          {/* Updated working navigation links */}
          <Link
            href="/admin/jobs"
            className="admin-nav-item"
            onClick={() => setMenuOpen(false)}
          >
            <BriefcaseBusiness size={19} />
            <span>Jobs</span>
          </Link>

          <Link
            href="/admin/applications"
            className="admin-nav-item"
            onClick={() => setMenuOpen(false)}
          >
            <FileText size={19} />
            <span>Applications</span>
          </Link>

          <Link
            href="/admin/reports"
            className="admin-nav-item"
            onClick={() => setMenuOpen(false)}
          >
            <BarChart3 size={19} />
            <span>Reports</span>
          </Link>

          <Link
            href="/admin/settings"
            className="admin-nav-item"
            onClick={() => setMenuOpen(false)}
          >
            <Settings size={19} />
            <span>Settings</span>
          </Link>
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-profile">
            <div className="admin-avatar">SA</div>

            <div className="admin-profile-info">
              <strong>Super Admin</strong>
              <span>Administrator</span>
            </div>
          </div>

          <button className="admin-logout" onClick={logout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {menuOpen && (
        <button
          className="admin-overlay"
          onClick={() => setMenuOpen(false)}
          aria-label="Close navigation"
        />
      )}

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
            <h1>User Management</h1>
            <p>
              Manage candidates, company administrators and accounts.
            </p>
          </div>

          <button
            className="admin-refresh"
            onClick={() => loadUsers()}
            disabled={isFetching}
          >
            <RefreshCw
              size={16}
              className={isFetching ? "animate-spin" : ""}
            />
            <span>
              {isFetching ? "Refreshing..." : "Refresh"}
            </span>
          </button>
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

          {/* Toolbar */}
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

          {/* Users table */}
          <div className="company-table-card">
            {isLoading ? (
              <div className="admin-loading">Loading users...</div>
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
                              onClick={() =>
                                openModal("view", user)
                              }
                            >
                              <Eye size={16} />
                            </button>

                            <button
                              title="Edit user"
                              onClick={() =>
                                openModal("edit", user)
                              }
                            >
                              <Pencil size={16} />
                            </button>

                            {user.role !== "SUPER_ADMIN" && (
                              <button
                                className={
                                  user.isActive
                                    ? "reject"
                                    : "approve"
                                }
                                title={
                                  user.isActive
                                    ? "Deactivate user"
                                    : "Activate user"
                                }
                                disabled={statusMutation.isPending}
                                onClick={() =>
                                  toggleUserStatus(user)
                                }
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

      {/* Modal */}
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
                {isDetailsLoading ? (
                  <p>Loading user details...</p>
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
                          userDetails?.role ?? selectedUser.role,
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
                          (userDetails ?? selectedUser).createdAt,
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Last Updated</span>
                      <strong>
                        {formatDate(
                          (userDetails ?? selectedUser).updatedAt,
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
