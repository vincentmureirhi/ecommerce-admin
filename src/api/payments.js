import client from "./client";

export async function listPayments(filters = {}) {
  const params = new URLSearchParams();

  if (filters.status && filters.status !== "all") params.append("status", filters.status);
  if (filters.method && filters.method !== "all") params.append("method", filters.method);
  if (filters.search) params.append("search", filters.search);
  if (filters.date_from) params.append("date_from", filters.date_from);
  if (filters.date_to) params.append("date_to", filters.date_to);

  const query = params.toString();
  const res = await client.get(`/payments${query ? `?${query}` : ""}`);
  return res.data;
}

export async function getPayment(id) {
  const res = await client.get(`/payments/${id}`);
  return res.data;
}

export async function getPaymentSummary() {
  const res = await client.get("/payments/summary");
  return res.data;
}

export async function createPayment(payload) {
  const res = await client.post("/payments", payload);
  return res.data;
}

export async function reconcilePayment(id, payload) {
  const res = await client.put(`/payments/${id}/reconcile`, payload);
  return res.data;
}

export async function getPaymentForOrder(orderId) {
  const res = await client.get(`/payments/order/${orderId}`);
  return res.data;
}

export async function initiateSTKPush(payload) {
  const res = await client.post("/payments/stk-push", payload);
  return res.data;
}
