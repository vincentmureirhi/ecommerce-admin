import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { getThemeColors } from "../utils/themeColors";
import {
  getCustomerById,
  getCustomerOrderHistory,
  getCustomerPayments,
  getCustomerSummary,
} from "../api/customers";
import { getOrderForPrint } from "../api/orders";

function money(value) {
  return `KES ${parseFloat(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
  })}`;
}

function badgeStyle(label, isDark) {
  const value = String(label || "").toLowerCase();

  if (["completed", "paid", "active", "printed"].includes(value)) {
    return {
      background: isDark ? "rgba(16,185,129,0.20)" : "#d1fae5",
      color: isDark ? "#4ade80" : "#047857",
    };
  }

  if (["pending", "partial", "unpaid", "not printed"].includes(value)) {
    return {
      background: isDark ? "rgba(245,158,11,0.20)" : "#fef3c7",
      color: isDark ? "#fbbf24" : "#b45309",
    };
  }

  if (["failed", "cancelled", "inactive", "overdue"].includes(value)) {
    return {
      background: isDark ? "rgba(239,68,68,0.20)" : "#fee2e2",
      color: isDark ? "#fca5a5" : "#b91c1c",
    };
  }

  return {
    background: isDark ? "rgba(148,163,184,0.20)" : "#e2e8f0",
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
        padding: 18,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: c.textMuted, marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: c.text }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: c.textMuted, marginTop: 8 }}>
        {subtitle}
      </div>
    </div>
  );
}

export default function CustomerDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { isDark } = useTheme();
  const c = getThemeColors(isDark);

  const [customer, setCustomer] = useState(null);
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [printingId, setPrintingId] = useState(null);
  const [err, setErr] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setErr("");

      const [customerRes, summaryRes, ordersRes, paymentsRes] = await Promise.all([
        getCustomerById(id),
        getCustomerSummary(id),
        getCustomerOrderHistory(id),
        getCustomerPayments(id),
      ]);

      setCustomer(customerRes?.data || customerRes);
      setSummary(summaryRes?.data?.summary || summaryRes?.summary || null);
      setOrders(Array.isArray(ordersRes?.data) ? ordersRes.data : []);
      setPayments(Array.isArray(paymentsRes?.data) ? paymentsRes.data : []);
    } catch (e) {
      setErr(e?.message || "Failed to load customer details");
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

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: c.textMuted }}>
        Loading...
      </div>
    );
  }

  if (!customer) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: c.textMuted }}>
        Customer not found
      </div>
    );
  }

  return (
    <div style={{ background: c.bg, minHeight: "100vh", padding: 20 }}>
      <div
        style={{
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ marginTop: 0, marginBottom: 5, fontSize: 28, fontWeight: 800, color: c.text }}>
            👤 {customer.name}
          </h1>
          <p style={{ margin: 0, color: c.textMuted, fontSize: 13 }}>
            Customer command page: orders, payments, balance, and print flow
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => nav(`/orders?customer=${customer.id}`)}
            style={btn("#667eea")}
          >
            View All Orders
          </button>
          <button
            onClick={() => nav("/customers")}
            style={btn(c.buttonBg || "#475569", c.text)}
          >
            ← Back
          </button>
        </div>
      </div>

      {err && (
        <div
          style={{
            background: isDark ? "rgba(239,68,68,0.10)" : "#fee2e2",
            color: isDark ? "#fca5a5" : "#b91c1c",
            border: `1px solid ${isDark ? "rgba(239,68,68,0.25)" : "#fecaca"}`,
            padding: 12,
            borderRadius: 8,
            marginBottom: 20,
          }}
        >
          {err}
        </div>
      )}

      <div
        style={{
          background: c.card,
          border: `1px solid ${c.border}`,
          borderRadius: 12,
          padding: 18,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          <InfoBlock label="Phone" value={customer.phone || "—"} c={c} />
          <InfoBlock label="Email" value={customer.email || "—"} c={c} />
          <InfoBlock label="Customer Type" value={customer.customer_type || "—"} c={c} />
          <InfoBlock label="Status" value={customer.is_active ? "active" : "inactive"} c={c} />
          <InfoBlock label="Location" value={customer.location_name || "—"} c={c} />
          <InfoBlock label="Region" value={customer.region_name || "—"} c={c} />
          <InfoBlock label="Sales Rep" value={customer.sales_rep_name || "—"} c={c} />
          <InfoBlock
            label="Created"
            value={customer.created_at ? new Date(customer.created_at).toLocaleDateString() : "—"}
            c={c}
          />
        </div>
      </div>

      {summary && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 14,
            marginBottom: 20,
          }}
        >
          <SummaryCard title="Total Orders" value={summary.total_orders || 0} subtitle="All customer orders" c={c} />
          <SummaryCard title="Total Spent" value={money(summary.total_spent || 0)} subtitle="Gross ordered value" c={c} />
          <SummaryCard title="Total Paid" value={money(summary.total_paid || 0)} subtitle="Collected from customer" c={c} />
          <SummaryCard title="Outstanding" value={money(summary.outstanding_balance || 0)} subtitle="Still owed" c={c} />
          <SummaryCard title="Completed Orders" value={summary.completed_orders || 0} subtitle="Fulfilled" c={c} />
          <SummaryCard title="Pending Orders" value={summary.pending_orders || 0} subtitle="Open workflow" c={c} />
          <SummaryCard
            title="Last Order"
            value={summary.last_order_date ? new Date(summary.last_order_date).toLocaleDateString() : "—"}
            subtitle="Most recent order"
            c={c}
          />
          <SummaryCard
            title="Last Payment"
            value={summary.last_payment_date ? new Date(summary.last_payment_date).toLocaleDateString() : "—"}
            subtitle="Most recent payment"
            c={c}
          />
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.15fr 0.85fr",
          gap: 20,
        }}
      >
        <div
          style={{
            background: c.card,
            border: `1px solid ${c.border}`,
            borderRadius: 12,
            padding: 18,
            overflowX: "auto",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 16, color: c.text, fontSize: 18 }}>
            📦 Order History
          </h3>

          {orders.length === 0 ? (
            <div style={{ color: c.textMuted, textAlign: "center", padding: 30 }}>
              No orders found
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 920 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${c.border}` }}>
                  <th style={thStyle(c)}>Order #</th>
                  <th style={thStyle(c)}>Type</th>
                  <th style={{ ...thStyle(c), textAlign: "right" }}>Total</th>
                  <th style={{ ...thStyle(c), textAlign: "right" }}>Paid</th>
                  <th style={{ ...thStyle(c), textAlign: "right" }}>Balance</th>
                  <th style={thStyle(c)}>Order Status</th>
                  <th style={thStyle(c)}>Settlement</th>
                  <th style={thStyle(c)}>Printed</th>
                  <th style={{ ...thStyle(c), textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, idx) => {
                  const orderBadge = badgeStyle(order.order_status, isDark);
                  const settlementBadge = badgeStyle(order.settlement_label, isDark);
                  const printedBadge = badgeStyle(order.is_printed ? "printed" : "not printed", isDark);

                  return (
                    <tr
                      key={order.id}
                      style={{
                        borderBottom: `1px solid ${c.border}`,
                        background: idx % 2 === 0 ? "transparent" : isDark ? "rgba(255,255,255,0.01)" : "#fafafa",
                      }}
                    >
                      <td style={tdPrimary(c)}>{order.order_number}</td>
                      <td style={tdMuted(c)}>{order.order_type}</td>
                      <td style={{ ...tdPrimary(c), textAlign: "right" }}>{money(order.total_amount)}</td>
                      <td style={{ ...tdMuted(c), textAlign: "right" }}>{money(order.amount_paid)}</td>
                      <td style={{ ...tdPrimary(c), textAlign: "right" }}>{money(order.balance_due)}</td>

                      <td style={tdBase}>
                        <span style={{ ...chipStyle(orderBadge), display: "inline-block" }}>
                          {order.order_status}
                        </span>
                      </td>

                      <td style={tdBase}>
                        <span style={{ ...chipStyle(settlementBadge), display: "inline-block" }}>
                          {order.settlement_label}
                        </span>
                      </td>

                      <td style={tdBase}>
                        <span style={{ ...chipStyle(printedBadge), display: "inline-block" }}>
                          {order.is_printed ? "printed" : "not printed"}
                        </span>
                      </td>

                      <td style={{ ...tdBase, textAlign: "center" }}>
                        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                          <button
                            onClick={() => nav(`/orders/${order.id}`)}
                            style={smallBtn("#667eea")}
                          >
                            View
                          </button>
                          <button
                            onClick={() => handlePrint(order.id)}
                            disabled={printingId === order.id}
                            style={{
                              ...smallBtn("#16a34a"),
                              opacity: printingId === order.id ? 0.7 : 1,
                              cursor: printingId === order.id ? "not-allowed" : "pointer",
                            }}
                          >
                            {printingId === order.id ? "Printing..." : "Print"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div
          style={{
            background: c.card,
            border: `1px solid ${c.border}`,
            borderRadius: 12,
            padding: 18,
            overflowX: "auto",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 16, color: c.text, fontSize: 18 }}>
            💳 Payment History
          </h3>

          {payments.length === 0 ? (
            <div style={{ color: c.textMuted, textAlign: "center", padding: 30 }}>
              No payments found
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${c.border}` }}>
                  <th style={thStyle(c)}>Payment</th>
                  <th style={thStyle(c)}>Order #</th>
                  <th style={{ ...thStyle(c), textAlign: "right" }}>Received</th>
                  <th style={thStyle(c)}>Method</th>
                  <th style={thStyle(c)}>Status</th>
                  <th style={thStyle(c)}>Receipt</th>
                  <th style={thStyle(c)}>Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment, idx) => {
                  const statusBadge = badgeStyle(payment.status, isDark);

                  return (
                    <tr
                      key={payment.id}
                      style={{
                        borderBottom: `1px solid ${c.border}`,
                        background: idx % 2 === 0 ? "transparent" : isDark ? "rgba(255,255,255,0.01)" : "#fafafa",
                      }}
                    >
                      <td style={tdPrimary(c)}>#{payment.id}</td>
                      <td style={tdMuted(c)}>{payment.order_number || payment.order_id}</td>
                      <td style={{ ...tdPrimary(c), textAlign: "right" }}>
                        {money(payment.received_amount || payment.amount || 0)}
                      </td>
                      <td style={tdMuted(c)}>{(payment.method || "—").toUpperCase()}</td>
                      <td style={tdBase}>
                        <span style={{ ...chipStyle(statusBadge), display: "inline-block" }}>
                          {payment.status}
                        </span>
                      </td>
                      <td style={tdMuted(c)}>{payment.mpesa_receipt || "—"}</td>
                      <td style={tdMuted(c)}>
                        {payment.created_at ? new Date(payment.created_at).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ label, value, c }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: c.textMuted, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: c.text, wordBreak: "break-word" }}>
        {value}
      </div>
    </div>
  );
}

const tdBase = {
  padding: 12,
  fontSize: 13,
  verticalAlign: "top",
};

function tdPrimary(c) {
  return {
    ...tdBase,
    color: c.text,
    fontWeight: 700,
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
    fontWeight: 800,
    color: c.textMuted,
  };
}

function chipStyle(style) {
  return {
    background: style.background,
    color: style.color,
    padding: "6px 10px",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700,
  };
}

function btn(background, color = "white") {
  return {
    padding: "10px 16px",
    background,
    color,
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 13,
  };
}

function smallBtn(background) {
  return {
    padding: "6px 12px",
    background,
    color: "white",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 11,
    fontWeight: 700,
  };
}

