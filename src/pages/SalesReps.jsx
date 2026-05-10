import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { getThemeColors } from "../utils/themeColors";
import {
  listSalesReps,
  createSalesRep,
  updateSalesRep,
  deleteSalesRep,
  resetSalesRepPassword,
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone_number: "",
    email: "",
    username: "",
    route_area: "",
    status: "active",
  });

  // Ephemeral temp-credentials display — never stored in localStorage/sessionStorage
  const [tempCredentials, setTempCredentials] = useState(null);
  // { action: 'created'|'reset', repName, username, temporary_password, handling_warning }

  // Reset password modal
  const [resetTarget, setResetTarget] = useState(null);
  // { id, name }
  const [resetLoading, setResetLoading] = useState(false);
  const [resetErr, setResetErr] = useState("");

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
      // Both full_name/name and phone/phone_number are sent to support the backend migration
      // period where the new columns (full_name, phone) coexist with legacy (name, phone_number).
      const payload = {
        full_name: form.name.trim(),
        name: form.name.trim(),
        phone_number: form.phone_number.trim() || null,
        phone: form.phone_number.trim() || null,
        email: form.email.trim() || null,
        username: form.username.trim() || null,
        route_area: form.route_area.trim() || null,
        status: form.status,
        is_active: form.status === "active",
      };

      if (editId) {
        await updateSalesRep(editId, payload);
      } else {
        const result = await createSalesRep(payload);
        // Backend returns { sales_rep, credentials } — show credentials once ephemerally
        const creds = result?.data?.credentials || result?.credentials;
        if (creds?.temporary_password) {
          setTempCredentials({
            action: "created",
            repName: form.name.trim(),
            username: creds.username,
            temporary_password: creds.temporary_password,
            handling_warning: creds.handling_warning,
          });
        }
      }

      setForm({
        name: "",
        phone_number: "",
        email: "",
        username: "",
        route_area: "",
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
      name: rep.full_name || rep.name || "",
      phone_number: rep.phone || rep.phone_number || "",
      email: rep.email || "",
      username: rep.username || "",
      route_area: rep.route_area || "",
      status: rep.status || (rep.is_active ? "active" : "inactive"),
    });
    setShowForm(true);
  }

  async function onResetPassword(rep) {
    setResetTarget({ id: rep.id, name: rep.full_name || rep.name });
    setResetErr("");
  }

  async function confirmResetPassword() {
    if (!resetTarget) return;
    setResetLoading(true);
    setResetErr("");
    try {
      const result = await resetSalesRepPassword(resetTarget.id);
      const creds = result?.data?.credentials || result?.credentials;
      setResetTarget(null);
      if (creds?.temporary_password) {
        setTempCredentials({
          action: "reset",
          repName: resetTarget.name,
          username: creds.username,
          temporary_password: creds.temporary_password,
          handling_warning: creds.handling_warning,
        });
      }
      await loadData();
    } catch (e) {
      setResetErr(e?.message || "Failed to reset password");
    } finally {
      setResetLoading(false);
    }
  }

  const summary = useMemo(() => {
    const totalReps = rows.length;
    const activeReps = rows.filter((r) => r.is_active || r.status === "active").length;
    const totalOrders = rows.reduce((sum, r) => sum + Number(r.order_count || 0), 0);
    const totalSales = rows.reduce((sum, r) => sum + Number(r.total_sales || 0), 0);
    const liveTracked = rows.filter((r) => getFreshness(r.latest_location_recorded_at).label === "Live").length;
    const mustChangePwd = rows.filter((r) => r.must_change_password).length;

    return {
      totalReps,
      activeReps,
      totalOrders,
      totalSales,
      liveTracked,
      mustChangePwd,
    };
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((rep) => {
      const isActive = rep.is_active || rep.status === "active";
      if (statusFilter === "active" && !isActive) return false;
      if (statusFilter === "inactive" && isActive) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const inName = (rep.full_name || rep.name || "").toLowerCase().includes(q);
        const inPhone = (rep.phone || rep.phone_number || "").toLowerCase().includes(q);
        const inEmail = (rep.email || "").toLowerCase().includes(q);
        const inUsername = (rep.username || "").toLowerCase().includes(q);
        const inRouteArea = (rep.route_area || "").toLowerCase().includes(q);
        if (!inName && !inPhone && !inEmail && !inUsername && !inRouteArea) return false;
      }
      return true;
    });
  }, [rows, search, statusFilter]);

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
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <SummaryCard title="Total Sales Reps" value={summary.totalReps} subtitle="All reps in the system" c={c} isDark={isDark} />
        <SummaryCard title="Active Reps" value={summary.activeReps} subtitle="Currently active reps" c={c} isDark={isDark} />
        <SummaryCard title="Total Orders" value={summary.totalOrders} subtitle="Orders taken by all reps" c={c} isDark={isDark} />
        <SummaryCard title="Total Sales" value={formatCurrency(summary.totalSales)} subtitle="Combined value of rep orders" c={c} isDark={isDark} />
        <SummaryCard title="Live Tracked" value={summary.liveTracked} subtitle="Updated within 2 minutes" c={c} isDark={isDark} />
        <SummaryCard title="Must Change Password" value={summary.mustChangePwd} subtitle="Pending first login" c={c} isDark={isDark} />
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

      <div style={{ marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditId(null);
            setForm({
              name: "",
              phone_number: "",
              email: "",
              username: "",
              route_area: "",
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

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, email..."
          style={{
            padding: "10px 14px",
            borderRadius: 6,
            border: `1px solid ${c.border}`,
            background: c.inputBg,
            color: c.text,
            fontSize: 13,
            minWidth: 220,
          }}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: "10px 14px",
            borderRadius: 6,
            border: `1px solid ${c.border}`,
            background: c.inputBg,
            color: c.text,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          <option value="">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>

        {(search || statusFilter) && (
          <button
            onClick={() => { setSearch(""); setStatusFilter(""); }}
            style={{
              padding: "10px 14px",
              background: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Clear Filters
          </button>
        )}
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
          <h3 style={{ margin: "0 0 14px 0", fontSize: 15, fontWeight: 700, color: c.text }}>
            {editId ? "Edit Sales Rep" : "Create New Sales Rep"}
          </h3>
          {!editId && (
            <div
              style={{
                marginBottom: 14,
                padding: "10px 14px",
                background: isDark ? "rgba(245, 158, 11, 0.1)" : "#fffbeb",
                border: `1px solid ${isDark ? "rgba(245, 158, 11, 0.3)" : "#fde68a"}`,
                borderRadius: 6,
                fontSize: 12,
                color: isDark ? "#fbbf24" : "#92400e",
              }}
            >
              🔑 A temporary password will be generated automatically. It will be shown once after creation — copy and share it securely with the rep.
            </div>
          )}
          <form onSubmit={onSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: c.textMuted, marginBottom: 6 }}>
                  Full Name *
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
                  Username (login)
                </label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="e.g., john.smith"
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
                  Route Area
                </label>
                <input
                  type="text"
                  value={form.route_area}
                  onChange={(e) => setForm({ ...form, route_area: e.target.value })}
                  placeholder="e.g., Westlands, CBD"
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

      {filteredRows.length === 0 && !loading && (
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
          👤 {rows.length === 0 ? "No sales reps found" : "No reps match your filters"}
        </div>
      )}

      {filteredRows.length > 0 && (
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
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1900 }}>
            <thead>
              <tr style={{ background: c.headerBg, borderBottom: `1px solid ${c.border}` }}>
                <th style={{ padding: 12, textAlign: "left", fontSize: 12, fontWeight: 700, color: c.textMuted }}>Name</th>
                <th style={{ padding: 12, textAlign: "left", fontSize: 12, fontWeight: 700, color: c.textMuted }}>Username / Email</th>
                <th style={{ padding: 12, textAlign: "left", fontSize: 12, fontWeight: 700, color: c.textMuted }}>Phone</th>
                <th style={{ padding: 12, textAlign: "left", fontSize: 12, fontWeight: 700, color: c.textMuted }}>Route Area</th>
                <th style={{ padding: 12, textAlign: "center", fontSize: 12, fontWeight: 700, color: c.textMuted }}>Status</th>
                <th style={{ padding: 12, textAlign: "center", fontSize: 12, fontWeight: 700, color: c.textMuted }}>Pwd Change</th>
                <th style={{ padding: 12, textAlign: "center", fontSize: 12, fontWeight: 700, color: c.textMuted }}>Last Login</th>
                <th style={{ padding: 12, textAlign: "center", fontSize: 12, fontWeight: 700, color: c.textMuted }}>Location</th>
                <th style={{ padding: 12, textAlign: "center", fontSize: 12, fontWeight: 700, color: c.textMuted }}>Last Location</th>
                <th style={{ padding: 12, textAlign: "center", fontSize: 12, fontWeight: 700, color: c.textMuted }}>Orders</th>
                <th style={{ padding: 12, textAlign: "right", fontSize: 12, fontWeight: 700, color: c.textMuted }}>Total Sales</th>
                <th style={{ padding: 12, textAlign: "center", fontSize: 12, fontWeight: 700, color: c.textMuted }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((rep, idx) => {
                const freshness = getFreshness(rep.latest_location_recorded_at);
                const badge = getBadgeStyles(freshness.tone, isDark);
                const isActive = rep.is_active || rep.status === "active";

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
                      {rep.full_name || rep.name}
                    </td>

                    <td style={{ padding: 12, fontSize: 13, color: c.textMuted }}>
                      <div>{rep.username || "—"}</div>
                      {rep.email && (
                        <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>{rep.email}</div>
                      )}
                    </td>

                    <td style={{ padding: 12, fontSize: 13, color: c.textMuted }}>
                      {rep.phone || rep.phone_number || "—"}
                    </td>

                    <td style={{ padding: 12, fontSize: 13, color: c.textMuted }}>
                      {rep.route_area || "—"}
                    </td>

                    <td style={{ padding: 12, fontSize: 13, textAlign: "center" }}>
                      <span
                        style={{
                          background: isActive
                            ? isDark ? "rgba(16, 185, 129, 0.2)" : "#e8f5e9"
                            : isDark ? "rgba(220, 53, 69, 0.2)" : "#ffebee",
                          color: isActive
                            ? isDark ? "#4ade80" : "#28a745"
                            : isDark ? "#ff6b6b" : "#dc3545",
                          padding: "4px 8px",
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {isActive ? "✅ Active" : "❌ Inactive"}
                      </span>
                    </td>

                    <td style={{ padding: 12, fontSize: 13, textAlign: "center" }}>
                      {rep.must_change_password ? (
                        <span
                          style={{
                            background: isDark ? "rgba(245, 158, 11, 0.2)" : "#fff3cd",
                            color: isDark ? "#fbbf24" : "#856404",
                            padding: "4px 8px",
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                          title="Rep must change password on next login"
                        >
                          ⚠️ Required
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: c.textMuted }}>—</span>
                      )}
                    </td>

                    <td style={{ padding: 12, fontSize: 12, color: c.textMuted, textAlign: "center" }}>
                      {formatDateTime(rep.last_login_at)}
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
                        {rep.order_count || 0}
                      </span>
                    </td>

                    <td style={{ padding: 12, fontSize: 13, color: c.text, fontWeight: 700, textAlign: "right" }}>
                      {formatCurrency(rep.total_sales || 0)}
                    </td>

                    <td style={{ padding: 12, textAlign: "center" }}>
                      <div style={{ display: "flex", gap: 5, justifyContent: "center", flexWrap: "wrap" }}>
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
                          onClick={() => onResetPassword(rep)}
                          style={{
                            padding: "5px 10px",
                            background: "#f59e0b",
                            color: "white",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                          title="Reset password"
                        >
                          🔑
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

      {/* Reset Password Confirmation Modal */}
      {resetTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              background: c.card,
              border: `1px solid ${c.border}`,
              borderRadius: 12,
              padding: 28,
              maxWidth: 440,
              width: "100%",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ margin: "0 0 10px 0", fontSize: 18, fontWeight: 700, color: c.text }}>
              🔑 Reset Password
            </h3>
            <p style={{ margin: "0 0 16px 0", fontSize: 14, color: c.textMuted }}>
              Reset the password for <strong style={{ color: c.text }}>{resetTarget.name}</strong>?
            </p>
            <p style={{ margin: "0 0 20px 0", fontSize: 13, color: c.textMuted }}>
              A new temporary password will be generated. The rep will be required to change it on next login. The temporary password will be shown once — copy and share it securely.
            </p>
            {resetErr && (
              <div
                style={{
                  marginBottom: 14,
                  padding: "10px 14px",
                  background: isDark ? "rgba(220, 53, 69, 0.1)" : "#fee",
                  color: isDark ? "#ff6b6b" : "#c33",
                  border: `1px solid ${isDark ? "rgba(220, 53, 69, 0.3)" : "#fdd"}`,
                  borderRadius: 6,
                  fontSize: 13,
                }}
              >
                ⚠️ {resetErr}
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={confirmResetPassword}
                disabled={resetLoading}
                style={{
                  padding: "10px 20px",
                  background: resetLoading ? "#aaa" : "#f59e0b",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  cursor: resetLoading ? "not-allowed" : "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {resetLoading ? "Resetting..." : "Reset Password"}
              </button>
              <button
                onClick={() => { setResetTarget(null); setResetErr(""); }}
                disabled={resetLoading}
                style={{
                  padding: "10px 20px",
                  background: c.buttonBg,
                  color: c.text,
                  border: "none",
                  borderRadius: 6,
                  cursor: resetLoading ? "not-allowed" : "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ephemeral Temporary Credentials Modal — never stored, shown once */}
      {tempCredentials && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            zIndex: 1100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              background: c.card,
              border: `2px solid ${isDark ? "#f59e0b" : "#d97706"}`,
              borderRadius: 12,
              padding: 28,
              maxWidth: 520,
              width: "100%",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            }}
          >
            <h3 style={{ margin: "0 0 6px 0", fontSize: 18, fontWeight: 700, color: c.text }}>
              {tempCredentials.action === "created" ? "✅ Sales Rep Created" : "✅ Password Reset"}
            </h3>
            <p style={{ margin: "0 0 16px 0", fontSize: 13, color: c.textMuted }}>
              {tempCredentials.action === "created"
                ? `Rep "${tempCredentials.repName}" was created successfully.`
                : `Password for "${tempCredentials.repName}" was reset successfully.`}
            </p>

            <div
              style={{
                background: isDark ? "rgba(245, 158, 11, 0.1)" : "#fffbeb",
                border: `1px solid ${isDark ? "rgba(245, 158, 11, 0.4)" : "#fde68a"}`,
                borderRadius: 8,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: isDark ? "#fbbf24" : "#92400e", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                🔑 Temporary Credentials — Copy Now
              </div>

              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: c.textMuted, marginBottom: 4 }}>Username / Login</div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: c.text,
                    background: c.inputBg,
                    border: `1px solid ${c.border}`,
                    borderRadius: 6,
                    padding: "8px 12px",
                    fontFamily: "monospace",
                    userSelect: "all",
                  }}
                >
                  {tempCredentials.username || "—"}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: c.textMuted, marginBottom: 4 }}>Temporary Password</div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: isDark ? "#fbbf24" : "#92400e",
                    background: isDark ? "rgba(245, 158, 11, 0.15)" : "#fef9c3",
                    border: `1px solid ${isDark ? "rgba(245, 158, 11, 0.4)" : "#fde047"}`,
                    borderRadius: 6,
                    padding: "10px 14px",
                    fontFamily: "monospace",
                    userSelect: "all",
                    letterSpacing: "0.05em",
                  }}
                >
                  {tempCredentials.temporary_password}
                </div>
              </div>
            </div>

            <div
              style={{
                background: isDark ? "rgba(220, 53, 69, 0.1)" : "#fef2f2",
                border: `1px solid ${isDark ? "rgba(220, 53, 69, 0.3)" : "#fecaca"}`,
                borderRadius: 6,
                padding: "10px 14px",
                marginBottom: 18,
                fontSize: 12,
                color: isDark ? "#ff6b6b" : "#991b1b",
              }}
            >
              ⚠️ <strong>This password is shown only once.</strong> Copy and share it with the rep securely. The rep must change it on their first login. Do not share it via insecure channels.
            </div>

            <button
              onClick={() => setTempCredentials(null)}
              style={{
                width: "100%",
                padding: "12px 20px",
                background: "#667eea",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              I have copied the password — Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
