import { redirect } from "next/dist/client/components/redirect";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

let refreshPromise: Promise<string | null> | null = null;

/**
 * Refresh the access token using the stored refresh token.
 */
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

    return data.access_token;
  } catch (error) {
    console.error("Token refresh failed:", error);
    return null;
  }
}

/**
 * Get the currently stored access token.
 */
async function getValidAccessToken(): Promise<string> {
  const token = sessionStorage.getItem("access_token");

  if (!token) {
    throw new Error("Please log in to continue.");
  }

  return token;
}

/**
 * Handle expired access tokens.
 * Multiple simultaneous requests share one refresh request.
 */
async function handleUnauthorized(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken();
  }

  const newToken = await refreshPromise;

  if (!newToken) {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("user");

    redirect("/login");
  }

  return newToken;
}

/**
 * Extract an error message from the API response.
 */
async function getErrorMessage(response: Response): Promise<string> {
  const error = await response.json().catch(() => ({}));

  return Array.isArray(error.message)
    ? error.message.join(", ")
    : error.message || "Something went wrong";
}

/**
 * Make authenticated API requests.
 */
export async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
) {
  let token = await getValidAccessToken();

  const makeRequest = (accessToken: string) =>
    fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        Authorization: `Bearer ${accessToken}`,
      },
    });

  let response = await makeRequest(token);

  if (response.status === 401) {
    token = await handleUnauthorized();
    response = await makeRequest(token);
  }

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

/**
 * Upload files using FormData.
 * Do not manually set Content-Type.
 */
export async function apiUpload(
  endpoint: string,
  formData: FormData,
) {
  let token = await getValidAccessToken();

  const makeRequest = (accessToken: string) =>
    fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

  let response = await makeRequest(token);

  if (response.status === 401) {
    token = await handleUnauthorized();
    response = await makeRequest(token);
  }

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
