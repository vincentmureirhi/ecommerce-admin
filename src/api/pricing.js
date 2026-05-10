import client from "./client";

// ─── Pricing Rules ────────────────────────────────────────────────────────────

export async function listPricingRules() {
  const res = await client.get("/pricing-rules");
  return res.data;
}

export async function getPricingRule(id) {
  const res = await client.get(`/pricing-rules/${id}`);
  return res.data;
}

export async function createPricingRule(payload) {
  const res = await client.post("/pricing-rules", payload);
  return res.data;
}

export async function updatePricingRule(id, payload) {
  const res = await client.put(`/pricing-rules/${id}`, payload);
  return res.data;
}

export async function deletePricingRule(id) {
  const res = await client.delete(`/pricing-rules/${id}`);
  return res.data;
}

// ─── Pricing Rule Tiers ───────────────────────────────────────────────────────

export async function listPricingRuleTiers(ruleId) {
  const res = await client.get(`/pricing-rules/${ruleId}/tiers`);
  return res.data;
}

export async function createPricingRuleTier(ruleId, payload) {
  const res = await client.post(`/pricing-rules/${ruleId}/tiers`, payload);
  return res.data;
}

export async function updatePricingRuleTier(ruleId, tierId, payload) {
  const res = await client.put(`/pricing-rules/${ruleId}/tiers/${tierId}`, payload);
  return res.data;
}

export async function deletePricingRuleTier(ruleId, tierId) {
  const res = await client.delete(`/pricing-rules/${ruleId}/tiers/${tierId}`);
  return res.data;
}

// ─── Pricing Groups ───────────────────────────────────────────────────────────

export async function listPricingGroups() {
  const res = await client.get("/pricing-groups");
  return res.data;
}

export async function getPricingGroup(id) {
  const res = await client.get(`/pricing-groups/${id}`);
  return res.data;
}

export async function createPricingGroup(payload) {
  const res = await client.post("/pricing-groups", payload);
  return res.data;
}

export async function updatePricingGroup(id, payload) {
  const res = await client.put(`/pricing-groups/${id}`, payload);
  return res.data;
}

export async function deletePricingGroup(id) {
  const res = await client.delete(`/pricing-groups/${id}`);
  return res.data;
}

// ─── Pricing Group Products ───────────────────────────────────────────────────

export async function listPricingGroupProducts(groupId) {
  const res = await client.get(`/pricing-groups/${groupId}/products`);
  return res.data;
}

export async function addProductToPricingGroup(groupId, productId) {
  const res = await client.post(`/pricing-groups/${groupId}/products`, { product_id: productId });
  return res.data;
}

export async function removeProductFromPricingGroup(groupId, productId) {
  const res = await client.delete(`/pricing-groups/${groupId}/products/${productId}`);
  return res.data;
}
