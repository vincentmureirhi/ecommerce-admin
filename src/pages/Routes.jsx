import React, { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import {
  listRoutes,
  createRoute,
  updateRoute,
  deleteRoute,
} from "../api/routes";
import { listSalesReps } from "../api/salesReps";

export default function Routes() {
  const { isDark } = useTheme();
  const [rows, setRows] = useState([]);
  const [salesReps, setSalesReps] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    sales_rep_id: "",
    status: "active",
  });

  const colors = {
    light: {
      bg: "#f8f9fa",
      card: "#ffffff",
      text: "#1a1a1a",
      textMuted: "#666",
      textMutedLight: "#999",
      border: "#ddd",
      borderLight: "#eee",
      headerBg: "#f8f9fa",
      rowBg1: "#fff",
      rowBg2: "#f9f9f9",
    },
    dark: {
      bg: "#0f172a",
      card: "#1e293b",
      text: "#f1f5f9",
      textMuted: "#94a3b8",
      textMutedLight: "#64748b",
      border: "#334155",
      borderLight: "#475569",
      headerBg: "#1a1f2e",
      rowBg1: "#1e293b",
      rowBg2: "#232f3f",
    },
  };

  const c = isDark ? colors.dark : colors.light;

  async function loadData() {
    setErr("");
    setLoading(true);
    try {
      const [routeData, repData] = await Promise.all([
        listRoutes(),
        listSalesReps(),
      ]);

      setRows(
        Array.isArray(routeData.data || routeData)
          ? routeData.data || routeData
          : []
      );
      setSalesReps(
        Array.isArray(repData.data || repData) ? repData.data || repData : []
      );
    } catch (e) {
      setErr(e?.message || "Failed to load routes");
      console.error("Load error:", e);
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!form.name.trim()) return setErr("Route name is required");
    if (!form.sales_rep_id) return setErr("Sales rep is required");

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        sales_rep_id: parseInt(form.sales_rep_id),
        status: form.status,
      };

      if (editId) {
        await updateRoute(editId, payload);
      } else {
        await createRoute(payload);
      }

      setForm({
        name: "",
        description: "",
        sales_rep_id: "",
        status: "active",
      });
      setEditId(null);
      setShowForm(false);
      await loadData();
    } catch (e) {
      setErr(e?.message || "Failed to save route");
      console.error("Submit error:", e);
    }
  }

  async function onDelete(id) {
    if (!confirm("Delete this route?")) return;
    try {
      await deleteRoute(id);
      await loadData();
    } catch (e) {
      setErr(e?.message || "Failed to delete route");
      console.error("Delete error:", e);
    }
  }

  function onEdit(route) {
    setEditId(route.id);
    setForm({
      name: route.name,
      description: route.description || "",
      sales_rep_id: route.sales_rep_id || "",
      status: route.status || "active",
    });
    setShowForm(true);
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading)
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

  return (
    <div style={{ background: c.bg, minHeight: "100vh", padding: "20px" }}>
      <div style={{ marginBottom: 30 }}>
        <h1
          style={{
            marginTop: 0,
            marginBottom: 5,
            fontSize: 28,
            fontWeight: 700,
            color: c.text,
          }}
        >
          🗺️ Routes
        </h1>
        <p style={{ margin: 0, color: c.textMuted, fontSize: 13 }}>
          {rows.length} total routes
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

      {/* ADD BUTTON */}
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditId(null);
            setForm({
              name: "",
              description: "",
              sales_rep_id: "",
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
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow =
              "0 4px 12px rgba(102, 126, 234, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {showForm ? "Cancel" : "+ New Route"}
        </button>
      </div>

      {/* FORM */}
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
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    color: c.textMuted,
                    marginBottom: 6,
                  }}
                >
                  Route Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., North Zone"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: `1px solid ${c.border}`,
                    borderRadius: 6,
                    fontSize: 13,
                    boxSizing: "border-box",
                    background: isDark ? "#0f172a" : "#fff",
                    color: c.text,
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    color: c.textMuted,
                    marginBottom: 6,
                  }}
                >
                  Sales Rep *
                </label>
                <select
                  value={form.sales_rep_id}
                  onChange={(e) =>
                    setForm({ ...form, sales_rep_id: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: `1px solid ${c.border}`,
                    borderRadius: 6,
                    fontSize: 13,
                    boxSizing: "border-box",
                    cursor: "pointer",
                    background: isDark ? "#0f172a" : "#fff",
                    color: c.text,
                  }}
                >
                  <option value="">Select sales rep</option>
                  {salesReps.map((rep) => (
                    <option key={rep.id} value={rep.id}>
                      {rep.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    color: c.textMuted,
                    marginBottom: 6,
                  }}
                >
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: `1px solid ${c.border}`,
                    borderRadius: 6,
                    fontSize: 13,
                    boxSizing: "border-box",
                    cursor: "pointer",
                    background: isDark ? "#0f172a" : "#fff",
                    color: c.text,
                  }}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: c.textMuted,
                  marginBottom: 6,
                }}
              >
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="e.g., Covers cities in North region"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: `1px solid ${c.border}`,
                  borderRadius: 6,
                  fontSize: 13,
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                  minHeight: 80,
                  background: isDark ? "#0f172a" : "#fff",
                  color: c.text,
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
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
                  background: isDark ? "#334155" : "#e0e0e0",
                  color: isDark ? "#f1f5f9" : "#1a1a1a",
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

      {/* TABLE */}
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
          🗺️ No routes found
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
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  background: c.headerBg,
                  borderBottom: `1px solid ${c.border}`,
                }}
              >
                <th
                  style={{
                    padding: 12,
                    textAlign: "left",
                    fontSize: 12,
                    fontWeight: 700,
                    color: c.textMuted,
                  }}
                >
                  Route Name
                </th>
                <th
                  style={{
                    padding: 12,
                    textAlign: "left",
                    fontSize: 12,
                    fontWeight: 700,
                    color: c.textMuted,
                  }}
                >
                  Sales Rep
                </th>
                <th
                  style={{
                    padding: 12,
                    textAlign: "left",
                    fontSize: 12,
                    fontWeight: 700,
                    color: c.textMuted,
                  }}
                >
                  Customers
                </th>
                <th
                  style={{
                    padding: 12,
                    textAlign: "left",
                    fontSize: 12,
                    fontWeight: 700,
                    color: c.textMuted,
                  }}
                >
                  Locations
                </th>
                <th
                  style={{
                    padding: 12,
                    textAlign: "left",
                    fontSize: 12,
                    fontWeight: 700,
                    color: c.textMuted,
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    padding: 12,
                    textAlign: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    color: c.textMuted,
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((route, idx) => (
                <tr
                  key={route.id}
                  style={{
                    borderBottom: `1px solid ${c.borderLight}`,
                    background: idx % 2 === 0 ? c.rowBg1 : c.rowBg2,
                  }}
                >
                  <td
                    style={{
                      padding: 12,
                      fontSize: 13,
                      color: c.text,
                      fontWeight: 600,
                    }}
                  >
                    {route.name}
                  </td>
                  <td style={{ padding: 12, fontSize: 13, color: c.textMuted }}>
                    {route.sales_rep_name || "N/A"}
                  </td>
                  <td style={{ padding: 12, fontSize: 13, color: c.textMuted }}>
                    <span
                      style={{
                        background: isDark
                          ? "rgba(102, 126, 234, 0.2)"
                          : "#e3f2fd",
                        color: "#667eea",
                        padding: "4px 8px",
                        borderRadius: 4,
                        fontSize: 12,
                      }}
                    >
                      {route.customer_count || 0} customers
                    </span>
                  </td>
                  <td style={{ padding: 12, fontSize: 13, color: c.textMuted }}>
                    <span
                      style={{
                        background: isDark
                          ? "rgba(118, 75, 162, 0.2)"
                          : "#f3e5f5",
                        color: "#764ba2",
                        padding: "4px 8px",
                        borderRadius: 4,
                        fontSize: 12,
                      }}
                    >
                      {route.location_count || 0} locations
                    </span>
                  </td>
                  <td style={{ padding: 12, fontSize: 13, color: c.textMuted }}>
                    <span
                      style={{
                        background:
                          route.status === "active"
                            ? isDark
                              ? "rgba(16, 185, 129, 0.2)"
                              : "#e8f5e9"
                            : isDark
                            ? "rgba(220, 53, 69, 0.2)"
                            : "#ffebee",
                        color:
                          route.status === "active"
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
                      {route.status || "active"}
                    </span>
                  </td>
                  <td style={{ padding: 12, textAlign: "center" }}>
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        justifyContent: "center",
                      }}
                    >
                      <button
                        onClick={() => onEdit(route)}
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
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => onDelete(route.id)}
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
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
