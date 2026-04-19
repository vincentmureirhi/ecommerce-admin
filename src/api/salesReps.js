import client from "./client";

export async function listSalesReps() {
  const res = await client.get("/sales-reps");
  return res.data;
}

export async function getSalesRepById(id) {
  const res = await client.get(`/sales-reps/${id}`);
  return res.data;
}

export async function createSalesRep(data) {
  const res = await client.post("/sales-reps", data);
  return res.data;
}

export async function updateSalesRep(id, data) {
  const res = await client.put(`/sales-reps/${id}`, data);
  return res.data;
}

export async function deleteSalesRep(id) {
  const res = await client.delete(`/sales-reps/${id}`);
  return res.data;
}

export async function saveSalesRepLocation(id, data) {
  const res = await client.post(`/sales-reps/${id}/location`, data);
  return res.data;
}

export async function getLatestSalesRepLocation(id) {
  const res = await client.get(`/sales-reps/${id}/location/latest`);
  return res.data;
}

export async function listLatestSalesRepLocations() {
  const res = await client.get("/sales-reps/locations/latest");
  return res.data;
}
