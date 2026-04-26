import client from "./client";

export async function listPricingRules() {
  const res = await client.get("/pricing-rules");
  return res.data;
}

export async function getPricingRuleById(id) {
  const res = await client.get(`/pricing-rules/${id}`);
  return res.data;
}

export async function createPricingRule(data) {
  const res = await client.post("/pricing-rules", data);
  return res.data;
}

export async function updatePricingRule(id, data) {
  const res = await client.put(`/pricing-rules/${id}`, data);
  return res.data;
}

export async function deletePricingRule(id) {
  const res = await client.delete(`/pricing-rules/${id}`);
  return res.data;
}
