
"use client";

import "./company-admin.css";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  LayoutDashboard,
  BriefcaseBusiness,
  FileText,
  Users,
  CalendarDays,
  Building2,
  LogOut,
  ChevronRight,
  Menu,
  X,
  CircleHelp,
  Bell,
  CheckCheck,
  Check,
} from "lucide-react";

import { apiRequest } from "@/lib/api";
import {
  connectNotificationSocket,
  disconnectNotificationSocket,
} from "@/lib/notification-socket";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const navigation = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/company-admin",
  },
  {
    label: "Job Management",
    icon: BriefcaseBusiness,
    href: "/company-admin/jobs",
  },
  {
    label: "Applications",
    icon: FileText,
    href: "/company-admin/applications",
  },
  {
    label: "Candidates",
    icon: Users,
    href: "/company-admin/candidates",
  },
  {
    label: "Interviews",
    icon: CalendarDays,
    href: "/company-admin/interviews",
  },
  {
    label: "Company Profile",
    icon: Building2,
    href: "/company-admin/company-profile",
  },
];

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "CA"
  );
}

function formatNotificationDate(date: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function CompanyAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminName, setAdminName] = useState("Company Admin");

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(true);

  // Load saved notifications and connect to real-time notifications.
  useEffect(() => {
    let isMounted = true;

    async function loadNotifications() {
      try {
        const [notificationData, countData] = await Promise.all([
          apiRequest("/notifications"),
          apiRequest("/notifications/unread-count"),
        ]);

        if (!isMounted) return;

        setNotifications(notificationData as Notification[]);
        setUnreadCount(countData as number);
      } catch (error) {
        console.error("Failed to load notifications:", error);
      } finally {
        if (isMounted) {
          setNotificationLoading(false);
        }
      }
    }

    const storedUser = sessionStorage.getItem("user");

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAdminName(user.name || user.fullName || "Company Admin");
      } catch {
        setAdminName("Company Admin");
      }
    }

    void loadNotifications();

    const accessToken = sessionStorage.getItem("access_token");

    if (accessToken) {
      const socket = connectNotificationSocket(accessToken);

      const handleNewNotification = (notification: Notification) => {
        setNotifications((previous) => {
          if (previous.some((item) => item.id === notification.id)) {
            return previous;
          }

          return [notification, ...previous].slice(0, 50);
        });

        if (!notification.isRead) {
          setUnreadCount((previous) => previous + 1);
        }

        toast.success(notification.title || "You received a new notification!");
      };

      socket.on("notification:new", handleNewNotification);

      return () => {
        isMounted = false;
        socket.off("notification:new", handleNewNotification);
        disconnectNotificationSocket();
      };
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const pageTitle =
    pathname === "/company-admin"
      ? "Dashboard"
      : pathname === "/company-admin/jobs/new"
        ? "Post a new job"
        : pathname.startsWith("/company-admin/jobs")
          ? "Job Management"
          : pathname.startsWith("/company-admin/applications")
            ? "Applications"
            : pathname.startsWith("/company-admin/candidates")
              ? "Candidates"
              : pathname.startsWith("/company-admin/interviews")
                ? "Interviews"
                : pathname.startsWith("/company-admin/company-profile")
                  ? "Company Profile"
                  : "Company Workspace";

  async function handleMarkAsRead(notification: Notification) {
    if (notification.isRead) return;

    try {
      await apiRequest(`/notifications/${notification.id}/read`, {
        method: "PATCH",
      });

      setNotifications((previous) =>
        previous.map((item) =>
          item.id === notification.id
            ? { ...item, isRead: true }
            : item,
        ),
      );

      setUnreadCount((previous) => Math.max(0, previous - 1));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not update notification.",
      );
    }
  }

  async function handleMarkAllAsRead() {
    if (unreadCount === 0) return;

    try {
      await apiRequest("/notifications/read-all", {
        method: "PATCH",
      });

      setNotifications((previous) =>
        previous.map((item) => ({ ...item, isRead: true })),
      );

      setUnreadCount(0);
      toast.success("All notifications marked as read.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not update notifications.",
      );
    }
  }

  function logout() {
    disconnectNotificationSocket();

    toast.success("Signed out.");
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("user");

    router.push("/login");
  }

  return (
    <div className="ca-layout">
      {sidebarOpen && (
        <button
          className="ca-overlay"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`ca-sidebar ${sidebarOpen ? "ca-sidebar-open" : ""}`}>
        <div className="ca-brand">
          <div className="ca-brand-icon">
            <BriefcaseBusiness size={22} />
          </div>

          <div className="ca-brand-text">
            <h2>CareerHub</h2>
            <p>COMPANY PORTAL</p>
          </div>

          <button
            className="ca-mobile-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="ca-sidebar-section">
          <p className="ca-menu-label">WORKSPACE</p>

          <nav className="ca-navigation">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === "/company-admin"
                  ? pathname === item.href
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={
                    active
                      ? "ca-nav-item ca-nav-active"
                      : "ca-nav-item"
                  }
                >
                  <Icon size={19} />
                  <span>{item.label}</span>

                  {active && (
                    <ChevronRight size={17} className="ca-nav-arrow" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="ca-sidebar-help">
          <div className="ca-help-icon">
            <CircleHelp size={19} />
          </div>
          <div>
            <strong>Need help?</strong>
            <p>Contact your system administrator.</p>
          </div>
        </div>

        <div className="ca-sidebar-bottom">
          <div className="ca-profile">
            <div className="ca-avatar">{getInitials(adminName)}</div>
            <div className="ca-profile-info">
              <strong>{adminName}</strong>
              <span>Company Administrator</span>
            </div>
          </div>

          <button className="ca-logout-button" onClick={logout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="ca-main">
        <header className="ca-topbar">
          <div className="ca-topbar-left">
            <button
              className="ca-menu-button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={22} />
            </button>

            <div>
              <div className="ca-breadcrumb">
                Workspace <ChevronRight size={13} /> {pageTitle}
              </div>
              <h1>{pageTitle}</h1>
            </div>
          </div>

          <div className="ca-topbar-right">
            <div className="ca-notification-wrapper">
              <button
                type="button"
                className="ca-notification-button"
                aria-label="Notifications"
                aria-expanded={notificationOpen}
                onClick={() => setNotificationOpen((previous) => !previous)}
              >
                <Bell size={21} />

                {unreadCount > 0 && (
                  <span className="ca-notification-badge">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {notificationOpen && (
                <div className="ca-notification-dropdown">
                  <div className="ca-notification-header">
                    <div>
                      <h3>Notifications</h3>
                      <p>
                        {unreadCount === 0
                          ? "You're all caught up"
                          : `${unreadCount} unread notification${
                              unreadCount === 1 ? "" : "s"
                            }`}
                      </p>
                    </div>

                    {unreadCount > 0 && (
                      <button
                        type="button"
                        className="ca-mark-all-button"
                        onClick={handleMarkAllAsRead}
                      >
                        <CheckCheck size={15} />
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="ca-notification-list">
                    {notificationLoading ? (
                      <div className="ca-notification-empty">
                        Loading notifications...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="ca-notification-empty">
                        <Bell size={25} />
                        <strong>No notifications yet</strong>
                        <span>
                          New job application updates will appear here.
                        </span>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`ca-notification-item ${
                            notification.isRead ? "" : "ca-notification-unread"
                          }`}
                        >
                          <div className="ca-notification-item-icon">
                            <FileText size={18} />
                          </div>

                          <div className="ca-notification-item-content">
                            <strong>{notification.title}</strong>
                            <p>{notification.message}</p>
                            <span>
                              {formatNotificationDate(notification.createdAt)}
                            </span>
                          </div>

                          {!notification.isRead && (
                            <button
                              type="button"
                              className="ca-notification-read-button"
                              aria-label="Mark notification as read"
                              title="Mark as read"
                              onClick={() => handleMarkAsRead(notification)}
                            >
                              <Check size={16} />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
