import client from "./client";

function queryString(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

function unwrap(response) {
  return response.data?.data ?? response.data;
}

export async function listVendorApplications(filters = {}) {
  const res = await client.get(`/vendors/applications${queryString(filters)}`);
  return unwrap(res);
}

export async function approveVendorApplication(id, payload) {
  const res = await client.post(`/vendors/applications/${id}/approve`, payload);
  return unwrap(res);
}

export async function rejectVendorApplication(id, payload) {
  const res = await client.post(`/vendors/applications/${id}/reject`, payload);
  return unwrap(res);
}

export async function listVendors(filters = {}) {
  const res = await client.get(`/vendors${queryString(filters)}`);
  return unwrap(res);
}

export async function updateVendor(id, payload) {
  const res = await client.patch(`/vendors/${id}`, payload);
  return unwrap(res);
}

export async function listVendorPlans() {
  const res = await client.get("/vendors/plans");
  return unwrap(res);
}

export async function createVendorPlan(payload) {
  const res = await client.post("/vendors/plans", payload);
  return unwrap(res);
}

export async function updateVendorPlan(id, payload) {
  const res = await client.put(`/vendors/plans/${id}`, payload);
  return unwrap(res);
}
