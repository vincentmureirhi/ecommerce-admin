import React, { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { getThemeColors } from "../utils/themeColors";
import { listAdminUsers } from "../api/adminUsers";

function badgeStyle(status, isDark) {
  const value = String(status || "").toLowerCase();

  if (["active", "enabled"].includes(value)) {
    return {
      background: isDark ? "rgba(16,185,129,0.20)" : "#d1fae5",
      color: isDark ? "#4ade80" : "#047857",
    };
  }

  if (["inactive", "disabled"].includes(value)) {
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

export default function AdminManagement() {
  const { isDark } = useTheme();
  const c = getThemeColors(isDark);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function loadAdmins() {
    try {
      setLoading(true);
      setErr("");

      const res = await listAdminUsers();
      setRows(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      setErr(e?.message || "Failed to load admin users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdmins();
  }, []);

  return (
    <div style={{ background: c.bg, minHeight: "100vh", padding: 20 }}>
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
              margin: "0 0 6px 0",
              fontSize: 30,
              fontWeight: 800,
              color: c.text,
            }}
          >
            👨‍💼 Admin Users
          </h1>
          <p style={{ margin: 0, color: c.textMuted, fontSize: 13 }}>
            View admin and superuser accounts
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.alert("Admin creation flow comes next after listing is stable.")}
          style={{
            padding: "10px 16px",
            border: "none",
            borderRadius: 8,
            background: "#667eea",
            color: "white",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          + New Admin
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
          {err}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <SummaryCard
          title="Total Admin Users"
          value={rows.length}
          subtitle="All admin + superuser accounts"
          c={c}
        />
        <SummaryCard
          title="Superusers"
          value={rows.filter((r) => r.role === "superuser").length}
          subtitle="Highest access"
          c={c}
        />
        <SummaryCard
          title="Admins"
          value={rows.filter((r) => r.role === "admin").length}
          subtitle="Standard admin access"
          c={c}
        />
      </div>

      <div
        style={{
          background: c.card,
          border: `1px solid ${c.border}`,
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: c.textMuted }}>
            Loading admin users...
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: c.textMuted }}>
            No admin users found
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
              <thead>
                <tr style={{ background: c.headerBg, borderBottom: `1px solid ${c.border}` }}>
                  <th style={thStyle(c)}>Email</th>
                  <th style={thStyle(c)}>Name</th>
                  <th style={thStyle(c)}>Role</th>
                  <th style={thStyle(c)}>Status</th>
                  <th style={{ ...thStyle(c), textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((admin, idx) => {
                  const badge = badgeStyle(admin.status, isDark);

                  return (
                    <tr
                      key={admin.id}
                      style={{
                        borderBottom: `1px solid ${c.border}`,
                        background: idx % 2 === 0 ? "transparent" : isDark ? "rgba(255,255,255,0.01)" : "#fafafa",
                      }}
                    >
                      <td style={tdPrimary(c)}>{admin.email}</td>
                      <td style={tdMuted(c)}>{admin.name || admin.email}</td>
                      <td style={tdMuted(c)}>{admin.role}</td>
                      <td style={tdBase}>
                        <span
                          style={{
                            background: badge.background,
                            color: badge.color,
                            padding: "6px 10px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            display: "inline-block",
                          }}
                        >
                          {admin.status}
                        </span>
                      </td>
                      <td style={{ ...tdBase, textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={() => window.alert("Role editing comes next after list API is stable.")}
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
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
      <div style={{ fontSize: 28, fontWeight: 800, color: c.text }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: c.textMuted, marginTop: 8 }}>
        {subtitle}
      </div>
    </div>
  );
}

const tdBase = {
  padding: 14,
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
    padding: 14,
    textAlign: "left",
    fontSize: 12,
    fontWeight: 800,
    color: c.textMuted,
  };
}
