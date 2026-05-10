import React, { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { getThemeColors } from "../utils/themeColors";
import {
  listPricingGroups,
  createPricingGroup,
  updatePricingGroup,
  deletePricingGroup,
  listPricingGroupProducts,
  addProductToPricingGroup,
  removeProductFromPricingGroup,
} from "../api/pricing";
import { listProducts } from "../api/products";

// ─── Shared UI Helpers ────────────────────────────────────────────────────────

function ModalOverlay({ onClose, children }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

function inputSt(c) {
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

function labelSt(c) {
  return {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    color: c.textMuted,
    marginBottom: 5,
  };
}

function primaryBtn() {
  return {
    padding: "9px 18px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "none",
    borderRadius: 7,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
  };
}

function dangerBtn() {
  return {
    padding: "6px 12px",
    background: "#dc3545",
    color: "white",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 11,
    fontWeight: 700,
  };
}

function secondaryBtn(c) {
  return {
    padding: "9px 16px",
    background: c.buttonBg,
    color: c.text,
    border: `1px solid ${c.border}`,
    borderRadius: 7,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  };
}

function badge(active) {
  return {
    display: "inline-block",
    padding: "3px 8px",
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 700,
    background: active ? "#dcfce7" : "#fee2e2",
    color: active ? "#15803d" : "#b91c1c",
  };
}

// ─── Group Form Modal ─────────────────────────────────────────────────────────

function GroupFormModal({ group, onClose, onSaved, c, isDark }) {
  const isEdit = !!group;
  const [form, setForm] = useState({
    name: group?.name || "",
    description: group?.description || "",
    is_active: group?.is_active !== false,
  });
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    if (!form.name.trim()) return setErr("Group name is required.");

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        is_active: form.is_active,
      };
      if (isEdit) {
        await updatePricingGroup(group.id, payload);
      } else {
        await createPricingGroup(payload);
      }
      onSaved();
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Failed to save group");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{
        background: isDark ? "#1e293b" : "#fff",
        borderRadius: 12,
        padding: 24,
        width: "100%",
        maxWidth: 460,
        boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
      }}>
        <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 800, color: isDark ? "#f1f5f9" : "#0f172a" }}>
          {isEdit ? "Edit Pricing Group" : "New Pricing Group"}
        </h2>

        {err && (
          <div style={{ background: isDark ? "rgba(220,53,69,0.12)" : "#fee2e2", color: "#b91c1c", padding: "10px 14px", borderRadius: 6, marginBottom: 14, fontSize: 13 }}>
            ⚠️ {err}
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelSt(c)}>Group name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Lotions Mix 6"
              style={inputSt(c)}
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelSt(c)}>Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional description of this pricing group"
              style={{ ...inputSt(c), resize: "vertical" }}
            />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, color: isDark ? "#f1f5f9" : "#0f172a", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            Active group
          </label>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" disabled={saving} style={primaryBtn()}>
              {saving ? "Saving…" : isEdit ? "Update group" : "Create group"}
            </button>
            <button type="button" onClick={onClose} style={secondaryBtn(c)}>Cancel</button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
}

// ─── Group Products Modal ─────────────────────────────────────────────────────

function GroupProductsModal({ group, onClose, c, isDark }) {
  const [members, setMembers] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [err, setErr] = useState("");
  const [addingId, setAddingId] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadMembers() {
    setLoadingMembers(true);
    try {
      const data = await listPricingGroupProducts(group.id);
      const list = data?.data || data;
      setMembers(Array.isArray(list) ? list : []);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Failed to load group products");
    } finally {
      setLoadingMembers(false);
    }
  }

  async function loadProducts() {
    setLoadingProducts(true);
    try {
      const data = await listProducts();
      const list = data?.data || data;
      setAllProducts(Array.isArray(list) ? list : []);
    } catch (e) {
      // not critical if we can't load products
    } finally {
      setLoadingProducts(false);
    }
  }

  useEffect(() => {
    loadMembers();
    loadProducts();
  }, [group.id]);

  const memberIds = new Set(members.map((m) => m.product_id ?? m.id));
  const availableProducts = allProducts.filter((p) => !memberIds.has(p.id));

  async function onAdd() {
    if (!addingId) return;
    setSaving(true);
    setErr("");
    try {
      await addProductToPricingGroup(group.id, parseInt(addingId));
      setAddingId("");
      await loadMembers();
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Failed to add product");
    } finally {
      setSaving(false);
    }
  }

  async function onRemove(productId) {
    if (!confirm("Remove this product from the group?")) return;
    try {
      await removeProductFromPricingGroup(group.id, productId);
      await loadMembers();
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Failed to remove product");
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{
        background: isDark ? "#1e293b" : "#fff",
        borderRadius: 12,
        padding: 24,
        width: "100%",
        maxWidth: 560,
        maxHeight: "85vh",
        overflowY: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: isDark ? "#f1f5f9" : "#0f172a" }}>
              Products in group
            </h2>
            <div style={{ fontSize: 13, color: isDark ? "#94a3b8" : "#64748b" }}>
              {group.name}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: isDark ? "#94a3b8" : "#64748b", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>

        {err && (
          <div style={{ background: isDark ? "rgba(220,53,69,0.12)" : "#fee2e2", color: "#b91c1c", padding: "10px 14px", borderRadius: 6, marginBottom: 14, fontSize: 13 }}>
            ⚠️ {err}
          </div>
        )}

        {/* Add product */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <select
            value={addingId}
            onChange={(e) => setAddingId(e.target.value)}
            style={{ ...inputSt(c), flex: 1 }}
            disabled={loadingProducts || saving}
          >
            <option value="">— Select a product to add —</option>
            {availableProducts.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
            ))}
          </select>
          <button
            onClick={onAdd}
            disabled={!addingId || saving}
            style={{ ...primaryBtn(), opacity: !addingId || saving ? 0.55 : 1, whiteSpace: "nowrap" }}
          >
            {saving ? "Adding…" : "+ Add"}
          </button>
        </div>

        {/* Member list */}
        {loadingMembers ? (
          <div style={{ color: c.textMuted, fontSize: 13 }}>Loading members…</div>
        ) : members.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: c.textMuted, fontSize: 13, background: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc", borderRadius: 8, border: `1px solid ${c.border}` }}>
            No products in this group yet. Add products above.
          </div>
        ) : (
          <div style={{ border: `1px solid ${c.border}`, borderRadius: 8, overflow: "hidden" }}>
            {members.map((m, idx) => {
              const pid = m.product_id ?? m.id;
              const name = m.product_name || m.name || `Product #${pid}`;
              const sku = m.sku || "";
              return (
                <div
                  key={pid}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderBottom: idx < members.length - 1 ? `1px solid ${c.borderLight}` : "none",
                    background: idx % 2 === 0 ? c.rowBg1 : c.rowBg2,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{name}</div>
                    {sku && <div style={{ fontSize: 11, color: c.textMuted }}>SKU: {sku}</div>}
                  </div>
                  <button onClick={() => onRemove(pid)} style={dangerBtn()}>
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ModalOverlay>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function PricingGroups() {
  const { isDark } = useTheme();
  const c = getThemeColors(isDark);

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editGroup, setEditGroup] = useState(null);
  const [viewGroup, setViewGroup] = useState(null);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const data = await listPricingGroups();
      const list = data?.data || data;
      setGroups(Array.isArray(list) ? list : []);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Failed to load pricing groups");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function onDelete(id) {
    if (!confirm("Delete this pricing group? Products in it will be removed from the group.")) return;
    try {
      await deletePricingGroup(id);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Failed to delete group");
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: c.textMuted, background: c.bg, minHeight: "100vh" }}>
        Loading pricing groups…
      </div>
    );
  }

  return (
    <div style={{ background: c.bg, minHeight: "100vh", padding: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 800, color: c.text }}>
            🗂️ Pricing Groups
          </h1>
          <p style={{ margin: 0, color: c.textMuted, fontSize: 13 }}>
            Group products together so customers can mix them to reach a pricing threshold or tier.
          </p>
        </div>
        <button style={primaryBtn()} onClick={() => { setEditGroup(null); setShowForm(true); }}>
          + New Group
        </button>
      </div>

      {err && (
        <div style={{ background: isDark ? "rgba(220,53,69,0.1)" : "#fee2e2", color: "#b91c1c", padding: 12, borderRadius: 6, marginBottom: 20, border: "1px solid #fecaca", fontSize: 13 }}>
          ⚠️ {err}
        </div>
      )}

      {groups.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, background: c.card, borderRadius: 10, color: c.textMuted, border: `1px solid ${c.border}` }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🗂️</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>No pricing groups yet</div>
          <div style={{ fontSize: 13, maxWidth: 360, margin: "0 auto" }}>
            Create a group to allow customers to mix products and qualify for group-based pricing rules (threshold or tiered).
          </div>
        </div>
      ) : (
        <div style={{ background: c.card, borderRadius: 10, border: `1px solid ${c.border}`, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 540 }}>
              <thead>
                <tr style={{ background: c.headerBg, borderBottom: `1px solid ${c.border}` }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 800, color: c.textMuted }}>Group Name</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 800, color: c.textMuted }}>Description</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 12, fontWeight: 800, color: c.textMuted }}>Products</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 12, fontWeight: 800, color: c.textMuted }}>Status</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 12, fontWeight: 800, color: c.textMuted }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group, idx) => (
                  <tr key={group.id} style={{ borderBottom: `1px solid ${c.borderLight}`, background: idx % 2 === 0 ? c.rowBg1 : c.rowBg2 }}>
                    <td style={{ padding: "12px 16px", color: c.text, fontWeight: 700, fontSize: 13 }}>
                      {group.name}
                      <div style={{ fontSize: 11, color: c.textMuted, fontWeight: 400, marginTop: 2 }}>ID: {group.id}</div>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: c.textMuted, maxWidth: 240 }}>
                      {group.description || <span style={{ fontStyle: "italic" }}>—</span>}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontSize: 13, fontWeight: 700, color: c.text }}>
                      {group.product_count != null ? group.product_count : "—"}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      <span style={badge(group.is_active !== false)}>
                        {group.is_active !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                        <button
                          onClick={() => setViewGroup(group)}
                          style={{ padding: "5px 10px", background: "#667eea", color: "white", border: "none", borderRadius: 5, cursor: "pointer", fontSize: 11, fontWeight: 700 }}
                        >
                          👥 Products
                        </button>
                        <button
                          onClick={() => { setEditGroup(group); setShowForm(true); }}
                          style={{ padding: "5px 10px", background: "#764ba2", color: "white", border: "none", borderRadius: 5, cursor: "pointer", fontSize: 11, fontWeight: 700 }}
                        >
                          ✏️ Edit
                        </button>
                        <button onClick={() => onDelete(group.id)} style={dangerBtn()}>
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <GroupFormModal
          group={editGroup}
          c={c}
          isDark={isDark}
          onClose={() => { setShowForm(false); setEditGroup(null); }}
          onSaved={() => { setShowForm(false); setEditGroup(null); load(); }}
        />
      )}

      {viewGroup && (
        <GroupProductsModal
          group={viewGroup}
          c={c}
          isDark={isDark}
          onClose={() => setViewGroup(null)}
        />
      )}
    </div>
  );
}
