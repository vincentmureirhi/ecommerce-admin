import client from "../api/client";

const PAID_STATUSES = new Set(["completed", "manually_resolved"]);
const OPEN_PAYMENT_STATUSES = new Set(["initiated", "pending"]);
const FAILED_PAYMENT_STATUSES = new Set(["failed", "cancelled", "timeout"]);

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function isPaid(payment) {
  return PAID_STATUSES.has(String(payment?.status || "").toLowerCase());
}

function getPaidAmount(payment) {
  return toNumber(payment?.received_amount ?? payment?.amount);
}

function getOrderStatus(order) {
  return String(order?.order_status || order?.status || "pending").toLowerCase();
}

function getRange(filter = "30days") {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (filter === "today") {
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }

  if (filter === "yesterday") {
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() - 1);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (filter === "thismonth") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }

  const days = filter === "7days" ? 7 : 30;
  start.setDate(start.getDate() - days);
  return { start, end };
}

function inRange(value, filter) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const { start, end } = getRange(filter);
  return date >= start && date <= end;
}

function inWindow(value, start, end) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date >= start && date <= end;
}

function getPreviousRange(filter = "30days") {
  const { start, end } = getRange(filter);
  const duration = end.getTime() - start.getTime();
  return {
    start: new Date(start.getTime() - duration),
    end: new Date(start.getTime()),
  };
}

function percentChange(current, previous) {
  const currentValue = toNumber(current);
  const previousValue = toNumber(previous);
  if (previousValue === 0 && currentValue === 0) return null;
  if (previousValue === 0) return 100;
  return Number((((currentValue - previousValue) / previousValue) * 100).toFixed(1));
}

function sameDay(value, target = new Date()) {
  if (!value) return false;
  return new Date(value).toDateString() === target.toDateString();
}

async function fetchAPI(endpoint, options = {}) {
  try {
    const response = await client.get(endpoint, options);
    return response.data?.success ? response.data.data : response.data;
  } catch (err) {
    console.error(`Dashboard API error [${endpoint}]:`, err?.response?.status || err.message);
    return null;
  }
}

async function loadOrders() {
  const data = await fetchAPI("/orders");
  return Array.isArray(data) ? data : [];
}

async function loadPayments() {
  const data = await fetchAPI("/payments");
  return Array.isArray(data) ? data : [];
}

async function loadInventory() {
  const data = await fetchAPI("/inventory/analytics", {
    params: { profit_type: "retail" },
  });

  return {
    summary: data?.summary || {},
    products: Array.isArray(data?.products) ? data.products : [],
    best_sellers: Array.isArray(data?.best_sellers) ? data.best_sellers : [],
    slow_moving: Array.isArray(data?.slow_moving) ? data.slow_moving : [],
  };
}

const overviewCache = new Map();
const overviewPending = new Map();

async function loadOverview(filter = "30days") {
  const key = String(filter || "30days");
  const cached = overviewCache.get(key);
  if (cached && Date.now() - cached.timestamp < 15000) {
    return cached.data;
  }

  if (overviewPending.has(key)) {
    return overviewPending.get(key);
  }

  const request = fetchAPI("/analytics/overview", {
    params: { filter: key, limit: 15 },
  }).finally(() => {
    overviewPending.delete(key);
  });

  overviewPending.set(key, request);
  const data = await request;

  if (data) {
    overviewCache.set(key, { timestamp: Date.now(), data });
  }

  return data;
}

function sortByDateDesc(a, b) {
  return new Date(b.created_at || b.updated_at || 0) - new Date(a.created_at || a.updated_at || 0);
}

function formatPaymentActivity(payment) {
  const status = String(payment.status || "pending").toLowerCase();
  const label = PAID_STATUSES.has(status)
    ? "Completed"
    : FAILED_PAYMENT_STATUSES.has(status)
    ? "Failed"
    : "Pending";

  return {
    message: `Payment #${payment.id} - ${label} (KSh ${getPaidAmount(payment).toLocaleString()})`,
    timestamp: payment.created_at ? new Date(payment.created_at).toLocaleTimeString() : "Just now",
  };
}

export const dashboardService = {
  getKPIs: async (filter = "30days") => {
    const overview = await loadOverview(filter);
    if (overview?.kpis) return overview.kpis;

    const [payments, orders, inventory] = await Promise.all([
      loadPayments(),
      loadOrders(),
      loadInventory(),
    ]);

    const filteredPayments = payments.filter((p) => inRange(p.created_at, filter));
    const filteredOrders = orders.filter((o) => inRange(o.created_at, filter));
    const previousRange = getPreviousRange(filter);
    const previousPayments = payments.filter((p) => inWindow(p.created_at, previousRange.start, previousRange.end));
    const previousOrders = orders.filter((o) => inWindow(o.created_at, previousRange.start, previousRange.end));
    const completedPayments = filteredPayments.filter(isPaid);
    const previousCompletedPayments = previousPayments.filter(isPaid);
    const failedPayments = filteredPayments.filter((p) =>
      FAILED_PAYMENT_STATUSES.has(String(p.status || "").toLowerCase())
    );
    const pendingPayments = filteredPayments.filter((p) =>
      OPEN_PAYMENT_STATUSES.has(String(p.status || "").toLowerCase())
    );
    const previousPendingPayments = previousPayments.filter((p) =>
      OPEN_PAYMENT_STATUSES.has(String(p.status || "").toLowerCase())
    );

    const revenue = completedPayments.reduce((sum, p) => sum + getPaidAmount(p), 0);
    const previousRevenue = previousCompletedPayments.reduce((sum, p) => sum + getPaidAmount(p), 0);
    const totalOrders = filteredOrders.length;
    const previousTotalOrders = previousOrders.length;
    const aov = totalOrders > 0 ? Math.round(revenue / totalOrders) : 0;
    const previousCustomerCount = new Set(previousOrders.map((o) => o.customer_phone || o.customer_name).filter(Boolean)).size;
    const currentCustomerCount = new Set(filteredOrders.map((o) => o.customer_phone || o.customer_name).filter(Boolean)).size;
    const paymentSuccessRate =
      filteredPayments.length > 0
        ? Math.round((completedPayments.length / filteredPayments.length) * 100)
        : 0;
    const previousPaymentSuccessRate =
      previousPayments.length > 0
        ? Math.round((previousCompletedPayments.length / previousPayments.length) * 100)
        : 0;
    const dispatchQueue = filteredOrders.filter((o) =>
      ["pending", "processing"].includes(getOrderStatus(o))
    ).length;

    return {
      revenue: Math.round(revenue),
      orders: totalOrders,
      aov,
      payment_success_rate: paymentSuccessRate,
      failed_payments: failedPayments.length,
      pending_payments: pendingPayments.length,
      low_stock:
        toNumber(inventory.summary.low_stock_count) +
        toNumber(inventory.summary.reorder_now_count),
      out_of_stock: toNumber(inventory.summary.out_of_stock_count),
      awaiting_dispatch: dispatchQueue,
      new_customers: currentCustomerCount,
      revenue_trend: percentChange(revenue, previousRevenue),
      orders_trend: percentChange(totalOrders, previousTotalOrders),
      payment_trend: percentChange(paymentSuccessRate, previousPaymentSuccessRate),
      pending_trend: percentChange(previousPendingPayments.length, pendingPayments.length),
      customer_trend: percentChange(currentCustomerCount, previousCustomerCount),
    };
  },

  getSalesTrend: async (filter = "30days") => {
    const overview = await loadOverview(filter);
    if (Array.isArray(overview?.trend)) return overview.trend;

    const payments = await loadPayments();
    const trend = {};

    payments
      .filter((p) => isPaid(p) && inRange(p.created_at, filter))
      .forEach((p) => {
        const date = new Date(p.created_at).toLocaleDateString("en-GB");
        trend[date] = (trend[date] || 0) + getPaidAmount(p);
      });

    return Object.entries(trend)
      .map(([date, revenue]) => ({ date, revenue: Math.round(revenue) }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  },

  getAlerts: async () => {
    const overview = await loadOverview("30days");
    if (Array.isArray(overview?.alerts)) return overview.alerts;

    const [payments, inventory] = await Promise.all([loadPayments(), loadInventory()]);
    const alerts = [];
    const now = new Date();

    const todaysFailed = payments.filter((p) =>
      FAILED_PAYMENT_STATUSES.has(String(p.status || "").toLowerCase()) && sameDay(p.created_at, now)
    );

    if (todaysFailed.length > 0) {
      alerts.push({
        severity: "error",
        message: `${todaysFailed.length} payments failed today`,
        action: "Review failed payments",
        link: "/payments",
      });
    }

    const pending10min = payments.filter((p) => {
      if (!OPEN_PAYMENT_STATUSES.has(String(p.status || "").toLowerCase())) return false;
      return (now - new Date(p.created_at)) / 60000 > 10;
    });

    if (pending10min.length > 0) {
      alerts.push({
        severity: "warning",
        message: `${pending10min.length} payments pending for 10+ minutes`,
        action: "Check payment status",
        link: "/payments",
      });
    }

    const needsReview = payments.filter((p) =>
      ["mismatch", "manual_review"].includes(String(p.reconciliation_status || "").toLowerCase())
    );

    if (needsReview.length > 0) {
      alerts.push({
        severity: "warning",
        message: `${needsReview.length} payments need reconciliation`,
        action: "Open payment desk",
        link: "/payments",
      });
    }

    const stockouts = inventory.products.filter((p) => p.stock_status === "out_of_stock");
    if (stockouts.length > 0) {
      alerts.push({
        severity: "error",
        message: `${stockouts.length} SKUs are out of stock`,
        action: "Open inventory command center",
        link: "/inventory",
      });
    }

    return alerts;
  },

  getTopProducts: async (limit = 5, filter = "30days") => {
    const overview = await loadOverview(filter);
    if (Array.isArray(overview?.top_products)) return overview.top_products.slice(0, limit);

    const inventory = await loadInventory();
    const candidates = inventory.best_sellers.length > 0 ? inventory.best_sellers : inventory.products;

    return candidates
      .map((p) => ({
        name: p.product_name || p.name,
        units_sold: toNumber(p.units_sold_30d),
        revenue: toNumber(p.units_sold_30d) * toNumber(p.retail_price),
      }))
      .filter((p) => p.units_sold > 0)
      .sort((a, b) => b.units_sold - a.units_sold)
      .slice(0, limit);
  },

  getLowStock: async (limit = 10) => {
    const overview = await loadOverview("30days");
    if (Array.isArray(overview?.low_stock)) return overview.low_stock.slice(0, limit);

    const inventory = await loadInventory();
    const priority = { out_of_stock: 0, reorder_now: 1, low_stock: 2, healthy: 3 };

    return inventory.products
      .filter((p) => ["out_of_stock", "reorder_now", "low_stock"].includes(p.stock_status))
      .sort((a, b) => (priority[a.stock_status] ?? 9) - (priority[b.stock_status] ?? 9))
      .slice(0, limit)
      .map((p) => ({
        name: p.product_name,
        current_stock: toNumber(p.current_stock),
        retail_price: toNumber(p.retail_price),
      }));
  },

  getRecentOrders: async (limit = 10) => {
    const overview = await loadOverview("30days");
    if (Array.isArray(overview?.recent_orders)) return overview.recent_orders.slice(0, limit);

    const orders = await loadOrders();

    return orders
      .sort(sortByDateDesc)
      .slice(0, limit)
      .map((o) => ({
        id: o.id,
        order_number: o.order_number || `ORD-${o.id}`,
        customer_name: o.customer_name || "Unknown",
        total_amount: toNumber(o.total_amount),
        status: getOrderStatus(o),
        created_at: o.created_at,
      }));
  },

  getRevenueByRegion: async (filter = "30days") => {
    const overview = await loadOverview(filter);
    if (Array.isArray(overview?.revenue_by_region)) return overview.revenue_by_region;

    const [orders, payments] = await Promise.all([loadOrders(), loadPayments()]);
    const ordersById = new Map(orders.map((o) => [Number(o.id), o]));
    const regionData = {};

    payments.filter((p) => isPaid(p) && inRange(p.created_at, filter)).forEach((p) => {
      const order = ordersById.get(Number(p.order_id));
      const regionName = order?.region_name || order?.last_sale_region || order?.location_name || "Unassigned";

      if (!regionData[regionName]) {
        regionData[regionName] = { name: regionName, revenue: 0, orders: 0 };
      }

      regionData[regionName].revenue += getPaidAmount(p);
      regionData[regionName].orders += 1;
    });

    return Object.values(regionData).sort((a, b) => b.revenue - a.revenue);
  },

  getTopCustomers: async (limit = 5, filter = "30days") => {
    const overview = await loadOverview(filter);
    if (Array.isArray(overview?.top_customers)) return overview.top_customers.slice(0, limit);

    const orders = await loadOrders();
    const customerData = {};

    orders.forEach((o) => {
      const key = o.customer_phone || o.customer_name || "Unknown";
      if (!customerData[key]) {
        customerData[key] = {
          name: o.customer_name || "Unknown",
          order_count: 0,
          total_spent: 0,
        };
      }
      customerData[key].order_count += 1;
      customerData[key].total_spent += toNumber(o.total_amount);
    });

    return Object.values(customerData)
      .sort((a, b) => b.total_spent - a.total_spent)
      .slice(0, limit);
  },

  getTopSalesReps: async (limit = 5, filter = "30days") => {
    const overview = await loadOverview(filter);
    if (Array.isArray(overview?.top_sales_reps)) return overview.top_sales_reps.slice(0, limit);

    const orders = await loadOrders();
    const repData = {};

    orders.forEach((o) => {
      const repName = o.sales_rep_name || "Unassigned";
      if (!repData[repName]) {
        repData[repName] = { name: repName, order_count: 0, revenue: 0 };
      }
      repData[repName].order_count += 1;
      repData[repName].revenue += toNumber(o.total_amount);
    });

    return Object.values(repData)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  },

  getPaymentHealth: async (filter = "30days") => {
    const overview = await loadOverview(filter);
    if (overview?.payment_health) return overview.payment_health;

    const payments = await loadPayments();
    const now = new Date();
    const completed = payments.filter(isPaid).length;
    const pendingOld = payments.filter((p) => {
      if (!OPEN_PAYMENT_STATUSES.has(String(p.status || "").toLowerCase())) return false;
      return (now - new Date(p.created_at)) / 60000 > 10;
    }).length;
    const failedToday = payments.filter((p) =>
      FAILED_PAYMENT_STATUSES.has(String(p.status || "").toLowerCase()) && sameDay(p.created_at, now)
    ).length;
    const unmatched = payments.filter((p) => !p.order_id).length;

    return {
      success_rate: payments.length > 0 ? Math.round((completed / payments.length) * 100) : 0,
      failed_today: failedToday,
      pending_old: pendingOld,
      unmatched,
    };
  },

  getRecentActivity: async (limit = 15) => {
    const overview = await loadOverview("30days");
    if (Array.isArray(overview?.recent_activity)) return overview.recent_activity.slice(0, limit);

    const payments = await loadPayments();
    return payments.sort(sortByDateDesc).slice(0, limit).map(formatPaymentActivity);
  },

  getInventoryIntelligence: async () => {
    const overview = await loadOverview("30days");
    if (overview?.inventory_intelligence) return overview.inventory_intelligence;

    const inventory = await loadInventory();
    const products = inventory.products;

    return {
      low_stock: products.filter((p) => p.stock_status === "low_stock").length,
      reorder_now: products.filter((p) => p.stock_status === "reorder_now").length,
      out_of_stock: products.filter((p) => p.stock_status === "out_of_stock").length,
      expiry_watch: products.filter((p) =>
        ["expired", "critical", "warning", "watch"].includes(p.expiry_status)
      ).length,
      expired: products.filter((p) => p.expiry_status === "expired").length,
      fast_moving: products.filter((p) => p.movement_status === "fast_moving").length,
      slow_moving: products.filter((p) => p.movement_status === "slow_moving").length,
      dead_stock: products.filter((p) => p.movement_status === "dead_stock").length,
      dead_stock_value: Math.round(
        products
          .filter((p) => p.movement_status === "dead_stock")
          .reduce((sum, p) => sum + toNumber(p.stock_value), 0)
      ),
    };
  },

  getMorningSummary: async () => {
    const overview = await loadOverview("today");
    if (overview?.morning_summary) return overview.morning_summary;

    const today = new Date();
    const [orders, payments, inventory] = await Promise.all([
      loadOrders(),
      loadPayments(),
      loadInventory(),
    ]);

    const todaysOrders = orders.filter((o) => sameDay(o.created_at, today));
    const todaysPayments = payments.filter((p) => sameDay(p.created_at, today));
    const revenue = todaysPayments.filter(isPaid).reduce((sum, p) => sum + getPaidAmount(p), 0);

    return {
      new_orders: todaysOrders.length,
      revenue: Math.round(revenue),
      pending_dispatch: todaysOrders.filter((o) => ["pending", "processing"].includes(getOrderStatus(o))).length,
      failed_payments: todaysPayments.filter((p) =>
        FAILED_PAYMENT_STATUSES.has(String(p.status || "").toLowerCase())
      ).length,
      low_stock:
        toNumber(inventory.summary.low_stock_count) +
        toNumber(inventory.summary.reorder_now_count),
    };
  },
};
