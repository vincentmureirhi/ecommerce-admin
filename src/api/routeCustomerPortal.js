const API_BASE = import.meta.env.VITE_API_URL || "/api";
const ROUTE_CUSTOMER_TOKEN_KEY = "routeCustomerToken";

function getRouteCustomerToken() {
  return localStorage.getItem(ROUTE_CUSTOMER_TOKEN_KEY);
}

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = {
      success: false,
      message: "Invalid server response",
    };
  }

  if (!response.ok || data?.success === false) {
    const error = new Error(
      data?.message || data?.error || "Request failed"
    );
    error.response = { data };
    throw error;
  }

  return data;
}

export async function loginRouteCustomer(username, password) {
  return request("/route-customer-portal/auth/login", {
    method: "POST",
    body: JSON.stringify({
      username,
      password,
    }),
  });
}

export async function getRouteCustomerDashboard() {
  const token = getRouteCustomerToken();

  return request("/route-customer-portal/dashboard/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function changeRouteCustomerPassword(payload) {
  const token = getRouteCustomerToken();

  return request("/route-customer-portal/auth/change-password", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}
