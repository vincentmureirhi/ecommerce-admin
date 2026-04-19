import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { getThemeColors } from "../utils/themeColors";
import { getRegionDashboard } from "../api/regions";
import client from "../api/client";

function formatCustomerType(type) {
  if (type === "route") return "Region";
  if (type === "normal") return "Normal";
  return type || "—";
}

export default function RegionDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { isDark } = useTheme();
  const c = getThemeColors(isDark);

  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [printingId, setPrintingId] = useState(null);

  async function loadData() {
    setErr("");
    setLoading(true);
    try {
      const res = await getRegionDashboard(id, {
        start_date: startDate,
        end_date: endDate,
      });
      setData(res.data || null);
    } catch (e) {
      setErr(e?.message || "Failed to load region details");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [id, startDate, endDate]);

  const summary = useMemo(() => {
    return data?.summary || {
      order_count: 0,
      total_revenue: 0,
      buying_customer_count: 0,
      completed_orders: 0,
      pending_orders: 0,
      paid_orders: 0,
    };
  }, [data]);

  async function handlePrintOrder(orderId) {
    try {
      setPrintingId(orderId);
      const res = await client.get(`/orders/${orderId}/print`);
      const html = res?.data?.data?.html;

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

  const cardStyle = {
    background: c.card,
    border: `1px solid ${c.border}`,
    borderRadius: 14,
    padding: 18,
    boxShadow: isDark
      ? "0 10px 24px rgba(0,0,0,0.18)"
      : "0 8px 20px rgba(15,23,42,0.05)",
  };

  const labelStyle = {
    margin: 0,
    fontSize: 12,
    fontWeight: 700,
    color: c.textMuted,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  };

  const valueStyle = {
    margin: "10px 0 4px",
    fontSize: 28,
    fontWeight: 800,
    color: c.text,
    lineHeight: 1.1,
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
        Loading region details...
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ background: c.bg, minHeight: "100vh", padding: 20 }}>
        <button
          onClick={() => nav("/regions")}
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
          ← Back to Regions
        </button>

        <div
          style={{
            background: c.card,
            border: `1px solid ${c.border}`,
            borderRadius: 12,
            padding: 24,
            color: c.textMuted,
          }}
        >
          Region data not found.
        </div>
      </div>
    );
  }

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
            onClick={() => nav("/regions")}
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
            ← Back to Regions
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
            🌍 {data.name}
          </h1>
          <p style={{ margin: "6px 0 0", color: c.textMuted, fontSize: 13 }}>
            Region performance, customers, locations, and order activity
          </p>
        </div>

        <div
          style={{
            padding: "8px 12px",
            borderRadius: 999,
            background:
              data.status === "active"
                ? isDark
                  ? "rgba(34, 197, 94, 0.18)"
                  : "rgba(34, 197, 94, 0.12)"
                : isDark
                ? "rgba(239, 68, 68, 0.18)"
                : "rgba(239, 68, 68, 0.12)",
            color: data.status === "active" ? "#16a34a" : "#dc2626",
            fontSize: 12,
            fontWeight: 700,
            border: `1px solid ${
              data.status === "active"
                ? isDark
                  ? "rgba(34, 197, 94, 0.35)"
                  : "rgba(34, 197, 94, 0.25)"
                : isDark
                ? "rgba(239, 68, 68, 0.35)"
                : "rgba(239, 68, 68, 0.25)"
            }`,
          }}
        >
          {data.status === "active" ? "Active Region" : "Inactive Region"}
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
          ...cardStyle,
          marginBottom: 18,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "end",
        }}
      >
        <div>
          <label style={{ display: "block", fontSize: 12, color: c.textMuted, marginBottom: 6 }}>
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{
              padding: "10px 12px",
              border: `1px solid ${c.border}`,
              borderRadius: 8,
              background: c.bg,
              color: c.text,
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, color: c.textMuted, marginBottom: 6 }}>
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{
              padding: "10px 12px",
              border: `1px solid ${c.border}`,
              borderRadius: 8,
              background: c.bg,
              color: c.text,
            }}
          />
        </div>

        <button
          onClick={() => {
            setStartDate("");
            setEndDate("");
          }}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: `1px solid ${c.border}`,
            background: c.card,
            color: c.text,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Clear Filters
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <div style={cardStyle}>
          <p style={labelStyle}>Locations</p>
          <p style={valueStyle}>{data.location_count || 0}</p>
          <p style={{ margin: 0, fontSize: 12, color: c.textMuted }}>
            Known locations in this region
          </p>
        </div>

        <div style={cardStyle}>
          <p style={labelStyle}>Customers</p>
          <p style={valueStyle}>{data.customer_count || 0}</p>
          <p style={{ margin: 0, fontSize: 12, color: c.textMuted }}>
            Active customers: {data.active_customer_count || 0}
          </p>
        </div>

        <div style={cardStyle}>
          <p style={labelStyle}>Orders</p>
          <p style={valueStyle}>{summary.order_count || 0}</p>
          <p style={{ margin: 0, fontSize: 12, color: c.textMuted }}>
            Completed: {summary.completed_orders || 0} · Pending: {summary.pending_orders || 0}
          </p>
        </div>

        <div style={cardStyle}>
          <p style={labelStyle}>Total Revenue</p>
          <p style={valueStyle}>KES {Number(summary.total_revenue || 0).toLocaleString()}</p>
          <p style={{ margin: 0, fontSize: 12, color: c.textMuted }}>
            Paid orders: {summary.paid_orders || 0}
          </p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 18,
          marginBottom: 20,
        }}
      >
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0, marginBottom: 14, color: c.text, fontSize: 18 }}>
            Daily Breakdown
          </h3>

          {data.daily_breakdown?.length ? (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${c.border}` }}>
                  <th style={{ textAlign: "left", padding: "10px 8px", fontSize: 12, color: c.textMuted }}>
                    Date
                  </th>
                  <th style={{ textAlign: "center", padding: "10px 8px", fontSize: 12, color: c.textMuted }}>
                    Orders
                  </th>
                  <th style={{ textAlign: "right", padding: "10px 8px", fontSize: 12, color: c.textMuted }}>
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.daily_breakdown.map((row) => (
                  <tr key={row.order_date} style={{ borderBottom: `1px solid ${c.borderLight}` }}>
                    <td style={{ padding: "10px 8px", color: c.text }}>
                      {row.order_date}
                    </td>
                    <td style={{ padding: "10px 8px", textAlign: "center", color: c.textMuted }}>
                      {row.order_count}
                    </td>
                    <td style={{ padding: "10px 8px", textAlign: "right", color: c.text, fontWeight: 700 }}>
                      KES {Number(row.total_revenue || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ color: c.textMuted }}>No orders found for this date range.</div>
          )}
        </div>

        <div style={cardStyle}>
          <h3 style={{ marginTop: 0, marginBottom: 14, color: c.text, fontSize: 18 }}>
            Sales Rep Performance
          </h3>

          {data.sales_rep_breakdown?.length ? (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${c.border}` }}>
                  <th style={{ textAlign: "left", padding: "10px 8px", fontSize: 12, color: c.textMuted }}>
                    Sales Rep
                  </th>
                  <th style={{ textAlign: "center", padding: "10px 8px", fontSize: 12, color: c.textMuted }}>
                    Orders
                  </th>
                  <th style={{ textAlign: "right", padding: "10px 8px", fontSize: 12, color: c.textMuted }}>
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.sales_rep_breakdown.map((row, index) => (
                  <tr key={`${row.sales_rep_id || "unassigned"}-${index}`} style={{ borderBottom: `1px solid ${c.borderLight}` }}>
                    <td style={{ padding: "10px 8px", color: c.text, fontWeight: 600 }}>
                      {row.sales_rep_name || "Unassigned"}
                    </td>
                    <td style={{ padding: "10px 8px", textAlign: "center", color: c.textMuted }}>
                      {row.order_count}
                    </td>
                    <td style={{ padding: "10px 8px", textAlign: "right", color: c.text, fontWeight: 700 }}>
                      KES {Number(row.total_revenue || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ color: c.textMuted }}>No sales rep activity found for this date range.</div>
          )}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          gap: 18,
          marginBottom: 20,
        }}
      >
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0, marginBottom: 14, color: c.text, fontSize: 18 }}>
            Customers in this Region
          </h3>

          {data.customers?.length ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${c.border}` }}>
                    <th style={{ textAlign: "left", padding: "10px 8px", fontSize: 12, color: c.textMuted }}>Customer</th>
                    <th style={{ textAlign: "left", padding: "10px 8px", fontSize: 12, color: c.textMuted }}>Phone</th>
                    <th style={{ textAlign: "left", padding: "10px 8px", fontSize: 12, color: c.textMuted }}>Type</th>
                    <th style={{ textAlign: "left", padding: "10px 8px", fontSize: 12, color: c.textMuted }}>Location</th>
                    <th style={{ textAlign: "left", padding: "10px 8px", fontSize: 12, color: c.textMuted }}>Assigned Rep</th>
                    <th style={{ textAlign: "center", padding: "10px 8px", fontSize: 12, color: c.textMuted }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.customers.map((customer) => (
                    <tr key={customer.id} style={{ borderBottom: `1px solid ${c.borderLight}` }}>
                      <td style={{ padding: "10px 8px", color: c.text, fontWeight: 600 }}>{customer.name}</td>
                      <td style={{ padding: "10px 8px", color: c.textMuted }}>{customer.phone || "—"}</td>
                      <td style={{ padding: "10px 8px", color: c.textMuted }}>{formatCustomerType(customer.customer_type)}</td>
                      <td style={{ padding: "10px 8px", color: c.textMuted }}>{customer.location_name || "—"}</td>
                      <td style={{ padding: "10px 8px", color: c.textMuted }}>{customer.sales_rep_name || "—"}</td>
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
                                  ? "rgba(34, 197, 94, 0.18)"
                                  : "rgba(34, 197, 94, 0.12)"
                                : isDark
                                ? "rgba(239, 68, 68, 0.18)"
                                : "rgba(239, 68, 68, 0.12)",
                            color: customer.is_active ? "#16a34a" : "#dc2626",
                          }}
                        >
                          {customer.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ color: c.textMuted }}>No customers found in this region.</div>
          )}
        </div>

        <div style={cardStyle}>
          <h3 style={{ marginTop: 0, marginBottom: 14, color: c.text, fontSize: 18 }}>
            Locations
          </h3>

          {data.locations?.length ? (
            <div style={{ display: "grid", gap: 10 }}>
              {data.locations.map((location) => (
                <div
                  key={location.id}
                  style={{
                    border: `1px solid ${c.border}`,
                    borderRadius: 10,
                    padding: 12,
                    background: isDark ? "rgba(255,255,255,0.02)" : "#fafafa",
                  }}
                >
                  <div style={{ fontWeight: 700, color: c.text }}>{location.name}</div>
                  <div style={{ fontSize: 12, color: c.textMuted, marginTop: 4 }}>
                    Customers: {location.customer_count || 0}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: c.textMuted }}>No locations found for this region.</div>
          )}
        </div>
      </div>

      <div style={cardStyle}>
        <h3 style={{ marginTop: 0, marginBottom: 14, color: c.text, fontSize: 18 }}>
          Orders in this Region
        </h3>

        {data.orders?.length ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1080 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${c.border}` }}>
                  <th style={{ textAlign: "left", padding: "10px 8px", fontSize: 12, color: c.textMuted }}>Order No</th>
                  <th style={{ textAlign: "left", padding: "10px 8px", fontSize: 12, color: c.textMuted }}>Customer</th>
                  <th style={{ textAlign: "left", padding: "10px 8px", fontSize: 12, color: c.textMuted }}>Location</th>
                  <th style={{ textAlign: "left", padding: "10px 8px", fontSize: 12, color: c.textMuted }}>Sales Rep</th>
                  <th style={{ textAlign: "right", padding: "10px 8px", fontSize: 12, color: c.textMuted }}>Amount</th>
                  <th style={{ textAlign: "center", padding: "10px 8px", fontSize: 12, color: c.textMuted }}>Order Status</th>
                  <th style={{ textAlign: "center", padding: "10px 8px", fontSize: 12, color: c.textMuted }}>Payment</th>
                  <th style={{ textAlign: "center", padding: "10px 8px", fontSize: 12, color: c.textMuted }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.orders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: `1px solid ${c.borderLight}` }}>
                    <td style={{ padding: "10px 8px", color: c.text, fontWeight: 700 }}>
                      {order.order_number}
                    </td>
                    <td style={{ padding: "10px 8px", color: c.textMuted }}>
                      {order.customer_name}
                    </td>
                    <td style={{ padding: "10px 8px", color: c.textMuted }}>
                      {order.location_name || "—"}
                    </td>
                    <td style={{ padding: "10px 8px", color: c.textMuted }}>
                      {order.sales_rep_name || "Unassigned"}
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
                              ? "rgba(239, 68, 68, 0.18)"
                              : "rgba(239, 68, 68, 0.12)",
                          color: order.payment_status === "completed" ? "#16a34a" : "#dc2626",
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
                          onClick={() => handlePrintOrder(order.id)}
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
          <div style={{ color: c.textMuted }}>No orders found for this region and date range.</div>
        )}
      </div>
    </div>
  );
}

