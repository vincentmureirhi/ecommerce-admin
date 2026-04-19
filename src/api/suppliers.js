import client from "./client";

export async function listSuppliers(filters = {}) {
  const params = new URLSearchParams();

  if (filters.search) {
    params.append("search", filters.search);
  }

  const queryStr = params.toString();
  const res = await client.get(`/suppliers${queryStr ? "?" + queryStr : ""}`);
  return res.data;
}

export async function getSupplierById(id) {
  const res = await client.get(`/suppliers/${id}`);
  return res.data;
}

export async function createSupplier(payload) {
  const res = await client.post("/suppliers", payload);
  return res.data;
}

export async function updateSupplier(id, payload) {
  const res = await client.put(`/suppliers/${id}`, payload);
  return res.data;
}

export async function deleteSupplier(id) {
  const res = await client.delete(`/suppliers/${id}`);
  return res.data;
}
