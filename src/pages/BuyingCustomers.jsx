import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { listBuyingCustomers } from "../api/buyingCustomers";

function SummaryCard({ title, value, subtitle, c, isDark }) {
  return (
    <div
      style={{
        background: c.card,
        borderRadius: 10,
        padding: 16,
        border: `1px solid ${c.border}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: c.muted, marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: c.text, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, marginTop: 8, color: isDark ? "#94a3b8" : "#64748b" }}>
        {subtitle}
      </div>
    </div>
  );
}

export default function BuyingCustomers() {
  const { isDark } = useTheme();
  const nav = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const colors = {
    light: {
      bg: "#f8f9fa",
      card: "#ffffff",
      text: "#1a1a1a",
      border: "#e5e7eb",
      muted: "#666",
      headerBg: "#f8f9fa",
      rowAlt: "#fafafa",
      inputBg: "#ffffff",
      buttonBg: "#f1f5f9",
    },
    dark: {
      bg: "#0f172a",
      card: "#1e293b",
      text: "#f1f5f9",
      border: "#334155",
      muted: "#94a3b8",
      headerBg: "#0f172a",
      rowAlt: "#1a2536",
      inputBg: "#0f172a",
      buttonBg: "#334155",
    },
  };

  const c = isDark ? colors.dark : colors.light;

  async function loadCustomers() {
    setErr("");
    setLoading(true);

    try {
      const data = await listBuyingCustomers();
      const rows = Array.isArray(data.data) ? data.data : [];
      setCustomers(rows);
      setFilteredRows(rows);
    } catch (e) {
      console.error("Error loading buying customers:", e);
      setErr(e?.message || "Failed to load buying customers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    const q = search.trim().toLowerCase();

    if (!q) {
      setFilteredRows(customers);
      return;
    }

    setFilteredRows(
      customers.filter((customer) => {
        return (
          String(customer.name || "").toLowerCase().includes(q) ||
          String(customer.email || "").toLowerCase().includes(q) ||
          String(customer.phone || "").toLowerCase().includes(q)
        );
      })
    );
  }, [search, customers]);

  const summary = useMemo(() => {
    const totalCustomers = filteredRows.length;
    const totalOrders = filteredRows.reduce(
      (sum, customer) => sum + Number(customer.orders_count || 0),
      0
    );
    const totalRevenue = filteredRows.reduce(
      (sum, customer) => sum + Number(customer.total_spent || 0),
      0
    );
    const activeBuyers = filteredRows.filter(
      (customer) => Number(customer.orders_count || 0) > 0
    ).length;

    return {
      totalCustomers,
      totalOrders,
      totalRevenue,
      activeBuyers,
    };
  }, [filteredRows]);

  return (
    <div style={{ background: c.bg, minHeight: "100vh", padding: "20px" }}>
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              margin: "0 0 5px 0",
              fontSize: "28px",
              fontWeight: 700,
              color: c.text,
            }}
          >
            💰 Buying Customers
          </h1>
          <p style={{ margin: 0, color: c.muted, fontSize: "14px" }}>
            Direct normal customers captured through the normal purchase flow
          </p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <SummaryCard
          title="Total Buying Customers"
          value={summary.totalCustomers}
          subtitle="Normal customers only"
          c={c}
          isDark={isDark}
        />
        <SummaryCard
          title="Total Orders"
          value={summary.totalOrders}
          subtitle="Normal order count"
          c={c}
          isDark={isDark}
        />
        <SummaryCard
          title="Total Revenue"
          value={`KES ${summary.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
          subtitle="Total spent by direct buyers"
          c={c}
          isDark={isDark}
        />
        <SummaryCard
          title="Active Buyers"
          value={summary.activeBuyers}
          subtitle="Customers with at least one order"
          c={c}
          isDark={isDark}
        />
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

      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search buying customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            border: `1px solid ${c.border}`,
            borderRadius: 8,
            fontSize: 13,
            background: c.inputBg,
            color: c.text,
          }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: c.muted }}>
          Loading...
        </div>
      ) : (
        <div
          style={{
            background: c.card,
            borderRadius: 10,
            padding: 20,
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            border: `1px solid ${c.border}`,
            overflowX: "auto",
          }}
        >
          {filteredRows.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: c.muted }}>
              No buying customers found
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 1100 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${c.border}`, background: c.headerBg }}>
                  <th style={{ padding: 12, textAlign: "left", fontWeight: 700, color: c.muted }}>Name</th>
                  <th style={{ padding: 12, textAlign: "left", fontWeight: 700, color: c.muted }}>Email</th>
                  <th style={{ padding: 12, textAlign: "left", fontWeight: 700, color: c.muted }}>Phone</th>
                  <th style={{ padding: 12, textAlign: "center", fontWeight: 700, color: c.muted }}>Orders</th>
                  <th style={{ padding: 12, textAlign: "right", fontWeight: 700, color: c.muted }}>Total Spent</th>
                  <th style={{ padding: 12, textAlign: "center", fontWeight: 700, color: c.muted }}>Paid Orders</th>
                  <th style={{ padding: 12, textAlign: "center", fontWeight: 700, color: c.muted }}>Pending</th>
                  <th style={{ padding: 12, textAlign: "center", fontWeight: 700, color: c.muted }}>Last Order</th>
                  <th style={{ padding: 12, textAlign: "center", fontWeight: 700, color: c.muted }}>Registered</th>
                  <th style={{ padding: 12, textAlign: "left", fontWeight: 700, color: c.muted }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((customer, idx) => (
                  <tr
                    key={customer.id}
                    style={{
                      borderBottom: `1px solid ${c.border}`,
                      background: idx % 2 === 0 ? "transparent" : c.rowAlt,
                    }}
                  >
                    <td
                      style={{
                        padding: 12,
                        color: "#667eea",
                        fontWeight: 700,
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                      onClick={() => nav(`/customers/${customer.id}`)}
                    >
                      {customer.name}
                    </td>

                    <td style={{ padding: 12, color: c.muted }}>
                      {customer.email || "—"}
                    </td>

                    <td style={{ padding: 12, color: c.text }}>
                      {customer.phone || "—"}
                    </td>

                    <td style={{ padding: 12, textAlign: "center" }}>
                      <button
                        onClick={() => nav(`/orders?customer=${customer.id}`)}
                        style={{
                          background: isDark ? "rgba(14,165,233,0.18)" : "#e0f2fe",
                          color: "#0284c7",
                          padding: "4px 8px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          border: "none",
                          cursor: "pointer",
                        }}
                        title="View customer orders"
                      >
                        {customer.orders_count || 0}
                      </button>
                    </td>

                    <td style={{ padding: 12, textAlign: "right", color: c.text, fontWeight: 700 }}>
                      KES {parseFloat(customer.total_spent || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </td>

                    <td style={{ padding: 12, textAlign: "center", color: c.text }}>
                      {customer.paid_orders || 0}
                    </td>

                    <td style={{ padding: 12, textAlign: "center", color: c.text }}>
                      {customer.pending_payment_orders || 0}
                    </td>

                    <td style={{ padding: 12, textAlign: "center", color: c.muted, fontSize: 12 }}>
                      {customer.last_order_date
                        ? new Date(customer.last_order_date).toLocaleDateString()
                        : "—"}
                    </td>

                    <td style={{ padding: 12, textAlign: "center", color: c.muted, fontSize: 12 }}>
                      {new Date(customer.created_at).toLocaleDateString()}
                    </td>

                    <td style={{ padding: 12 }}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          onClick={() => nav(`/customers/${customer.id}`)}
                          style={{
                            padding: "6px 12px",
                            background: "#667eea",
                            color: "white",
                            border: "none",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          View
                        </button>

                        <button
                          onClick={() => nav(`/orders?customer=${customer.id}`)}
                          style={{
                            padding: "6px 12px",
                            background: "#16a34a",
                            color: "white",
                            border: "none",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          View Orders
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

