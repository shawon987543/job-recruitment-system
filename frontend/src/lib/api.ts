const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
) {
  const accessToken =
    typeof window !== "undefined"
      ? sessionStorage.getItem("access_token")
      : null;

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Something went wrong");
  }

  return response.json();
}
