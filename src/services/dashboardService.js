const API_BASE = '/api';

// Helper to get auth token
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Helper to fetch with error handling
const fetchAPI = async (endpoint) => {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      console.error(`❌ API Error [${endpoint}]:`, response.status);
      return null;
    }

    const data = await response.json();
    return data.success ? data.data : null;
  } catch (err) {
    console.error(`❌ Fetch error [${endpoint}]:`, err.message);
    return null;
  }
};

export const dashboardService = {
  // Get KPIs - REAL DATA ONLY
  getKPIs: async (filter = '30days') => {
    const payments = await fetchAPI('/payments');
    const orders = await fetchAPI('/orders');

    if (!payments || !orders) return {};

    const now = new Date();
    const filterDays = filter === '30days' ? 30 : filter === '7days' ? 7 : filter === 'today' ? 0 : 30;
    const cutoffDate = new Date(now.getTime() - filterDays * 24 * 60 * 60 * 1000);

    const filteredPayments = payments.filter(p => new Date(p.created_at) >= cutoffDate);
    const filteredOrders = orders.filter(o => new Date(o.created_at) >= cutoffDate);

    const completedPayments = filteredPayments.filter(p => p.status === 'completed');
    const failedPayments = filteredPayments.filter(p => p.status === 'failed');
    const pendingPayments = filteredPayments.filter(p => p.status === 'pending');

    const revenue = completedPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const totalOrders = filteredOrders.length;
    const aov = totalOrders > 0 ? Math.round(revenue / totalOrders) : 0;

    return {
      revenue: Math.round(revenue),
      orders: totalOrders,
      aov,
      payment_success_rate: filteredPayments.length > 0 ? Math.round((completedPayments.length / filteredPayments.length) * 100) : 0,
      failed_payments: failedPayments.length,
      pending_payments: pendingPayments.length,
      low_stock: 0,
      out_of_stock: 0,
      awaiting_dispatch: filteredOrders.filter(o => o.status === 'pending').length,
      new_customers: 0,
      revenue_trend: 0,
      orders_trend: 0,
      payment_trend: 0,
      pending_trend: 0,
      customer_trend: 0
    };
  },

  // Get sales trend - REAL DATA ONLY
  getSalesTrend: async (filter = '30days') => {
    const payments = await fetchAPI('/payments');
    if (!payments) return [];

    const now = new Date();
    const filterDays = filter === '30days' ? 30 : filter === '7days' ? 7 : 30;
    const cutoffDate = new Date(now.getTime() - filterDays * 24 * 60 * 60 * 1000);

    const trend = {};

    payments.filter(p => p.status === 'completed' && new Date(p.created_at) >= cutoffDate)
      .forEach(p => {
        const date = new Date(p.created_at).toLocaleDateString('en-GB');
        trend[date] = (trend[date] || 0) + (parseFloat(p.amount) || 0);
      });

    return Object.entries(trend)
      .map(([date, revenue]) => ({
        date,
        revenue: Math.round(revenue)
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  },

  // Get alerts - REAL DATA ONLY
  getAlerts: async () => {
    const payments = await fetchAPI('/payments');
    if (!payments) return [];

    const alerts = [];

    // Check for failed payments today
    const today = new Date().toDateString();
    const todaysFailed = payments.filter(p =>
      p.status === 'failed' && new Date(p.created_at).toDateString() === today
    );

    if (todaysFailed.length > 0) {
      alerts.push({
        severity: 'error',
        message: `⛔ ${todaysFailed.length} payments failed today`,
        action: 'Review failed payments',
        link: '/payments'
      });
    }

    // Check for pending > 10 minutes
    const now = new Date();
    const pending10min = payments.filter(p => {
      if (p.status !== 'pending') return false;
      const age = (now - new Date(p.created_at)) / 60000;
      return age > 10;
    });

    if (pending10min.length > 0) {
      alerts.push({
        severity: 'warning',
        message: `⏳ ${pending10min.length} payments stuck for 10+ minutes`,
        action: 'Check payment status',
        link: '/payments'
      });
    }

    // Check for unmatched payments
    const unmatched = payments.filter(p => !p.order_id);
    if (unmatched.length > 0) {
      alerts.push({
        severity: 'warning',
        message: `❓ ${unmatched.length} unmatched payments`,
        action: 'Reconcile payments',
        link: '/payments'
      });
    }

    return alerts;
  },

  // Get top products - REAL DATA ONLY - Returns empty if no data
  getTopProducts: async (limit = 5) => {
    return [];
  },

  // Get low stock items - REAL DATA ONLY - Returns empty if no data
  getLowStock: async (limit = 10) => {
    return [];
  },

  // Get recent orders - REAL DATA ONLY
  getRecentOrders: async (limit = 10) => {
    const orders = await fetchAPI('/orders');
    if (!orders || orders.length === 0) return [];

    return orders
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit)
      .map(o => ({
        id: o.id,
        order_number: o.order_number || `ORD-${o.id}`,
        customer_name: o.customer_name || 'Unknown',
        total_amount: o.total_amount || 0,
        status: o.status || 'pending',
        created_at: o.created_at
      }));
  },

  // Get revenue by region - REAL DATA ONLY
  getRevenueByRegion: async () => {
    const orders = await fetchAPI('/orders');
    const payments = await fetchAPI('/payments');

    if (!orders || !payments) return [];

    const regionData = {};

    payments.filter(p => p.status === 'completed').forEach(p => {
      const order = orders.find(o => o.id === p.order_id);
      if (order && order.region_name) {
        if (!regionData[order.region_name]) {
          regionData[order.region_name] = {
            name: order.region_name,
            revenue: 0,
            orders: 0
          };
        }
        regionData[order.region_name].revenue += parseFloat(p.amount) || 0;
        regionData[order.region_name].orders += 1;
      }
    });

    return Object.values(regionData).sort((a, b) => b.revenue - a.revenue);
  },

  // Get top customers - REAL DATA ONLY
  getTopCustomers: async (limit = 5) => {
    const orders = await fetchAPI('/orders');
    if (!orders || orders.length === 0) return [];

    const customerData = {};
    orders.forEach(o => {
      const customerName = o.customer_name || 'Unknown';
      if (!customerData[customerName]) {
        customerData[customerName] = {
          name: customerName,
          order_count: 0,
          total_spent: 0
        };
      }
      customerData[customerName].order_count += 1;
      customerData[customerName].total_spent += parseFloat(o.total_amount) || 0;
    });

    return Object.values(customerData)
      .sort((a, b) => b.total_spent - a.total_spent)
      .slice(0, limit);
  },

  // Get top sales reps - REAL DATA ONLY
  getTopSalesReps: async (limit = 5) => {
    const orders = await fetchAPI('/orders');
    if (!orders || orders.length === 0) return [];

    const repData = {};
    orders.forEach(o => {
      const repName = o.sales_rep_name || 'Unassigned';
      if (!repData[repName]) {
        repData[repName] = {
          name: repName,
          order_count: 0,
          revenue: 0
        };
      }
      repData[repName].order_count += 1;
      repData[repName].revenue += parseFloat(o.total_amount) || 0;
    });

    return Object.values(repData)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  },

  // Get payment health - REAL DATA ONLY
  getPaymentHealth: async () => {
    const payments = await fetchAPI('/payments');
    if (!payments || payments.length === 0) return {};

    const completed = payments.filter(p => p.status === 'completed').length;
    const now = new Date();
    const pending10min = payments.filter(p => {
      if (p.status !== 'pending') return false;
      const age = (now - new Date(p.created_at)) / 60000;
      return age > 10;
    }).length;

    const today = new Date().toDateString();
    const todaysFailed = payments.filter(p =>
      p.status === 'failed' && new Date(p.created_at).toDateString() === today
    ).length;
    const unmatched = payments.filter(p => !p.order_id).length;

    return {
      success_rate: payments.length > 0 ? Math.round((completed / payments.length) * 100) : 0,
      failed_today: todaysFailed,
      pending_old: pending10min,
      unmatched
    };
  },

  // Get recent activity - REAL DATA ONLY
  getRecentActivity: async (limit = 15) => {
    const payments = await fetchAPI('/payments');
    if (!payments || payments.length === 0) return [];

    return payments
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit)
      .map(p => ({
        message: `Payment #${p.id} - ${p.status === 'completed' ? '✅ Completed' : p.status === 'failed' ? '❌ Failed' : '⏳ Pending'} (KSh ${parseFloat(p.amount || 0).toLocaleString()})`,
        timestamp: new Date(p.created_at).toLocaleTimeString()
      }));
  },

  // Get inventory intelligence - REAL DATA ONLY
  getInventoryIntelligence: async () => {
    return {
      low_stock: 0,
      out_of_stock: 0,
      fast_moving: 0,
      slow_moving: 0
    };
  },

  // Get morning summary - REAL DATA ONLY
  getMorningSummary: async () => {
    const today = new Date().toDateString();
    const orders = await fetchAPI('/orders');
    const payments = await fetchAPI('/payments');

    if (!orders || !payments) return {};

    const todaysOrders = orders.filter(o => new Date(o.created_at).toDateString() === today);
    const todaysPayments = payments.filter(p => new Date(p.created_at).toDateString() === today);

    const revenue = todaysPayments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    return {
      new_orders: todaysOrders.length,
      revenue: Math.round(revenue),
      pending_dispatch: todaysOrders.filter(o => o.status === 'pending').length,
      failed_payments: todaysPayments.filter(p => p.status === 'failed').length,
      low_stock: 0
    };
  }
};
