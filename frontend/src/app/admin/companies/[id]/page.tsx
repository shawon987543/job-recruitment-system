"use client";
import {
  useCallback,
  useState,
  type ReactNode,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Skeleton from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  CalendarDays,
  ShieldCheck,
  UserRound,
  RefreshCw,
  AlertCircle,
  FileText,
  Clock,
  Menu,
} from "lucide-react";
import AdminSidebar from "../../../../components/admin/AdminSidebar";

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
  adminName: string | null;
  adminEmail: string | null;
  email: string;
  contactName: string;
  contactPhone: string;
  website: string | null;
  address: string | null;
  description: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  isActive: boolean;
  rejectionReason: string | null;
  reviewedBy: number | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  admins: CompanyAdmin[];
}

interface InfoItemProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}

/*Skeleton for company details page*/ 

function CompanyDetailsSkeleton() {
  return (
    <div>
      {/* Company header */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e8edf3",
          borderRadius: 14,
          padding: 25,
          marginBottom: 22,
          display: "flex",
          alignItems: "center",
          gap: 17,
        }}
      >
        <Skeleton
          variant="rectangle"
          width={65}
          height={65}
        />

        <div style={{ flex: 1 }}>
          <Skeleton
            variant="text"
            width="35%"
            height={25}
          />
          <div style={{ marginTop: 10 }}>
            <Skeleton variant="text" width="20%" />
          </div>
        </div>
      </div>

      {/* Company and contact information */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 380px), 1fr))",
          gap: 22,
          marginBottom: 22,
        }}
      >
        {[1, 2].map((card) => (
          <div
            key={card}
            style={{
              background: "#fff",
              border: "1px solid #e8edf3",
              borderRadius: 13,
              padding: 23,
            }}
          >
            <Skeleton
              variant="text"
              width="55%"
              height={22}
            />

            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                style={{
                  display: "flex",
                  gap: 13,
                  alignItems: "center",
                  padding: "15px 0",
                  borderBottom: "1px solid #edf0f4",
                }}
              >
                <Skeleton
                  variant="rectangle"
                  width={38}
                  height={38}
                />

                <div style={{ flex: 1 }}>
                  <Skeleton
                    variant="text"
                    width="30%"
                  />
                  <div style={{ marginTop: 8 }}>
                    <Skeleton
                      variant="text"
                      width="70%"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Approval information */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e8edf3",
          borderRadius: 13,
          padding: 23,
          marginBottom: 22,
        }}
      >
        <Skeleton
          variant="text"
          width="40%"
          height={22}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(190px, 1fr))",
            gap: 15,
            marginTop: 20,
          }}
        >
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              style={{
                padding: 15,
                background: "#f8fafc",
                borderRadius: 9,
              }}
            >
              <Skeleton variant="text" width="65%" />
              <div style={{ marginTop: 10 }}>
                <Skeleton variant="text" width="45%" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assigned company admins */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e8edf3",
          borderRadius: 13,
          padding: 23,
        }}
      >
        <Skeleton
          variant="text"
          width="35%"
          height={22}
        />

        <div style={{ marginTop: 20 }}>
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              style={{
                display: "flex",
                gap: 20,
                padding: 16,
                borderBottom: "1px solid #edf0f4",
              }}
            >
              <Skeleton variant="text" width="20%" />
              <Skeleton variant="text" width="30%" />
              <Skeleton variant="text" width="20%" />
              <Skeleton variant="rectangle" width={75} height={24} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Keep InfoItem outside CompanyDetailsPage.
// This prevents React from recreating the component during rendering.
function InfoItem({
  icon,
  label,
  value,
}: InfoItemProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: 13,
        alignItems: "flex-start",
        padding: "15px 0",
        borderBottom: "1px solid #edf0f4",
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          minWidth: 38,
          borderRadius: 9,
          background: "#eff6ff",
          color: "#2563eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>

      <div style={{ minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: "#64748b",
            fontWeight: 600,
          }}
        >
          {label}
        </p>

        <div
          style={{
            marginTop: 5,
            fontSize: 14,
            color: "#1e293b",
            fontWeight: 500,
            overflowWrap: "anywhere",
          }}
        >
          {value || "Not provided"}
        </div>
      </div>
    </div>
  );
}

export default function CompanyDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const companyId = String(params.id);

  const [menuOpen, setMenuOpen] = useState(false);

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
          "You are not authorized to view this company.",
        );
      }

      return response;
    },
    [clearSession, router],
  );

  const {
    data: company,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<Company>({
    queryKey: ["company-details", companyId],

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

      let user: { role?: string };

      try {
        user = JSON.parse(userData);
      } catch {
        clearSession();
        router.replace("/login");
        throw new Error("Invalid login session.");
      }

      if (user.role !== "SUPER_ADMIN") {
        router.replace("/login");
        throw new Error(
          "Only Super Admin can view company details.",
        );
      }

      if (!/^\d+$/.test(companyId)) {
        throw new Error("Invalid company ID.");
      }

      const response = await apiRequest(
        `/companies/${companyId}`,
      );

      if (!response.ok) {
        const result = await response
          .json()
          .catch(() => ({}));

        throw new Error(
          result.message || "Unable to load company details.",
        );
      }

      return (await response.json()) as Company;
    },

    retry: false,
    enabled: Boolean(companyId),
  });

  const formatDate = (
    value: string | null | undefined,
  ) => {
    if (!value) return "Not available";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Not available";
    }

    return date.toLocaleString("en-BD", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusStyle = (status: string) => {
    switch (status) {
      case "APPROVED":
        return {
          background: "#dcfce7",
          color: "#166534",
        };

      case "REJECTED":
        return {
          background: "#fee2e2",
          color: "#991b1b",
        };

      default:
        return {
          background: "#fef3c7",
          color: "#92400e",
        };
    }
  };

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
            <h2 style={{ margin: 0 }}>Company Details</h2>

            <p
              style={{
                margin: "4px 0 0",
                color: "#64748b",
                fontSize: 13,
              }}
            >
              Super Admin / Companies / Details
            </p>
          </div>
        </header>

        <section className="admin-content">
          <button
            type="button"
            onClick={() => router.push("/admin/companies")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 15px",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              background: "#fff",
              color: "#334155",
              fontWeight: 600,
              cursor: "pointer",
              marginBottom: 22,
            }}
          >
            <ArrowLeft size={17} />
            Back to Companies
          </button>
          
            {/* Skeleton */}
          {(isLoading || isFetching) && <CompanyDetailsSkeleton />}

          {isError && (
            <div
              style={{
                padding: 24,
                borderRadius: 12,
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#991b1b",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <AlertCircle size={21} />
                <strong>Unable to load company</strong>
              </div>

              <p style={{ margin: "0 0 15px" }}>
                {error instanceof Error
                  ? error.message
                  : "Something went wrong."}
              </p>

              <button
                type="button"
                onClick={() => refetch()}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "9px 14px",
                  border: "none",
                  borderRadius: 7,
                  background: "#991b1b",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                <RefreshCw size={15} />
                Try Again
              </button>
            </div>
          )}

          {company && !isFetching && (
            <>
              {/* Company header */}
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #e8edf3",
                  borderRadius: 14,
                  padding: 25,
                  marginBottom: 22,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 20,
                  boxShadow: "0 2px 8px rgba(15,23,42,0.03)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 17,
                  }}
                >
                  <div
                    style={{
                      width: 65,
                      height: 65,
                      borderRadius: 14,
                      background: "#eff6ff",
                      color: "#2563eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Building2 size={32} />
                  </div>

                  <div>
                    <h1
                      style={{
                        margin: 0,
                        fontSize: 24,
                        color: "#0f172a",
                      }}
                    >
                      {company.name}
                    </h1>

                    <p
                      style={{
                        margin: "6px 0 0",
                        color: "#64748b",
                        fontSize: 13,
                      }}
                    >
                      Company ID: #{company.id}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 9,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      ...statusStyle(company.status),
                      padding: "7px 13px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {company.status}
                  </span>

                  <span
                    style={{
                      background: company.isActive
                        ? "#dcfce7"
                        : "#fee2e2",
                      color: company.isActive
                        ? "#166534"
                        : "#991b1b",
                      padding: "7px 13px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {company.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>

                  <button
                    type="button"
                    onClick={() => refetch()}
                    disabled={isFetching}
                    title="Refresh details"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      padding: "9px 12px",
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                      background: "#fff",
                      color: "#334155",
                      cursor: "pointer",
                    }}
                  >
                    <RefreshCw
                      size={15}
                      className={isFetching ? "animate-spin" : ""}
                    />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Main information grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(min(100%, 380px), 1fr))",
                  gap: 22,
                  marginBottom: 22,
                }}
              >
                {/* Company information */}
                <div
                  style={{
                    background: "#fff",
                    border: "1px solid #e8edf3",
                    borderRadius: 13,
                    padding: 23,
                  }}
                >
                  <h2
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      margin: "0 0 12px",
                      fontSize: 17,
                      color: "#0f172a",
                    }}
                  >
                    <Building2 size={20} color="#2563eb" />
                    Company Information
                  </h2>

                  <InfoItem
                    icon={<Building2 size={18} />}
                    label="Company Name"
                    value={company.name}
                  />

                  <InfoItem
                    icon={<Mail size={18} />}
                    label="Company Email"
                    value={company.email}
                  />

                  <InfoItem
                    icon={<Globe size={18} />}
                    label="Website"
                    value={
                      company.website ? (
                        <a
                          href={
                            company.website.startsWith("http")
                              ? company.website
                              : `https://${company.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#2563eb" }}
                        >
                          {company.website}
                        </a>
                      ) : (
                        "Not provided"
                      )
                    }
                  />

                  <InfoItem
                    icon={<MapPin size={18} />}
                    label="Business Address"
                    value={company.address}
                  />

                  <InfoItem
                    icon={<FileText size={18} />}
                    label="Description"
                    value={company.description}
                  />
                </div>

                {/* Contact information */}
                <div
                  style={{
                    background: "#fff",
                    border: "1px solid #e8edf3",
                    borderRadius: 13,
                    padding: 23,
                  }}
                >
                  <h2
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      margin: "0 0 12px",
                      fontSize: 17,
                      color: "#0f172a",
                    }}
                  >
                    <UserRound size={20} color="#2563eb" />
                    Contact Information
                  </h2>

                  <InfoItem
                    icon={<UserRound size={18} />}
                    label="Contact Person"
                    value={company.contactName}
                  />

                  <InfoItem
                    icon={<Phone size={18} />}
                    label="Contact Phone"
                    value={company.contactPhone}
                  />

                  <InfoItem
                    icon={<UserRound size={18} />}
                    label="Original Admin Name"
                    value={company.adminName}
                  />

                  <InfoItem
                    icon={<Mail size={18} />}
                    label="Original Admin Email"
                    value={company.adminEmail}
                  />

                  <InfoItem
                    icon={<CalendarDays size={18} />}
                    label="Registration Date"
                    value={formatDate(company.createdAt)}
                  />

                  <InfoItem
                    icon={<Clock size={18} />}
                    label="Last Updated"
                    value={formatDate(company.updatedAt)}
                  />
                </div>
              </div>

              {/* Approval information */}
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #e8edf3",
                  borderRadius: 13,
                  padding: 23,
                  marginBottom: 22,
                }}
              >
                <h2
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    margin: "0 0 15px",
                    fontSize: 17,
                    color: "#0f172a",
                  }}
                >
                  <ShieldCheck size={20} color="#2563eb" />
                  Approval & Account Information
                </h2>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(190px, 1fr))",
                    gap: 15,
                  }}
                >
                  <div
                    style={{
                      padding: 15,
                      background: "#f8fafc",
                      borderRadius: 9,
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        color: "#64748b",
                      }}
                    >
                      Approval Status
                    </p>

                    <strong
                      style={{
                        display: "block",
                        marginTop: 7,
                        color: statusStyle(company.status).color,
                      }}
                    >
                      {company.status}
                    </strong>
                  </div>

                  <div
                    style={{
                      padding: 15,
                      background: "#f8fafc",
                      borderRadius: 9,
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        color: "#64748b",
                      }}
                    >
                      Account Status
                    </p>

                    <strong
                      style={{
                        display: "block",
                        marginTop: 7,
                        color: company.isActive
                          ? "#15803d"
                          : "#dc2626",
                      }}
                    >
                      {company.isActive ? "Active" : "Inactive"}
                    </strong>
                  </div>

                  <div
                    style={{
                      padding: 15,
                      background: "#f8fafc",
                      borderRadius: 9,
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        color: "#64748b",
                      }}
                    >
                      Reviewed By (User ID)
                    </p>

                    <strong
                      style={{
                        display: "block",
                        marginTop: 7,
                        color: "#1e293b",
                      }}
                    >
                      {company.reviewedBy ?? "Not reviewed"}
                    </strong>
                  </div>

                  <div
                    style={{
                      padding: 15,
                      background: "#f8fafc",
                      borderRadius: 9,
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        color: "#64748b",
                      }}
                    >
                      Review Date
                    </p>

                    <strong
                      style={{
                        display: "block",
                        marginTop: 7,
                        color: "#1e293b",
                        fontSize: 13,
                      }}
                    >
                      {formatDate(company.reviewedAt)}
                    </strong>
                  </div>
                </div>

                {company.rejectionReason && (
                  <div
                    style={{
                      marginTop: 18,
                      padding: 15,
                      borderRadius: 9,
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                    }}
                  >
                    <strong
                      style={{
                        color: "#991b1b",
                        fontSize: 13,
                      }}
                    >
                      Rejection Reason
                    </strong>

                    <p
                      style={{
                        margin: "7px 0 0",
                        color: "#7f1d1d",
                        fontSize: 14,
                      }}
                    >
                      {company.rejectionReason}
                    </p>
                  </div>
                )}
              </div>

              {/* Assigned company admins */}
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #e8edf3",
                  borderRadius: 13,
                  padding: 23,
                  marginBottom: 25,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                    marginBottom: 18,
                  }}
                >
                  <div>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: 17,
                        color: "#0f172a",
                      }}
                    >
                      Assigned Company Admins
                    </h2>

                    <p
                      style={{
                        margin: "5px 0 0",
                        color: "#64748b",
                        fontSize: 13,
                      }}
                    >
                      Administrators assigned to this company.
                    </p>
                  </div>

                  <span
                    style={{
                      padding: "7px 12px",
                      background: "#eff6ff",
                      color: "#1d4ed8",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {company.admins?.length || 0} Admin(s)
                  </span>
                </div>

                {!company.admins ||
                company.admins.length === 0 ? (
                  <div
                    style={{
                      padding: 30,
                      textAlign: "center",
                      color: "#64748b",
                      background: "#f8fafc",
                      borderRadius: 9,
                    }}
                  >
                    <UserRound
                      size={30}
                      style={{ margin: "0 auto 10px" }}
                    />

                    <p style={{ margin: 0 }}>
                      No company administrators assigned yet.
                    </p>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        minWidth: 550,
                      }}
                    >
                      <thead>
                        <tr style={{ background: "#f8fafc" }}>
                          {[
                            "Admin",
                            "Email",
                            "Role",
                            "Account Status",
                          ].map((heading) => (
                            <th
                              key={heading}
                              style={{
                                padding: "13px 14px",
                                textAlign: "left",
                                fontSize: 12,
                                color: "#64748b",
                                fontWeight: 700,
                                borderBottom: "1px solid #e2e8f0",
                              }}
                            >
                              {heading}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {company.admins.map((admin) => (
                          <tr key={admin.id}>
                            <td
                              style={{
                                padding: 14,
                                borderBottom: "1px solid #edf0f4",
                                fontWeight: 600,
                                color: "#1e293b",
                              }}
                            >
                              {admin.name}

                              <div
                                style={{
                                  fontSize: 11,
                                  color: "#94a3b8",
                                  marginTop: 4,
                                }}
                              >
                                ID: {admin.id}
                              </div>
                            </td>

                            <td
                              style={{
                                padding: 14,
                                borderBottom: "1px solid #edf0f4",
                                color: "#475569",
                                fontSize: 13,
                              }}
                            >
                              {admin.email}
                            </td>

                            <td
                              style={{
                                padding: 14,
                                borderBottom: "1px solid #edf0f4",
                                color: "#475569",
                                fontSize: 13,
                              }}
                            >
                              {admin.role}
                            </td>

                            <td
                              style={{
                                padding: 14,
                                borderBottom: "1px solid #edf0f4",
                              }}
                            >
                              <span
                                style={{
                                  padding: "5px 10px",
                                  borderRadius: 20,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  background: admin.isActive
                                    ? "#dcfce7"
                                    : "#fee2e2",
                                  color: admin.isActive
                                    ? "#166534"
                                    : "#991b1b",
                                }}
                              >
                                {admin.isActive
                                  ? "ACTIVE"
                                  : "INACTIVE"}
                              </span>
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
        </section>
      </main>
    </div>
  );
}
