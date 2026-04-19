import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { getThemeColors } from "../utils/themeColors";
import {
  listOrders,
  getOrderForPrint,
  getOrderStatistics,
} from "../api/orders";
import { getCustomerById } from "../api/customers";

function money(value) {
  return `KES ${parseFloat(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
  })}`;
}

function getOrderStatusStyle(status, isDark) {
  if (status === "completed") {
    return {
      bg: isDark ? "rgba(16, 185, 129, 0.2)" : "#d4edda",
      color: isDark ? "#4ade80" : "#155724",
    };
  }

  if (status === "pending") {
    return {
      bg: isDark ? "rgba(245, 158, 11, 0.2)" : "#fff3cd",
      color: isDark ? "#fbbf24" : "#856404",
    };
  }

  return {
    bg: isDark ? "rgba(220, 53, 69, 0.2)" : "#f8d7da",
    color: isDark ? "#ff6b6b" : "#721c24",
  };
}

function getSettlementStyle(order, isDark) {
  if (order.order_type === "route") {
    if (order.payment_state === "paid") {
      return {
        label: "Paid",
        bg: isDark ? "rgba(16, 185, 129, 0.2)" : "#d4edda",
        color: isDark ? "#4ade80" : "#155724",
      };
    }

    if (order.payment_state === "partial") {
      return {
        label: "Partial",
        bg: isDark ? "rgba(59, 130, 246, 0.2)" : "#dbeafe",
        color: isDark ? "#93c5fd" : "#1d4ed8",
      };
    }

    if (order.payment_state === "overdue") {
      return {
        label: "Overdue",
        bg: isDark ? "rgba(220, 53, 69, 0.2)" : "#f8d7da",
        color: isDark ? "#ff6b6b" : "#721c24",
      };
    }

    return {
      label: "Unpaid",
      bg: isDark ? "rgba(245, 158, 11, 0.2)" : "#fff3cd",
      color: isDark ? "#fbbf24" : "#856404",
    };
  }

  if (order.payment_status === "completed") {
    return {
      label: "Paid",
      bg: isDark ? "rgba(16, 185, 129, 0.2)" : "#d4edda",
      color: isDark ? "#4ade80" : "#155724",
    };
  }

  if (order.payment_status === "failed") {
    return {
      label: "Failed",
      bg: isDark ? "rgba(220, 53, 69, 0.2)" : "#f8d7da",
      color: isDark ? "#ff6b6b" : "#721c24",
    };
  }

  return {
    label: "Pending",
    bg: isDark ? "rgba(245, 158, 11, 0.2)" : "#fff3cd",
    color: isDark ? "#fbbf24" : "#856404",
  };
}

function getPrintedStyle(order, isDark) {
  if (order.is_printed) {
    return {
      label: "Printed",
      bg: isDark ? "rgba(16, 185, 129, 0.2)" : "#d4edda",
      color: isDark ? "#4ade80" : "#155724",
    };
  }

  return {
    label: "Not Printed",
    bg: isDark ? "rgba(148, 163, 184, 0.2)" : "#e2e8f0",
    color: isDark ? "#cbd5e1" : "#475569",
  };
}

function SummaryCard({ title, value, subtitle, c }) {
  return (
    <div
      style={{
        background: c.card,
        border: `1px solid ${c.border}`,
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: c.textMuted, marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: c.text }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: c.textMuted, marginTop: 8 }}>
        {subtitle}
      </div>
    </div>
  );
}

export default function Orders() {
  const { isDark } = useTheme();
  const c = getThemeColors(isDark);
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const customerFromUrl = searchParams.get("customer") || "";

  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [printingId, setPrintingId] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [search, setSearch] = useState("");
  const [orderType, setOrderType] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [printedStatus, setPrintedStatus] = useState("");
  const [paymentState, setPaymentState] = useState("");

  async function loadData() {
    setErr("");
    setLoading(true);

    try {
      const filters = {};
      if (search) filters.search = search;
      if (orderType) filters.order_type = orderType;
      if (orderStatus) filters.order_status = orderStatus;
      if (customerFromUrl) filters.customer_id = customerFromUrl;
      if (printedStatus) filters.printed_status = printedStatus;
      if (paymentState) filters.payment_state = paymentState;

      const [orderData, customerData, statsData] = await Promise.all([
        listOrders(filters),
        customerFromUrl ? getCustomerById(customerFromUrl) : Promise.resolve(null),
        getOrderStatistics(),
      ]);

      setRows(Array.isArray(orderData.data) ? orderData.data : []);
      setSelectedCustomer(customerData?.data || null);
      setStats(statsData?.data || null);
    } catch (e) {
      setErr(e?.message || "Failed to load orders");
      setSelectedCustomer(null);
    } finally {
      setLoading(false);
    }
  }

  async function handlePrint(orderId) {
    try {
      setPrintingId(orderId);

      const res = await getOrderForPrint(orderId);
      const html = res?.data?.html;

      if (!html) {
        throw new Error("Printable order sheet was not returned");
      }

      const printWindow = window.open("", "_blank", "width=900,height=700");
      if (!printWindow) {
        throw new Error("Popup blocked. Allow popups and try again.");
      }

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();

      await loadData();
    } catch (e) {
      setErr(e?.message || "Failed to print order");
    } finally {
      setPrintingId(null);
    }
  }

  function clearCustomerFilter() {
    const next = new URLSearchParams(searchParams);
    next.delete("customer");
    setSearchParams(next);
  }

  useEffect(() => {
    loadData();
  }, [search, orderType, orderStatus, customerFromUrl, printedStatus, paymentState]);

  if (loading) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          color: c.textMuted,
          background: c.bg,
          minHeight: "100vh",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div style={{ background: c.bg, minHeight: "100vh", padding: "20px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            marginTop: 0,
            marginBottom: 6,
            fontSize: 30,
            fontWeight: 800,
            color: c.text,
          }}
        >
          📦 Orders
        </h1>
        <p style={{ margin: 0, color: c.textMuted, fontSize: 13 }}>
          All orders from normal and region customers, with printing, payment tracking, and balance control
        </p>
      </div>

      {err && (
        <div
          style={{
            background: isDark ? "rgba(220, 53, 69, 0.1)" : "#fee",
            color: isDark ? "#ff6b6b" : "#c33",
            padding: 12,
            borderRadius: 6,
            marginBottom: 20,
            border: `1px solid ${isDark ? "rgba(220, 53, 69, 0.3)" : "#fdd"}`,
          }}
        >
          ⚠️ {err}
        </div>
      )}

      {selectedCustomer && (
        <div
          style={{
            marginBottom: 18,
            padding: 12,
            borderRadius: 8,
            background: isDark ? "rgba(16,185,129,0.10)" : "#ecfdf5",
            border: `1px solid ${isDark ? "rgba(16,185,129,0.25)" : "#bbf7d0"}`,
            color: c.text,
            fontSize: 13,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span>
            Showing orders for customer: <strong>{selectedCustomer.name}</strong>
            {selectedCustomer.phone ? <> · <strong>{selectedCustomer.phone}</strong></> : null}
          </span>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={() => nav(`/customers/${selectedCustomer.id}`)}
              style={smallBtn("#667eea")}
            >
              Open Customer
            </button>

            <button
              onClick={clearCustomerFilter}
              style={smallBtn("#dc3545")}
            >
              Clear Filter
            </button>
          </div>
        </div>
      )}

      {stats && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 14,
            marginBottom: 20,
          }}
        >
          <SummaryCard title="Total Orders" value={stats.total_orders || 0} subtitle="All recorded orders" c={c} />
          <SummaryCard title="Printed" value={stats.printed_orders || 0} subtitle="Already handled" c={c} />
          <SummaryCard title="Pending Print" value={stats.not_printed_orders || 0} subtitle="Still waiting" c={c} />
          <SummaryCard title="Open Region Credit" value={stats.route_credit_open || 0} subtitle="Credit orders not cleared" c={c} />
          <SummaryCard title="Outstanding Balance" value={money(stats.total_outstanding_balance || 0)} subtitle="Money still owed" c={c} />
          <SummaryCard title="Overdue Region Orders" value={stats.overdue_route_orders || 0} subtitle="Need follow-up" c={c} />
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
          gap: 15,
          marginBottom: 20,
        }}
      >
        <div>
          <label style={filterLabel(c)}>Search</label>
          <input
            type="text"
            placeholder="Order #, customer, region, rep..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={inputStyle(c)}
          />
        </div>

        <div>
          <label style={filterLabel(c)}>Type</label>
          <select value={orderType} onChange={(e) => setOrderType(e.target.value)} style={inputStyle(c)}>
            <option value="">All Types</option>
            <option value="route">🚗 Region Orders</option>
            <option value="normal">💰 Normal Orders</option>
          </select>
        </div>

        <div>
          <label style={filterLabel(c)}>Order Status</label>
          <select value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)} style={inputStyle(c)}>
            <option value="">All Statuses</option>
            <option value="pending">⏳ Pending</option>
            <option value="completed">✅ Completed</option>
            <option value="cancelled">❌ Cancelled</option>
          </select>
        </div>

        <div>
          <label style={filterLabel(c)}>Printed</label>
          <select value={printedStatus} onChange={(e) => setPrintedStatus(e.target.value)} style={inputStyle(c)}>
            <option value="">All</option>
            <option value="printed">Printed</option>
            <option value="not_printed">Not Printed</option>
          </select>
        </div>

        <div>
          <label style={filterLabel(c)}>Region Settlement</label>
          <select value={paymentState} onChange={(e) => setPaymentState(e.target.value)} style={inputStyle(c)}>
            <option value="">All</option>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {rows.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: 60,
            background: c.card,
            borderRadius: 8,
            color: c.textMuted,
            border: `1px solid ${c.border}`,
          }}
        >
          🔭 No orders found
        </div>
      )}

      {rows.length > 0 && (
        <div
          style={{
            background: c.card,
            borderRadius: 8,
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            border: `1px solid ${c.border}`,
            overflowX: "auto",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1920 }}>
            <thead>
              <tr style={{ background: c.headerBg, borderBottom: `1px solid ${c.border}` }}>
                <th style={thStyle(c)}>Order #</th>
                <th style={thStyle(c)}>Customer</th>
                <th style={thStyle(c)}>Sales Rep</th>
                <th style={thStyle(c)}>Location</th>
                <th style={thStyle(c)}>Region</th>
                <th style={{ ...thStyle(c), textAlign: "center" }}>Type</th>
                <th style={{ ...thStyle(c), textAlign: "center" }}>Date</th>
                <th style={{ ...thStyle(c), textAlign: "center" }}>Items</th>
                <th style={{ ...thStyle(c), textAlign: "right" }}>Total</th>
                <th style={{ ...thStyle(c), textAlign: "right" }}>Amount Paid</th>
                <th style={{ ...thStyle(c), textAlign: "right" }}>Balance</th>
                <th style={{ ...thStyle(c), textAlign: "center" }}>Due Date</th>
                <th style={{ ...thStyle(c), textAlign: "center" }}>Order</th>
                <th style={{ ...thStyle(c), textAlign: "center" }}>Settlement</th>
                <th style={{ ...thStyle(c), textAlign: "center" }}>Printed</th>
                <th style={{ ...thStyle(c), textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((order, idx) => {
                const orderStatusStyle = getOrderStatusStyle(order.order_status, isDark);
                const settlementStyle = getSettlementStyle(order, isDark);
                const printedStyle = getPrintedStyle(order, isDark);

                return (
                  <tr
                    key={order.id}
                    style={{
                      borderBottom: `1px solid ${c.borderLight || c.border}`,
                      background: idx % 2 === 0 ? c.rowBg1 : c.rowBg2,
                    }}
                  >
                    <td style={tdPrimary(c)}>{order.order_number}</td>

                    <td
                      onClick={() => order.customer_id && nav(`/customers/${order.customer_id}`)}
                      style={{
                        ...tdPrimary(c),
                        color: order.customer_id ? "#667eea" : c.text,
                        cursor: order.customer_id ? "pointer" : "default",
                        textDecoration: order.customer_id ? "underline" : "none",
                      }}
                    >
                      {order.customer_name}
                    </td>

                    <td style={tdMuted(c)}>{order.sales_rep_name || "Unassigned"}</td>
                    <td style={tdMuted(c)}>{order.location_name || "—"}</td>
                    <td style={tdMuted(c)}>{order.region_name || "—"}</td>

                    <td style={{ ...tdBase, textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 8px",
                          background:
                            isDark
                              ? "rgba(102, 126, 234, 0.2)"
                              : order.order_type === "route"
                              ? "#e3f2fd"
                              : "#f0f5ff",
                          color: "#667eea",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {order.order_type === "route" ? "🚗 Region" : "💰 Normal"}
                      </span>
                    </td>

                    <td style={{ ...tdMuted(c), textAlign: "center" }}>
                      {new Date(order.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>

                    <td style={{ ...tdMuted(c), textAlign: "center" }}>{order.item_count || 0}</td>

                    <td style={{ ...tdPrimary(c), textAlign: "right" }}>{money(order.total_amount)}</td>
                    <td style={{ ...tdMuted(c), textAlign: "right" }}>{money(order.amount_paid)}</td>
                    <td style={{ ...tdPrimary(c), textAlign: "right", color: order.balance_due > 0 ? "#fbbf24" : c.text }}>
                      {money(order.balance_due)}
                    </td>

                    <td style={{ ...tdMuted(c), textAlign: "center" }}>
                      {order.due_date || "—"}
                    </td>

                    <td style={{ ...tdBase, textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 8px",
                          background: orderStatusStyle.bg,
                          color: orderStatusStyle.color,
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {order.order_status}
                      </span>
                    </td>

                    <td style={{ ...tdBase, textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 8px",
                          background: settlementStyle.bg,
                          color: settlementStyle.color,
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {settlementStyle.label}
                      </span>
                    </td>

                    <td style={{ ...tdBase, textAlign: "center" }}>
                      <div
                        style={{
                          display: "inline-flex",
                          flexDirection: "column",
                          gap: 4,
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 8px",
                            background: printedStyle.bg,
                            color: printedStyle.color,
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {printedStyle.label}
                        </span>
                        {order.printed_at ? (
                          <span style={{ fontSize: 11, color: c.textMuted }}>
                            {new Date(order.printed_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        ) : null}
                      </div>
                    </td>

                    <td style={{ ...tdBase, textAlign: "center" }}>
                      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                        <button onClick={() => nav(`/orders/${order.id}`)} style={smallBtn("#667eea")}>
                          View
                        </button>

                        <button
                          onClick={() => handlePrint(order.id)}
                          disabled={printingId === order.id}
                          style={{
                            ...smallBtn("#16a34a"),
                            cursor: printingId === order.id ? "not-allowed" : "pointer",
                            opacity: printingId === order.id ? 0.7 : 1,
                          }}
                        >
                          {printingId === order.id ? "Printing..." : order.is_printed ? "Reprint" : "Print"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const tdBase = {
  padding: 12,
  fontSize: 13,
};

function tdPrimary(c) {
  return {
    ...tdBase,
    color: c.text,
    fontWeight: 600,
  };
}

function tdMuted(c) {
  return {
    ...tdBase,
    color: c.textMuted,
  };
}

function thStyle(c) {
  return {
    padding: 12,
    textAlign: "left",
    fontSize: 12,
    fontWeight: 700,
    color: c.textMuted,
  };
}

function inputStyle(c) {
  return {
    width: "100%",
    padding: "10px 12px",
    border: `1px solid ${c.border}`,
    borderRadius: 6,
    fontSize: 13,
    background: c.inputBg,
    color: c.text,
    boxSizing: "border-box",
  };
}

function filterLabel(c) {
  return {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: c.textMuted,
    marginBottom: 6,
  };
}

function smallBtn(background) {
  return {
    padding: "6px 12px",
    background,
    color: "white",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 11,
    fontWeight: 600,
  };
}
