import React, { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { getThemeColors } from "../utils/themeColors";
import {
  listPricingRules,
  createPricingRule,
  updatePricingRule,
  deletePricingRule,
  listPricingRuleTiers,
  createPricingRuleTier,
  updatePricingRuleTier,
  deletePricingRuleTier,
} from "../api/pricing";
import { listPricingGroups } from "../api/pricing";

// ─── Constants ────────────────────────────────────────────────────────────────

const RULE_TYPES = [
  { value: "FIXED_UNIT", label: "Fixed unit price" },
  { value: "SKU_THRESHOLD", label: "Same-product threshold (wholesale when qty met)" },
  { value: "GROUP_THRESHOLD", label: "Group mix threshold (mix products to qualify)" },
  { value: "SKU_TIERED", label: "Same-product tiered (price bands by product qty)" },
  { value: "GROUP_TIERED", label: "Group tiered (price bands by combined group qty)" },
];

const TIERED_TYPES = new Set(["SKU_TIERED", "GROUP_TIERED"]);
const GROUP_TYPES = new Set(["GROUP_THRESHOLD", "GROUP_TIERED"]);
const THRESHOLD_TYPES = new Set(["SKU_THRESHOLD", "GROUP_THRESHOLD"]);

function ruleTypeLabel(type) {
  return RULE_TYPES.find((r) => r.value === type)?.label || type || "—";
}

// ─── Rule Preview ─────────────────────────────────────────────────────────────

function buildRulePreview(form) {
  const type = form.rule_type;
  const threshold = form.threshold_qty;
  const groupName = form.groupName || "the selected group";

  if (!type) return "Select a rule type to see a plain-English preview.";

  if (type === "FIXED_UNIT") {
    return "Customers always pay the fixed unit price for this product, regardless of quantity.";
  }
  if (type === "SKU_THRESHOLD") {
    if (threshold) {
      return `Customers get wholesale pricing when they buy ${threshold} or more of the same product.`;
    }
    return "Customers get wholesale pricing once they reach the minimum quantity of the same product.";
  }
  if (type === "GROUP_THRESHOLD") {
    if (threshold) {
      return `Customers can mix products in "${groupName}" and qualify for wholesale once combined quantity reaches ${threshold}.`;
    }
    return `Customers can mix products in this pricing group to qualify for wholesale.`;
  }
  if (type === "SKU_TIERED") {
    return "The unit price for this product is determined by quantity bands — the more the customer buys, the lower the price per unit.";
  }
  if (type === "GROUP_TIERED") {
    return `The unit price is determined by the combined quantity of all products in "${groupName}" — mixing products in the group counts toward the tier.`;
  }
  return "";
}

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

// ─── Tier Manager Sub-component ───────────────────────────────────────────────

function PricingUseGuide({ c, isDark }) {
  const cards = [
    {
      title: "Braids mix 12+",
      body: "Use GROUP_THRESHOLD. Put every braid type in one pricing group, set threshold 12, then each braid can keep its own wholesale price.",
    },
    {
      title: "Brazilian wool",
      body: "Use SKU_TIERED for one wool item, or GROUP_TIERED if wool SKUs can be mixed. Add tiers 1-5 at KES 100 and 6+ at KES 50.",
    },
    {
      title: "Manual price",
      body: "Use only for quotation items. Normal products should be priced by fixed, threshold, or tiered rules.",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 12,
        marginBottom: 18,
      }}
    >
      {cards.map((card) => (
        <div
          key={card.title}
          style={{
            background: isDark ? "rgba(255,255,255,0.04)" : "#fff",
            border: `1px solid ${c.border}`,
            borderRadius: 12,
            padding: 14,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 900, color: c.text, marginBottom: 6 }}>
            {card.title}
          </div>
          <div style={{ fontSize: 12, color: c.textMuted, lineHeight: 1.55 }}>
            {card.body}
          </div>
        </div>
      ))}
    </div>
  );
}

function TierManager({ rule, c, isDark }) {
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editTier, setEditTier] = useState(null);
  const [form, setForm] = useState({ min_qty: "", max_qty: "", unit_price: "" });

  async function load() {
    setLoading(true);
    try {
      const data = await listPricingRuleTiers(rule.id);
      const list = data?.data || data;
      setTiers(Array.isArray(list) ? list : []);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Failed to load tiers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [rule.id]);

  function openNew() {
    setEditTier(null);
    setForm({ min_qty: "", max_qty: "", unit_price: "" });
    setShowForm(true);
    setErr("");
  }

  function openEdit(t) {
    setEditTier(t);
    setForm({ min_qty: String(t.min_qty), max_qty: t.max_qty != null ? String(t.max_qty) : "", unit_price: String(t.unit_price) });
    setShowForm(true);
    setErr("");
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    const min = parseInt(form.min_qty);
    const max = form.max_qty ? parseInt(form.max_qty) : null;
    const price = parseFloat(form.unit_price);

    if (!Number.isFinite(min) || min < 1) return setErr("Min quantity must be at least 1.");
    if (max !== null && max < min) return setErr("Max quantity must be greater than or equal to min quantity.");
    if (!Number.isFinite(price) || price <= 0) return setErr("Unit price must be greater than 0.");

    // Client-side overlap check
    for (const t of tiers) {
      if (editTier && t.id === editTier.id) continue;
      const tMax = t.max_qty != null ? t.max_qty : Infinity;
      const newMax = max !== null ? max : Infinity;
      if (min <= tMax && newMax >= t.min_qty) {
        return setErr(`This range overlaps with existing tier (${t.min_qty}–${t.max_qty ?? "∞"}).`);
      }
    }

    try {
      const payload = { min_qty: min, max_qty: max, unit_price: price };
      if (editTier) {
        await updatePricingRuleTier(rule.id, editTier.id, payload);
      } else {
        await createPricingRuleTier(rule.id, payload);
      }
      setShowForm(false);
      setEditTier(null);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Failed to save tier");
    }
  }

  async function onDelete(tierId) {
    if (!confirm("Delete this tier?")) return;
    try {
      await deletePricingRuleTier(rule.id, tierId);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Failed to delete tier");
    }
  }

  const sorted = [...tiers].sort((a, b) => a.min_qty - b.min_qty);

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: c.text }}>
          📊 Quantity tiers for: <em>{rule.name}</em>
        </div>
        <button style={primaryBtn()} onClick={openNew}>+ Add tier</button>
      </div>

      {err && (
        <div style={{ background: isDark ? "rgba(220,53,69,0.12)" : "#fee2e2", color: "#b91c1c", padding: "10px 14px", borderRadius: 6, marginBottom: 10, fontSize: 13 }}>
          ⚠️ {err}
        </div>
      )}

      {showForm && (
        <form onSubmit={onSubmit} style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 8, padding: 16, marginBottom: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div>
              <label style={labelSt(c)}>Min Qty *</label>
              <input type="number" min="1" value={form.min_qty} onChange={(e) => setForm({ ...form, min_qty: e.target.value })} style={inputSt(c)} />
            </div>
            <div>
              <label style={labelSt(c)}>Max Qty (blank = unlimited)</label>
              <input type="number" min="1" value={form.max_qty} onChange={(e) => setForm({ ...form, max_qty: e.target.value })} style={inputSt(c)} />
            </div>
            <div>
              <label style={labelSt(c)}>Unit Price (KES) *</label>
              <input type="number" step="0.01" min="0.01" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} style={inputSt(c)} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" style={primaryBtn()}>
              {editTier ? "Update" : "Add tier"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} style={secondaryBtn(c)}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div style={{ color: c.textMuted, fontSize: 13, padding: "12px 0" }}>Loading tiers…</div>
      ) : sorted.length === 0 ? (
        <div style={{ padding: 24, textAlign: "center", color: c.textMuted, fontSize: 13, background: c.card, borderRadius: 8, border: `1px solid ${c.border}` }}>
          ⚠️ No tiers configured yet. Add at least one tier so this rule functions correctly.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: c.headerBg, borderBottom: `1px solid ${c.border}` }}>
                <th style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: c.textMuted }}>Min Qty</th>
                <th style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: c.textMuted }}>Max Qty</th>
                <th style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: c.textMuted }}>Unit Price</th>
                <th style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: c.textMuted }}>Range Summary</th>
                <th style={{ padding: "10px 14px", textAlign: "center", fontWeight: 700, color: c.textMuted }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((t, idx) => (
                <tr key={t.id} style={{ borderBottom: `1px solid ${c.borderLight}`, background: idx % 2 === 0 ? c.rowBg1 : c.rowBg2 }}>
                  <td style={{ padding: "10px 14px", textAlign: "right", color: c.text, fontWeight: 600 }}>{t.min_qty}</td>
                  <td style={{ padding: "10px 14px", textAlign: "right", color: c.text, fontWeight: 600 }}>{t.max_qty ?? "∞"}</td>
                  <td style={{ padding: "10px 14px", textAlign: "right", color: "#667eea", fontWeight: 700 }}>
                    KES {Number(t.unit_price || 0).toFixed(2)}
                  </td>
                  <td style={{ padding: "10px 14px", textAlign: "right", color: c.textMuted, fontSize: 12 }}>
                    {t.min_qty}–{t.max_qty ?? "∞"} units → KES {Number(t.unit_price || 0).toFixed(2)}
                  </td>
                  <td style={{ padding: "10px 14px", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                      <button
                        onClick={() => openEdit(t)}
                        style={{ padding: "5px 10px", background: "#667eea", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 11, fontWeight: 600 }}
                      >✏️</button>
                      <button onClick={() => onDelete(t.id)} style={dangerBtn()}>🗑️</button>
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

// ─── Rule Form Modal ──────────────────────────────────────────────────────────

function RuleFormModal({ rule, groups, onClose, onSaved, c, isDark }) {
  const isEdit = !!rule;
  const [form, setForm] = useState({
    name: rule?.name || "",
    rule_type: rule?.rule_type || "",
    threshold_qty: rule?.threshold_qty != null ? String(rule.threshold_qty) : "",
    pricing_group_id: rule?.pricing_group_id != null ? String(rule.pricing_group_id) : "",
    is_active: rule?.is_active !== false,
  });
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const needsGroup = GROUP_TYPES.has(form.rule_type);
  const needsThreshold = THRESHOLD_TYPES.has(form.rule_type);
  const isTiered = TIERED_TYPES.has(form.rule_type);

  const selectedGroup = groups.find((g) => String(g.id) === form.pricing_group_id);
  const preview = buildRulePreview({ ...form, groupName: selectedGroup?.name });

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!form.name.trim()) return setErr("Rule name is required.");
    if (!form.rule_type) return setErr("Rule type is required.");
    if (needsGroup && !form.pricing_group_id) return setErr("A pricing group is required for this rule type.");
    if (needsThreshold && !form.threshold_qty) return setErr("Threshold quantity is required for this rule type.");

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        rule_type: form.rule_type,
        threshold_qty: needsThreshold && form.threshold_qty ? parseInt(form.threshold_qty) : null,
        pricing_group_id: needsGroup && form.pricing_group_id ? parseInt(form.pricing_group_id) : null,
        is_active: form.is_active,
      };

      if (isEdit) {
        await updatePricingRule(rule.id, payload);
      } else {
        await createPricingRule(payload);
      }
      onSaved();
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Failed to save rule");
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
        maxWidth: 540,
        boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        maxHeight: "90vh",
        overflowY: "auto",
      }}>
        <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 800, color: isDark ? "#f1f5f9" : "#0f172a" }}>
          {isEdit ? "Edit Pricing Rule" : "New Pricing Rule"}
        </h2>

        {err && (
          <div style={{ background: isDark ? "rgba(220,53,69,0.12)" : "#fee2e2", color: "#b91c1c", padding: "10px 14px", borderRadius: 6, marginBottom: 14, fontSize: 13 }}>
            ⚠️ {err}
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelSt(c)}>Rule name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Lotion Mix 6 Group"
              style={inputSt(c)}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelSt(c)}>Rule type *</label>
            <select
              value={form.rule_type}
              onChange={(e) => setForm({ ...form, rule_type: e.target.value, pricing_group_id: "", threshold_qty: "" })}
              style={inputSt(c)}
            >
              <option value="">— Select rule type —</option>
              {RULE_TYPES.map((rt) => (
                <option key={rt.value} value={rt.value}>{rt.label}</option>
              ))}
            </select>
          </div>

          {needsGroup && (
            <div style={{ marginBottom: 14 }}>
              <label style={labelSt(c)}>Pricing group * <span style={{ color: "#b91c1c" }}>required for group rules</span></label>
              <select
                value={form.pricing_group_id}
                onChange={(e) => setForm({ ...form, pricing_group_id: e.target.value })}
                style={inputSt(c)}
              >
                <option value="">— Select a pricing group —</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              {groups.length === 0 && (
                <div style={{ marginTop: 5, fontSize: 12, color: "#b45309" }}>
                  ⚠️ No pricing groups exist yet. Create a group first via Pricing Groups.
                </div>
              )}
            </div>
          )}

          {needsThreshold && (
            <div style={{ marginBottom: 14 }}>
              <label style={labelSt(c)}>Threshold quantity * <span style={{ color: "#b91c1c" }}>required</span></label>
              <input
                type="number"
                min="1"
                value={form.threshold_qty}
                onChange={(e) => setForm({ ...form, threshold_qty: e.target.value })}
                placeholder="e.g. 6"
                style={inputSt(c)}
              />
            </div>
          )}

          {isTiered && (
            <div style={{ marginBottom: 14, padding: "10px 14px", background: isDark ? "rgba(102,126,234,0.08)" : "#eff6ff", borderRadius: 7, border: `1px solid ${isDark ? "rgba(102,126,234,0.25)" : "#bfdbfe"}`, fontSize: 12, color: isDark ? "#93c5fd" : "#1d4ed8" }}>
              📊 This rule type uses <strong>quantity tiers</strong>. After saving, configure the tier bands on the rules list.
            </div>
          )}

          {form.rule_type === "FIXED_UNIT" && (
            <div style={{ marginBottom: 14, padding: "10px 14px", background: isDark ? "rgba(16,185,129,0.08)" : "#f0fdf4", borderRadius: 7, border: `1px solid ${isDark ? "rgba(16,185,129,0.25)" : "#bbf7d0"}`, fontSize: 12, color: isDark ? "#6ee7b7" : "#15803d" }}>
              ✅ Fixed unit price: no threshold or tiers needed. The product's retail price is always used.
            </div>
          )}

          {/* Live preview */}
          {form.rule_type && (
            <div style={{ marginBottom: 14, padding: "10px 14px", background: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc", borderRadius: 7, border: `1px solid ${c.border}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: c.textMuted, marginBottom: 4, textTransform: "uppercase" }}>
                Plain-English Preview
              </div>
              <div style={{ fontSize: 13, color: isDark ? "#f1f5f9" : "#0f172a", lineHeight: 1.6 }}>
                {preview}
              </div>
            </div>
          )}

          <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, color: isDark ? "#f1f5f9" : "#0f172a", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            Active (rule will be applied to products)
          </label>

          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" disabled={saving} style={primaryBtn()}>
              {saving ? "Saving…" : isEdit ? "Update rule" : "Create rule"}
            </button>
            <button type="button" onClick={onClose} style={secondaryBtn(c)}>Cancel</button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function PricingRules() {
  const { isDark } = useTheme();
  const c = getThemeColors(isDark);

  const [rules, setRules] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editRule, setEditRule] = useState(null);
  const [expandedTiers, setExpandedTiers] = useState(new Set());

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const [rulesData, groupsData] = await Promise.all([
        listPricingRules(),
        listPricingGroups(),
      ]);
      const rList = rulesData?.data || rulesData;
      const gList = groupsData?.data || groupsData;
      setRules(Array.isArray(rList) ? rList : []);
      setGroups(Array.isArray(gList) ? gList : []);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Failed to load pricing rules");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function onDelete(id) {
    if (!confirm("Delete this pricing rule? Products assigned to it will lose their rule.")) return;
    try {
      await deletePricingRule(id);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Failed to delete rule");
    }
  }

  function toggleTiers(ruleId) {
    setExpandedTiers((prev) => {
      const next = new Set(prev);
      if (next.has(ruleId)) next.delete(ruleId);
      else next.add(ruleId);
      return next;
    });
  }

  function groupName(groupId) {
    if (!groupId) return null;
    return groups.find((g) => g.id === groupId)?.name || `Group #${groupId}`;
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: c.textMuted, background: c.bg, minHeight: "100vh" }}>
        Loading pricing rules…
      </div>
    );
  }

  return (
    <div style={{ background: c.bg, minHeight: "100vh", padding: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 800, color: c.text }}>
            🏷️ Pricing Rules
          </h1>
          <p style={{ margin: 0, color: c.textMuted, fontSize: 13 }}>
            Manage how prices are calculated — fixed, threshold, or tiered — for individual products or product groups.
          </p>
        </div>
        <button
          style={primaryBtn()}
          onClick={() => { setEditRule(null); setShowForm(true); }}
        >
          + New Rule
        </button>
      </div>

      <PricingUseGuide c={c} isDark={isDark} />

      {err && (
        <div style={{ background: isDark ? "rgba(220,53,69,0.1)" : "#fee2e2", color: "#b91c1c", padding: 12, borderRadius: 6, marginBottom: 20, border: "1px solid #fecaca", fontSize: 13 }}>
          ⚠️ {err}
        </div>
      )}

      {rules.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, background: c.card, borderRadius: 10, color: c.textMuted, border: `1px solid ${c.border}` }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏷️</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>No pricing rules yet</div>
          <div style={{ fontSize: 13 }}>
            Create your first rule to define how products are priced — fixed, threshold, or tiered.
          </div>
        </div>
      ) : (
        <div style={{ background: c.card, borderRadius: 10, border: `1px solid ${c.border}`, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
              <thead>
                <tr style={{ background: c.headerBg, borderBottom: `1px solid ${c.border}` }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 800, color: c.textMuted }}>Rule Name</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 800, color: c.textMuted }}>Type</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 800, color: c.textMuted }}>Group</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 12, fontWeight: 800, color: c.textMuted }}>Threshold</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 12, fontWeight: 800, color: c.textMuted }}>Status</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 12, fontWeight: 800, color: c.textMuted }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule, idx) => {
                  const isTiered = TIERED_TYPES.has(rule.rule_type);
                  const expanded = expandedTiers.has(rule.id);
                  return (
                    <React.Fragment key={rule.id}>
                      <tr style={{ borderBottom: `1px solid ${c.borderLight}`, background: idx % 2 === 0 ? c.rowBg1 : c.rowBg2 }}>
                        <td style={{ padding: "12px 16px", color: c.text, fontWeight: 700, fontSize: 13 }}>
                          {rule.name}
                          <div style={{ fontSize: 11, color: c.textMuted, fontWeight: 400, marginTop: 2 }}>
                            ID: {rule.id}
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: c.textMuted }}>
                          {ruleTypeLabel(rule.rule_type)}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: c.textMuted }}>
                          {groupName(rule.pricing_group_id) || <span style={{ color: c.textLight, fontStyle: "italic" }}>—</span>}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right", fontSize: 13, color: c.text, fontWeight: 600 }}>
                          {rule.threshold_qty != null ? rule.threshold_qty : <span style={{ color: c.textLight }}>—</span>}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "center" }}>
                          <span style={badge(rule.is_active !== false)}>
                            {rule.is_active !== false ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "center" }}>
                          <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                            {isTiered && (
                              <button
                                onClick={() => toggleTiers(rule.id)}
                                style={{ padding: "5px 10px", background: "#764ba2", color: "white", border: "none", borderRadius: 5, cursor: "pointer", fontSize: 11, fontWeight: 700 }}
                              >
                                {expanded ? "Hide Tiers" : "📊 Tiers"}
                              </button>
                            )}
                            <button
                              onClick={() => { setEditRule(rule); setShowForm(true); }}
                              style={{ padding: "5px 10px", background: "#667eea", color: "white", border: "none", borderRadius: 5, cursor: "pointer", fontSize: 11, fontWeight: 700 }}
                            >
                              ✏️ Edit
                            </button>
                            <button onClick={() => onDelete(rule.id)} style={dangerBtn()}>
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isTiered && expanded && (
                        <tr style={{ background: isDark ? "rgba(102,126,234,0.04)" : "#f8fafc" }}>
                          <td colSpan={6} style={{ padding: "16px 24px", borderBottom: `1px solid ${c.borderLight}` }}>
                            <TierManager rule={rule} c={c} isDark={isDark} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <RuleFormModal
          rule={editRule}
          groups={groups}
          c={c}
          isDark={isDark}
          onClose={() => { setShowForm(false); setEditRule(null); }}
          onSaved={() => { setShowForm(false); setEditRule(null); load(); }}
        />
      )}
    </div>
  );
}
