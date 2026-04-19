import React, { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { getThemeColors } from "../utils/themeColors";
import { listRegions, deleteRegion, createRegion, updateRegion } from "../api/regions";
import { useNavigate } from "react-router-dom";

export default function Regions() {
  const { isDark } = useTheme();
  const c = getThemeColors(isDark);
  const nav = useNavigate();

  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    latitude: "",
    longitude: "",
  });

  async function loadData() {
    setErr("");
    setLoading(true);
    try {
      const data = await listRegions({ search });
      setRows(Array.isArray(data.data) ? data.data : []);
    } catch (e) {
      setErr(e?.message || "Failed to load regions");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!form.name.trim()) return setErr("Region name is required");

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      };

      if (editId) {
        await updateRegion(editId, payload);
      } else {
        await createRegion(payload);
      }

      setForm({ name: "", description: "", latitude: "", longitude: "" });
      setEditId(null);
      setShowForm(false);
      loadData();
    } catch (e) {
      setErr(e?.message || "Failed to save region");
    }
  }

  async function onDelete(id) {
    if (!window.confirm("Are you sure?")) return;

    try {
      await deleteRegion(id);
      setRows(rows.filter((r) => r.id !== id));
    } catch (e) {
      setErr(e?.message || "Failed to delete");
    }
  }

  function onEdit(region) {
    setEditId(region.id);
    setForm({
      name: region.name,
      description: region.description || "",
      latitude: region.latitude || "",
      longitude: region.longitude || "",
    });
    setShowForm(true);
  }

  useEffect(() => {
    loadData();
  }, [search]);

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
      <div
        style={{
          marginBottom: 30,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
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
            🌍 Regions
          </h1>
          <p style={{ margin: 0, color: c.textMuted, fontSize: 13 }}>
            Manage geographic regions
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditId(null);
            setForm({ name: "", description: "", latitude: "", longitude: "" });
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
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          ➕ Add Region
        </button>
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

      {/* SEARCH */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search regions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            border: `1px solid ${c.border}`,
            borderRadius: 6,
            fontSize: 13,
            background: c.card,
            color: c.text,
          }}
        />
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
          <h3
            style={{
              marginTop: 0,
              marginBottom: 15,
              fontSize: 16,
              fontWeight: 700,
              color: c.text,
            }}
          >
            {editId ? "✏️ Edit Region" : "➕ New Region"}
          </h3>

          <form onSubmit={onSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 15,
                marginBottom: 15,
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
                  Region Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Taveta"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
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
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional description"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
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
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    color: c.textMuted,
                    marginBottom: 6,
                  }}
                >
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.00001"
                  value={form.latitude}
                  onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                  placeholder="-1.2345"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
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
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    color: c.textMuted,
                    marginBottom: 6,
                  }}
                >
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.00001"
                  value={form.longitude}
                  onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                  placeholder="36.7345"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: `1px solid ${c.border}`,
                    borderRadius: 6,
                    fontSize: 13,
                    boxSizing: "border-box",
                    background: c.inputBg,
                    color: c.text,
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="submit"
                style={{
                  padding: "8px 16px",
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
                {editId ? "Update Region" : "Create Region"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditId(null);
                  setForm({ name: "", description: "", latitude: "", longitude: "" });
                }}
                style={{
                  padding: "8px 16px",
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

      {/* EMPTY STATE */}
      {rows.length === 0 && !showForm && (
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
          🔭 No regions found
        </div>
      )}

      {/* TABLE */}
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
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: c.headerBg, borderBottom: `1px solid ${c.border}` }}>
                <th
                  style={{
                    padding: 12,
                    textAlign: "left",
                    fontSize: 12,
                    fontWeight: 700,
                    color: c.textMuted,
                  }}
                >
                  Name
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
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((region, idx) => (
                <tr
                  key={region.id}
                  style={{
                    borderBottom: `1px solid ${c.borderLight}`,
                    background: idx % 2 === 0 ? c.rowBg1 : c.rowBg2,
                  }}
                >
                  <td style={{ padding: 12, fontSize: 13, color: c.text, fontWeight: 600 }}>
                    <button
                      onClick={() => nav(`/regions/${region.id}`)}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        margin: 0,
                        color: c.text,
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      {region.name}
                    </button>
                  </td>

                  <td style={{ padding: 12, fontSize: 13, color: c.textMuted, textAlign: "center" }}>
                    <span
                      style={{
                        background: isDark ? "rgba(102, 126, 234, 0.2)" : "#e3f2fd",
                        color: "#667eea",
                        padding: "4px 8px",
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {region.location_count || 0} locations
                    </span>
                  </td>

                  <td style={{ padding: 12, fontSize: 13, color: c.textMuted }}>
                    <button
                      onClick={() => nav(`/regions/${region.id}`)}
                      style={{
                        padding: "6px 12px",
                        background: "#0ea5e9",
                        color: "white",
                        border: "none",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontSize: 11,
                        fontWeight: 600,
                        marginRight: 8,
                      }}
                    >
                      Open Region
                    </button>

                    <button
                      onClick={() => onEdit(region)}
                      style={{
                        padding: "6px 12px",
                        background: "#667eea",
                        color: "white",
                        border: "none",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontSize: 11,
                        fontWeight: 600,
                        marginRight: 8,
                      }}
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => onDelete(region.id)}
                      style={{
                        padding: "6px 12px",
                        background: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontSize: 11,
                        fontWeight: 600,
                        marginRight: 8,
                      }}
                    >
                      Delete
                    </button>

                    <button
                      onClick={() => nav(`/locations?region=${region.id}`)}
                      style={{
                        padding: "6px 12px",
                        background: "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      View Locations
                    </button>
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

