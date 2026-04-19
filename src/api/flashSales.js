import client from "./client";

export async function listFlashSales() {
  const res = await client.get("/flash-sales");
  return res.data;
}

export async function getFlashSaleById(id) {
  const res = await client.get(`/flash-sales/${id}`);
  return res.data;
}

export async function createFlashSale(data) {
  const res = await client.post("/flash-sales", data);
  return res.data;
}

export async function updateFlashSale(id, data) {
  const res = await client.put(`/flash-sales/${id}`, data);
  return res.data;
}

export async function deleteFlashSale(id) {
  const res = await client.delete(`/flash-sales/${id}`);
  return res.data;
}

export async function getActiveFlashSales() {
  const res = await client.get("/flash-sales/active");
  return res.data;
}

export async function getFlashSaleProducts(saleId) {
  const res = await client.get(`/flash-sales/${saleId}/products`);
  return res.data;
}

export async function addProductToFlashSale(saleId, productId, discountOverride = null) {
  const body = { product_id: productId };
  if (discountOverride !== null) body.discount_override = discountOverride;
  const res = await client.post(`/flash-sales/${saleId}/products`, body);
  return res.data;
}

export async function removeProductFromFlashSale(saleId, productId) {
  const res = await client.delete(`/flash-sales/${saleId}/products/${productId}`);
  return res.data;
}
