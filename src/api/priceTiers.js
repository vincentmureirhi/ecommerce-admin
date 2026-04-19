import client from "./client";

// Get price tiers by product
export async function listPriceTiersByProduct(productId) {
  const res = await client.get(`/price-tiers/product/${productId}`);
  return res.data;
}

// Get all price tiers (mock - will load from all products)
export async function listPriceTiers() {
  // Since backend doesn't have a "list all" endpoint, we'll return empty
  // This should be fetched per product
  return { data: [] };
}

// Create price tier
export async function createPriceTier(payload) {
  const res = await client.post("/price-tiers", payload);
  return res.data;
}

// Update price tier
export async function updatePriceTier(id, payload) {
  const res = await client.put(`/price-tiers/${id}`, payload);
  return res.data;
}

// Delete price tier
export async function deletePriceTier(id) {
  const res = await client.delete(`/price-tiers/${id}`);
  return res.data;
}
