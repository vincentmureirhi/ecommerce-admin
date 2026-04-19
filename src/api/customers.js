import client from "./client";

export async function listCustomers(filters = {}) {
  const params = new URLSearchParams();

  if (filters.search) params.append("search", filters.search);
  if (filters.customer_type) params.append("customer_type", filters.customer_type);
  if (filters.status) params.append("status", filters.status);
  if (filters.location_id) params.append("location_id", filters.location_id);
  if (filters.sales_rep_id) params.append("sales_rep_id", filters.sales_rep_id);
  if (filters.region_id) params.append("region_id", filters.region_id);

  const queryStr = params.toString();
  const res = await client.get(`/customers${queryStr ? "?" + queryStr : ""}`);
  return res.data;
}

export async function getCustomerById(id) {
  const res = await client.get(`/customers/${id}`);
  return res.data;
}

export async function createCustomer(data) {
  const res = await client.post("/customers", data);
  return res.data;
}

export async function updateCustomer(id, data) {
  const res = await client.put(`/customers/${id}`, data);
  return res.data;
}

export async function deleteCustomer(id) {
  const res = await client.delete(`/customers/${id}`);
  return res.data;
}

export async function getCustomerOrderHistory(customerId) {
  const res = await client.get(`/customers/${customerId}/orders`);
  return res.data;
}

export async function getCustomerPayments(customerId) {
  const res = await client.get(`/customers/${customerId}/payments`);
  return res.data;
}

export async function getCustomerSummary(customerId) {
  const res = await client.get(`/customers/${customerId}/summary`);
  return res.data;
}
