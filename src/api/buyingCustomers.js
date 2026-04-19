import client from "./client";

export async function listBuyingCustomers(filters = {}) {
  const params = new URLSearchParams();

  if (filters.search) params.append("search", filters.search);

  const queryStr = params.toString();
  const res = await client.get(`/buying-customers${queryStr ? "?" + queryStr : ""}`);
  return res.data;
}

export async function getBuyingCustomerById(id) {
  const res = await client.get(`/buying-customers/${id}`);
  return res.data;
}

export async function getBuyingCustomerOrders(id) {
  const res = await client.get(`/buying-customers/${id}/orders`);
  return res.data;
}
