import client from "./client";

export async function listCategories(filters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.append("search", filters.search);
  
  const queryStr = params.toString();
  const res = await client.get(`/categories${queryStr ? "?" + queryStr : ""}`);
  return res.data;
}

export async function getCategoryById(id) {
  const res = await client.get(`/categories/${id}`);
  return res.data;
}

export async function createCategory(data) {
  const res = await client.post("/categories", data);
  return res.data;
}

export async function updateCategory(id, data) {
  const res = await client.put(`/categories/${id}`, data);
  return res.data;
}

export async function deleteCategory(id) {
  const res = await client.delete(`/categories/${id}`);
  return res.data;
}
