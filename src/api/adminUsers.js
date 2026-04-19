import client from "./client";

export async function listAdminUsers() {
  const res = await client.get("/admin-users");
  return res.data;
}

export async function createAdminUser(data) {
  const res = await client.post("/admin-users", data);
  return res.data;
}

export async function updateAdminUser(id, data) {
  const res = await client.put(`/admin-users/${id}`, data);
  return res.data;
}

export async function changeAdminUserRole(id, role) {
  const res = await client.put(`/admin-users/${id}/role`, { role });
  return res.data;
}

export async function deleteAdminUser(id) {
  const res = await client.delete(`/admin-users/${id}`);
  return res.data;
}
