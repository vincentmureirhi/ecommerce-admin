import client from "../api/client";

const EMPTY_OVERVIEW = {
  kpis: {},
  trend: [],
  alerts: [],
  top_products: [],
  low_stock: [],
  recent_orders: [],
  revenue_by_region: [],
  top_customers: [],
  top_sales_reps: [],
  payment_health: {},
  recent_activity: [],
  inventory_intelligence: {},
  morning_summary: {},
};

function unwrap(response) {
  return response?.data?.success ? response.data.data : response?.data;
}

function normalizeOverview(payload) {
  const data = payload && typeof payload === "object" ? payload : {};
  return {
    ...EMPTY_OVERVIEW,
    ...data,
    kpis: data.kpis || {},
    trend: Array.isArray(data.trend) ? data.trend : [],
    alerts: Array.isArray(data.alerts) ? data.alerts : [],
    top_products: Array.isArray(data.top_products) ? data.top_products : [],
    low_stock: Array.isArray(data.low_stock) ? data.low_stock : [],
    recent_orders: Array.isArray(data.recent_orders) ? data.recent_orders : [],
    revenue_by_region: Array.isArray(data.revenue_by_region) ? data.revenue_by_region : [],
    top_customers: Array.isArray(data.top_customers) ? data.top_customers : [],
    top_sales_reps: Array.isArray(data.top_sales_reps) ? data.top_sales_reps : [],
    payment_health: data.payment_health || {},
    recent_activity: Array.isArray(data.recent_activity) ? data.recent_activity : [],
    inventory_intelligence: data.inventory_intelligence || {},
    morning_summary: data.morning_summary || {},
  };
}

async function fetchOverview(filter = "30days", limit = 15) {
  const response = await client.get("/analytics/overview", {
    params: { filter, limit },
  });
  return normalizeOverview(unwrap(response));
}

async function fetchSection(endpoint, fallback, params = {}) {
  const response = await client.get(endpoint, { params });
  const data = unwrap(response);
  return data ?? fallback;
}

export const dashboardService = {
  getOverview: fetchOverview,

  getKPIs: async (filter = "30days") => {
    const data = await fetchOverview(filter);
    return data.kpis;
  },

  getSalesTrend: async (filter = "30days") => {
    const data = await fetchOverview(filter);
    return data.trend;
  },

  getAlerts: async () => {
    const data = await fetchOverview("30days");
    return data.alerts;
  },

  getTopProducts: async (limit = 5, filter = "30days") => {
    const data = await fetchOverview(filter, limit);
    return data.top_products.slice(0, limit);
  },

  getLowStock: async (limit = 10) => {
    const data = await fetchOverview("30days", limit);
    return data.low_stock.slice(0, limit);
  },

  getRecentOrders: async (limit = 10) => {
    const data = await fetchOverview("30days", limit);
    return data.recent_orders.slice(0, limit);
  },

  getRevenueByRegion: async (filter = "30days") => {
    const data = await fetchOverview(filter);
    return data.revenue_by_region;
  },

  getTopCustomers: async (limit = 5, filter = "30days") => {
    const data = await fetchOverview(filter, limit);
    return data.top_customers.slice(0, limit);
  },

  getTopSalesReps: async (limit = 5, filter = "30days") => {
    const data = await fetchOverview(filter, limit);
    return data.top_sales_reps.slice(0, limit);
  },

  getPaymentHealth: async (filter = "30days") => {
    const data = await fetchOverview(filter);
    return data.payment_health;
  },

  getRecentActivity: async (limit = 15) => {
    const data = await fetchOverview("30days", limit);
    return data.recent_activity.slice(0, limit);
  },

  getInventoryIntelligence: async () => {
    const data = await fetchOverview("30days");
    return data.inventory_intelligence;
  },

  getMorningSummary: async () => {
    const data = await fetchOverview("today");
    return data.morning_summary;
  },

  // Kept for targeted diagnostics from the browser console.
  getRawSection: fetchSection,
};
