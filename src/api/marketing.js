import client from "./client";

export async function listMarketingCampaigns(filters = {}) {
  const res = await client.get("/marketing/campaigns", { params: filters });
  return res.data;
}

export async function createMarketingCampaign(payload) {
  const res = await client.post("/marketing/campaigns", payload);
  return res.data;
}

export async function updateMarketingCampaign(id, payload) {
  const res = await client.patch(`/marketing/campaigns/${id}`, payload);
  return res.data;
}

export async function listCoupons(filters = {}) {
  const res = await client.get("/marketing/coupons", { params: filters });
  return res.data;
}

export async function createCoupon(payload) {
  const res = await client.post("/marketing/coupons", payload);
  return res.data;
}

export async function updateCoupon(id, payload) {
  const res = await client.patch(`/marketing/coupons/${id}`, payload);
  return res.data;
}

export async function getCampaignTargets(id) {
  const res = await client.get(`/marketing/campaigns/${id}/targets`);
  return res.data;
}

export async function replaceCampaignTargets(id, payload) {
  const res = await client.put(`/marketing/campaigns/${id}/targets`, payload);
  return res.data;
}

export async function getMarketingAnalytics(days = 30) {
  const res = await client.get('/marketing/analytics', { params: { days } });
  return res.data;
}

export async function listSalesRepReferralCodes() {
  const res = await client.get('/marketing/referrals/sales-reps');
  return res.data;
}

export async function syncSalesRepReferralCodes() {
  const res = await client.post('/marketing/referrals/sales-reps/sync');
  return res.data;
}