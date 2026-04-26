import React, { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { getThemeColors } from "../utils/themeColors";
import { listProducts } from "../api/products";
import { listPriceTiersByProduct, createPriceTier, updatePriceTier, deletePriceTier } from "../api/priceTiers";

export default function PriceTiers() {
  const { isDark } = useTheme();
  const c = getThemeColors(isDark);

  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [tiers, setTiers] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    min_qty: "",
    max_qty: "",
    unit_price: "",
  });

  async function loadProducts() {
    try {
      const data = await listProducts();
      const list = data?.data || data;
      setProducts(Array.isArray(list) ? list : []);
      if (list && list.length > 0) {
        setSelectedProductId(list[0].id);
        await loadTiers(list[0].id);
      }
    } catch (e) {
      setErr(e?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  async function loadTiers(productId) {
    if (!productId) return;
    setErr("");
    try {
      const data = await listPriceTiersByProduct(productId);
      const list = data?.data || data;
      setTiers(Array.isArray(list) ? list : []);
    } catch (e) {
      setErr(e?.message || "Failed to load tiers");
      setTiers([]);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!form.min_qty) return setErr("Min quantity is required");
    if (!form.unit_price) return setErr("Unit price is required");

    try {
      const payload = {
        product_id: parseInt(selectedProductId),
        min_qty: parseInt(form.min_qty),
        max_qty: form.max_qty ? parseInt(form.max_qty) : null,
        unit_price: parseFloat(form.unit_price),
      };

      if (editId) {
        await updatePriceTier(editId, payload);
      } else {
        await createPriceTier(payload);
      }

      setForm({ min_qty: "", max_qty: "", unit_price: "" });
      setEditId(null);
      setShowForm(false);
      await loadTiers(selectedProductId);
    } catch (e) {
      setErr(e?.message || "Failed to save tier");
    }
  }

  async function onDelete(id) {
    if (!confirm("Delete this tier?")) return;
    try {
      await deletePriceTier(id);
      await loadTiers(selectedProductId);
    } catch (e) {
      setErr(e?.message || "Failed to delete tier");
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: c.textMuted, background: c.bg, minHeight: "100vh" }}>Loading...</div>;

  return (
    <div style={{ background: c.bg, minHeight: "100vh", padding: "20px" }}>
      <div style={{ marginBottom: 30 }}>
        <h1 style={{ marginTop: 0, marginBottom: 5, fontSize: 28, fontWeight: 700, color: c.text }}>
          📊 Volume Tiers
        </h1>
        <p style={{ margin: 0, color: c.textMuted, fontSize: 13 }}>
          Manage quantity-based price tiers for products that use Volume Pricing. Select a product below to view or edit its tiers.
        </p>
      </div>

      <div style={{
        background: isDark ? "rgba(102, 126, 234, 0.1)" : "#f0f4ff",
        border: `1px solid ${isDark ? "rgba(102, 126, 234, 0.3)" : "#c7d2fe"}`,
        borderRadius: 8,
        padding: "12px 16px",
        marginBottom: 20,
        fontSize: 13,
        color: isDark ? "#a5b4fc" : "#3730a3",
        lineHeight: 1.6,
      }}>
        <strong>Note:</strong> Tiers only apply to products using the <strong>Volume Pricing</strong> rule.
        Products on <strong>Fixed Price</strong>, <strong>Bulk Discount</strong>, or <strong>Group Wholesale</strong> rules do not use tiers.
        Products with no pricing rule default to standard retail pricing.
      </div>

      {err && (
        <div style={{
          background: isDark ? "rgba(220, 53, 69, 0.1)" : "#fee",
          color: isDark ? "#ff6b6b" : "#c33",
          padding: 12,
          borderRadius: 6,
          marginBottom: 20,
          border: `1px solid ${isDark ? "rgba(220, 53, 69, 0.3)" : "#fdd"}`,
        }}>
          ⚠️ {err}
        </div>
      )}

      {/* SELECT PRODUCT */}
      <div style={{
        background: c.card,
        padding: 16,
        borderRadius: 8,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        marginBottom: 20,
        border: `1px solid ${c.border}`,
      }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: c.textMuted, marginBottom: 6 }}>
          Select Product (Volume Pricing)
        </label>
        <select
          value={selectedProductId}
          onChange={(e) => {
            setSelectedProductId(e.target.value);
            loadTiers(e.target.value);
          }}
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
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditId(null);
            setForm({ min_qty: "", max_qty: "", unit_price: "" });
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
          {showForm ? "Cancel" : "+ Add Volume Tier"}
        </button>
      </div>

      {showForm && (
        <div style={{
          background: c.card,
          padding: 20,
          borderRadius: 8,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          marginBottom: 20,
          border: `1px solid ${c.border}`,
        }}>
          <form onSubmit={onSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: c.textMuted, marginBottom: 6 }}>
                  Min Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.min_qty}
                  onChange={(e) => setForm({ ...form, min_qty: e.target.value })}
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
                  Max Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.max_qty}
                  onChange={(e) => setForm({ ...form, max_qty: e.target.value })}
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
                  Unit Price (KES) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.unit_price}
                  onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
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

      {tiers.length === 0 && (
        <div style={{
          textAlign: "center",
          padding: 60,
          background: c.card,
          borderRadius: 8,
          color: c.textMuted,
          border: `1px solid ${c.border}`,
        }}>
          📊 No volume tiers defined for this product. Add a tier below to enable quantity-based pricing.
        </div>
      )}

      {tiers.length > 0 && (
        <div style={{
          background: c.card,
          borderRadius: 8,
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          border: `1px solid ${c.border}`,
          overflowX: "auto",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: c.headerBg, borderBottom: `1px solid ${c.border}` }}>
                <th style={{ padding: 12, textAlign: "right", fontSize: 12, fontWeight: 700, color: c.textMuted }}>
                  Min Qty
                </th>
                <th style={{ padding: 12, textAlign: "right", fontSize: 12, fontWeight: 700, color: c.textMuted }}>
                  Max Qty
                </th>
                <th style={{ padding: 12, textAlign: "right", fontSize: 12, fontWeight: 700, color: c.textMuted }}>
                  Unit Price
                </th>
                <th style={{ padding: 12, textAlign: "center", fontSize: 12, fontWeight: 700, color: c.textMuted }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((tier, idx) => (
                <tr
                  key={tier.id}
                  style={{
                    borderBottom: `1px solid ${c.borderLight}`,
                    background: idx % 2 === 0 ? c.rowBg1 : c.rowBg2,
                  }}
                >
                  <td style={{ padding: 12, textAlign: "right", fontSize: 13, color: c.text, fontWeight: 600 }}>
                    {tier.min_qty}
                  </td>
                  <td style={{ padding: 12, textAlign: "right", fontSize: 13, color: c.text, fontWeight: 600 }}>
                    {tier.max_qty || "∞"}
                  </td>
                  <td style={{ padding: 12, textAlign: "right", fontSize: 13, fontWeight: 600, color: "#667eea" }}>
                    KES {Number(tier.unit_price || 0).toFixed(2)}
                  </td>
                  <td style={{ padding: 12, textAlign: "center" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                      <button
                        onClick={() => {
                          setEditId(tier.id);
                          setForm({
                            min_qty: tier.min_qty,
                            max_qty: tier.max_qty || "",
                            unit_price: tier.unit_price,
                          });
                          setShowForm(true);
                        }}
                        style={{
                          padding: "5px 10px",
                          background: "#667eea",
                          color: "white",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontSize: 11,
                          fontWeight: 600,
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
                        ✏️
                      </button>
                      <button
                        onClick={() => onDelete(tier.id)}
                        style={{
                          padding: "5px 10px",
                          background: "#dc3545",
                          color: "white",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontSize: 11,
                          fontWeight: 600,
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#b82a2a";
                          e.currentTarget.style.transform = "scale(1.05)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#dc3545";
                          e.currentTarget.style.transform = "scale(1)";
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
