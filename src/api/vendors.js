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

export async function resetVendorOwnerPassword(id, payload = {}) {
  const res = await client.post(`/vendors/${id}/reset-owner-password`, payload);
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

export async function listVendorProductSubmissions(filters = {}) {
  const res = await client.get(`/vendors/product-submissions${queryString(filters)}`);
  return unwrap(res);
}

export async function getVendorProductSubmission(id) {
  const res = await client.get(`/vendors/product-submissions/${id}`);
  return unwrap(res);
}

export async function approveVendorProductSubmission(id, payload) {
  const res = await client.post(`/vendors/product-submissions/${id}/approve`, payload);
  return unwrap(res);
}

export async function requestVendorProductChanges(id, payload) {
  const res = await client.post(`/vendors/product-submissions/${id}/request-changes`, payload);
  return unwrap(res);
}

export async function rejectVendorProductSubmission(id, payload) {
  const res = await client.post(`/vendors/product-submissions/${id}/reject`, payload);
  return unwrap(res);
}
