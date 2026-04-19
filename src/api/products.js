import client from "./client";

// Get all products
export async function listProducts(filters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.append("search", filters.search);
  if (filters.category_id) params.append("category_id", filters.category_id);
  if (filters.department_id) params.append("department_id", filters.department_id);
  
  const queryStr = params.toString();
  const res = await client.get(`/products${queryStr ? "?" + queryStr : ""}`);
  return res.data;
}

// Get single product
export async function getProductById(id) {
  const res = await client.get(`/products/${id}`);
  return res.data;
}

// Create product
export async function createProduct(data) {
  const res = await client.post("/products", data);
  return res.data;
}

// Update product
export async function updateProduct(id, data) {
  const res = await client.put(`/products/${id}`, data);
  return res.data;
}

// Delete product
export async function deleteProduct(id) {
  const res = await client.delete(`/products/${id}`);
  return res.data;
}

// Get product by SKU
export async function getProductBySKU(sku) {
  const res = await client.get(`/products/sku/${sku}`);
  return res.data;
}

// Update stock
export async function updateProductStock(id, quantity) {
  const res = await client.put(`/products/${id}/stock`, { quantity });
  return res.data;
}
