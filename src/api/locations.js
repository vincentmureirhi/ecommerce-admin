import client from "./client";

export async function listLocations(filters = {}) {
  const params = new URLSearchParams();
  if (filters.region_id) params.append("region_id", filters.region_id);
  if (filters.search) params.append("search", filters.search);
  
  const queryStr = params.toString();
  const res = await client.get(`/locations${queryStr ? "?" + queryStr : ""}`);
  return res.data;
}

export async function getLocationById(id) {
  const res = await client.get(`/locations/${id}`);
  return res.data;
}

export async function createLocation(data) {
  const res = await client.post("/locations", data);
  return res.data;
}

export async function updateLocation(id, data) {
  const res = await client.put(`/locations/${id}`, data);
  return res.data;
}

export async function deleteLocation(id) {
  const res = await client.delete(`/locations/${id}`);
  return res.data;
}
