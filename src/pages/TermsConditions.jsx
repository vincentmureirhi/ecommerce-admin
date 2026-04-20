import React, { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { getThemeColors } from "../utils/themeColors";
import { getTerms, updateTerms } from "../api/termsConditions";

export default function TermsConditions() {
  const { isDark } = useTheme();
  const c = getThemeColors(isDark);

  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  function showSuccess(msg) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3500);
  }

  async function loadTerms() {
    try {
      setLoading(true);
      setErr("");
      const res = await getTerms();
      const data = res?.data || res;
      setContent(data?.content || "");
      setLastUpdated(data?.updated_at || null);
    } catch {
      // If endpoint doesn't exist yet, start with empty content
      setContent("");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTerms();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    if (!content.trim()) {
      setErr("Terms & Conditions content cannot be empty");
      return;
    }

    setSaving(true);
    setErr("");

    try {
      const res = await updateTerms({ content: content.trim() });
      const data = res?.data || res;
      setLastUpdated(data?.updated_at || new Date().toISOString());
      showSuccess("Terms & Conditions saved and published successfully!");
    } catch (e) {
      setErr(e?.message || "Failed to save Terms & Conditions");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    border: `1px solid ${c.border}`,
    borderRadius: 8,
    fontSize: 13,
    boxSizing: "border-box",
    background: c.inputBg || (isDark ? "#0f172a" : "#f8f9fa"),
    color: c.text,
    fontFamily: "inherit",
    lineHeight: 1.6,
    resize: "vertical",
  };

  return (
    <div style={{ background: c.bg, minHeight: "100vh", padding: 20 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: "0 0 5px 0", fontSize: 28, fontWeight: 800, color: c.text }}>
          📜 Terms &amp; Conditions
        </h1>
        <p style={{ margin: 0, color: c.textMuted, fontSize: 13 }}>
          Write and publish the Terms &amp; Conditions shown to customers on the storefront
        </p>
        {lastUpdated && (
          <p style={{ margin: "8px 0 0", color: c.textMuted, fontSize: 12 }}>
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </p>
        )}
      </div>

      {/* Success */}
      {successMsg && (
        <div
          style={{
            background: isDark ? "rgba(16,185,129,0.15)" : "#d1fae5",
            color: isDark ? "#4ade80" : "#065f46",
            padding: "10px 16px",
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          ✅ {successMsg}
        </div>
      )}

      {/* Error */}
      {err && (
        <div
          style={{
            background: isDark ? "rgba(239,68,68,0.15)" : "#fee2e2",
            color: isDark ? "#fca5a5" : "#b91c1c",
            padding: "10px 16px",
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          ⚠️ {err}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: c.textMuted }}>
          Loading...
        </div>
      ) : (
        <form onSubmit={handleSave}>
          <div
            style={{
              background: c.card,
              border: `1px solid ${c.border}`,
              borderRadius: 12,
              padding: 24,
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              marginBottom: 20,
            }}
          >
            {/* Toolbar hint */}
            <div
              style={{
                marginBottom: 12,
                padding: "10px 14px",
                background: isDark ? "rgba(102,126,234,0.1)" : "#eff2ff",
                borderRadius: 6,
                fontSize: 12,
                color: isDark ? "#a5b4fc" : "#4338ca",
                lineHeight: 1.5,
              }}
            >
              💡 <strong>Tip:</strong> You can use basic HTML formatting (e.g.{" "}
              <code>&lt;h2&gt;</code>, <code>&lt;p&gt;</code>, <code>&lt;ul&gt;&lt;li&gt;</code>,{" "}
              <code>&lt;strong&gt;</code>) to format your content, or write plain text.
            </div>

            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 700,
                color: c.text,
                marginBottom: 8,
              }}
            >
              Terms &amp; Conditions Content
            </label>
            <textarea
              rows={24}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Enter your Terms & Conditions here...\n\nExample:\n\n1. Introduction\nWelcome to Xpose Distributors...\n\n2. Orders & Payments\nAll orders are subject to...\n\n3. Delivery\nWe deliver across Kenya...`}
              style={inputStyle}
            />

            <div
              style={{
                marginTop: 8,
                fontSize: 11,
                color: c.textMuted,
                textAlign: "right",
              }}
            >
              {content.length} characters
            </div>
          </div>

          {/* Preview */}
          {content.trim() && (
            <div
              style={{
                background: c.card,
                border: `1px solid ${c.border}`,
                borderRadius: 12,
                padding: 24,
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                marginBottom: 20,
              }}
            >
              <h3
                style={{
                  margin: "0 0 16px 0",
                  fontSize: 14,
                  fontWeight: 700,
                  color: c.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Preview
              </h3>
              <div
                style={{
                  fontSize: 13,
                  color: c.text,
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                }}
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <button
              type="button"
              onClick={loadTerms}
              disabled={loading || saving}
              style={{
                padding: "12px 20px",
                background: isDark ? "#334155" : "#e5e7eb",
                color: c.text,
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "12px 24px",
                background: "#667eea",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: saving ? "not-allowed" : "pointer",
                fontWeight: 700,
                fontSize: 13,
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Saving..." : "💾 Save & Publish"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
