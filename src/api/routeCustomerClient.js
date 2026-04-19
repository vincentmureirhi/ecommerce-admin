import axios from "axios";

const routeCustomerClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 20000,
});

routeCustomerClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("route_customer_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

routeCustomerClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("route_customer_token");
      localStorage.removeItem("route_customer_user");
      localStorage.removeItem("route_customer_account");

      const currentPath = window.location.pathname || "/";
      if (currentPath.startsWith("/customer")) {
        window.location.href = "/login?portal=customer";
      }
    }

    return Promise.reject(error);
  }
);

export default routeCustomerClient;
