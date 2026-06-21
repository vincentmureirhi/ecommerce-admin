import client from "./client";

const buildQuery = (filters = {}) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  });

  const query = params.toString();
  return query ? `?${query}` : "";
};

const unwrap = (response) => response.data?.data ?? response.data;

export async function getRouteOperations(filters = {}) {
  const res = await client.get(`/analytics/route-operations${buildQuery(filters)}`);
  return unwrap(res);
}

export async function listRouteCycles(filters = {}) {
  const res = await client.get(`/route-operations/cycles${buildQuery(filters)}`);
  return unwrap(res);
}

export async function getCurrentRouteCycle(filters = {}) {
  const res = await client.get(`/route-operations/cycles/current${buildQuery(filters)}`);
  return unwrap(res);
}

export async function getRouteTerminal(cycleId, filters = {}) {
  const res = await client.get(
    `/route-operations/cycles/${cycleId}/terminal${buildQuery(filters)}`
  );
  return unwrap(res);
}

export async function getRouteCandles(cycleId, filters = {}) {
  const res = await client.get(
    `/route-operations/cycles/${cycleId}/candles${buildQuery(filters)}`
  );
  return unwrap(res);
}

export async function createRouteCycle(payload) {
  const res = await client.post("/route-operations/cycles", payload);
  return unwrap(res);
}

export async function updateRouteCycle(cycleId, payload) {
  const res = await client.put(`/route-operations/cycles/${cycleId}`, payload);
  return unwrap(res);
}

export async function closeRouteCycle(cycleId) {
  const res = await client.post(`/route-operations/cycles/${cycleId}/close`);
  return unwrap(res);
}

export async function syncRouteCycleOrders(cycleId) {
  const res = await client.post(`/route-operations/cycles/${cycleId}/sync-orders`);
  return unwrap(res);
}