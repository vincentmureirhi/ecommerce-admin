import client from "./client";

export async function listRegions(filters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.append("search", filters.search);

  const queryStr = params.toString();
  const res = await client.get(`/regions${queryStr ? "?" + queryStr : ""}`);
  return res.data;
}

export async function getRegionById(id) {
  const res = await client.get(`/regions/${id}`);
  return res.data;
}

export async function getRegionDashboard(id, filters = {}) {
  const params = new URLSearchParams();

  if (filters.start_date) params.append("start_date", filters.start_date);
  if (filters.end_date) params.append("end_date", filters.end_date);

  const queryStr = params.toString();
  const res = await client.get(
    `/regions/${id}/dashboard${queryStr ? "?" + queryStr : ""}`
  );
  return res.data;
}

export async function createRegion(data) {
  const res = await client.post("/regions", data);
  return res.data;
}

export async function updateRegion(id, data) {
  const res = await client.put(`/regions/${id}`, data);
  return res.data;
}

export async function deleteRegion(id) {
  const res = await client.delete(`/regions/${id}`);
  return res.data;
}
