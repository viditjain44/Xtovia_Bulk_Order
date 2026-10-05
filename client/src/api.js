// Leave VITE_API_URL unset when the API is served from the same domain as this app.
const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.message || "Something went wrong. Please try again.");
    error.status = response.status;
    error.errors = body.errors;
    throw error;
  }
  return body;
}

export function submitEnquiry(data) {
  return request("/enquiries", { method: "POST", body: JSON.stringify(data) });
}

export function adminLogin(password) {
  return request("/admin/login", { method: "POST", body: JSON.stringify({ password }) });
}

export function fetchEnquiries(token) {
  return request("/admin/enquiries", { headers: { Authorization: `Bearer ${token}` } });
}
