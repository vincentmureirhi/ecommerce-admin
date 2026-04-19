import React, { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { getThemeColors } from "../utils/themeColors";
import {
  listFlashSales,
  createFlashSale,
  updateFlashSale,
  deleteFlashSale,
  getFlashSaleProducts,
  addProductToFlashSale,
  removeProductFromFlashSale,
} from "../api/flashSales";
import { listProducts } from "../api/products";

function money(value) {
  return `KES ${parseFloat(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
  })}`;
}

function getSaleStatus(sale) {
  const now = new Date();
  const start = new Date(sale.start_date);
  const end = new Date(sale.end_date);

  if (now < start) return "upcoming";
  if (now > end) return "expired";
  return "active";
}

function statusBadgeStyle(status, isDark) {
  if (status === "active") {
    return {
      bg: isDark ? "rgba(16,185,129,0.20)" : "#d1fae5",
      color: isDark ? "#4ade80" : "#047857",
    };
  }
  if (status === "upcoming") {
    return {
      bg: isDark ? "rgba(59,130,246,0.20)" : "#dbeafe",
      color: isDark ? "#93c5fd" : "#1d4ed8",
    };
  }
  return {
    bg: isDark ? "rgba(148,163,184,0.20)" : "#e2e8f0",
    color: isDark ? "#cbd5e1" : "#475569",
  };
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

const EMPTY_FORM = {
  name: "",
  discount_type: "percentage",
  discount_value: "",
  start_date: "",
  end_date: "",
  description: "",
};

function toInputDatetime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function FlashSales() {
  const { isDark } = useTheme();
  const c = getThemeColors(isDark);

  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Create / Edit modal
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("create"); // "create" | "edit"
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formErr, setFormErr] = useState("");

  // Delete confirmation
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Products modal
  const [productsModalSale, setProductsModalSale] = useState(null);
  const [saleProducts, setSaleProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [addingProductId, setAddingProductId] = useState(null);
  const [removingProductId, setRemovingProductId] = useState(null);
  const [productsErr, setProductsErr] = useState("");

  async function loadSales() {
    try {
      setLoading(true);
      setErr("");
      const res = await listFlashSales();
      const rows = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setSales(rows);
    } catch (e) {
      setErr(e?.message || "Failed to load flash sales");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSales();
  }, []);

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormMode("create");
    setEditingId(null);
    setFormErr("");
    setShowForm(true);
  }

  function openEdit(sale) {
    setForm({
      name: sale.name || "",
      discount_type: sale.discount_type || "percentage",
      discount_value: String(sale.discount_value || ""),
      start_date: toInputDatetime(sale.start_date),
      end_date: toInputDatetime(sale.end_date),
      description: sale.description || "",
    });
    setFormMode("edit");
    setEditingId(sale.id);
    setFormErr("");
    setShowForm(true);
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    setFormLoading(true);
    setFormErr("");

    const payload = {
      name: form.name.trim(),
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value),
      start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
      end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
      description: form.description.trim() || null,
    };

    try {
      if (formMode === "create") {
        await createFlashSale(payload);
        showSuccess("Flash sale created successfully");
      } else {
        await updateFlashSale(editingId, payload);
        showSuccess("Flash sale updated successfully");
      }
      setShowForm(false);
      loadSales();
    } catch (e) {
      setFormErr(e?.response?.data?.message || e?.message || "Failed to save flash sale");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete() {
    if (!deletingId) return;
    setDeleteLoading(true);
    try {
      await deleteFlashSale(deletingId);
      setDeletingId(null);
      showSuccess("Flash sale deleted");
      loadSales();
    } catch (e) {
      setErr(e?.message || "Failed to delete flash sale");
      setDeletingId(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  async function openProductsModal(sale) {
    setProductsModalSale(sale);
    setProductSearch("");
    setProductsErr("");
    setProductsLoading(true);
    setSaleProducts([]);

    try {
      const [saleProdsRes, allProdsRes] = await Promise.all([
        getFlashSaleProducts(sale.id),
        listProducts(),
      ]);

      const sp = Array.isArray(saleProdsRes?.data)
        ? saleProdsRes.data
        : Array.isArray(saleProdsRes)
        ? saleProdsRes
        : [];
      setSaleProducts(sp);

      const ap = Array.isArray(allProdsRes?.data)
        ? allProdsRes.data
        : Array.isArray(allProdsRes)
        ? allProdsRes
        : [];
      setAllProducts(ap);
    } catch (e) {
      setProductsErr(e?.message || "Failed to load products");
    } finally {
      setProductsLoading(false);
    }
  }

  async function handleAddProduct(productId) {
    setAddingProductId(productId);
    try {
      await addProductToFlashSale(productsModalSale.id, productId);
      const res = await getFlashSaleProducts(productsModalSale.id);
      const sp = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setSaleProducts(sp);
      showSuccess("Product added to flash sale");
    } catch (e) {
      setProductsErr(e?.response?.data?.message || e?.message || "Failed to add product");
    } finally {
      setAddingProductId(null);
    }
  }

  async function handleRemoveProduct(productId) {
    setRemovingProductId(productId);
    try {
      await removeProductFromFlashSale(productsModalSale.id, productId);
      setSaleProducts((prev) => prev.filter((p) => p.product_id !== productId && p.id !== productId));
      showSuccess("Product removed from flash sale");
    } catch (e) {
      setProductsErr(e?.message || "Failed to remove product");
    } finally {
      setRemovingProductId(null);
    }
  }

  function showSuccess(msg) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  }

  const saleProductIds = new Set(saleProducts.map((p) => p.product_id || p.id));

  const filteredAllProducts = allProducts.filter((p) => {
    if (!productSearch.trim()) return true;
    const q = productSearch.toLowerCase();
    return (
      String(p.name || "").toLowerCase().includes(q) ||
      String(p.sku || "").toLowerCase().includes(q)
    );
  });

  const activeCount = sales.filter((s) => getSaleStatus(s) === "active").length;
  const upcomingCount = sales.filter((s) => getSaleStatus(s) === "upcoming").length;
  const expiredCount = sales.filter((s) => getSaleStatus(s) === "expired").length;

  return (
    <div style={{ background: c.bg, minHeight: "100vh", padding: 20 }}>
      {/* Header */}
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
          <h1 style={{ margin: "0 0 5px 0", fontSize: 28, fontWeight: 800, color: c.text }}>
            ⚡ Flash Sales
          </h1>
          <p style={{ margin: 0, color: c.textMuted, fontSize: 13 }}>
            Create and manage time-limited flash sales &amp; product discounts
          </p>
        </div>

        <button
          onClick={openCreate}
          style={{
            padding: "10px 18px",
            background: "#667eea",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          + New Flash Sale
        </button>
      </div>

      {/* Success message */}
      {successMsg && (
        <div
          style={{
            background: isDark ? "rgba(16,185,129,0.15)" : "#d1fae5",
            color: isDark ? "#4ade80" : "#047857",
            border: `1px solid ${isDark ? "rgba(16,185,129,0.3)" : "#a7f3d0"}`,
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          ✓ {successMsg}
        </div>
      )}

      {/* Error */}
      {err && (
        <div
          style={{
            background: isDark ? "rgba(239,68,68,0.10)" : "#fee2e2",
            color: isDark ? "#fca5a5" : "#b91c1c",
            border: `1px solid ${isDark ? "rgba(239,68,68,0.25)" : "#fecaca"}`,
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          ⚠️ {err}
        </div>
      )}

      {/* Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <SummaryCard title="Total Flash Sales" value={sales.length} subtitle="All time" c={c} />
        <SummaryCard title="Active" value={activeCount} subtitle="Running now" c={c} />
        <SummaryCard title="Upcoming" value={upcomingCount} subtitle="Scheduled" c={c} />
        <SummaryCard title="Expired" value={expiredCount} subtitle="Ended" c={c} />
      </div>

      {/* Table */}
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
            Loading flash sales...
          </div>
        ) : sales.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: c.textMuted }}>
            No flash sales found. Click "+ New Flash Sale" to create one.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
              <thead>
                <tr style={{ background: c.headerBg, borderBottom: `1px solid ${c.border}` }}>
                  <th style={thStyle(c)}>Name</th>
                  <th style={thStyle(c)}>Discount</th>
                  <th style={thStyle(c)}>Start Date</th>
                  <th style={thStyle(c)}>End Date</th>
                  <th style={{ ...thStyle(c), textAlign: "center" }}>Status</th>
                  <th style={{ ...thStyle(c), textAlign: "center" }}>Products</th>
                  <th style={{ ...thStyle(c), textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale, idx) => {
                  const status = getSaleStatus(sale);
                  const badge = statusBadgeStyle(status, isDark);

                  return (
                    <tr
                      key={sale.id}
                      style={{
                        borderBottom: `1px solid ${c.border}`,
                        background: idx % 2 === 0 ? "transparent" : isDark ? "rgba(255,255,255,0.01)" : "#fafafa",
                      }}
                    >
                      <td style={tdPrimary(c)}>
                        {sale.name}
                        {sale.description && (
                          <div style={{ fontSize: 11, color: c.textMuted, fontWeight: 400, marginTop: 2 }}>
                            {sale.description}
                          </div>
                        )}
                      </td>

                      <td style={tdMuted(c)}>
                        <span
                          style={{
                            background: isDark ? "rgba(102,126,234,0.2)" : "#ede9fe",
                            color: isDark ? "#a78bfa" : "#5b21b6",
                            padding: "4px 8px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {sale.discount_type === "percentage"
                            ? `${sale.discount_value}%`
                            : `KES ${sale.discount_value}`}
                        </span>
                      </td>

                      <td style={tdMuted(c)}>
                        {sale.start_date ? new Date(sale.start_date).toLocaleString() : "—"}
                      </td>

                      <td style={tdMuted(c)}>
                        {sale.end_date ? new Date(sale.end_date).toLocaleString() : "—"}
                      </td>

                      <td style={{ ...tdBase, textAlign: "center" }}>
                        <span
                          style={{
                            background: badge.bg,
                            color: badge.color,
                            padding: "5px 10px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            display: "inline-block",
                            textTransform: "capitalize",
                          }}
                        >
                          {status}
                        </span>
                      </td>

                      <td style={{ ...tdBase, textAlign: "center" }}>
                        <button
                          onClick={() => openProductsModal(sale)}
                          style={{
                            background: isDark ? "rgba(14,165,233,0.18)" : "#e0f2fe",
                            color: "#0284c7",
                            border: "none",
                            padding: "4px 10px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {sale.products_count != null ? `${sale.products_count} products` : "Manage"}
                        </button>
                      </td>

                      <td style={{ ...tdBase, textAlign: "center" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                          <button
                            onClick={() => openEdit(sale)}
                            style={smallBtn("#667eea")}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeletingId(sale.id)}
                            style={smallBtn("#dc2626")}
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
        )}
      </div>

      {/* ─── Create / Edit Modal ─── */}
      {showForm && (
        <ModalOverlay onClose={() => setShowForm(false)}>
          <div
            style={{
              background: c.card,
              borderRadius: 12,
              padding: 28,
              width: "100%",
              maxWidth: 520,
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: c.text }}>
                {formMode === "create" ? "⚡ New Flash Sale" : "✏️ Edit Flash Sale"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 22,
                  cursor: "pointer",
                  color: c.textMuted,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            {formErr && (
              <div
                style={{
                  background: isDark ? "rgba(239,68,68,0.10)" : "#fee2e2",
                  color: isDark ? "#fca5a5" : "#b91c1c",
                  padding: 10,
                  borderRadius: 6,
                  marginBottom: 16,
                  fontSize: 13,
                }}
              >
                {formErr}
              </div>
            )}

            <form onSubmit={handleFormSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle(c)}>Sale Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Summer Flash Deal"
                  style={inputStyle(c)}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle(c)}>Discount Type *</label>
                  <select
                    value={form.discount_type}
                    onChange={(e) => setForm((f) => ({ ...f, discount_type: e.target.value }))}
                    style={inputStyle(c)}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (KES)</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle(c)}>
                    Discount Value *{" "}
                    <span style={{ fontWeight: 400 }}>
                      ({form.discount_type === "percentage" ? "%" : "KES"})
                    </span>
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.discount_value}
                    onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))}
                    placeholder={form.discount_type === "percentage" ? "e.g. 20" : "e.g. 500"}
                    style={inputStyle(c)}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle(c)}>Start Date &amp; Time *</label>
                  <input
                    required
                    type="datetime-local"
                    value={form.start_date}
                    onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                    style={inputStyle(c)}
                  />
                </div>

                <div>
                  <label style={labelStyle(c)}>End Date &amp; Time *</label>
                  <input
                    required
                    type="datetime-local"
                    value={form.end_date}
                    onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                    style={inputStyle(c)}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle(c)}>Description (optional)</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Short description of this sale..."
                  style={{ ...inputStyle(c), resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={btnSecondary(c)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  style={{
                    ...btnPrimary,
                    opacity: formLoading ? 0.7 : 1,
                    cursor: formLoading ? "not-allowed" : "pointer",
                  }}
                >
                  {formLoading
                    ? "Saving..."
                    : formMode === "create"
                    ? "Create Flash Sale"
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </ModalOverlay>
      )}

      {/* ─── Delete Confirmation Modal ─── */}
      {deletingId && (
        <ModalOverlay onClose={() => setDeletingId(null)}>
          <div
            style={{
              background: c.card,
              borderRadius: 12,
              padding: 28,
              width: "100%",
              maxWidth: 420,
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ marginTop: 0, marginBottom: 10, color: c.text }}>Delete Flash Sale?</h3>
            <p style={{ color: c.textMuted, marginBottom: 24, fontSize: 13 }}>
              This action cannot be undone. The flash sale and all its product assignments will be
              permanently removed.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setDeletingId(null)} style={btnSecondary(c)}>
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                style={{
                  padding: "10px 20px",
                  background: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  cursor: deleteLoading ? "not-allowed" : "pointer",
                  fontWeight: 700,
                  fontSize: 13,
                  opacity: deleteLoading ? 0.7 : 1,
                }}
              >
                {deleteLoading ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ─── Products Management Modal ─── */}
      {productsModalSale && (
        <ModalOverlay onClose={() => setProductsModalSale(null)}>
          <div
            style={{
              background: c.card,
              borderRadius: 12,
              padding: 28,
              width: "100%",
              maxWidth: 700,
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: c.text }}>
                📦 Products in "{productsModalSale.name}"
              </h2>
              <button
                onClick={() => setProductsModalSale(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 22,
                  cursor: "pointer",
                  color: c.textMuted,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            {productsErr && (
              <div
                style={{
                  background: isDark ? "rgba(239,68,68,0.10)" : "#fee2e2",
                  color: isDark ? "#fca5a5" : "#b91c1c",
                  padding: 10,
                  borderRadius: 6,
                  marginBottom: 16,
                  fontSize: 13,
                }}
              >
                {productsErr}
              </div>
            )}

            {productsLoading ? (
              <div style={{ textAlign: "center", padding: 40, color: c.textMuted }}>
                Loading products...
              </div>
            ) : (
              <>
                {/* Current products in sale */}
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ margin: "0 0 12px 0", color: c.text, fontSize: 14 }}>
                    Current Sale Products ({saleProducts.length})
                  </h4>

                  {saleProducts.length === 0 ? (
                    <div
                      style={{
                        padding: "16px",
                        textAlign: "center",
                        color: c.textMuted,
                        fontSize: 13,
                        border: `1px dashed ${c.border}`,
                        borderRadius: 8,
                      }}
                    >
                      No products added yet
                    </div>
                  ) : (
                    <div
                      style={{
                        border: `1px solid ${c.border}`,
                        borderRadius: 8,
                        overflow: "hidden",
                      }}
                    >
                      {saleProducts.map((sp, idx) => (
                        <div
                          key={sp.product_id || sp.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "10px 14px",
                            borderBottom: idx < saleProducts.length - 1 ? `1px solid ${c.border}` : "none",
                            background: idx % 2 === 0 ? "transparent" : isDark ? "rgba(255,255,255,0.02)" : "#fafafa",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, color: c.text, fontSize: 13 }}>
                              {sp.product_name || sp.name}
                            </div>
                            {sp.sku && (
                              <div style={{ fontSize: 11, color: c.textMuted }}>
                                SKU: {sp.sku}
                              </div>
                            )}
                            {sp.original_price != null && (
                              <div style={{ fontSize: 11, color: c.textMuted }}>
                                Price: {money(sp.original_price)} →{" "}
                                <span style={{ color: isDark ? "#4ade80" : "#16a34a", fontWeight: 700 }}>
                                  {money(sp.discounted_price || sp.sale_price)}
                                </span>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handleRemoveProduct(sp.product_id || sp.id)}
                            disabled={removingProductId === (sp.product_id || sp.id)}
                            style={{
                              padding: "5px 10px",
                              background: isDark ? "rgba(220,53,69,0.2)" : "#fee2e2",
                              color: isDark ? "#fca5a5" : "#b91c1c",
                              border: "none",
                              borderRadius: 6,
                              cursor: removingProductId === (sp.product_id || sp.id) ? "not-allowed" : "pointer",
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            {removingProductId === (sp.product_id || sp.id) ? "Removing..." : "Remove"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add products */}
                <div>
                  <h4 style={{ margin: "0 0 10px 0", color: c.text, fontSize: 14 }}>
                    Add Products to Sale
                  </h4>

                  <input
                    type="text"
                    placeholder="Search products by name or SKU..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    style={{ ...inputStyle(c), marginBottom: 12 }}
                  />

                  <div
                    style={{
                      border: `1px solid ${c.border}`,
                      borderRadius: 8,
                      maxHeight: 260,
                      overflowY: "auto",
                    }}
                  >
                    {filteredAllProducts.length === 0 ? (
                      <div style={{ padding: 20, textAlign: "center", color: c.textMuted, fontSize: 13 }}>
                        No products match your search
                      </div>
                    ) : (
                      filteredAllProducts.map((p, idx) => {
                        const alreadyAdded = saleProductIds.has(p.id);

                        return (
                          <div
                            key={p.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "8px 14px",
                              borderBottom:
                                idx < filteredAllProducts.length - 1
                                  ? `1px solid ${c.border}`
                                  : "none",
                              background: alreadyAdded
                                ? isDark
                                  ? "rgba(16,185,129,0.08)"
                                  : "#f0fdf4"
                                : idx % 2 === 0
                                ? "transparent"
                                : isDark
                                ? "rgba(255,255,255,0.02)"
                                : "#fafafa",
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 600, color: c.text, fontSize: 13 }}>
                                {p.name}
                              </div>
                              <div style={{ fontSize: 11, color: c.textMuted }}>
                                {p.sku ? `SKU: ${p.sku} · ` : ""}
                                {money(p.selling_price || p.price)}
                              </div>
                            </div>

                            {alreadyAdded ? (
                              <span
                                style={{
                                  fontSize: 11,
                                  color: isDark ? "#4ade80" : "#16a34a",
                                  fontWeight: 700,
                                }}
                              >
                                ✓ Added
                              </span>
                            ) : (
                              <button
                                onClick={() => handleAddProduct(p.id)}
                                disabled={addingProductId === p.id}
                                style={{
                                  padding: "5px 10px",
                                  background: "#667eea",
                                  color: "white",
                                  border: "none",
                                  borderRadius: 6,
                                  cursor: addingProductId === p.id ? "not-allowed" : "pointer",
                                  fontSize: 11,
                                  fontWeight: 700,
                                  opacity: addingProductId === p.id ? 0.7 : 1,
                                }}
                              >
                                {addingProductId === p.id ? "Adding..." : "+ Add"}
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

function ModalOverlay({ children, onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {children}
    </div>
  );
}

const tdBase = {
  padding: 14,
  fontSize: 13,
  verticalAlign: "middle",
};

function tdPrimary(c) {
  return { ...tdBase, color: c.text, fontWeight: 700 };
}

function tdMuted(c) {
  return { ...tdBase, color: c.textMuted };
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

function smallBtn(bg) {
  return {
    padding: "6px 12px",
    background: bg,
    color: "white",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 11,
    fontWeight: 700,
  };
}

function labelStyle(c) {
  return {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    color: c.textMuted,
    marginBottom: 5,
  };
}

function inputStyle(c) {
  return {
    width: "100%",
    padding: "9px 12px",
    border: `1px solid ${c.border}`,
    borderRadius: 7,
    fontSize: 13,
    background: c.inputBg,
    color: c.text,
    boxSizing: "border-box",
  };
}

function btnSecondary(c) {
  return {
    padding: "10px 18px",
    background: c.buttonBg,
    color: c.text,
    border: `1px solid ${c.border}`,
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 13,
  };
}

const btnPrimary = {
  padding: "10px 20px",
  background: "#667eea",
  color: "white",
  border: "none",
  borderRadius: 8,
  fontWeight: 700,
  fontSize: 13,
};
