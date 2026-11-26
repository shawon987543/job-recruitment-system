
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

let refreshPromise: Promise<string | null> | null = null;

const accessTokenListeners = new Set<(token: string) => void>();

export function subscribeToAccessToken(
  listener: (token: string) => void,
) {
  accessTokenListeners.add(listener);

  return () => {
    accessTokenListeners.delete(listener);
  };
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = sessionStorage.getItem("refresh_token");

  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return null;

    const data = await response.json();

    if (!data.access_token || !data.refresh_token) {
      return null;
    }

    sessionStorage.setItem("access_token", data.access_token);
    sessionStorage.setItem("refresh_token", data.refresh_token);

    accessTokenListeners.forEach((listener) => {
      listener(data.access_token);
    });

    return data.access_token;
  } catch (error) {
    console.error("Token refresh failed:", error);
    return null;
  }
}

export function refreshAccessTokenOnce(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export function clearSessionAndRedirect() {
  sessionStorage.removeItem("access_token");
  sessionStorage.removeItem("refresh_token");
  sessionStorage.removeItem("user");

  window.location.assign("/login");
}
