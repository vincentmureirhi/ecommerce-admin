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

const money = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat("en-KE");

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function lower(value) {
  return String(value || "").toLowerCase();
}

function getSupplierHealth(supplier) {
  const productCount = toNumber(supplier.product_count);
  const leadTime = toNumber(supplier.lead_time_days);
  const hasContact = Boolean(supplier.phone || supplier.email || supplier.contact_person);

  if (supplier.is_active === false) {
    return { label: "Inactive", tone: "danger", detail: "Disabled supplier" };
  }

  if (!hasContact) {
    return { label: "Contact gap", tone: "warning", detail: "Missing contact details" };
  }

  if (leadTime >= 14) {
    return { label: "Long lead", tone: "warning", detail: `${leadTime} day lead time` };
  }

  if (productCount === 0) {
    return { label: "No products", tone: "muted", detail: "No stock exposure" };
  }

  return { label: "Healthy", tone: "success", detail: "Ready for procurement" };
}

function toneStyle(tone, isDark) {
  const styles = {
    success: {
      background: isDark ? "rgba(22, 163, 74, 0.16)" : "rgba(22, 163, 74, 0.10)",
      border: isDark ? "rgba(34, 197, 94, 0.30)" : "rgba(22, 163, 74, 0.20)",
      color: isDark ? "#86efac" : "#15803d",
    },
    warning: {
      background: isDark ? "rgba(245, 158, 11, 0.16)" : "rgba(245, 158, 11, 0.12)",
      border: isDark ? "rgba(245, 158, 11, 0.34)" : "rgba(245, 158, 11, 0.25)",
      color: isDark ? "#fbbf24" : "#b45309",
    },
    danger: {
      background: isDark ? "rgba(239, 68, 68, 0.16)" : "rgba(239, 68, 68, 0.10)",
      border: isDark ? "rgba(248, 113, 113, 0.34)" : "rgba(239, 68, 68, 0.20)",
      color: isDark ? "#fca5a5" : "#b91c1c",
    },
    muted: {
      background: isDark ? "rgba(148, 163, 184, 0.12)" : "rgba(100, 116, 139, 0.08)",
      border: isDark ? "rgba(148, 163, 184, 0.24)" : "rgba(100, 116, 139, 0.18)",
      color: isDark ? "#cbd5e1" : "#475569",
    },
  };

  return styles[tone] || styles.muted;
}

export default function Suppliers() {
  const { isDark } = useTheme();
  const c = getThemeColors(isDark);

  const [suppliers, setSuppliers] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [healthFilter, setHealthFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  async function loadData() {
    setErr("");
    setLoading(true);
    try {
      const data = await listSuppliers();
      setSuppliers(Array.isArray(data.data) ? data.data : []);
    } catch (e) {
      setErr(e?.message || "Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const enrichedSuppliers = useMemo(
    () =>
      suppliers.map((supplier) => ({
        ...supplier,
        health: getSupplierHealth(supplier),
      })),
    [suppliers]
  );

  const filteredSuppliers = useMemo(() => {
    const query = lower(search).trim();

    return enrichedSuppliers.filter((supplier) => {
      const health = supplier.health;
      const matchesSearch =
        !query ||
        [
          supplier.name,
          supplier.contact_person,
          supplier.phone,
          supplier.email,
          supplier.payment_terms,
          supplier.address,
        ]
          .map(lower)
          .some((value) => value.includes(query));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && supplier.is_active !== false) ||
        (statusFilter === "inactive" && supplier.is_active === false);

      const matchesHealth = healthFilter === "all" || health.label === healthFilter;

      return matchesSearch && matchesStatus && matchesHealth;
    });
  }, [enrichedSuppliers, healthFilter, search, statusFilter]);

  const stats = useMemo(() => {
    const totalSuppliers = suppliers.length;
    const activeSuppliers = suppliers.filter((s) => s.is_active !== false).length;
    const inactiveSuppliers = suppliers.filter((s) => s.is_active === false).length;
    const totalStockValue = suppliers.reduce((sum, s) => sum + toNumber(s.stock_value), 0);
    const totalProducts = suppliers.reduce((sum, s) => sum + toNumber(s.product_count), 0);
    const contactGaps = enrichedSuppliers.filter((s) => s.health.label === "Contact gap").length;
    const longLead = enrichedSuppliers.filter((s) => s.health.label === "Long lead").length;
    const activeRatio = totalSuppliers > 0 ? Math.round((activeSuppliers / totalSuppliers) * 100) : 0;

    return {
      totalSuppliers,
      activeSuppliers,
      inactiveSuppliers,
      totalStockValue,
      totalProducts,
      contactGaps,
      longLead,
      activeRatio,
    };
  }, [enrichedSuppliers, suppliers]);

  async function onDelete(id, productCount) {
    setErr("");

    if (Number(productCount) > 0) {
      setErr(`Cannot delete this supplier while ${productCount} product(s) are still assigned.`);
      return;
    }

    if (!window.confirm("Delete this supplier record?")) return;

    try {
      await deleteSupplier(id);
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      setErr(e?.message || "Failed to delete supplier");
    }
  }

  function openCreate() {
    setEditingSupplier(null);
    setShowForm(true);
    setErr("");
  }

  function openEdit(supplier) {
    setEditingSupplier(supplier);
    setShowForm(true);
    setErr("");
  }

  async function handleSave(payload) {
    setSaving(true);
    setErr("");
    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, payload);
      } else {
        await createSupplier(payload);
      }
      setShowForm(false);
      setEditingSupplier(null);
      await loadData();
    } catch (e) {
      setErr(e?.message || "Failed to save supplier");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (saving) return;
    setShowForm(false);
    setEditingSupplier(null);
  }

  const shellStyle = {
    background: c.bg,
    minHeight: "100vh",
    padding: "20px",
    color: c.text,
  };

  const panelStyle = {
    background: c.card,
    border: `1px solid ${c.border}`,
    borderRadius: 8,
    boxShadow: isDark ? "0 10px 28px rgba(0,0,0,0.20)" : "0 10px 30px rgba(15,23,42,0.06)",
  };

  const inputStyle = {
    width: "100%",
    border: `1px solid ${c.border}`,
    borderRadius: 8,
    background: c.bg,
    color: c.text,
    fontSize: 13,
    outline: "none",
    padding: "11px 12px",
    boxSizing: "border-box",
  };

  const selectStyle = {
    ...inputStyle,
    minWidth: 160,
    width: "auto",
  };

  const buttonStyle = {
    border: "none",
    borderRadius: 8,
    background: "#0f766e",
    color: "#fff",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 800,
    padding: "11px 16px",
    whiteSpace: "nowrap",
  };

  if (loading) {
    return (
      <div style={shellStyle}>
        <div style={{ ...panelStyle, padding: 28, color: c.textMuted }}>Loading suppliers...</div>
      </div>
    );
  }

  return (
    <div style={shellStyle}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 18,
        }}
      >
        <div>
          <p style={{ margin: "0 0 6px", color: "#0f766e", fontSize: 12, fontWeight: 800, letterSpacing: 0 }}>
            Procurement control
          </p>
          <h1 style={{ margin: 0, color: c.text, fontSize: 30, fontWeight: 900, letterSpacing: 0 }}>
            Supplier Command
          </h1>
          <p style={{ margin: "7px 0 0", color: c.textMuted, fontSize: 13 }}>
            Supplier health, linked stock exposure, contact readiness, and replenishment pressure.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={loadData}
            style={{
              ...buttonStyle,
              background: isDark ? "#1f2937" : "#e2e8f0",
              color: isDark ? "#f8fafc" : "#0f172a",
            }}
          >
            Refresh
          </button>
          <button type="button" onClick={openCreate} style={buttonStyle}>
            Add supplier
          </button>
        </div>
      </div>

      {err && (
        <div
          style={{
            ...panelStyle,
            borderColor: isDark ? "rgba(248,113,113,0.4)" : "rgba(220,38,38,0.18)",
            color: isDark ? "#fca5a5" : "#b91c1c",
            padding: 13,
            marginBottom: 16,
          }}
        >
          {err}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <MetricCard label="Suppliers" value={number.format(stats.totalSuppliers)} sub={`${stats.activeRatio}% active`} c={c} isDark={isDark} />
        <MetricCard label="Linked Products" value={number.format(stats.totalProducts)} sub="Assigned catalogue items" c={c} isDark={isDark} />
        <MetricCard label="Stock Exposure" value={money.format(stats.totalStockValue)} sub="Retail stock value" c={c} isDark={isDark} />
        <MetricCard label="Attention" value={number.format(stats.contactGaps + stats.longLead + stats.inactiveSuppliers)} sub="Contact, lead, or status issues" c={c} isDark={isDark} />
      </div>

      <div style={{ ...panelStyle, padding: 14, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 280px" }}>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, phone, email, contact, payment terms..."
              style={inputStyle}
            />
          </div>

          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={selectStyle}>
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select value={healthFilter} onChange={(event) => setHealthFilter(event.target.value)} style={selectStyle}>
            <option value="all">All health</option>
            <option value="Healthy">Healthy</option>
            <option value="Contact gap">Contact gap</option>
            <option value="Long lead">Long lead</option>
            <option value="No products">No products</option>
            <option value="Inactive">Inactive</option>
          </select>

          <div style={{ color: c.textMuted, fontSize: 12, fontWeight: 700 }}>
            Showing {number.format(filteredSuppliers.length)} of {number.format(suppliers.length)}
          </div>
        </div>
      </div>

      {filteredSuppliers.length === 0 ? (
        <div style={{ ...panelStyle, padding: 44, textAlign: "center", color: c.textMuted }}>
          No supplier records match the current filters.
        </div>
      ) : (
        <div style={{ ...panelStyle, overflow: "hidden" }}>
          <div style={{ overflowX: "auto", maxHeight: "72vh" }}>
            <table style={{ width: "100%", minWidth: 1180, borderCollapse: "separate", borderSpacing: 0 }}>
              <thead>
                <tr>
                  {[
                    "Supplier",
                    "Health",
                    "Contact",
                    "Terms",
                    "Products",
                    "Stock",
                    "Exposure",
                    "Actions",
                  ].map((label, index) => (
                    <th
                      key={label}
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 1,
                        background: c.headerBg,
                        borderBottom: `1px solid ${c.border}`,
                        color: c.textMuted,
                        fontSize: 11,
                        fontWeight: 900,
                        letterSpacing: 0,
                        padding: "13px 14px",
                        textAlign: index >= 4 && index <= 6 ? "right" : "left",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map((supplier) => {
                  const health = supplier.health;
                  const tone = toneStyle(health.tone, isDark);
                  const productCount = toNumber(supplier.product_count);

                  return (
                    <tr key={supplier.id} style={{ background: c.card }}>
                      <td style={tdStyle(c)}>
                        <div style={{ fontWeight: 900, color: c.text }}>{supplier.name}</div>
                        <div style={{ marginTop: 4, color: c.textMuted, fontSize: 12 }}>
                          ID #{supplier.id}
                          {supplier.address ? ` - ${supplier.address}` : ""}
                        </div>
                      </td>

                      <td style={tdStyle(c)}>
                        <span
                          style={{
                            display: "inline-flex",
                            flexDirection: "column",
                            gap: 2,
                            borderRadius: 999,
                            border: `1px solid ${tone.border}`,
                            background: tone.background,
                            color: tone.color,
                            padding: "7px 11px",
                            minWidth: 118,
                          }}
                        >
                          <span style={{ fontSize: 12, fontWeight: 900 }}>{health.label}</span>
                          <span style={{ fontSize: 10, opacity: 0.82 }}>{health.detail}</span>
                        </span>
                      </td>

                      <td style={tdStyle(c)}>
                        <div style={{ color: c.text, fontWeight: 700 }}>{supplier.contact_person || "No contact person"}</div>
                        <div style={{ marginTop: 4, color: c.textMuted, fontSize: 12 }}>
                          {supplier.phone || "No phone"} {supplier.email ? `- ${supplier.email}` : ""}
                        </div>
                      </td>

                      <td style={tdStyle(c)}>
                        <div style={{ color: c.text, fontWeight: 700 }}>{supplier.payment_terms || "Terms not set"}</div>
                        <div style={{ marginTop: 4, color: c.textMuted, fontSize: 12 }}>
                          Lead time: {toNumber(supplier.lead_time_days)} day(s)
                        </div>
                      </td>

                      <td style={{ ...tdStyle(c), textAlign: "right", fontWeight: 900 }}>
                        {number.format(productCount)}
                      </td>

                      <td style={{ ...tdStyle(c), textAlign: "right", fontWeight: 900 }}>
                        {number.format(toNumber(supplier.total_stock))}
                      </td>

                      <td style={{ ...tdStyle(c), textAlign: "right", fontWeight: 900, whiteSpace: "nowrap" }}>
                        {money.format(toNumber(supplier.stock_value))}
                      </td>

                      <td style={tdStyle(c)}>
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                          <button type="button" onClick={() => openEdit(supplier)} style={tableButtonStyle("#0f766e")}>
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(supplier.id, supplier.product_count)}
                            disabled={productCount > 0}
                            title={productCount > 0 ? "Reassign products before deleting this supplier" : "Delete supplier"}
                            style={{
                              ...tableButtonStyle(productCount > 0 ? "#64748b" : "#b91c1c"),
                              opacity: productCount > 0 ? 0.58 : 1,
                              cursor: productCount > 0 ? "not-allowed" : "pointer",
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <SupplierForm
          initialData={editingSupplier || {}}
          onSave={handleSave}
          onCancel={handleCancel}
          saving={saving}
        />
      )}
    </div>
  );
}

function MetricCard({ label, value, sub, c, isDark }) {
  return (
    <div
      style={{
        background: c.card,
        border: `1px solid ${c.border}`,
        borderRadius: 8,
        padding: 16,
        boxShadow: isDark ? "0 10px 24px rgba(0,0,0,0.18)" : "0 10px 30px rgba(15,23,42,0.05)",
      }}
    >
      <p style={{ margin: 0, color: c.textMuted, fontSize: 11, fontWeight: 900, letterSpacing: 0, textTransform: "uppercase" }}>
        {label}
      </p>
      <p style={{ margin: "9px 0 4px", color: c.text, fontSize: 26, fontWeight: 950, lineHeight: 1.05 }}>
        {value}
      </p>
      <p style={{ margin: 0, color: c.textMuted, fontSize: 12 }}>{sub}</p>
    </div>
  );
}

function tdStyle(c) {
  return {
    borderBottom: `1px solid ${c.borderLight}`,
    color: c.text,
    fontSize: 13,
    padding: "14px",
    verticalAlign: "middle",
  };
}

function tableButtonStyle(background) {
  return {
    background,
    border: "none",
    borderRadius: 8,
    color: "#fff",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 850,
    padding: "8px 11px",
  };
}
