import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { getThemeColors } from "../utils/themeColors";
import {
  listLocations,
  deleteLocation,
  createLocation,
  updateLocation,
} from "../api/locations";
import { listRegions } from "../api/regions";

export default function Locations() {
  const { isDark } = useTheme();
  const c = getThemeColors(isDark);
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const regionId = searchParams.get("region");

  const [rows, setRows] = useState([]);
  const [regions, setRegions] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRegion, setSelectedRegion] = useState(regionId || "");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    region_id: regionId || "",
    latitude: "",
    longitude: "",
  });

  async function loadRegions() {
    try {
      const data = await listRegions();
      setRegions(Array.isArray(data.data) ? data.data : []);
    } catch (e) {
      setErr(e?.message || "Failed to load regions");
    }
  }

  async function loadData() {
    setErr("");
    setLoading(true);

    try {
      const filters = { search };
      if (selectedRegion) filters.region_id = selectedRegion;

      const data = await listLocations(filters);
      setRows(Array.isArray(data.data) ? data.data : []);
    } catch (e) {
      setErr(e?.message || "Failed to load locations");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!form.name.trim()) return setErr("Location name is required");
    if (!form.region_id) return setErr("Region is required");

    try {
      const payload = {
        name: form.name.trim(),
        region_id: parseInt(form.region_id, 10),
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      };

      if (editId) {
        await updateLocation(editId, payload);
      } else {
        await createLocation(payload);
      }

      setForm({
        name: "",
        region_id: selectedRegion || "",
        latitude: "",
        longitude: "",
      });
      setEditId(null);
      setShowForm(false);
      await loadData();
    } catch (e) {
      setErr(e?.message || "Failed to save location");
    }
  }

  async function onDelete(id) {
    if (!window.confirm("Are you sure?")) return;

    try {
      await deleteLocation(id);
      setRows(rows.filter((r) => r.id !== id));
    } catch (e) {
      setErr(e?.message || "Failed to delete");
    }
  }

  function onEdit(location) {
    setEditId(location.id);
    setForm({
      name: location.name,
      region_id: String(location.region_id),
      latitude: location.latitude || "",
      longitude: location.longitude || "",
    });
    setShowForm(true);
  }

  function openCustomersByLocation(locationId) {
    nav(`/customers?location=${locationId}`);
  }

  useEffect(() => {
    loadRegions();
  }, []);

  useEffect(() => {
    loadData();
  }, [search, selectedRegion]);

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
          marginBottom: 30,
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
              marginTop: 0,
              marginBottom: 5,
              fontSize: 28,
              fontWeight: 700,
              color: c.text,
            }}
          >
            📍 Locations
          </h1>
          <p style={{ margin: 0, color: c.textMuted, fontSize: 13 }}>
            Manage locations within regions
          </p>
        </div>

        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditId(null);
            setForm({
              name: "",
              region_id: selectedRegion || "",
              latitude: "",
              longitude: "",
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
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          ➕ Add Location
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 15, marginBottom: 20 }}>
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
            Filter by Region
          </label>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: `1px solid ${c.border}`,
              borderRadius: 6,
              fontSize: 13,
              cursor: "pointer",
              background: c.inputBg,
              color: c.text,
            }}
          >
            <option value="">All Regions</option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
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
            Search Location
          </label>
          <input
            type="text"
            placeholder="Search locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: `1px solid ${c.border}`,
              borderRadius: 6,
              fontSize: 13,
              background: c.inputBg,
              color: c.text,
            }}
          />
        </div>
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
          <h3
            style={{
              marginTop: 0,
              marginBottom: 15,
              fontSize: 16,
              fontWeight: 700,
              color: c.text,
            }}
          >
            {editId ? "✏️ Edit Location" : "➕ New Location"}
          </h3>

          <form onSubmit={onSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 15, marginBottom: 15 }}>
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
                  Region *
                </label>
                <select
                  value={form.region_id}
                  onChange={(e) => setForm({ ...form, region_id: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: `1px solid ${c.border}`,
                    borderRadius: 6,
                    fontSize: 13,
                    cursor: "pointer",
                    boxSizing: "border-box",
                    background: c.inputBg,
                    color: c.text,
                  }}
                >
                  <option value="">Select Region</option>
                  {regions.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name}
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
                  Location Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Westlands"
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {editId ? "Update Location" : "Create Location"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditId(null);
                  setForm({
                    name: "",
                    region_id: selectedRegion || "",
                    latitude: "",
                    longitude: "",
                  });
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
          🔭 No locations found
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
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: c.headerBg, borderBottom: `1px solid ${c.border}` }}>
                <th style={{ padding: 12, textAlign: "left", fontSize: 12, fontWeight: 700, color: c.textMuted }}>
                  Location
                </th>
                <th style={{ padding: 12, textAlign: "left", fontSize: 12, fontWeight: 700, color: c.textMuted }}>
                  Region
                </th>
                <th style={{ padding: 12, textAlign: "center", fontSize: 12, fontWeight: 700, color: c.textMuted }}>
                  Customers
                </th>
                <th style={{ padding: 12, textAlign: "left", fontSize: 12, fontWeight: 700, color: c.textMuted }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((location, idx) => (
                <tr
                  key={location.id}
                  style={{
                    borderBottom: `1px solid ${c.borderLight}`,
                    background: idx % 2 === 0 ? c.rowBg1 : c.rowBg2,
                  }}
                >
                  <td
                    onClick={() => openCustomersByLocation(location.id)}
                    style={{
                      padding: 12,
                      fontSize: 13,
                      color: "#667eea",
                      fontWeight: 700,
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                    title="View customers in this location"
                  >
                    {location.name}
                  </td>

                  <td style={{ padding: 12, fontSize: 13, color: c.textMuted }}>
                    {location.region_name}
                  </td>

                  <td style={{ padding: 12, fontSize: 13, textAlign: "center" }}>
                    <button
                      onClick={() => openCustomersByLocation(location.id)}
                      style={{
                        background: isDark ? "rgba(102, 126, 234, 0.2)" : "#e3f2fd",
                        color: "#667eea",
                        padding: "4px 8px",
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        border: "none",
                        cursor: "pointer",
                      }}
                      title="View customers in this location"
                    >
                      {location.customer_count || 0}
                    </button>
                  </td>

                  <td style={{ padding: 12, fontSize: 13, color: c.textMuted }}>
                    <button
                      onClick={() => openCustomersByLocation(location.id)}
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
                      👥 View Customers
                    </button>

                    <button
                      onClick={() => onEdit(location)}
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
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#5568d3";
                        e.currentTarget.style.transform = "scale(1.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#667eea";
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                    >
                      ✏️ Edit
                    </button>

                    <button
                      onClick={() => onDelete(location.id)}
                      disabled={location.customer_count > 0}
                      style={{
                        padding: "6px 12px",
                        background:
                          location.customer_count > 0
                            ? isDark
                              ? "#475569"
                              : "#ccc"
                            : "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: 4,
                        cursor: location.customer_count > 0 ? "not-allowed" : "pointer",
                        fontSize: 11,
                        fontWeight: 600,
                        transition: "all 0.2s",
                        opacity: location.customer_count > 0 ? 0.6 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (location.customer_count === 0) {
                          e.currentTarget.style.background = "#b82a2a";
                          e.currentTarget.style.transform = "scale(1.05)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (location.customer_count === 0) {
                          e.currentTarget.style.background = "#dc3545";
                          e.currentTarget.style.transform = "scale(1)";
                        }
                      }}
                      title={
                        location.customer_count > 0
                          ? "Cannot delete - has customers"
                          : "Delete location"
                      }
                    >
                      🗑️ Delete
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

