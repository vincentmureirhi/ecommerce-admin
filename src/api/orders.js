import client from "./client";

export async function listOrders(filters = {}) {
  const params = new URLSearchParams();

  if (filters.order_type) params.append("order_type", filters.order_type);
  if (filters.order_status) params.append("order_status", filters.order_status);
  if (filters.customer_id) params.append("customer_id", filters.customer_id);
  if (filters.sales_rep_id) params.append("sales_rep_id", filters.sales_rep_id);
  if (filters.search) params.append("search", filters.search);
  if (filters.printed_status) params.append("printed_status", filters.printed_status);
  if (filters.payment_state) params.append("payment_state", filters.payment_state);

  const queryStr = params.toString();
  const res = await client.get(`/orders${queryStr ? "?" + queryStr : ""}`);
  return res.data;
}

export async function getOrderById(id) {
  const res = await client.get(`/orders/${id}`);
  return res.data;
}

export async function createOrder(data) {
  const res = await client.post("/orders", data);
  return res.data;
}

export async function updateOrderStatus(id, data) {
  const res = await client.put(`/orders/${id}/status`, data);
  return res.data;
}

export async function deleteOrder(id) {
  const res = await client.delete(`/orders/${id}`);
  return res.data;
}

export async function getOrdersBySalesRep(salesRepId) {
  const res = await client.get(`/orders/sales-rep/${salesRepId}`);
  return res.data;
}

export async function getOrderForPrint(id) {
  const res = await client.get(`/orders/${id}/print`);
  return res.data;
}

export async function getOrderStatistics(filters = {}) {
  const params = new URLSearchParams();
  if (filters.start_date) params.append("start_date", filters.start_date);
  if (filters.end_date) params.append("end_date", filters.end_date);

  const queryStr = params.toString();
  const res = await client.get(`/orders/stats/all${queryStr ? "?" + queryStr : ""}`);
  return res.data;
}
