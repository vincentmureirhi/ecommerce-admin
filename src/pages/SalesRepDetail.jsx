import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { getThemeColors } from "../utils/themeColors";
import { getSalesRepById } from "../api/salesReps";
import { getOrderForPrint } from "../api/orders";

function SummaryCard({ title, value, subtitle, c }) {
  return (
    <div
      style={{
        background: c.card,
        border: `1px solid ${c.border}`,
        borderRadius: 14,
        padding: 18,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 12,
          fontWeight: 700,
          color: c.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {title}
      </p>

      <p
        style={{
          margin: "10px 0 4px",
          fontSize: 28,
          fontWeight: 800,
          color: c.text,
          lineHeight: 1.1,
        }}
      >
        {value}
      </p>

      <p style={{ margin: 0, fontSize: 12, color: c.textMuted }}>
        {subtitle}
      </p>
    </div>
  );
}

function formatCurrency(value) {
  return `KES ${Number(value || 0).toLocaleString()}`;
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getLocationFreshness(recordedAt) {
  if (!recordedAt) {
    return { label: "No location", color: "#6b7280" };
  }

  const diffMs = Date.now() - new Date(recordedAt).getTime();
  const diffMinutes = diffMs / 60000;

  if (diffMinutes < 2) {
    return { label: "Live", color: "#16a34a" };
  }

  if (diffMinutes < 10) {
    return { label: "Stale", color: "#d97706" };
  }

  return { label: "Offline", color: "#dc2626" };
}

export default function SalesRepDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { isDark } = useTheme();
  const c = getThemeColors(isDark);

  const [rep, setRep] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [printingId, setPrintingId] = useState(null);

  async function loadData() {
    setErr("");
    setLoading(true);

    try {
      const data = await getSalesRepById(id);
      setRep(data?.data || null);
    } catch (e) {
      setErr(e?.message || "Failed to load sales rep");
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
    } catch (e) {
      setErr(e?.message || "Failed to print order");
    } finally {
      setPrintingId(null);
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  const cardStyle = {
    background: c.card,
    border: `1px solid ${c.border}`,
    borderRadius: 14,
    padding: 18,
    boxShadow: isDark
      ? "0 10px 24px rgba(0,0,0,0.18)"
      : "0 8px 20px rgba(15,23,42,0.05)",
  };

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
        Loading sales rep details...
      </div>
    );
  }

  if (!rep) {
    return (
      <div style={{ background: c.bg, minHeight: "100vh", padding: 20 }}>
        <button
          onClick={() => nav("/sales-reps")}
          style={{
            marginBottom: 16,
            padding: "8px 12px",
            border: `1px solid ${c.border}`,
            background: c.card,
            color: c.text,
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          ← Back to Sales Reps
        </button>
        <div style={{ ...cardStyle, color: c.textMuted }}>
          Sales rep not found.
        </div>
      </div>
    );
  }

  const freshness = getLocationFreshness(rep.latest_location_recorded_at);

  return (
    <div style={{ background: c.bg, minHeight: "100vh", padding: 20 }}>
      <div
        style={{
          marginBottom: 22,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <button
            onClick={() => nav("/sales-reps")}
            style={{
              marginBottom: 14,
              padding: "8px 12px",
              border: `1px solid ${c.border}`,
              background: c.card,
              color: c.text,
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            ← Back to Sales Reps
          </button>

          <h1
            style={{
              margin: 0,
              fontSize: 30,
              fontWeight: 800,
              color: c.text,
              letterSpacing: "-0.02em",
            }}
          >
            👤 {rep.name}
          </h1>

          <p style={{ margin: "6px 0 0", color: c.textMuted, fontSize: 13 }}>
            Sales rep performance, customers served, orders, and location status
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => nav(`/sales-reps/${rep.id}/track`)}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "none",
              background: "#0ea5e9",
              color: "white",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            📍 Track Rep
          </button>

          <div
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              background:
                rep.status === "active"
                  ? isDark
                    ? "rgba(34, 197, 94, 0.18)"
                    : "rgba(34, 197, 94, 0.12)"
                  : isDark
                  ? "rgba(239, 68, 68, 0.18)"
                  : "rgba(239, 68, 68, 0.12)",
              color: rep.status === "active" ? "#16a34a" : "#dc2626",
              fontSize: 12,
              fontWeight: 700,
              border: `1px solid ${
                rep.status === "active"
                  ? isDark
                    ? "rgba(34, 197, 94, 0.35)"
                    : "rgba(34, 197, 94, 0.25)"
                  : isDark
                  ? "rgba(239, 68, 68, 0.35)"
                  : "rgba(239, 68, 68, 0.25)"
              }`,
            }}
          >
            {rep.status === "active" ? "Active" : "Inactive"}
          </div>
        </div>
      </div>

      {err && (
        <div
          style={{
            background: isDark ? "rgba(220, 53, 69, 0.1)" : "#fee",
            color: isDark ? "#ff6b6b" : "#c33",
            padding: 12,
            borderRadius: 10,
            marginBottom: 18,
            border: `1px solid ${isDark ? "rgba(220, 53, 69, 0.3)" : "#fdd"}`,
          }}
        >
          ⚠️ {err}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <SummaryCard title="Orders Taken" value={rep.order_count || 0} subtitle="Total recorded orders" c={c} />
        <SummaryCard title="Total Sales" value={formatCurrency(rep.total_sales || 0)} subtitle="Revenue from orders taken" c={c} />
        <SummaryCard title="Avg Order Value" value={formatCurrency(rep.avg_order_value || 0)} subtitle="Average value per order" c={c} />
        <SummaryCard title="Customers Served" value={rep.ordering_customer_count || 0} subtitle="Distinct customers served" c={c} />
        <SummaryCard title="Completed Orders" value={rep.completed_orders || 0} subtitle="Orders marked completed" c={c} />
        <SummaryCard title="Pending Orders" value={rep.pending_orders || 0} subtitle="Orders still pending" c={c} />
        <SummaryCard title="Last Order" value={formatDate(rep.last_order_date)} subtitle="Most recent order activity" c={c} />
        <SummaryCard title="Contact" value={rep.phone_number || "No phone"} subtitle={rep.email || "No email"} c={c} />
      </div>

      <div style={{ ...cardStyle, marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: 14,
          }}
        >
          <h3 style={{ margin: 0, color: c.text, fontSize: 18 }}>
            Latest Location
          </h3>

          <span
            style={{
              display: "inline-block",
              padding: "6px 10px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              background: isDark ? "rgba(255,255,255,0.06)" : "#f8fafc",
              color: freshness.color,
              border: `1px solid ${c.border}`,
            }}
          >
            {freshness.label}
          </span>
        </div>

        {rep.latest_location_recorded_at ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: c.textMuted, marginBottom: 6 }}>
                Coordinates
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: c.text }}>
                {Number(rep.latest_latitude).toFixed(6)}, {Number(rep.latest_longitude).toFixed(6)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: c.textMuted, marginBottom: 6 }}>
                Last Updated
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: c.text }}>
                {formatDateTime(rep.latest_location_recorded_at)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: c.textMuted, marginBottom: 6 }}>
                Accuracy
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: c.text }}>
                {rep.latest_accuracy_meters ? `${rep.latest_accuracy_meters} m` : "—"}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: c.textMuted, marginBottom: 6 }}>
                Source
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: c.text }}>
                {rep.latest_location_source || "—"}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ color: c.textMuted }}>
            No location ping has been received for this sales rep yet.
          </div>
        )}
      </div>

      <div style={{ ...cardStyle, marginBottom: 20 }}>
        <h3 style={{ marginTop: 0, marginBottom: 14, color: c.text, fontSize: 18 }}>
          Customers Served by {rep.name}
        </h3>

        {rep.customers?.length ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${c.border}` }}>
                  <th style={{ textAlign: "left", padding: "10px 8px", fontSize: 12, color: c.textMuted }}>Customer</th>
                  <th style={{ textAlign: "left", padding: "10px 8px", fontSize: 12, color: c.textMuted }}>Phone</th>
                  <th style={{ textAlign: "left", padding: "10px 8px", fontSize: 12, color: c.textMuted }}>Type</th>
                  <th style={{ textAlign: "left", padding: "10px 8px", fontSize: 12, color: c.textMuted }}>Location</th>
                  <th style={{ textAlign: "left", padding: "10px 8px", fontSize: 12, color: c.textMuted }}>Region</th>
                  <th style={{ textAlign: "center", padding: "10px 8px", fontSize: 12, color: c.textMuted }}>Status</th>
                  <th style={{ textAlign: "center", padding: "10px 8px", fontSize: 12, color: c.textMuted }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rep.customers.map((customer) => (
                  <tr key={customer.id} style={{ borderBottom: `1px solid ${c.borderLight}` }}>
                    <td
                      onClick={() => nav(`/customers/${customer.id}`)}
                      style={{
                        padding: "10px 8px",
                        color: "#667eea",
                        fontWeight: 700,
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      {customer.name}
                    </td>
                    <td style={{ padding: "10px 8px", color: c.textMuted }}>{customer.phone || "—"}</td>
                    <td style={{ padding: "10px 8px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 8px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                          background:
                            customer.customer_type === "route"
                              ? isDark
                                ? "rgba(59,130,246,0.18)"
                                : "rgba(59,130,246,0.12)"
                              : isDark
                              ? "rgba(34,197,94,0.18)"
                              : "rgba(34,197,94,0.12)",
                          color: customer.customer_type === "route" ? "#2563eb" : "#16a34a",
                        }}
                      >
                        {customer.customer_type === "route" ? "Region" : "Normal"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 8px", color: c.textMuted }}>{customer.location_name || "—"}</td>
                    <td style={{ padding: "10px 8px", color: c.textMuted }}>{customer.region_name || "—"}</td>
                    <td style={{ padding: "10px 8px", textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 8px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                          background:
                            customer.is_active
                              ? isDark
                                ? "rgba(34,197,94,0.18)"
                                : "rgba(34,197,94,0.12)"
                              : isDark
                              ? "rgba(239,68,68,0.18)"
                              : "rgba(239,68,68,0.12)",
                          color: customer.is_active ? "#16a34a" : "#dc2626",
                        }}
                      >
                        {customer.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 8px", textAlign: "center" }}>
                      <button
                        onClick={() => nav(`/customers/${customer.id}`)}
                        style={{
                          padding: "6px 10px",
                          background: "#0ea5e9",
                          color: "white",
                          border: "none",
                          borderRadius: 8,
                          cursor: "pointer",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        View Customer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ color: c.textMuted }}>
            No served customers recorded for this sales rep yet.
          </div>
        )}
      </div>

      <div style={{ ...cardStyle, marginBottom: 20 }}>
        <h3 style={{ marginTop: 0, marginBottom: 14, color: c.text, fontSize: 18 }}>
          Orders Taken by {rep.name}
        </h3>

        {rep.orders?.length ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1080 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${c.border}` }}>
                  <th style={{ textAlign: "left", padding: "10px 8px", fontSize: 12, color: c.textMuted }}>Order No</th>
                  <th style={{ textAlign: "left", padding: "10px 8px", fontSize: 12, color: c.textMuted }}>Customer</th>
                  <th style={{ textAlign: "left", padding: "10px 8px", fontSize: 12, color: c.textMuted }}>Location</th>
                  <th style={{ textAlign: "left", padding: "10px 8px", fontSize: 12, color: c.textMuted }}>Region</th>
                  <th style={{ textAlign: "center", padding: "10px 8px", fontSize: 12, color: c.textMuted }}>Items</th>
                  <th style={{ textAlign: "center", padding: "10px 8px", fontSize: 12, color: c.textMuted }}>Date</th>
                  <th style={{ textAlign: "right", padding: "10px 8px", fontSize: 12, color: c.textMuted }}>Amount</th>
                  <th style={{ textAlign: "center", padding: "10px 8px", fontSize: 12, color: c.textMuted }}>Status</th>
                  <th style={{ textAlign: "center", padding: "10px 8px", fontSize: 12, color: c.textMuted }}>Payment</th>
                  <th style={{ textAlign: "center", padding: "10px 8px", fontSize: 12, color: c.textMuted }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rep.orders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: `1px solid ${c.borderLight}` }}>
                    <td style={{ padding: "10px 8px", color: c.text, fontWeight: 700 }}>
                      {order.order_number}
                    </td>
                    <td style={{ padding: "10px 8px", color: c.textMuted }}>{order.customer_name}</td>
                    <td style={{ padding: "10px 8px", color: c.textMuted }}>{order.location_name || "—"}</td>
                    <td style={{ padding: "10px 8px", color: c.textMuted }}>{order.region_name || "—"}</td>
                    <td style={{ padding: "10px 8px", textAlign: "center", color: c.textMuted }}>{order.item_count || 0}</td>
                    <td style={{ padding: "10px 8px", textAlign: "center", color: c.textMuted }}>
                      {new Date(order.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td style={{ padding: "10px 8px", textAlign: "right", color: c.text, fontWeight: 700 }}>
                      KES {Number(order.total_amount || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: "10px 8px", textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 8px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                          background:
                            order.order_status === "completed"
                              ? isDark
                                ? "rgba(34, 197, 94, 0.18)"
                                : "rgba(34, 197, 94, 0.12)"
                              : isDark
                              ? "rgba(245, 158, 11, 0.18)"
                              : "rgba(245, 158, 11, 0.12)",
                          color: order.order_status === "completed" ? "#16a34a" : "#d97706",
                        }}
                      >
                        {order.order_status}
                      </span>
                    </td>
                    <td style={{ padding: "10px 8px", textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 8px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                          background:
                            order.payment_status === "completed"
                              ? isDark
                                ? "rgba(34, 197, 94, 0.18)"
                                : "rgba(34, 197, 94, 0.12)"
                              : isDark
                              ? "rgba(245, 158, 11, 0.18)"
                              : "rgba(245, 158, 11, 0.12)",
                          color: order.payment_status === "completed" ? "#16a34a" : "#d97706",
                        }}
                      >
                        {order.payment_status}
                      </span>
                    </td>
                    <td style={{ padding: "10px 8px", textAlign: "center" }}>
                      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                        <button
                          onClick={() => nav(`/orders/${order.id}`)}
                          style={{
                            padding: "6px 10px",
                            background: "#0ea5e9",
                            color: "white",
                            border: "none",
                            borderRadius: 8,
                            cursor: "pointer",
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => handlePrint(order.id)}
                          disabled={printingId === order.id}
                          style={{
                            padding: "6px 10px",
                            background: "#16a34a",
                            color: "white",
                            border: "none",
                            borderRadius: 8,
                            cursor: printingId === order.id ? "not-allowed" : "pointer",
                            fontSize: 11,
                            fontWeight: 700,
                            opacity: printingId === order.id ? 0.7 : 1,
                          }}
                        >
                          {printingId === order.id ? "Printing..." : "Print"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ color: c.textMuted }}>
            No orders recorded for this sales rep yet.
          </div>
        )}
      </div>
    </div>
  );
}
