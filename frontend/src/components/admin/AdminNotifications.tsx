"use client";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Bell, Check, CheckCheck, FileText } from "lucide-react";

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

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(true);

  const seenNotificationIds = useRef(new Set<number>());

  useEffect(() => {
    let isMounted = true;

    async function loadNotifications() {
      try {
        const [notificationData, countData] = await Promise.all([
          apiRequest("/notifications"),
          apiRequest("/notifications/unread-count"),
        ]);

        if (!isMounted) return;

        const savedNotifications =
          notificationData as Notification[];

        savedNotifications.forEach((notification) => {
          seenNotificationIds.current.add(notification.id);
        });

        setNotifications(savedNotifications);
        setUnreadCount(Number(countData) || 0);
      } catch (error) {
        console.error("Failed to load Super Admin notifications:", error);
      } finally {
        if (isMounted) {
          setNotificationLoading(false);
        }
      }
    }

    void loadNotifications();

    const accessToken = sessionStorage.getItem("access_token");

    if (accessToken) {
      const socket = connectNotificationSocket(accessToken);

      const handleNewNotification = (notification: Notification) => {
        if (seenNotificationIds.current.has(notification.id)) {
          return;
        }

        seenNotificationIds.current.add(notification.id);

        setNotifications((previous) =>
          [notification, ...previous].slice(0, 50),
        );

        if (!notification.isRead) {
          setUnreadCount((previous) => previous + 1);
        }

        toast.success(
          notification.title || "You received a new notification!",
        );
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

  return (
    <div className="admin-notification-wrapper">
      <button
        type="button"
        className="admin-notification-button"
        aria-label="Notifications"
        aria-expanded={notificationOpen}
        onClick={() => setNotificationOpen((previous) => !previous)}
      >
        <Bell size={21} />

        {unreadCount > 0 && (
          <span className="admin-notification-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {notificationOpen && (
        <div className="admin-notification-dropdown">
          <div className="admin-notification-header">
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
                className="admin-mark-all-button"
                onClick={handleMarkAllAsRead}
              >
                <CheckCheck size={15} />
                Mark all read
              </button>
            )}
          </div>

          <div className="admin-notification-list">
            {notificationLoading ? (
              <div className="admin-notification-empty">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="admin-notification-empty">
                <Bell size={25} />
                <strong>No notifications yet</strong>
                <span>
                  New system updates will appear here.
                </span>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`admin-notification-item ${
                    notification.isRead
                      ? ""
                      : "admin-notification-unread"
                  }`}
                >
                  <div className="admin-notification-item-icon">
                    <FileText size={18} />
                  </div>

                  <div className="admin-notification-item-content">
                    <strong>{notification.title}</strong>
                    <p>{notification.message}</p>
                    <span>
                      {formatNotificationDate(notification.createdAt)}
                    </span>
                  </div>

                  {!notification.isRead && (
                    <button
                      type="button"
                      className="admin-notification-read-button"
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
  );
}
