import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { getThemeColors } from '../utils/themeColors';
import { dashboardService } from '../services/dashboardService';

export default function Dashboard() {
  const { isDark } = useTheme();
  const c = getThemeColors(isDark);
  const navigate = useNavigate();

  // State Management
  const [filter, setFilter] = useState('30days');
  const [customDateRange, setCustomDateRange] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Data States
  const [kpis, setKpis] = useState(null);
  const [trend, setTrend] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [revenueByRegion, setRevenueByRegion] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [topSalesReps, setTopSalesReps] = useState([]);
  const [paymentHealth, setPaymentHealth] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [inventoryIntelligence, setInventoryIntelligence] = useState(null);
  const [morningSummary, setMorningSummary] = useState(null);

  const loadAttemptRef = useRef(0);
  const maxRetries = 3;

  // Load Dashboard Data with retry logic
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Use filter or custom date range
      const activeFilter = customDateRange ? 'custom' : filter;

      // Parallel API calls with timeout protection
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Dashboard load timeout')), 30000)
      );

      const allDataPromise = Promise.all([
        dashboardService.getKPIs(activeFilter),
        dashboardService.getSalesTrend(activeFilter),
        dashboardService.getAlerts(),
        dashboardService.getTopProducts(5, activeFilter),
        dashboardService.getLowStock(10),
        dashboardService.getRecentOrders(10),
        dashboardService.getRevenueByRegion(activeFilter),
        dashboardService.getTopCustomers(5, activeFilter),
        dashboardService.getTopSalesReps(5, activeFilter),
        dashboardService.getPaymentHealth(activeFilter),
        dashboardService.getRecentActivity(15),
        dashboardService.getInventoryIntelligence(),
        dashboardService.getMorningSummary(),
      ]);

      const [
        kpisData,
        trendData,
        alertsData,
        productsData,
        stockData,
        ordersData,
        regionData,
        customersData,
        repsData,
        paymentData,
        activityData,
        inventoryData,
        summaryData,
      ] = await Promise.race([allDataPromise, timeout]);

      // Set all data with null safety
      setKpis(kpisData || {});
      setTrend(Array.isArray(trendData) ? trendData : []);
      setAlerts(Array.isArray(alertsData) ? alertsData : []);
      setTopProducts(Array.isArray(productsData) ? productsData : []);
      setLowStock(Array.isArray(stockData) ? stockData : []);
      setRecentOrders(Array.isArray(ordersData) ? ordersData : []);
      setRevenueByRegion(Array.isArray(regionData) ? regionData : []);
      setTopCustomers(Array.isArray(customersData) ? customersData : []);
      setTopSalesReps(Array.isArray(repsData) ? repsData : []);
      setPaymentHealth(paymentData || {});
      setRecentActivity(Array.isArray(activityData) ? activityData : []);
      setInventoryIntelligence(inventoryData || {});
      setMorningSummary(summaryData || {});

      setLastUpdate(new Date());
      loadAttemptRef.current = 0;
    } catch (err) {
      console.error('Dashboard load error:', err);

      // Retry logic
      if (loadAttemptRef.current < maxRetries) {
        loadAttemptRef.current += 1;
        setError(`Loading... (Attempt ${loadAttemptRef.current}/${maxRetries})`);
        setTimeout(() => loadDashboardData(), 2000);
      } else {
        setError(err?.message || 'Failed to load dashboard. Please refresh the page.');
      }
    } finally {
      setLoading(false);
    }
  }, [filter, customDateRange]);

  useEffect(() => {
    loadDashboardData();
  }, [filter, customDateRange, loadDashboardData]);

  // Get alert color
  const getAlertColor = (severity) => {
    const colors = {
      error: '#ff5f57',
      warning: '#ff9500',
      info: '#667eea',
    };
    return colors[severity] || '#999';
  };

  // Render error state
  if (error && !loading) {
    return (
      <div style={{ padding: '20px', background: c.bg, minHeight: '100vh' }}>
        <div style={{
          background: isDark ? 'rgba(220, 53, 69, 0.1)' : '#fee',
          color: isDark ? '#ff6b6b' : '#c33',
          padding: '20px',
          borderRadius: '8px',
          border: `1px solid ${isDark ? 'rgba(220, 53, 69, 0.3)' : '#fdd'}`,
          marginBottom: '20px',
        }}>
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '10px' }}>⚠️ Error</div>
          <div style={{ fontSize: '14px', marginBottom: '15px' }}>{error}</div>
          <button
            onClick={() => {
              loadAttemptRef.current = 0;
              loadDashboardData();
            }}
            style={{
              padding: '8px 16px',
              background: isDark ? '#ff6b6b' : '#ff5f57',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', background: c.bg, minHeight: '100vh' }}>
      {/* HEADER WITH FILTERS */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        background: c.card,
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        border: `1px solid ${c.border}`,
        flexWrap: 'wrap',
        gap: '15px',
      }}>
        <div>
          <h1 style={{ margin: '0 0 5px 0', fontSize: '28px', fontWeight: 700, color: c.text }}>
            📊 Dashboard
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: c.textMuted }}>
            Real-time business intelligence & alerts
            {lastUpdate && ` • Updated ${lastUpdate.toLocaleTimeString()}`}
          </p>
        </div>

        {/* TIME FILTERS */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['today', 'yesterday', '7days', '30days', 'thismonth'].map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f);
                setCustomDateRange(null);
              }}
              style={{
                padding: '8px 14px',
                background: filter === f ? '#667eea' : isDark ? '#334155' : '#f3f4f6',
                color: filter === f ? 'white' : c.text,
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '12px',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                if (filter !== f) {
                  e.target.style.background = isDark ? '#475569' : '#e5e7eb';
                }
              }}
              onMouseLeave={(e) => {
                if (filter !== f) {
                  e.target.style.background = isDark ? '#334155' : '#f3f4f6';
                }
              }}
            >
              {f === 'today' && '📅 Today'}
              {f === 'yesterday' && '📅 Yesterday'}
              {f === '7days' && '📅 7D'}
              {f === '30days' && '📅 30D'}
              {f === 'thismonth' && '📅 Month'}
            </button>
          ))}

          {/* REFRESH BUTTON */}
          <button
            onClick={() => {
              loadAttemptRef.current = 0;
              loadDashboardData();
            }}
            style={{
              padding: '8px 14px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '12px',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#5568d3';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#667eea';
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* LOADING STATE */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: c.textMuted }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳ Loading dashboard...</div>
          <div style={{ fontSize: '14px' }}>Fetching real-time data</div>
        </div>
      ) : (
        <>
          {/* MORNING SUMMARY */}
          {morningSummary && (morningSummary.new_orders > 0 || morningSummary.revenue > 0 || morningSummary.pending_dispatch > 0 || morningSummary.failed_payments > 0 || morningSummary.low_stock > 0) && (
            <div style={{
              background: c.card,
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px',
              border: `2px solid #667eea`,
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
            }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 700, color: c.text }}>
                📌 Today's Summary
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                <SummaryItem icon="🛒" label="New Orders" value={morningSummary.new_orders || 0} color="#10b981" />
                <SummaryItem icon="💰" label="Revenue" value={`KSh ${(morningSummary.revenue || 0).toLocaleString()}`} color="#667eea" />
                <SummaryItem icon="📦" label="Pending Dispatch" value={morningSummary.pending_dispatch || 0} color="#f59e0b" />
                <SummaryItem icon="❌" label="Failed Payments" value={morningSummary.failed_payments || 0} color="#ff5f57" />
                <SummaryItem icon="⚠️" label="Low Stock" value={morningSummary.low_stock || 0} color="#ff9500" />
              </div>
            </div>
          )}

          {/* ROW 1: KPI CARDS WITH TRENDS */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '15px',
            marginBottom: '20px',
          }}>
            {kpis && (
              <>
                <KPICard
                  isDark={isDark}
                  c={c}
                  icon="💰"
                  title="Revenue"
                  value={`KSh ${kpis.revenue?.toLocaleString() || 0}`}
                  trend={kpis.revenue_trend}
                  subtitle={`${kpis.orders || 0} orders`}
                  color="#667eea"
                  onClick={() => navigate('/orders')}
                />
                <KPICard
                  isDark={isDark}
                  c={c}
                  icon="🛒"
                  title="Orders"
                  value={kpis.orders || 0}
                  trend={kpis.orders_trend}
                  subtitle={`Avg: KSh ${kpis.aov || 0}`}
                  color="#10b981"
                  onClick={() => navigate('/orders')}
                />
                <KPICard
                  isDark={isDark}
                  c={c}
                  icon="💳"
                  title="Payment Rate"
                  value={`${kpis.payment_success_rate || 0}%`}
                  trend={kpis.payment_trend}
                  subtitle={`${kpis.failed_payments || 0} failed`}
                  color={kpis.payment_success_rate >= 80 ? '#10b981' : '#ff9500'}
                  onClick={() => navigate('/payments')}
                />
                <KPICard
                  isDark={isDark}
                  c={c}
                  icon="⏳"
                  title="Pending"
                  value={kpis.pending_payments || 0}
                  trend={kpis.pending_trend}
                  subtitle="Awaiting confirmation"
                  color="#f59e0b"
                  onClick={() => navigate('/payments')}
                />
                <KPICard
                  isDark={isDark}
                  c={c}
                  icon="⚠️"
                  title="Low Stock"
                  value={kpis.low_stock || 0}
                  trend={null}
                  subtitle="Below reorder level"
                  color="#ff9500"
                  onClick={() => navigate('/inventory')}
                />
                <KPICard
                  isDark={isDark}
                  c={c}
                  icon="🚫"
                  title="Out of Stock"
                  value={kpis.out_of_stock || 0}
                  trend={null}
                  subtitle="No inventory"
                  color="#ff5f57"
                  onClick={() => navigate('/inventory')}
                />
                <KPICard
                  isDark={isDark}
                  c={c}
                  icon="📦"
                  title="Dispatch Queue"
                  value={kpis.awaiting_dispatch || 0}
                  trend={null}
                  subtitle="Ready to ship"
                  color="#3b82f6"
                  onClick={() => navigate('/orders')}
                />
                <KPICard
                  isDark={isDark}
                  c={c}
                  icon="👥"
                  title="New Customers"
                  value={kpis.new_customers || 0}
                  trend={kpis.customer_trend}
                  subtitle="This period"
                  color="#8b5cf6"
                  onClick={() => navigate('/customers')}
                />
              </>
            )}
          </div>

          {/* ROW 2: MAIN CHART + ATTENTION PANEL */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
            {/* TREND CHART */}
            <ChartCard isDark={isDark} c={c} trend={trend} />

            {/* ATTENTION REQUIRED */}
            <AttentionPanel isDark={isDark} c={c} alerts={alerts} navigate={navigate} getAlertColor={getAlertColor} />
          </div>

          {/* ROW 3: TOP PRODUCTS & PAYMENT HEALTH */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <DataTable
              isDark={isDark}
              c={c}
              title="🏆 Top Selling Products"
              columns={['Product', 'Units', 'Revenue']}
              data={topProducts.map(p => [
                p.name,
                p.units_sold || 0,
                `KSh ${(p.revenue || 0).toLocaleString()}`,
              ])}
            />
            <PaymentHealthCard isDark={isDark} c={c} paymentHealth={paymentHealth} />
          </div>

          {/* ROW 4: INVENTORY + LOW STOCK */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <InventoryCard isDark={isDark} c={c} inventory={inventoryIntelligence} />
            <DataTable
              isDark={isDark}
              c={c}
              title="⚠️ Low Stock Alert"
              columns={['Product', 'Qty', 'Price']}
              data={lowStock.map(p => [
                p.name,
                p.current_stock || 0,
                `KSh ${(p.retail_price || 0).toLocaleString()}`,
              ])}
            />
          </div>

          {/* ROW 5: RECENT ORDERS + RECENT ACTIVITY */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <RecentOrdersTable isDark={isDark} c={c} orders={recentOrders} navigate={navigate} />
            <RecentActivityFeed isDark={isDark} c={c} activities={recentActivity} />
          </div>

          {/* ROW 6: GEOGRAPHIC & PERFORMANCE INSIGHTS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <DataTable
              isDark={isDark}
              c={c}
              title="🌍 Revenue by Region"
              columns={['Region', 'Revenue', 'Orders']}
              data={revenueByRegion.map(r => [
                r.name,
                `KSh ${(r.revenue || 0).toLocaleString()}`,
                r.orders || 0,
              ])}
            />
            <DataTable
              isDark={isDark}
              c={c}
              title="⭐ Top Customers"
              columns={['Name', 'Orders', 'Total Spent']}
              data={topCustomers.map(c => [
                c.name,
                c.order_count || 0,
                `KSh ${(c.total_spent || 0).toLocaleString()}`,
              ])}
            />
            <DataTable
              isDark={isDark}
              c={c}
              title="🎯 Top Sales Reps"
              columns={['Rep Name', 'Orders', 'Revenue']}
              data={topSalesReps.map(r => [
                r.name,
                r.order_count || 0,
                `KSh ${(r.revenue || 0).toLocaleString()}`,
              ])}
            />
          </div>
        </>
      )}
    </div>
  );
}

// KPI Card Component with Trend
function KPICard({ isDark, c, icon, title, value, trend, subtitle, color, onClick }) {
  const trendPercentage = trend !== undefined && trend !== null ? parseFloat(trend).toFixed(1) : null;
  const isPositive = trendPercentage > 0;

  return (
    <div
      onClick={onClick}
      style={{
        background: c.card,
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        borderLeft: `4px solid ${color}`,
        border: `1px solid ${c.border}`,
        cursor: 'pointer',
        transition: 'all 0.3s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
        <div style={{ fontSize: '24px' }}>{icon}</div>
        {trendPercentage !== null && (
          <div style={{
            fontSize: '12px',
            fontWeight: 700,
            color: isPositive ? '#10b981' : '#ff5f57',
            background: isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 95, 87, 0.1)',
            padding: '4px 8px',
            borderRadius: '4px',
          }}>
            {isPositive ? '📈' : '📉'} {Math.abs(trendPercentage)}%
          </div>
        )}
      </div>
      <div style={{ fontSize: '12px', color: c.textMuted, marginBottom: '5px', fontWeight: 500 }}>
        {title}
      </div>
      <div style={{ fontSize: '24px', fontWeight: 700, color: c.text, marginBottom: '8px' }}>
        {value}
      </div>
      <div style={{ fontSize: '12px', color: c.textLight }}>
        {subtitle}
      </div>
    </div>
  );
}

// Summary Item Component
function SummaryItem({ icon, label, value, color }) {
  return (
    <div style={{
      padding: '12px',
      borderRadius: '6px',
      background: `${color}15`,
      borderLeft: `4px solid ${color}`,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '18px', marginBottom: '5px' }}>{icon}</div>
      <div style={{ fontSize: '11px', color: '#999', marginBottom: '5px', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: '16px', fontWeight: 700, color: color }}>{value}</div>
    </div>
  );
}

// Chart Card Component
function ChartCard({ isDark, c, trend }) {
  return (
    <div style={{
      background: c.card,
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      border: `1px solid ${c.border}`,
    }}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 600, color: c.text }}>
        📈 Revenue Trend (Last 30 Days)
      </h3>
      {trend && trend.length > 0 ? (
        <svg width="100%" height="280" viewBox="0 0 800 280" style={{ display: 'block' }}>
          {/* Grid */}
          {[0, 1, 2, 3, 4].map(i => (
            <line
              key={`grid-${i}`}
              x1="40"
              y1={50 + i * 50}
              x2="800"
              y2={50 + i * 50}
              stroke={isDark ? '#334155' : '#e5e7eb'}
              strokeWidth="1"
              strokeDasharray="5,5"
            />
          ))}

          {/* Line chart */}
          {trend.length > 1 && (
            <polyline
              points={trend
                .map((point, idx) => {
                  const x = 40 + (idx / Math.max(1, trend.length - 1)) * 750;
                  const maxRev = Math.max(...trend.map(t => t.revenue || 0)) || 1;
                  const y = 250 - (point.revenue / maxRev) * 200;
                  return `${x},${y}`;
                })
                .join(' ')}
              fill="none"
              stroke="#667eea"
              strokeWidth="2"
            />
          )}

          {/* Data points */}
          {trend.map((point, idx) => {
            const x = 40 + (idx / Math.max(1, trend.length - 1)) * 750;
            const maxRev = Math.max(...trend.map(t => t.revenue || 0)) || 1;
            const y = 250 - (point.revenue / maxRev) * 200;
            return (
              <g key={idx}>
                <circle cx={x} cy={y} r="4" fill="#667eea" />
                {idx % Math.ceil(trend.length / 7) === 0 && (
                  <text x={x} y="270" fontSize="11" textAnchor="middle" fill={c.textLight}>
                    {point.date}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      ) : (
        <div style={{ textAlign: 'center', color: c.textMuted, padding: '60px 20px' }}>
          No data available
        </div>
      )}
    </div>
  );
}

// Attention Panel Component
function AttentionPanel({ isDark, c, alerts, navigate, getAlertColor }) {
  return (
    <div style={{
      background: c.card,
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      maxHeight: '400px',
      overflowY: 'auto',
      border: `1px solid ${c.border}`,
    }}>
      <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 600, color: c.text }}>
        🚨 Attention Required
      </h3>
      {alerts && alerts.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {alerts.map((alert, idx) => (
            <div
              key={idx}
              onClick={() => alert.link && navigate(alert.link)}
              style={{
                padding: '12px',
                border: `2px solid ${getAlertColor(alert.severity)}`,
                borderRadius: '6px',
                background: isDark
                  ? `${getAlertColor(alert.severity)}15`
                  : `${getAlertColor(alert.severity)}20`,
                cursor: alert.link ? 'pointer' : 'default',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                if (alert.link) {
                  e.currentTarget.style.transform = 'translateX(5px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (alert.link) {
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              <div style={{
                fontSize: '13px',
                fontWeight: 600,
                color: getAlertColor(alert.severity),
                marginBottom: '5px',
              }}>
                {alert.message}
              </div>
              {alert.action && (
                <div style={{ fontSize: '11px', color: c.textMuted }}>
                  → {alert.action}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: c.textMuted, padding: '40px 20px' }}>
          ✅ All systems normal!
        </div>
      )}
    </div>
  );
}

// Payment Health Card
function PaymentHealthCard({ isDark, c, paymentHealth }) {
  return (
    <div style={{
      background: c.card,
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      border: `1px solid ${c.border}`,
    }}>
      <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 600, color: c.text }}>
        💳 Payment Health
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <MetricRow
          label="Success Rate"
          value={`${paymentHealth?.success_rate || 0}%`}
          color={paymentHealth?.success_rate >= 80 ? '#10b981' : '#ff9500'}
        />
        <MetricRow
          label="Failed Today"
          value={paymentHealth?.failed_today || 0}
          color="#ff5f57"
        />
        <MetricRow
          label="Pending >10min"
          value={paymentHealth?.pending_old || 0}
          color="#f59e0b"
        />
        <MetricRow
          label="Unmatched"
          value={paymentHealth?.unmatched || 0}
          color="#667eea"
        />
      </div>
    </div>
  );
}

// Inventory Card
function InventoryCard({ isDark, c, inventory }) {
  return (
    <div style={{
      background: c.card,
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      border: `1px solid ${c.border}`,
    }}>
      <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 600, color: c.text }}>
        📦 Inventory Status
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <MetricRow
          label="Low Stock"
          value={inventory?.low_stock || 0}
          color="#ff9500"
        />
        <MetricRow
          label="Out of Stock"
          value={inventory?.out_of_stock || 0}
          color="#ff5f57"
        />
        <MetricRow
          label="Fast Moving"
          value={inventory?.fast_moving || 0}
          color="#10b981"
        />
        <MetricRow
          label="Slow Moving"
          value={inventory?.slow_moving || 0}
          color="#667eea"
        />
      </div>
    </div>
  );
}

// Metric Row Component
function MetricRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '13px', color: '#999' }}>{label}</span>
      <span style={{
        fontSize: '16px',
        fontWeight: 700,
        color: color,
        background: `${color}15`,
        padding: '6px 12px',
        borderRadius: '4px',
      }}>
        {value}
      </span>
    </div>
  );
}

// Recent Orders Table
function RecentOrdersTable({ isDark, c, orders, navigate }) {
  return (
    <div style={{
      background: c.card,
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      overflowX: 'auto',
      border: `1px solid ${c.border}`,
    }}>
      <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 600, color: c.text }}>
        📋 Recent Orders
      </h3>
      {orders && orders.length > 0 ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${c.border}` }}>
              <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600, color: c.textMuted }}>Order</th>
              <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600, color: c.textMuted }}>Customer</th>
              <th style={{ padding: '10px', textAlign: 'right', fontWeight: 600, color: c.textMuted }}>Amount</th>
              <th style={{ padding: '10px', textAlign: 'center', fontWeight: 600, color: c.textMuted }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, idx) => (
              <tr
                key={idx}
                style={{ borderBottom: `1px solid ${c.borderLight}`, cursor: 'pointer' }}
                onClick={() => navigate(`/orders/${order.id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDark ? '#334155' : '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <td style={{ padding: '10px', color: c.text, fontWeight: 500 }}>#{order.order_number}</td>
                <td style={{ padding: '10px', color: c.textMuted }}>{order.customer_name}</td>
                <td style={{ padding: '10px', color: c.text, fontWeight: 500, textAlign: 'right' }}>
                  KSh {order.total_amount?.toLocaleString() || 0}
                </td>
                <td style={{ padding: '10px', textAlign: 'center' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background:
                      order.status === 'completed'
                        ? isDark ? 'rgba(16, 185, 129, 0.2)' : '#d1fae5'
                        : order.status === 'pending'
                        ? isDark ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7'
                        : isDark ? 'rgba(220, 53, 69, 0.2)' : '#fee2e2',
                    color:
                      order.status === 'completed'
                        ? isDark ? '#4ade80' : '#10b981'
                        : order.status === 'pending'
                        ? isDark ? '#fbbf24' : '#f59e0b'
                        : isDark ? '#ff6b6b' : '#ff5f57',
                  }}>
                    {order.status?.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: c.textMuted }}>
          No recent orders
        </div>
      )}
    </div>
  );
}

// Recent Activity Feed
function RecentActivityFeed({ isDark, c, activities }) {
  return (
    <div style={{
      background: c.card,
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      maxHeight: '500px',
      overflowY: 'auto',
      border: `1px solid ${c.border}`,
    }}>
      <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 600, color: c.text }}>
        📢 Recent Activity
      </h3>
      {activities && activities.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {activities.map((activity, idx) => (
            <div
              key={idx}
              style={{
                padding: '10px',
                borderLeft: `3px solid #667eea`,
                borderRadius: '4px',
                background: isDark ? '#334155' : '#f3f4f6',
                fontSize: '12px',
              }}
            >
              <div style={{ color: c.text, fontWeight: 500, marginBottom: '3px' }}>
                {activity.message}
              </div>
              <div style={{ color: c.textMuted, fontSize: '11px' }}>
                {activity.timestamp || 'Just now'}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: c.textMuted }}>
          No recent activity
        </div>
      )}
    </div>
  );
}

// Data Table Component
function DataTable({ isDark, c, title, columns, data }) {
  return (
    <div style={{
      background: c.card,
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      overflowX: 'auto',
      border: `1px solid ${c.border}`,
    }}>
      <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 600, color: c.text }}>
        {title}
      </h3>
      {data && data.length > 0 ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${c.border}` }}>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  style={{
                    padding: '10px',
                    textAlign: idx === columns.length - 1 ? 'right' : 'left',
                    fontWeight: 600,
                    color: c.textMuted,
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={idx}
                style={{
                  borderBottom: `1px solid ${c.borderLight}`,
                  background: idx % 2 === 0 ? 'transparent' : isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                }}
              >
                {row.map((cell, cidx) => (
                  <td
                    key={cidx}
                    style={{
                      padding: '10px',
                      textAlign: cidx === row.length - 1 ? 'right' : 'left',
                      color: cidx === 0 ? c.text : c.textMuted,
                      fontWeight: cidx === 0 ? 500 : 400,
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: c.textMuted }}>
          No data available
        </div>
      )}
    </div>
  );
}

