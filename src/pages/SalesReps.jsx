import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { getThemeColors } from "../utils/themeColors";
import {
  listSalesReps,
  createSalesRep,
  updateSalesRep,
  deleteSalesRep,
} from "../api/salesReps";

function SummaryCard({ title, value, subtitle, c, isDark }) {
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
      <div style={{ fontSize: 12, color: c.textMuted, fontWeight: 700, marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: c.text, lineHeight: 1 }}>
        {value}
      </div>
      <div
        style={{
          fontSize: 12,
          marginTop: 8,
          color: isDark ? "#94a3b8" : "#64748b",
        }}
      >
        {subtitle}
      </div>
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
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getFreshness(recordedAt) {
  if (!recordedAt) {
    return { label: "No location", tone: "neutral" };
  }

  const diffMinutes = (Date.now() - new Date(recordedAt).getTime()) / 60000;

  if (diffMinutes < 2) return { label: "Live", tone: "success" };
  if (diffMinutes < 10) return { label: "Stale", tone: "warning" };
  return { label: "Offline", tone: "danger" };
}

function getBadgeStyles(tone, isDark) {
  if (tone === "success") {
    return {
      background: isDark ? "rgba(16, 185, 129, 0.2)" : "#d4edda",
      color: isDark ? "#4ade80" : "#155724",
    };
  }

  if (tone === "warning") {
    return {
      background: isDark ? "rgba(245, 158, 11, 0.2)" : "#fff3cd",
      color: isDark ? "#fbbf24" : "#856404",
    };
  }

  if (tone === "danger") {
    return {
      background: isDark ? "rgba(220, 53, 69, 0.2)" : "#f8d7da",
      color: isDark ? "#ff6b6b" : "#721c24",
    };
  }

  return {
    background: isDark ? "rgba(148, 163, 184, 0.2)" : "#eef2f7",
    color: isDark ? "#cbd5e1" : "#475569",
  };
}

export default function SalesReps() {
  const { isDark } = useTheme();
  const c = getThemeColors(isDark);
  const nav = useNavigate();

  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    phone_number: "",
    email: "",
    status: "active",
  });

  async function loadData() {
    setErr("");
    setLoading(true);
    try {
      const data = await listSalesReps();
      setRows(Array.isArray(data.data || data) ? data.data || data : []);
    } catch (e) {
      setErr(e?.message || "Failed to load sales reps");
      console.error("Load error:", e);
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!form.name.trim()) return setErr("Name is required");

    try {
      const payload = {
        name: form.name.trim(),
        phone_number: form.phone_number.trim() || null,
        email: form.email.trim() || null,
        status: form.status,
      };

      if (editId) {
        await updateSalesRep(editId, payload);
      } else {
        await createSalesRep(payload);
      }

      setForm({
        name: "",
        phone_number: "",
        email: "",
        status: "active",
      });
      setEditId(null);
      setShowForm(false);
      await loadData();
    } catch (e) {
      setErr(e?.message || "Failed to save sales rep");
      console.error("Submit error:", e);
    }
  }

  async function onDelete(id) {
    if (!window.confirm("Delete this sales rep?")) return;

    try {
      await deleteSalesRep(id);
      await loadData();
    } catch (e) {
      setErr(e?.message || "Failed to delete sales rep");
      console.error("Delete error:", e);
    }
  }

  function onEdit(rep) {
    setEditId(rep.id);
    setForm({
      name: rep.name,
      phone_number: rep.phone_number || "",
      email: rep.email || "",
      status: rep.status || "active",
    });
    setShowForm(true);
  }

  const summary = useMemo(() => {
    const totalReps = rows.length;
    const activeReps = rows.filter((r) => r.status === "active").length;
    const totalOrders = rows.reduce((sum, r) => sum + Number(r.order_count || 0), 0);
    const totalSales = rows.reduce((sum, r) => sum + Number(r.total_sales || 0), 0);
    const liveTracked = rows.filter((r) => getFreshness(r.latest_location_recorded_at).label === "Live").length;

    return {
      totalReps,
      activeReps,
      totalOrders,
      totalSales,
      liveTracked,
    };
  }, [rows]);

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 30000);
    return () => clearInterval(timer);
  }, []);

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
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              marginTop: 0,
              marginBottom: 5,
              fontSize: 28,
              fontWeight: 700,
              color: c.text,
            }}
          >
            👤 Sales Representatives
          </h1>
          <p style={{ margin: 0, color: c.textMuted, fontSize: 13 }}>
            Performance dashboard with latest location status
          </p>
        </div>

        <button
          onClick={() => nav("/sales-reps/live-map")}
          style={{
            padding: "10px 16px",
            background: "#0ea5e9",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          🛰️ Open Live Map
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <SummaryCard title="Total Sales Reps" value={summary.totalReps} subtitle="All reps in the system" c={c} isDark={isDark} />
        <SummaryCard title="Active Reps" value={summary.activeReps} subtitle="Currently active reps" c={c} isDark={isDark} />
        <SummaryCard title="Total Orders" value={summary.totalOrders} subtitle="Orders taken by all reps" c={c} isDark={isDark} />
        <SummaryCard title="Total Sales" value={formatCurrency(summary.totalSales)} subtitle="Combined value of rep orders" c={c} isDark={isDark} />
        <SummaryCard title="Live Tracked" value={summary.liveTracked} subtitle="Updated within 2 minutes" c={c} isDark={isDark} />
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

      <div style={{ marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditId(null);
            setForm({
              name: "",
              phone_number: "",
              email: "",
              status: "active",
            });
          }}
          style={{
            padding: "10px 20px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            transition: "all 0.2s",
          }}
        >
          {showForm ? "Cancel" : "+ New Sales Rep"}
        </button>

        <button
          onClick={loadData}
          style={{
            padding: "10px 20px",
            background: c.buttonBg,
            color: c.text,
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Refresh
        </button>
      </div>

      {showForm && (
        <div
          style={{
            background: c.card,
            padding: 20,
            borderRadius: 8,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            marginBottom: 20,
            border: `1px solid ${c.border}`,
          }}
        >
          <form onSubmit={onSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr 1fr",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: c.textMuted, marginBottom: 6 }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., John Smith"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: `1px solid ${c.border}`,
                    borderRadius: 6,
                    fontSize: 13,
                    boxSizing: "border-box",
                    background: c.inputBg,
                    color: c.text,
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: c.textMuted, marginBottom: 6 }}>
                  Phone
                </label>
                <input
                  type="text"
                  value={form.phone_number}
                  onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                  placeholder="e.g., +254712345678"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: `1px solid ${c.border}`,
                    borderRadius: 6,
                    fontSize: 13,
                    boxSizing: "border-box",
                    background: c.inputBg,
                    color: c.text,
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: c.textMuted, marginBottom: 6 }}>
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="e.g., john@example.com"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: `1px solid ${c.border}`,
                    borderRadius: 6,
                    fontSize: 13,
                    boxSizing: "border-box",
                    background: c.inputBg,
                    color: c.text,
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: c.textMuted, marginBottom: 6 }}>
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: `1px solid ${c.border}`,
                    borderRadius: 6,
                    fontSize: 13,
                    boxSizing: "border-box",
                    cursor: "pointer",
                    background: c.inputBg,
                    color: c.text,
                  }}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="submit"
                style={{
                  padding: "10px 20px",
                  background: "#667eea",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {editId ? "Update" : "Create"}
              </button>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{
                  padding: "10px 20px",
                  background: c.buttonBg,
                  color: c.text,
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {rows.length === 0 && !loading && (
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
          👤 No sales reps found
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
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1550 }}>
            <thead>
              <tr style={{ background: c.headerBg, borderBottom: `1px solid ${c.border}` }}>
                <th style={{ padding: 12, textAlign: "left", fontSize: 12, fontWeight: 700, color: c.textMuted }}>Name</th>
                <th style={{ padding: 12, textAlign: "left", fontSize: 12, fontWeight: 700, color: c.textMuted }}>Phone</th>
                <th style={{ padding: 12, textAlign: "left", fontSize: 12, fontWeight: 700, color: c.textMuted }}>Email</th>
                <th style={{ padding: 12, textAlign: "center", fontSize: 12, fontWeight: 700, color: c.textMuted }}>Unique Customers Served</th>
                <th style={{ padding: 12, textAlign: "center", fontSize: 12, fontWeight: 700, color: c.textMuted }}>Orders</th>
                <th style={{ padding: 12, textAlign: "right", fontSize: 12, fontWeight: 700, color: c.textMuted }}>Avg Order</th>
                <th style={{ padding: 12, textAlign: "right", fontSize: 12, fontWeight: 700, color: c.textMuted }}>Total Sales</th>
                <th style={{ padding: 12, textAlign: "center", fontSize: 12, fontWeight: 700, color: c.textMuted }}>Last Order</th>
                <th style={{ padding: 12, textAlign: "center", fontSize: 12, fontWeight: 700, color: c.textMuted }}>Location Status</th>
                <th style={{ padding: 12, textAlign: "center", fontSize: 12, fontWeight: 700, color: c.textMuted }}>Last Location Update</th>
                <th style={{ padding: 12, textAlign: "left", fontSize: 12, fontWeight: 700, color: c.textMuted }}>Status</th>
                <th style={{ padding: 12, textAlign: "center", fontSize: 12, fontWeight: 700, color: c.textMuted }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((rep, idx) => {
                const freshness = getFreshness(rep.latest_location_recorded_at);
                const badge = getBadgeStyles(freshness.tone, isDark);

                return (
                  <tr
                    key={rep.id}
                    style={{
                      borderBottom: `1px solid ${c.borderLight}`,
                      background: idx % 2 === 0 ? c.rowBg1 : c.rowBg2,
                    }}
                  >
                    <td
                      onClick={() => nav(`/sales-reps/${rep.id}`)}
                      style={{
                        padding: 12,
                        fontSize: 13,
                        color: "#667eea",
                        fontWeight: 700,
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                      title="Open sales rep details"
                    >
                      {rep.name}
                    </td>

                    <td style={{ padding: 12, fontSize: 13, color: c.textMuted }}>
                      {rep.phone_number || "N/A"}
                    </td>

                    <td style={{ padding: 12, fontSize: 13, color: c.textMuted }}>
                      {rep.email || "N/A"}
                    </td>

                    <td style={{ padding: 12, fontSize: 13, textAlign: "center" }}>
                      <span
                        style={{
                          background: isDark ? "rgba(102, 126, 234, 0.2)" : "#e3f2fd",
                          color: "#667eea",
                          padding: "4px 8px",
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {rep.customer_count || 0} served
                      </span>
                    </td>

                    <td style={{ padding: 12, fontSize: 13, textAlign: "center" }}>
                      <span
                        style={{
                          background: isDark ? "rgba(245, 158, 11, 0.2)" : "#fff8e1",
                          color: isDark ? "#fbbf24" : "#d97706",
                          padding: "4px 8px",
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {rep.order_count || 0} orders
                      </span>
                    </td>

                    <td style={{ padding: 12, fontSize: 13, color: c.text, fontWeight: 700, textAlign: "right" }}>
                      {formatCurrency(rep.avg_order_value || 0)}
                    </td>

                    <td style={{ padding: 12, fontSize: 13, color: c.text, fontWeight: 700, textAlign: "right" }}>
                      {formatCurrency(rep.total_sales || 0)}
                    </td>

                    <td style={{ padding: 12, fontSize: 13, color: c.textMuted, textAlign: "center" }}>
                      {formatDate(rep.last_order_date)}
                    </td>

                    <td style={{ padding: 12, fontSize: 13, textAlign: "center" }}>
                      <span
                        style={{
                          ...badge,
                          padding: "4px 8px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {freshness.label}
                      </span>
                    </td>

                    <td style={{ padding: 12, fontSize: 12, color: c.textMuted, textAlign: "center" }}>
                      {formatDateTime(rep.latest_location_recorded_at)}
                    </td>

                    <td style={{ padding: 12, fontSize: 13, color: c.textMuted }}>
                      <span
                        style={{
                          background:
                            rep.status === "active"
                              ? isDark
                                ? "rgba(16, 185, 129, 0.2)"
                                : "#e8f5e9"
                              : isDark
                              ? "rgba(220, 53, 69, 0.2)"
                              : "#ffebee",
                          color:
                            rep.status === "active"
                              ? isDark
                                ? "#4ade80"
                                : "#28a745"
                              : isDark
                              ? "#ff6b6b"
                                : "#dc3545",
                          padding: "4px 8px",
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {rep.status === "active" ? "✅" : "❌"} {rep.status}
                      </span>
                    </td>

                    <td style={{ padding: 12, textAlign: "center" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                        <button
                          onClick={() => nav(`/sales-reps/${rep.id}`)}
                          style={{
                            padding: "5px 10px",
                            background: "#0ea5e9",
                            color: "white",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                          title="View orders and performance"
                        >
                          👁️
                        </button>

                        <button
                          onClick={() => nav(`/sales-reps/${rep.id}/track`)}
                          style={{
                            padding: "5px 10px",
                            background: "#16a34a",
                            color: "white",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                          title="Track sales rep"
                        >
                          📍
                        </button>

                        <button
                          onClick={() => onEdit(rep)}
                          style={{
                            padding: "5px 10px",
                            background: "#667eea",
                            color: "white",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                          title="Edit sales rep"
                        >
                          ✏️
                        </button>

                        <button
                          onClick={() => onDelete(rep.id)}
                          style={{
                            padding: "5px 10px",
                            background: "#dc3545",
                            color: "white",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                          title="Delete sales rep"
                        >
                          🗑️
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
