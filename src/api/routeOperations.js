import client from "./client";

export async function getRouteOperations(filters = {}) {
  const params = new URLSearchParams();

  if (filters.filter) params.append("filter", filters.filter);
  if (filters.region_id) params.append("region_id", filters.region_id);
  if (filters.start_date) params.append("start_date", filters.start_date);
  if (filters.end_date) params.append("end_date", filters.end_date);
  if (filters.limit) params.append("limit", String(filters.limit));

  const query = params.toString();
  const res = await client.get(`/analytics/route-operations${query ? `?${query}` : ""}`);
  return res.data?.data || res.data;
}
