const BASE = import.meta.env.VITE_API_URL || "";

function token(role) {
  return localStorage.getItem(role === "admin" ? "fp_admin_token" : "fp_customer_token");
}

export async function api(path, { method = "GET", body, role = "admin", auth = false } = {}) {
  const isForm = body instanceof FormData;
  const headers = isForm ? {} : { "Content-Type": "application/json" };
  if (auth) {
    const t = token(role || "customer");
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data.detail;
    const message = typeof detail === "string" ? detail : Array.isArray(detail) ? detail[0]?.msg : "Request failed";
    throw new Error(message || "Request failed");
  }
  return data;
}

export const AuthStore = {
  setCustomer(tokenValue, customer) {
    localStorage.setItem("fp_customer_token", tokenValue);
    localStorage.setItem("fp_customer", JSON.stringify(customer));
  },
  setAdmin(tokenValue, admin) {
    localStorage.setItem("fp_admin_token", tokenValue);
    localStorage.setItem("fp_admin", JSON.stringify(admin));
  },
  customer() {
    try {
      return JSON.parse(localStorage.getItem("fp_customer") || "null");
    } catch {
      return null;
    }
  },
  admin() {
    try {
      return JSON.parse(localStorage.getItem("fp_admin") || "null");
    } catch {
      return null;
    }
  },
  clearCustomer() {
    localStorage.removeItem("fp_customer_token");
    localStorage.removeItem("fp_customer");
  },
  clearAdmin() {
    localStorage.removeItem("fp_admin_token");
    localStorage.removeItem("fp_admin");
  },
};
