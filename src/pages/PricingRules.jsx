import React, { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import {
  listPricingRules,
  createPricingRule,
  updatePricingRule,
  deletePricingRule,
} from "../api/pricingRules";
import {
  RULE_TYPE_LABELS,
  RULE_TYPE_DESCRIPTIONS,
  RULE_TYPES,
  ruleNeedsThreshold,
} from "../lib/pricingRuleConstants";

const EMPTY_FORM = {
  name: "",
  rule_type: "CONSTANT",
  threshold_qty: "",
  description: "",
  is_active: true,
};

export default function PricingRules() {
  const { isDark } = useTheme();

  const colors = {
    light: {
      bg: "#f8fafc",
      card: "#ffffff",
      text: "#0f172a",
      border: "#e2e8f0",
      muted: "#64748b",
      inputBg: "#f8fafc",
      badgeBg: "#f1f5f9",
      badgeText: "#475569",
      activeBg: "#dcfce7",
      activeText: "#15803d",
      inactiveBg: "#fef2f2",
      inactiveText: "#b91c1c",
      dangerBg: "#fef2f2",
      dangerText: "#b91c1c",
      dangerBorder: "#fecaca",
    },
    dark: {
      bg: "#020617",
      card: "#111827",
      text: "#f8fafc",
      border: "#334155",
      muted: "#94a3b8",
      inputBg: "#0f172a",
      badgeBg: "#1e293b",
      badgeText: "#94a3b8",
      activeBg: "rgba(21,128,61,0.2)",
      activeText: "#4ade80",
      inactiveBg: "rgba(185,28,28,0.2)",
      inactiveText: "#fca5a5",
      dangerBg: "rgba(127,29,29,0.22)",
      dangerText: "#fca5a5",
      dangerBorder: "rgba(239,68,68,0.35)",
    },
  };

  const c = isDark ? colors.dark : colors.light;

  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function loadRules() {
    try {
      setLoading(true);
      setErr("");
      const res = await listPricingRules();
      const rows =
        res?.data?.data || res?.data || [];
      setRules(Array.isArray(rows) ? rows : []);
    } catch {
      setErr("Failed to load pricing rules.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRules();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormErr("");
    setShowModal(true);
  }

  function openEdit(rule) {
    setEditingId(rule.id);
    setForm({
      name: rule.name || "",
      rule_type: rule.rule_type || "CONSTANT",
      threshold_qty: rule.threshold_qty != null ? String(rule.threshold_qty) : "",
      description: rule.description || "",
      is_active: rule.is_active !== false,
    });
    setFormErr("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormErr("");
  }

  async function handleSave(e) {
    e.preventDefault();
    setFormErr("");

    if (!form.name.trim()) {
      setFormErr("Rule name is required.");
      return;
    }
    if (!form.rule_type) {
      setFormErr("Rule type is required.");
      return;
    }
    const needsThreshold = ruleNeedsThreshold(form.rule_type);
    if (needsThreshold && (!form.threshold_qty || Number(form.threshold_qty) < 1)) {
      setFormErr("Threshold quantity must be at least 1 for this rule type.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        rule_type: form.rule_type,
        threshold_qty: needsThreshold ? Number(form.threshold_qty) : null,
        description: form.description.trim() || null,
        is_active: form.is_active,
      };

      if (editingId) {
        await updatePricingRule(editingId, payload);
        setSuccessMsg("Pricing rule updated.");
      } else {
        await createPricingRule(payload);
        setSuccessMsg("Pricing rule created.");
      }

      closeModal();
      await loadRules();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (e) {
      setFormErr(e?.response?.data?.message || e?.message || "Failed to save rule.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(rule) {
    try {
      await updatePricingRule(rule.id, { ...rule, is_active: !rule.is_active });
      setSuccessMsg(rule.is_active ? "Rule deactivated." : "Rule activated.");
      await loadRules();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch {
      setErr("Failed to update rule status.");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePricingRule(deleteTarget.id);
      setSuccessMsg("Pricing rule deleted.");
      setDeleteTarget(null);
      await loadRules();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Failed to delete rule.");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const inputSt = {
    width: "100%",
    padding: "10px 12px",
    border: `1px solid ${c.border}`,
    borderRadius: 8,
    fontSize: 13,
    boxSizing: "border-box",
    background: c.inputBg,
    color: c.text,
    outline: "none",
  };

  const needsThreshold = ruleNeedsThreshold(form.rule_type);

  return (
    <div style={{ minHeight: "100vh", background: c.bg, padding: 16 }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div>
            <h1
              style={{
                margin: "0 0 4px 0",
                fontSize: 26,
                fontWeight: 900,
                color: c.text,
              }}
            >
              Pricing Rules
            </h1>
            <p style={{ margin: 0, color: c.muted, fontSize: 14 }}>
              Define how products are priced at different quantities and configurations.
            </p>
          </div>
          <button
            onClick={openCreate}
            style={{
              padding: "10px 20px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            + New Rule
          </button>
        </div>

        {/* Banners */}
        {err && (
          <div
            style={{
              padding: 14,
              borderRadius: 10,
              background: c.dangerBg,
              color: c.dangerText,
              border: `1px solid ${c.dangerBorder}`,
              fontWeight: 700,
              marginBottom: 16,
            }}
          >
            {err}
          </div>
        )}
        {successMsg && (
          <div
            style={{
              padding: 14,
              borderRadius: 10,
              background: isDark ? "rgba(21,128,61,0.2)" : "#dcfce7",
              color: isDark ? "#4ade80" : "#15803d",
              border: `1px solid ${isDark ? "rgba(74,222,128,0.3)" : "#bbf7d0"}`,
              fontWeight: 700,
              marginBottom: 16,
            }}
          >
            {successMsg}
          </div>
        )}

        {/* Rule type legend */}
        <div
          style={{
            display: "grid",
            gap: 10,
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            marginBottom: 20,
          }}
        >
          {RULE_TYPES.map((rt) => (
            <div
              key={rt}
              style={{
                background: c.card,
                border: `1px solid ${c.border}`,
                borderRadius: 10,
                padding: "12px 14px",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 800, color: c.text, marginBottom: 2 }}>
                {RULE_TYPE_LABELS[rt]}
              </div>
              <div style={{ fontSize: 11, color: c.muted, lineHeight: 1.5 }}>
                {RULE_TYPE_DESCRIPTIONS[rt]}
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div
          style={{
            background: c.card,
            border: `1px solid ${c.border}`,
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          {loading ? (
            <div style={{ padding: 32, textAlign: "center", color: c.muted }}>
              Loading pricing rules…
            </div>
          ) : rules.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: c.muted }}>
              No pricing rules yet.{" "}
              <span
                style={{ color: "#667eea", cursor: "pointer", fontWeight: 700 }}
                onClick={openCreate}
              >
                Create the first rule.
              </span>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    borderBottom: `1px solid ${c.border}`,
                    background: isDark ? "#1e293b" : "#f8fafc",
                  }}
                >
                  {["Rule Name", "Type", "Threshold Qty", "Status", "Description", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          padding: "12px 14px",
                          textAlign: "left",
                          fontSize: 11,
                          fontWeight: 800,
                          color: c.muted,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {rules.map((rule, idx) => (
                  <tr
                    key={rule.id}
                    style={{
                      borderBottom:
                        idx < rules.length - 1 ? `1px solid ${c.border}` : "none",
                    }}
                  >
                    <td
                      style={{
                        padding: "12px 14px",
                        fontSize: 13,
                        fontWeight: 700,
                        color: c.text,
                      }}
                    >
                      {rule.name}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 10px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                          background: c.badgeBg,
                          color: c.badgeText,
                        }}
                      >
                        {RULE_TYPE_LABELS[rule.rule_type] || rule.rule_type}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        fontSize: 13,
                        color: c.muted,
                        textAlign: "center",
                      }}
                    >
                      {rule.threshold_qty != null ? rule.threshold_qty : "—"}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 10px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                          background: rule.is_active ? c.activeBg : c.inactiveBg,
                          color: rule.is_active ? c.activeText : c.inactiveText,
                        }}
                      >
                        {rule.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        fontSize: 12,
                        color: c.muted,
                        maxWidth: 220,
                      }}
                    >
                      {rule.description || "—"}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button
                          onClick={() => openEdit(rule)}
                          style={{
                            padding: "5px 12px",
                            fontSize: 12,
                            fontWeight: 700,
                            border: `1px solid ${c.border}`,
                            borderRadius: 6,
                            background: c.card,
                            color: c.text,
                            cursor: "pointer",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleActive(rule)}
                          style={{
                            padding: "5px 12px",
                            fontSize: 12,
                            fontWeight: 700,
                            border: "none",
                            borderRadius: 6,
                            background: rule.is_active ? c.inactiveBg : c.activeBg,
                            color: rule.is_active ? c.inactiveText : c.activeText,
                            cursor: "pointer",
                          }}
                        >
                          {rule.is_active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => setDeleteTarget(rule)}
                          style={{
                            padding: "5px 12px",
                            fontSize: 12,
                            fontWeight: 700,
                            border: "none",
                            borderRadius: 6,
                            background: c.dangerBg,
                            color: c.dangerText,
                            cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: c.card,
              border: `1px solid ${c.border}`,
              borderRadius: 16,
              padding: 24,
              width: "100%",
              maxWidth: 480,
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
                {editingId ? "Edit Pricing Rule" : "New Pricing Rule"}
              </h2>
              <button
                onClick={closeModal}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 20,
                  cursor: "pointer",
                  color: c.muted,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            {formErr && (
              <div
                style={{
                  padding: 12,
                  borderRadius: 8,
                  background: c.dangerBg,
                  color: c.dangerText,
                  border: `1px solid ${c.dangerBorder}`,
                  fontSize: 13,
                  fontWeight: 700,
                  marginBottom: 16,
                }}
              >
                {formErr}
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: "grid", gap: 14 }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 700,
                    color: c.muted,
                    marginBottom: 6,
                  }}
                >
                  Rule Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Standard Bulk Discount"
                  style={inputSt}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 700,
                    color: c.muted,
                    marginBottom: 6,
                  }}
                >
                  Rule Type *
                </label>
                <select
                  value={form.rule_type}
                  onChange={(e) => setForm((f) => ({ ...f, rule_type: e.target.value }))}
                  style={inputSt}
                >
                  {RULE_TYPES.map((rt) => (
                    <option key={rt} value={rt}>
                      {RULE_TYPE_LABELS[rt]}
                    </option>
                  ))}
                </select>
                {form.rule_type && (
                  <div style={{ marginTop: 6, fontSize: 12, color: c.muted, lineHeight: 1.5 }}>
                    {RULE_TYPE_DESCRIPTIONS[form.rule_type]}
                  </div>
                )}
              </div>

              {needsThreshold && (
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 700,
                      color: c.muted,
                      marginBottom: 6,
                    }}
                  >
                    Threshold Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.threshold_qty}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, threshold_qty: e.target.value }))
                    }
                    placeholder="e.g. 12"
                    style={inputSt}
                  />
                  <div style={{ marginTop: 6, fontSize: 12, color: c.muted }}>
                    Minimum quantity required to unlock wholesale pricing.
                  </div>
                </div>
              )}

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 700,
                    color: c.muted,
                    marginBottom: 6,
                  }}
                >
                  Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Optional note for staff"
                  style={{ ...inputSt, resize: "vertical" }}
                />
              </div>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  color: c.text,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                />
                Active rule
              </label>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    padding: "10px 20px",
                    background: "none",
                    border: `1px solid ${c.border}`,
                    borderRadius: 8,
                    color: c.text,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: "10px 20px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    border: "none",
                    borderRadius: 8,
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {saving ? "Saving…" : editingId ? "Update Rule" : "Create Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: c.card,
              border: `1px solid ${c.dangerBorder}`,
              borderRadius: 16,
              padding: 24,
              width: "100%",
              maxWidth: 400,
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            <h2
              style={{
                margin: "0 0 12px 0",
                fontSize: 18,
                fontWeight: 800,
                color: c.dangerText,
              }}
            >
              Delete Pricing Rule
            </h2>
            <p style={{ margin: "0 0 20px 0", fontSize: 14, color: c.muted, lineHeight: 1.6 }}>
              Delete <strong style={{ color: c.text }}>{deleteTarget.name}</strong>? Products
              assigned to this rule will lose their pricing rule assignment. This cannot be
              undone.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setDeleteTarget(null)}
                style={{
                  padding: "10px 20px",
                  background: "none",
                  border: `1px solid ${c.border}`,
                  borderRadius: 8,
                  color: c.text,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: "10px 20px",
                  background: "#dc2626",
                  border: "none",
                  borderRadius: 8,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
