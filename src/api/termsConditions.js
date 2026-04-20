import client from "./client";

export async function getTerms() {
  const res = await client.get("/terms");
  return res.data;
}

export async function updateTerms(data) {
  const res = await client.put("/terms", data);
  return res.data;
}
