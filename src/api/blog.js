import client from "./client";

export async function listBlogPosts(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.append("status", filters.status);
  if (filters.search) params.append("search", filters.search);
  const queryStr = params.toString();
  const res = await client.get(`/blog${queryStr ? "?" + queryStr : ""}`);
  return res.data;
}

export async function getBlogPostById(id) {
  const res = await client.get(`/blog/${id}`);
  return res.data;
}

export async function createBlogPost(data) {
  const res = await client.post("/blog", data);
  return res.data;
}

export async function updateBlogPost(id, data) {
  const res = await client.put(`/blog/${id}`, data);
  return res.data;
}

export async function deleteBlogPost(id) {
  const res = await client.delete(`/blog/${id}`);
  return res.data;
}
