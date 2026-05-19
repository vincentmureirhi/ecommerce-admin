import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://ecommerce-backend-9s3f.onrender.com/api";

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(
      `❌ Fetch error [${error.config?.url}]`,
      error.response?.data || error.message
    );

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      const currentPath = window.location.pathname || "/";

      if (!currentPath.startsWith("/customer")) {
        window.location.href = "/login?portal=admin";
      }
    }

    return Promise.reject(error);
  }
);

export default client;