import client from "./client";

export async function listAdminUsers() {
  const res = await client.get("/admin-users");
  return res.data;
}
