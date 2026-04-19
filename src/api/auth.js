import client from "./client";

export async function login(email, password) {
  const res = await client.post("/auth/login", { email, password });
  return res.data;
}
