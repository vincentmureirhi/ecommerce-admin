import client from "./client";

// Get all customer locations
export async function listCustomerLocations() {
  const res = await client.get("/customer-locations");
  return res.data;
}

// Get single location
export async function getCustomerLocation(id) {
  const res = await client.get(`/customer-locations/${id}`);
  return res.data;
}

// Create location
export async function createCustomerLocation(payload) {
  const res = await client.post("/customer-locations", payload);
  return res.data;
}

// Update location
export async function updateCustomerLocation(id, payload) {
  const res = await client.put(`/customer-locations/${id}`, payload);
  return res.data;
}

// Delete location
export async function deleteCustomerLocation(id) {
  const res = await client.delete(`/customer-locations/${id}`);
  return res.data;
}
