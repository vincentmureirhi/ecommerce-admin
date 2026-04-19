const API_BASE = import.meta.env.VITE_API_URL || "/api";

function getAdminToken() {
  return localStorage.getItem("token");
}

async function request(path, options = {}) {
  const token = getAdminToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

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
    const error = new Error(data?.message || data?.error || "Request failed");
    error.response = { data };
    throw error;
  }

  return data;
}

export async function listRouteCustomerApplications(status = "") {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return request(`/route-customer-portal/applications${query}`, {
    method: "GET",
  });
}

export async function listRouteCustomerApplicationEvents(applicationId) {
  return request(`/route-customer-portal/applications/${applicationId}/events`, {
    method: "GET",
  });
}

export async function createManualRouteCustomerApplication(payload) {
  return request("/route-customer-portal/applications/public", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function approveRouteCustomerApplication(applicationId, payload) {
  return request(`/route-customer-portal/applications/${applicationId}/approve`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function rejectRouteCustomerApplication(applicationId, payload) {
  return request(`/route-customer-portal/applications/${applicationId}/reject`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function saveRouteCustomerApplicationWorkflow(applicationId, payload) {
  return request(`/route-customer-portal/applications/${applicationId}/workflow`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listAdminRouteCustomers() {
  return request("/route-customer-portal/admin/customers", {
    method: "GET",
  });
}

export async function saveRouteCustomerAccess(customerId, payload) {
  return request(`/route-customer-portal/admin/customers/${customerId}/access`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listRouteCustomerApplicationFiles(applicationId) {
  return request(`/route-customer-portal/applications/${applicationId}/files`, {
    method: "GET",
  });
}

export async function uploadRouteCustomerApplicationFile(applicationId, fileType, file) {
  const token = getAdminToken();
  const formData = new FormData();

  formData.append("file_type", fileType);
  formData.append("file", file);

  const response = await fetch(
    `${API_BASE}/route-customer-portal/applications/${applicationId}/files`,
    {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }
  );

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
    const error = new Error(data?.message || data?.error || "File upload failed");
    error.response = { data };
    throw error;
  }

  return data;
}

export async function deleteRouteCustomerApplicationFile(applicationId, fileId) {
  return request(`/route-customer-portal/applications/${applicationId}/files/${fileId}`, {
    method: "DELETE",
  });
}

function extractDownloadFilename(contentDisposition, fallback = "downloaded-file") {
  if (!contentDisposition) return fallback;

  const utfMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) {
    try {
      return decodeURIComponent(utfMatch[1]);
    } catch {
      return utfMatch[1];
    }
  }

  const basicMatch = contentDisposition.match(/filename="([^"]+)"/i);
  if (basicMatch?.[1]) return basicMatch[1];

  return fallback;
}

export async function downloadRouteCustomerApplicationFile(applicationId, fileId, fallbackName = "downloaded-file") {
  const token = getAdminToken();

  const response = await fetch(
    `${API_BASE}/route-customer-portal/applications/${applicationId}/files/${fileId}/download`,
    {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );

  if (!response.ok) {
    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    const error = new Error(data?.message || data?.error || "Download failed");
    error.response = { data };
    throw error;
  }

  const blob = await response.blob();
  const filename = extractDownloadFilename(
    response.headers.get("content-disposition"),
    fallbackName
  );

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);

  return { filename };
}
