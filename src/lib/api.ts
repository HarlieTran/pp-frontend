import { getAuthToken } from "./cognito";

const API_URL = import.meta.env.VITE_API_URL;

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = await getAuthToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = "API Request Failed";
    try {
      const data = await response.json();
      errorMsg = data.error || data.message || errorMsg;
    } catch {
      errorMsg = await response.text() || errorMsg;
    }
    throw new Error(errorMsg);
  }

  return response;
}

export async function apiGet(endpoint: string) {
  const res = await apiFetch(endpoint, { method: "GET" });
  return res.json();
}

export async function apiPost(endpoint: string, body: any) {
  const res = await apiFetch(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function apiPut(endpoint: string, body: any) {
  const res = await apiFetch(endpoint, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function apiPatch(endpoint: string, body: any) {
  const res = await apiFetch(endpoint, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function apiDelete(endpoint: string) {
  const res = await apiFetch(endpoint, { method: "DELETE" });
  return res.json();
}
