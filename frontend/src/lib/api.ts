
import toast from "react-hot-toast";
import {
  refreshAccessTokenOnce,
  clearSessionAndRedirect,
} from "@/lib/auth-session";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

/**
 * Get the currently stored access token.
 */
async function getValidAccessToken(): Promise<string> {
  const token = sessionStorage.getItem("access_token");

  if (token) return token;

  return handleUnauthorized("");
}

/**
 * Handle expired access tokens.
 */
async function handleUnauthorized(failedToken: string): Promise<string> {
  const currentToken = sessionStorage.getItem("access_token");

  if (currentToken && currentToken !== failedToken) {
    return currentToken;
  }

  const newToken = await refreshAccessTokenOnce();

  if (!newToken) {
    clearSessionAndRedirect();
    throw new Error("Your session has expired. Please log in again.");
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
  const method = (options.method || "GET").toUpperCase();

  const toastId =
    method === "GET"
      ? undefined
      : toast.loading("Saving your changes...");

  try {
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
      token = await handleUnauthorized(token);
      response = await makeRequest(token);
    }

    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  } finally {
    if (toastId) toast.dismiss(toastId);
  }
}

/**
 * Upload files using FormData.
 */
export async function apiUpload(
  endpoint: string,
  formData: FormData,
) {
  const toastId = toast.loading("Uploading...");

  try {
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
      token = await handleUnauthorized(token);
      response = await makeRequest(token);
    }

    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  } finally {
    toast.dismiss(toastId);
  }
}
