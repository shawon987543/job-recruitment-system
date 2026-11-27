import { io, Socket } from "socket.io-client";

import {
  refreshAccessTokenOnce,
  subscribeToAccessToken,
  clearSessionAndRedirect,
} from "@/lib/auth-session";

let notificationSocket: Socket | null = null;
let unsubscribeTokenListener: (() => void) | null = null;
let refreshingSocketToken = false;

export function connectNotificationSocket(
  accessToken: string,
): Socket {
  if (notificationSocket) {
    notificationSocket.auth = { token: accessToken };

    if (!notificationSocket.connected) {
      notificationSocket.connect();
    }

    return notificationSocket;
  }

  const serverUrl =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ||
    "http://localhost:3000";

  notificationSocket = io(serverUrl, {
    auth: { token: accessToken },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
  });

  // Keep the socket updated whenever the API refreshes the access token.
  unsubscribeTokenListener = subscribeToAccessToken((newToken) => {
    if (!notificationSocket) return;

    notificationSocket.auth = { token: newToken };
  });

  notificationSocket.on("connect", () => {
    console.log(
      "Notification socket connected:",
      notificationSocket?.id,
    );
  });

  notificationSocket.on("disconnect", (reason) => {
    console.log("Notification socket disconnected:", reason);

    // Socket.IO does not automatically reconnect after a server disconnect.
    // The gateway uses a server disconnect when the access token is invalid
    // or expired, so refresh it before reconnecting.
    if (reason !== "io server disconnect" || refreshingSocketToken) {
      return;
    }

    refreshingSocketToken = true;

    void refreshAccessTokenOnce()
      .then((newToken) => {
        if (!newToken) {
          clearSessionAndRedirect();
          return;
        }

        if (!notificationSocket) return;

        notificationSocket.auth = { token: newToken };
        notificationSocket.connect();
      })
      .catch((error) => {
        console.error("Could not reconnect notification socket:", error);
      })
      .finally(() => {
        refreshingSocketToken = false;
      });
  });

  notificationSocket.on("connect_error", async (error) => {
    console.error("Notification socket error:", error.message);

    const isAuthenticationError =
      /unauthorized|token|expired/i.test(error.message);

    if (!isAuthenticationError || refreshingSocketToken) {
      return;
    }

    refreshingSocketToken = true;

    try {
      // Stop automatic retries using the expired token.
      notificationSocket?.disconnect();

      const newToken = await refreshAccessTokenOnce();

      if (!newToken) {
        clearSessionAndRedirect();
        return;
      }

      if (!notificationSocket) return;

      notificationSocket.auth = { token: newToken };
      notificationSocket.connect();
    } catch (refreshError) {
      console.error(
        "Could not reconnect notification socket:",
        refreshError,
      );
    } finally {
      refreshingSocketToken = false;
    }
  });

  return notificationSocket;
}

export function disconnectNotificationSocket() {
  unsubscribeTokenListener?.();
  unsubscribeTokenListener = null;

  notificationSocket?.removeAllListeners();
  notificationSocket?.disconnect();
  notificationSocket = null;

  refreshingSocketToken = false;
}
