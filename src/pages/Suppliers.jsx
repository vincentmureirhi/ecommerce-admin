import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { getThemeColors } from "../utils/themeColors";
import {
  listSuppliers,
  deleteSupplier,
  createSupplier,
  updateSupplier,
} from "../api/suppliers";
import SupplierForm from "./SupplierForm";

export default function Suppliers() {
  const { isDark } = useTheme();
  const c = getThemeColors(isDark);

  const [suppliers, setSuppliers] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [hoveredRowId, setHoveredRowId] = useState(null);

  async function loadData() {
    setErr("");
    setLoading(true);
    try {
      const data = await listSuppliers({ search });
      setSuppliers(Array.isArray(data.data) ? data.data : []);
    } catch (e) {
      setErr(e?.message || "Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(id, productCount) {
    setErr("");

    if (productCount > 0) {
      setErr(
        `Cannot delete! This supplier has ${productCount} product(s). Please reassign them first.`
      );
      return;
    }

    if (!window.confirm("Are you sure you want to delete this supplier?")) return;

    try {
      await deleteSupplier(id);
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      setErr(e?.message || "Failed to delete");
    }
  }

  const openCreate = () => {
    setEditingSupplier(null);
    setShowForm(true);
    setErr("");
  };

  const openEdit = (supplier) => {
    setEditingSupplier(supplier);
    setShowForm(true);
    setErr("");
  };

  const handleSave = async (payload) => {
    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, payload);
      } else {
        await createSupplier(payload);
      }
      setShowForm(false);
      setEditingSupplier(null);
      loadData();
    } catch (e) {
      setErr(e?.message || "Failed to save supplier");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingSupplier(null);
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const stats = useMemo(() => {
    const totalSuppliers = suppliers.length;
    const activeSuppliers = suppliers.filter((s) => s.is_active === true).length;
    const inactiveSuppliers = suppliers.filter((s) => s.is_active === false).length;
    const totalStockValue = suppliers.reduce(
      (sum, s) => sum + Number(s.stock_value || 0),
      0
    );
    const totalProducts = suppliers.reduce(
      (sum, s) => sum + Number(s.product_count || 0),
      0
    );

    return {
      totalSuppliers,
      activeSuppliers,
      inactiveSuppliers,
      totalStockValue,
      totalProducts,
    };
  }, [suppliers]);

  const dashStyle = {
    color: c.textMuted,
    opacity: 0.7,
  };

  const thStyle = {
    padding: "14px 12px",
    fontSize: 12,
    fontWeight: 700,
    color: c.textMuted,
    whiteSpace: "nowrap",
    letterSpacing: "0.02em",
    textTransform: "uppercase",
    position: "sticky",
    top: 0,
    background: c.headerBg,
    zIndex: 1,
  };

  const cellStyle = {
    padding: "14px 12px",
    fontSize: 13,
    color: c.text,
    verticalAlign: "middle",
  };

  const mutedCellStyle = {
    padding: "14px 12px",
    fontSize: 13,
    color: c.textMuted,
    verticalAlign: "middle",
  };

  const statCardStyle = {
    background: c.card,
    border: `1px solid ${c.border}`,
    borderRadius: 14,
    padding: 18,
    boxShadow: isDark
      ? "0 8px 20px rgba(0,0,0,0.18)"
      : "0 6px 18px rgba(15,23,42,0.06)",
  };

  const cardLabelStyle = {
    margin: 0,
    fontSize: 12,
    fontWeight: 700,
    color: c.textMuted,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  };

  const cardValueStyle = {
    margin: "10px 0 4px",
    fontSize: 28,
    fontWeight: 800,
    color: c.text,
    lineHeight: 1.1,
  };

  const cardSubTextStyle = {
    margin: 0,
    fontSize: 12,
    color: c.textMuted,
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
              fontSize: 30,
              fontWeight: 800,
              color: c.text,
              letterSpacing: "-0.02em",
            }}
          >
            🏢 Suppliers
          </h1>
          <p style={{ margin: 0, color: c.textMuted, fontSize: 13 }}>
            Manage supplier records, stock exposure, and business terms
          </p>
        </div>

        <button
          onClick={openCreate}
          style={{
            padding: "11px 16px",
            borderRadius: 10,
            border: "none",
            background: "#667eea",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            whiteSpace: "nowrap",
            boxShadow: "0 10px 20px rgba(102,126,234,0.22)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 14px 24px rgba(102,126,234,0.28)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 10px 20px rgba(102,126,234,0.22)";
          }}
        >
          + Add Supplier
        </button>
      </div>

      {err && (
        <div
          style={{
            background: isDark ? "rgba(220, 53, 69, 0.1)" : "#fee",
            color: isDark ? "#ff6b6b" : "#c33",
            padding: 12,
            borderRadius: 10,
            marginBottom: 20,
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
          marginBottom: 22,
        }}
      >
        <div style={statCardStyle}>
          <p style={cardLabelStyle}>Total Suppliers</p>
          <p style={cardValueStyle}>{stats.totalSuppliers}</p>
          <p style={cardSubTextStyle}>All supplier records currently listed</p>
        </div>

        <div style={statCardStyle}>
          <p style={cardLabelStyle}>Active Suppliers</p>
          <p style={cardValueStyle}>{stats.activeSuppliers}</p>
          <p style={cardSubTextStyle}>Suppliers currently marked as active</p>
        </div>

        <div style={statCardStyle}>
          <p style={cardLabelStyle}>Inactive Suppliers</p>
          <p style={cardValueStyle}>{stats.inactiveSuppliers}</p>
          <p style={cardSubTextStyle}>Suppliers not active at the moment</p>
        </div>

        <div style={statCardStyle}>
          <p style={cardLabelStyle}>Total Stock Value</p>
          <p style={cardValueStyle}>
            KES {stats.totalStockValue.toLocaleString()}
          </p>
          <p style={cardSubTextStyle}>
            Across {stats.totalProducts.toLocaleString()} linked products
          </p>
        </div>
      </div>

      <div
        style={{
          marginBottom: 18,
          background: c.card,
          border: `1px solid ${c.border}`,
          borderRadius: 14,
          padding: 14,
          boxShadow: isDark
            ? "0 8px 20px rgba(0,0,0,0.16)"
            : "0 4px 14px rgba(15,23,42,0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: "1 1 320px" }}>
            <input
              type="text"
              placeholder="Search suppliers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "11px 13px",
                border: `1px solid ${c.border}`,
                borderRadius: 10,
                fontSize: 13,
                background: c.bg,
                color: c.text,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              background: isDark ? "rgba(102,126,234,0.15)" : "#eef2ff",
              color: "#667eea",
              fontSize: 12,
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            {suppliers.length} supplier{suppliers.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      {suppliers.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: 60,
            background: c.card,
            borderRadius: 14,
            color: c.textMuted,
            border: `1px solid ${c.border}`,
            boxShadow: isDark
              ? "0 8px 20px rgba(0,0,0,0.16)"
              : "0 4px 14px rgba(15,23,42,0.05)",
          }}
        >
          🔭 No suppliers found
        </div>
      )}

      {suppliers.length > 0 && (
        <div
          style={{
            background: c.card,
            borderRadius: 14,
            overflow: "hidden",
            boxShadow: isDark
              ? "0 10px 24px rgba(0,0,0,0.18)"
              : "0 8px 24px rgba(15,23,42,0.06)",
            border: `1px solid ${c.border}`,
            overflowX: "auto",
            maxHeight: "70vh",
          }}
        >
          <table
            style={{
              width: "100%",
              minWidth: 1220,
              borderCollapse: "separate",
              borderSpacing: 0,
            }}
          >
            <thead>
              <tr>
                <th style={{ ...thStyle, textAlign: "left" }}>Name</th>
                <th style={{ ...thStyle, textAlign: "left" }}>Contact</th>
                <th style={{ ...thStyle, textAlign: "left" }}>Phone</th>
                <th style={{ ...thStyle, textAlign: "left" }}>Email</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Status</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Products</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Total Stock</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Stock Value</th>
                <th style={{ ...thStyle, textAlign: "left" }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {suppliers.map((supplier, idx) => {
                const hasStatus =
                  supplier.is_active === true || supplier.is_active === false;

                const isHovered = hoveredRowId === supplier.id;

                return (
                  <tr
                    key={supplier.id}
                    onMouseEnter={() => setHoveredRowId(supplier.id)}
                    onMouseLeave={() => setHoveredRowId(null)}
                    style={{
                      background: isHovered
                        ? isDark
                          ? "rgba(102,126,234,0.08)"
                          : "#f8faff"
                        : idx % 2 === 0
                        ? c.rowBg1
                        : c.rowBg2,
                      transition: "background 0.18s ease",
                    }}
                  >
                    <td
                      style={{
                        ...cellStyle,
                        fontWeight: 700,
                        minWidth: 180,
                        borderBottom: `1px solid ${c.borderLight}`,
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <span>{supplier.name}</span>
                        <span
                          style={{
                            fontSize: 11,
                            color: c.textMuted,
                            fontWeight: 500,
                          }}
                        >
                          ID #{supplier.id}
                        </span>
                      </div>
                    </td>

                    <td
                      style={{
                        ...mutedCellStyle,
                        minWidth: 150,
                        borderBottom: `1px solid ${c.borderLight}`,
                      }}
                    >
                      {supplier.contact_person ? (
                        supplier.contact_person
                      ) : (
                        <span style={dashStyle}>—</span>
                      )}
                    </td>

                    <td
                      style={{
                        ...mutedCellStyle,
                        minWidth: 130,
                        borderBottom: `1px solid ${c.borderLight}`,
                      }}
                    >
                      {supplier.phone ? (
                        supplier.phone
                      ) : (
                        <span style={dashStyle}>—</span>
                      )}
                    </td>

                    <td
                      style={{
                        ...mutedCellStyle,
                        minWidth: 220,
                        whiteSpace: "nowrap",
                        borderBottom: `1px solid ${c.borderLight}`,
                      }}
                    >
                      {supplier.email ? (
                        supplier.email
                      ) : (
                        <span style={dashStyle}>—</span>
                      )}
                    </td>

                    <td
                      style={{
                        ...mutedCellStyle,
                        textAlign: "center",
                        minWidth: 120,
                        borderBottom: `1px solid ${c.borderLight}`,
                      }}
                    >
                      {hasStatus ? (
                        <span
                          style={{
                            display: "inline-block",
                            padding: "6px 10px",
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 700,
                            background: supplier.is_active
                              ? isDark
                                ? "rgba(34, 197, 94, 0.18)"
                                : "rgba(34, 197, 94, 0.12)"
                              : isDark
                              ? "rgba(239, 68, 68, 0.18)"
                              : "rgba(239, 68, 68, 0.12)",
                            color: supplier.is_active ? "#16a34a" : "#dc2626",
                            border: `1px solid ${
                              supplier.is_active
                                ? isDark
                                  ? "rgba(34, 197, 94, 0.35)"
                                  : "rgba(34, 197, 94, 0.25)"
                                : isDark
                                ? "rgba(239, 68, 68, 0.35)"
                                : "rgba(239, 68, 68, 0.25)"
                            }`,
                          }}
                        >
                          {supplier.is_active ? "Active" : "Inactive"}
                        </span>
                      ) : (
                        <span style={dashStyle}>—</span>
                      )}
                    </td>

                    <td
                      style={{
                        ...mutedCellStyle,
                        textAlign: "center",
                        minWidth: 100,
                        borderBottom: `1px solid ${c.borderLight}`,
                      }}
                    >
                      <span
                        style={{
                          background: isDark ? "rgba(102, 126, 234, 0.2)" : "#e3f2fd",
                          color: "#667eea",
                          padding: "5px 9px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {supplier.product_count || 0}
                      </span>
                    </td>

                    <td
                      style={{
                        ...mutedCellStyle,
                        textAlign: "center",
                        minWidth: 120,
                        borderBottom: `1px solid ${c.borderLight}`,
                      }}
                    >
                      <span
                        style={{
                          background: isDark ? "rgba(102, 126, 234, 0.15)" : "#f0f5ff",
                          color: "#667eea",
                          padding: "5px 9px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {supplier.total_stock || 0} units
                      </span>
                    </td>

                    <td
                      style={{
                        ...cellStyle,
                        fontWeight: 700,
                        textAlign: "right",
                        minWidth: 140,
                        whiteSpace: "nowrap",
                        borderBottom: `1px solid ${c.borderLight}`,
                      }}
                    >
                      KES {parseFloat(supplier.stock_value || 0).toLocaleString()}
                    </td>

                    <td
                      style={{
                        ...mutedCellStyle,
                        minWidth: 185,
                        borderBottom: `1px solid ${c.borderLight}`,
                      }}
                    >
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <button
                          onClick={() => openEdit(supplier)}
                          style={{
                            padding: "7px 12px",
                            background: "#0ea5e9",
                            color: "white",
                            border: "none",
                            borderRadius: 8,
                            cursor: "pointer",
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = "0.9";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = "1";
                          }}
                        >
                          ✏️ Edit
                        </button>

                        <button
                          onClick={() => onDelete(supplier.id, supplier.product_count)}
                          disabled={supplier.product_count > 0}
                          style={{
                            padding: "7px 12px",
                            background:
                              supplier.product_count > 0
                                ? isDark
                                  ? "#475569"
                                  : "#ccc"
                                : "#dc3545",
                            color: "white",
                            border: "none",
                            borderRadius: 8,
                            cursor:
                              supplier.product_count > 0 ? "not-allowed" : "pointer",
                            fontSize: 11,
                            fontWeight: 700,
                            opacity: supplier.product_count > 0 ? 0.6 : 1,
                          }}
                          title={
                            supplier.product_count > 0
                              ? `Cannot delete - ${supplier.product_count} products assigned`
                              : "Delete supplier"
                          }
                          onMouseEnter={(e) => {
                            if (supplier.product_count === 0) {
                              e.currentTarget.style.opacity = "0.9";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (supplier.product_count === 0) {
                              e.currentTarget.style.opacity = "1";
                            }
                          }}
                        >
                          🗑️ Delete
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

      {showForm && (
        <SupplierForm
          initialData={editingSupplier || {}}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
