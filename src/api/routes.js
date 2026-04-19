import client from "./client";

// Get all routes
export async function listRoutes(filters = {}) {
  const params = new URLSearchParams();
  if (filters.sales_rep_id) params.append("sales_rep_id", filters.sales_rep_id);
  
  const queryStr = params.toString();
  const res = await client.get(`/routes${queryStr ? "?" + queryStr : ""}`);
  return res.data;
}

// Get single route
export async function getRoute(id) {
  const res = await client.get(`/routes/${id}`);
  return res.data;
}

// Create route
export async function createRoute(payload) {
  const res = await client.post("/routes", payload);
  return res.data;
}

// Update route
export async function updateRoute(id, payload) {
  const res = await client.put(`/routes/${id}`, payload);
  return res.data;
}

// Delete route
export async function deleteRoute(id) {
  const res = await client.delete(`/routes/${id}`);
  return res.data;
}
