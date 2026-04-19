import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { getThemeColors } from "../utils/themeColors";
import { getBuyingCustomerById, getBuyingCustomerOrders } from "../api/buyingCustomers";
import { getOrderPrintHtml } from "../api/orders";

function money(value) {
  return `KES ${parseFloat(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
  })}`;
}

function badgeStyle(label, isDark) {
  const value = String(label || "").toLowerCase();

  if (["completed", "paid", "delivered"].includes(value)) {
    return {
      background: isDark ? "rgba(16,185,129,0.20)" : "#d1fae5",
      color: isDark ? "#4ade80" : "#047857",
    };
  }

  if (["pending", "processing", "confirmed"].includes(value)) {
    return {
      background: isDark ? "rgba(245,158,11,0.20)" : "#fef3c7",
      color: isDark ? "#fbbf24" : "#b45309",
    };
  }

  if (["cancelled", "failed", "refunded"].includes(value)) {
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

function InfoBlock({ label, value, c }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: c.textMuted, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: c.text, wordBreak: "break-word" }}>
        {value || "—"}
      </div>
    </div>
  );
}

export default function BuyingCustomerDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { isDark } = useTheme();
  const c = getThemeColors(isDark);

  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [printingId, setPrintingId] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [err, setErr] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setErr("");

      const [customerRes, ordersRes] = await Promise.all([
        getBuyingCustomerById(id),
        getBuyingCustomerOrders(id),
      ]);

      const cust = customerRes?.data || customerRes;
      setCustomer(cust);

      const orderList = Array.isArray(ordersRes?.data)
        ? ordersRes.data
        : Array.isArray(ordersRes)
        ? ordersRes
        : [];
      setOrders(orderList);
    } catch (e) {
      setErr(e?.message || "Failed to load customer details");
    } finally {
      setLoading(false);
    }
  }

  async function handlePrint(orderId) {
    try {
      setPrintingId(orderId);
      const html = await getOrderPrintHtml(orderId);

      const printWindow = window.open("", "_blank", "width=700,height=700");
      if (!printWindow) {
        throw new Error("Popup blocked. Please allow popups and try again.");
      }

      printWindow.document.open();
      printWindow.document.write(typeof html === "string" ? html : html?.html || "");
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } catch (e) {
      setErr(e?.message || "Failed to print order");
    } finally {
      setPrintingId(null);
    }
  }

  function toggleOrderExpand(orderId) {
    setExpandedOrder((prev) => (prev === orderId ? null : orderId));
  }

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: c.textMuted }}>
        Loading customer details...
      </div>
    );
  }

  if (!customer) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: c.textMuted }}>
        Customer not found.
      </div>
    );
  }

  const totalSpent = orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

  return (
    <div style={{ background: c.bg, minHeight: "100vh", padding: 20 }}>
      {/* Header */}
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
            🛍️ {customer.name}
          </h1>
          <p style={{ margin: 0, color: c.textMuted, fontSize: 13 }}>
            Buying customer detail — orders &amp; purchase history
          </p>
        </div>

        <button
          onClick={() => nav("/buying-customers")}
          style={btnStyle(c.buttonBg, c.text)}
        >
          ← Back to Buying Customers
        </button>
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
          ⚠️ {err}
        </div>
      )}

      {/* Customer Info Card */}
      <div
        style={{
          background: c.card,
          border: `1px solid ${c.border}`,
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16, fontWeight: 700, color: c.text }}>
          👤 Customer Information
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
          }}
        >
          <InfoBlock label="Full Name" value={customer.name} c={c} />
          <InfoBlock label="Phone" value={customer.phone} c={c} />
          <InfoBlock label="Email" value={customer.email} c={c} />
          <InfoBlock label="Address" value={customer.address} c={c} />
          <InfoBlock
            label="Registered"
            value={customer.created_at ? new Date(customer.created_at).toLocaleDateString() : null}
            c={c}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <SummaryCard
          title="Total Orders"
          value={orders.length}
          subtitle="All purchase orders"
          c={c}
        />
        <SummaryCard
          title="Total Spent"
          value={money(totalSpent)}
          subtitle="Gross order value"
          c={c}
        />
        <SummaryCard
          title="Completed Orders"
          value={orders.filter((o) => o.status === "completed").length}
          subtitle="Successfully fulfilled"
          c={c}
        />
        <SummaryCard
          title="Pending Orders"
          value={orders.filter((o) => ["pending", "processing", "confirmed"].includes(o.status)).length}
          subtitle="Awaiting fulfillment"
          c={c}
        />
      </div>

      {/* Order History */}
      <div
        style={{
          background: c.card,
          border: `1px solid ${c.border}`,
          borderRadius: 12,
          padding: 20,
          overflowX: "auto",
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 18, fontWeight: 700, color: c.text }}>
          📦 Order History
        </h3>

        {orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: c.textMuted }}>
            No orders found for this customer
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${c.border}`, background: c.headerBg }}>
                <th style={thStyle(c)}></th>
                <th style={thStyle(c)}>Order #</th>
                <th style={thStyle(c)}>Date</th>
                <th style={{ ...thStyle(c), textAlign: "center" }}>Items</th>
                <th style={{ ...thStyle(c), textAlign: "right" }}>Total</th>
                <th style={thStyle(c)}>Status</th>
                <th style={{ ...thStyle(c), textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, idx) => {
                const isExpanded = expandedOrder === order.id;
                const badge = badgeStyle(order.status, isDark);
                const items = Array.isArray(order.items) ? order.items : [];

                return (
                  <React.Fragment key={order.id}>
                    <tr
                      style={{
                        borderBottom: isExpanded ? "none" : `1px solid ${c.border}`,
                        background: idx % 2 === 0 ? "transparent" : isDark ? "rgba(255,255,255,0.01)" : "#fafafa",
                      }}
                    >
                      {/* Expand toggle */}
                      <td style={{ padding: "12px 8px", textAlign: "center" }}>
                        {items.length > 0 && (
                          <button
                            onClick={() => toggleOrderExpand(order.id)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontSize: 16,
                              color: c.textMuted,
                              padding: 2,
                            }}
                            title={isExpanded ? "Collapse" : "Expand order items"}
                          >
                            {isExpanded ? "▲" : "▶"}
                          </button>
                        )}
                      </td>

                      <td style={tdPrimary(c)}>
                        #{order.order_number || order.id}
                      </td>

                      <td style={tdMuted(c)}>
                        {order.created_at
                          ? new Date(order.created_at).toLocaleDateString()
                          : "—"}
                      </td>

                      <td style={{ ...tdBase, textAlign: "center" }}>
                        {items.length > 0 ? (
                          <span
                            style={{
                              background: isDark ? "rgba(14,165,233,0.18)" : "#e0f2fe",
                              color: "#0284c7",
                              padding: "3px 8px",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            {items.length} item{items.length !== 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span style={{ color: c.textMuted, fontSize: 12 }}>—</span>
                        )}
                      </td>

                      <td style={{ ...tdPrimary(c), textAlign: "right" }}>
                        {money(order.total_amount)}
                      </td>

                      <td style={tdBase}>
                        <span
                          style={{
                            background: badge.background,
                            color: badge.color,
                            padding: "5px 10px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            display: "inline-block",
                          }}
                        >
                          {order.status || "—"}
                        </span>
                      </td>

                      <td style={{ ...tdBase, textAlign: "center" }}>
                        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                          <button
                            onClick={() => handlePrint(order.id)}
                            disabled={printingId === order.id}
                            style={{
                              padding: "6px 12px",
                              background: printingId === order.id ? "#9ca3af" : "#16a34a",
                              color: "white",
                              border: "none",
                              borderRadius: 6,
                              cursor: printingId === order.id ? "not-allowed" : "pointer",
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            {printingId === order.id ? "Printing..." : "🖨️ Print"}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded order items row */}
                    {isExpanded && items.length > 0 && (
                      <tr style={{ borderBottom: `1px solid ${c.border}` }}>
                        <td colSpan={7} style={{ padding: 0 }}>
                          <div
                            style={{
                              background: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
                              borderTop: `1px dashed ${c.border}`,
                              padding: 16,
                            }}
                          >
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: c.textMuted,
                                marginBottom: 10,
                              }}
                            >
                              ORDER ITEMS
                            </div>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                              <thead>
                                <tr>
                                  <th
                                    style={{
                                      padding: "6px 10px",
                                      textAlign: "left",
                                      fontSize: 11,
                                      fontWeight: 700,
                                      color: c.textMuted,
                                      borderBottom: `1px solid ${c.border}`,
                                    }}
                                  >
                                    Product
                                  </th>
                                  <th
                                    style={{
                                      padding: "6px 10px",
                                      textAlign: "center",
                                      fontSize: 11,
                                      fontWeight: 700,
                                      color: c.textMuted,
                                      borderBottom: `1px solid ${c.border}`,
                                    }}
                                  >
                                    Qty
                                  </th>
                                  <th
                                    style={{
                                      padding: "6px 10px",
                                      textAlign: "right",
                                      fontSize: 11,
                                      fontWeight: 700,
                                      color: c.textMuted,
                                      borderBottom: `1px solid ${c.border}`,
                                    }}
                                  >
                                    Unit Price
                                  </th>
                                  <th
                                    style={{
                                      padding: "6px 10px",
                                      textAlign: "right",
                                      fontSize: 11,
                                      fontWeight: 700,
                                      color: c.textMuted,
                                      borderBottom: `1px solid ${c.border}`,
                                    }}
                                  >
                                    Subtotal
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {items.map((item, itemIdx) => (
                                  <tr key={itemIdx}>
                                    <td
                                      style={{
                                        padding: "6px 10px",
                                        fontSize: 13,
                                        color: c.text,
                                        fontWeight: 600,
                                      }}
                                    >
                                      {item.product_name || item.name || `Product #${item.product_id}`}
                                    </td>
                                    <td
                                      style={{
                                        padding: "6px 10px",
                                        fontSize: 13,
                                        color: c.textMuted,
                                        textAlign: "center",
                                      }}
                                    >
                                      {item.quantity}
                                    </td>
                                    <td
                                      style={{
                                        padding: "6px 10px",
                                        fontSize: 13,
                                        color: c.textMuted,
                                        textAlign: "right",
                                      }}
                                    >
                                      {money(item.unit_price || item.price)}
                                    </td>
                                    <td
                                      style={{
                                        padding: "6px 10px",
                                        fontSize: 13,
                                        color: c.text,
                                        fontWeight: 700,
                                        textAlign: "right",
                                      }}
                                    >
                                      {money(
                                        item.subtotal ||
                                          (item.quantity || 0) * (item.unit_price || item.price || 0)
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>

                            {order.notes && (
                              <div
                                style={{
                                  marginTop: 10,
                                  padding: "8px 10px",
                                  background: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9",
                                  borderRadius: 6,
                                  fontSize: 12,
                                  color: c.textMuted,
                                }}
                              >
                                <strong>Notes:</strong> {order.notes}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const tdBase = {
  padding: 12,
  fontSize: 13,
  verticalAlign: "middle",
};

function tdPrimary(c) {
  return { ...tdBase, color: c.text, fontWeight: 700 };
}

function tdMuted(c) {
  return { ...tdBase, color: c.textMuted };
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

function btnStyle(background, color = "white") {
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
