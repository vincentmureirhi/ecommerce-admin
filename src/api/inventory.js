import client from "./client";

export async function getInventoryAnalytics(params = {}) {
  const query = new URLSearchParams();

  if (params.profit_type) {
    query.append("profit_type", params.profit_type);
  }

  const qs = query.toString();
  const res = await client.get(`/inventory/analytics${qs ? `?${qs}` : ""}`);
  return res.data;
}

export async function listInventory(params = {}) {
  const res = await getInventoryAnalytics(params);
  const data = res?.data || {};

  return {
    data: data.products || [],
    summary: data.summary || {},
    best_sellers: data.best_sellers || [],
    slow_moving: data.slow_moving || [],
    categories: data.categories || [],
    suppliers: data.suppliers || [],
  };
}

export async function updateInventoryReorderLevel(id, reorderLevel) {
  const res = await client.put(`/inventory/${id}/reorder-level`, {
    reorder_level: reorderLevel,
  });
  return res.data;
}

export async function updateInventory(id, payload) {
  return { success: true, id, payload };
}
