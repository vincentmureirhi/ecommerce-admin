import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { getThemeColors } from "../utils/themeColors";
import {
  approveVendorProductSubmission,
  getVendorProductSubmission,
  listVendorProductSubmissions,
  rejectVendorProductSubmission,
  requestVendorProductChanges,
} from "../api/vendors";

const money = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat("en-KE");

const statusOptions = [
  { value: "", label: "All statuses" },
  { value: "submitted", label: "Submitted" },
  { value: "changes_requested", label: "Changes requested" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "draft", label: "Draft" },
];

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function labelize(value) {
  return String(value || "-")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-KE", {
    timeZone: "Africa/Nairobi",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function readArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

function toneStyle(status, isDark) {
  const key = String(status || "").toLowerCase();
  const palette = {
    submitted: isDark
      ? ["rgba(59,130,246,.16)", "rgba(59,130,246,.32)", "#93c5fd"]
      : ["rgba(59,130,246,.10)", "rgba(59,130,246,.22)", "#1d4ed8"],
    approved: isDark
      ? ["rgba(34,197,94,.16)", "rgba(34,197,94,.32)", "#86efac"]
      : ["rgba(34,197,94,.10)", "rgba(34,197,94,.22)", "#15803d"],
    changes_requested: isDark
      ? ["rgba(245,158,11,.16)", "rgba(245,158,11,.34)", "#fbbf24"]
      : ["rgba(245,158,11,.12)", "rgba(245,158,11,.25)", "#b45309"],
    rejected: isDark
      ? ["rgba(239,68,68,.16)", "rgba(239,68,68,.34)", "#fca5a5"]
      : ["rgba(239,68,68,.10)", "rgba(239,68,68,.22)", "#b91c1c"],
  };
  const [bg, border, color] = palette[key] || (isDark
    ? ["rgba(148,163,184,.12)", "rgba(148,163,184,.24)", "#cbd5e1"]
    : ["rgba(100,116,139,.08)", "rgba(100,116,139,.18)", "#475569"]);
  return { background: bg, border, color };
}

function Badge({ value, isDark }) {
  const s = toneStyle(value, isDark);
  return (
    <span style={{
      display: "inline-flex",
      border: `1px solid ${s.border}`,
      background: s.background,
      color: s.color,
      borderRadius: 999,
      padding: "5px 10px",
      fontSize: 12,
      fontWeight: 900,
      whiteSpace: "nowrap",
    }}>
      {labelize(value)}
    </span>
  );
}

function Metric({ label, value, sub, c, isDark }) {
  return (
    <div style={{
      background: c.card,
      border: `1px solid ${c.border}`,
      borderRadius: 12,
      padding: 16,
      boxShadow: isDark ? "none" : "0 10px 28px rgba(15,23,42,.06)",
    }}>
      <div style={{ color: c.textMuted, fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>{label}</div>
      <div style={{ color: c.text, fontSize: 28, fontWeight: 950, marginTop: 8 }}>{value}</div>
      {sub && <div style={{ color: c.textMuted, fontSize: 13, marginTop: 5 }}>{sub}</div>}
    </div>
  );
}

export default function VendorProducts() {
  const { isDark } = useTheme();
  const c = getThemeColors(isDark);
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState("submitted");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [approvalForm, setApprovalForm] = useState({
    retail_price: "",
    wholesale_price: "",
    cost_price: "",
    commission_rate: "",
    vendor_net_price: "",
    price_review_notes: "",
    admin_review_notes: "",
  });

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await listVendorProductSubmissions({ status, search });
      setRows(readArray(data));
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to load vendor product submissions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 45000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const stats = useMemo(() => ({
    total: rows.length,
    submitted: rows.filter((row) => row.submission_status === "submitted").length,
    changes: rows.filter((row) => row.submission_status === "changes_requested").length,
    approved: rows.filter((row) => row.submission_status === "approved").length,
  }), [rows]);

  async function selectRow(row) {
    setSelected(row);
    setSuccess("");
    setError("");
    try {
      const full = await getVendorProductSubmission(row.id);
      setSelected(full);
      setApprovalForm({
        retail_price: String(full.proposed_retail_price || ""),
        wholesale_price: String(full.proposed_wholesale_price || full.proposed_retail_price || ""),
        cost_price: String(full.proposed_cost_price || ""),
        commission_rate: String(full.commission_rate || full.vendor_default_commission_rate || ""),
        vendor_net_price: String(full.vendor_net_price || ""),
        price_review_notes: full.price_review_notes || "",
        admin_review_notes: full.admin_review_notes || "",
      });
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to load submission detail");
    }
  }

  async function approveSelected() {
    if (!selected) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await approveVendorProductSubmission(selected.id, approvalForm);
      setSuccess(`${selected.product_name} published to live catalogue.`);
      setSelected(null);
      await load();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to approve product");
    } finally {
      setSaving(false);
    }
  }

  async function requestChanges() {
    if (!selected) return;
    const notes = window.prompt("What should the vendor change?");
    if (!notes) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await requestVendorProductChanges(selected.id, { admin_review_notes: notes });
      setSuccess(`Changes requested for ${selected.product_name}.`);
      setSelected(null);
      await load();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to request changes");
    } finally {
      setSaving(false);
    }
  }

  async function rejectSelected() {
    if (!selected) return;
    const reason = window.prompt("Why is this product rejected?");
    if (!reason) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await rejectVendorProductSubmission(selected.id, { rejection_reason: reason });
      setSuccess(`${selected.product_name} rejected.`);
      setSelected(null);
      await load();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to reject product");
    } finally {
      setSaving(false);
    }
  }

  const pageStyle = {
    color: c.text,
    display: "grid",
    gap: 20,
  };

  return (
    <div style={pageStyle}>
      <div style={{
        background: isDark ? "linear-gradient(135deg,#020617,#111827)" : "linear-gradient(135deg,#111827,#0f172a)",
        color: "white",
        borderRadius: 16,
        padding: 24,
        display: "flex",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
        boxShadow: "0 18px 45px rgba(15,23,42,.22)",
      }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1.5, textTransform: "uppercase", color: "#93c5fd" }}>
            Vendor product command
          </div>
          <h1 style={{ margin: "8px 0 0", fontSize: 30, fontWeight: 950 }}>Approve marketplace listings</h1>
          <p style={{ margin: "8px 0 0", color: "rgba(255,255,255,.68)", maxWidth: 720 }}>
            Review vendor products, pricing, stock, and margin before anything appears on the customer catalogue.
          </p>
        </div>
        <button onClick={load} disabled={loading} style={buttonStyle("#2563eb")}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 12 }}>
        <Metric label="Showing" value={number.format(stats.total)} sub="Current filter" c={c} isDark={isDark} />
        <Metric label="Submitted" value={number.format(stats.submitted)} sub="Needs review" c={c} isDark={isDark} />
        <Metric label="Changes" value={number.format(stats.changes)} sub="Sent back" c={c} isDark={isDark} />
        <Metric label="Approved" value={number.format(stats.approved)} sub="Published" c={c} isDark={isDark} />
      </div>

      {(error || success) && (
        <div style={{
          padding: 14,
          borderRadius: 12,
          border: `1px solid ${error ? "#fecaca" : "#bbf7d0"}`,
          background: error ? "#fef2f2" : "#f0fdf4",
          color: error ? "#991b1b" : "#166534",
          fontWeight: 800,
        }}>
          {error || success}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 420px", gap: 18, alignItems: "start" }}>
        <section style={panelStyle(c, isDark)}>
          <div style={{ padding: 16, borderBottom: `1px solid ${c.borderLight}`, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") load();
              }}
              placeholder="Search product, vendor, SKU..."
              style={inputStyle(c)}
            />
            <select value={status} onChange={(event) => setStatus(event.target.value)} style={selectStyle(c)}>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <button onClick={load} style={buttonStyle("#0f766e")}>Search</button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: c.tableHeader }}>
                  {["Product", "Vendor", "Price", "Stock", "Status", "Action"].map((head) => (
                    <th key={head} style={thStyle(c)}>{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 28, color: c.textMuted, textAlign: "center" }}>
                      {loading ? "Loading vendor submissions..." : "No vendor products match this filter."}
                    </td>
                  </tr>
                ) : rows.map((row) => (
                  <tr key={row.id} style={{ borderTop: `1px solid ${c.borderLight}` }}>
                    <td style={tdStyle(c)}>
                      <strong>{row.product_name}</strong>
                      <div style={{ color: c.textMuted, fontSize: 12 }}>{row.sku || "No SKU"} - {row.category_name || "No category"}</div>
                    </td>
                    <td style={tdStyle(c)}>
                      <strong>{row.store_name}</strong>
                      <div style={{ color: c.textMuted, fontSize: 12 }}>{labelize(row.verification_status)} vendor</div>
                    </td>
                    <td style={tdStyle(c)}>
                      <strong>{money.format(toNumber(row.proposed_retail_price))}</strong>
                      <div style={{ color: c.textMuted, fontSize: 12 }}>Wholesale {money.format(toNumber(row.proposed_wholesale_price))}</div>
                    </td>
                    <td style={tdStyle(c)}>
                      <strong>{number.format(toNumber(row.current_stock))}</strong>
                      <div style={{ color: c.textMuted, fontSize: 12 }}>{row.selling_unit_label || "piece"}</div>
                    </td>
                    <td style={tdStyle(c)}><Badge value={row.submission_status} isDark={isDark} /></td>
                    <td style={tdStyle(c)}>
                      <button onClick={() => selectRow(row)} style={buttonStyle("#111827")}>Review</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside style={panelStyle(c, isDark)}>
          <div style={{ padding: 16, borderBottom: `1px solid ${c.borderLight}` }}>
            <h2 style={{ margin: 0, color: c.text }}>Review panel</h2>
            <p style={{ margin: "6px 0 0", color: c.textMuted, fontSize: 13 }}>
              Approve only products that fit catalogue quality and pricing rules.
            </p>
          </div>

          {!selected ? (
            <div style={{ padding: 18, color: c.textMuted }}>Select a submission to review.</div>
          ) : (
            <div style={{ padding: 18, display: "grid", gap: 14 }}>
              <div>
                <div style={{ fontSize: 12, color: c.textMuted, textTransform: "uppercase", fontWeight: 900 }}>Vendor</div>
                <div style={{ fontWeight: 900, color: c.text }}>{selected.store_name}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: c.textMuted, textTransform: "uppercase", fontWeight: 900 }}>Product</div>
                <div style={{ fontWeight: 900, color: c.text }}>{selected.product_name}</div>
                <div style={{ color: c.textMuted, fontSize: 13 }}>{selected.description || "No description"}</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label="Retail" value={approvalForm.retail_price} onChange={(v) => setApprovalForm((f) => ({ ...f, retail_price: v }))} c={c} />
                <Field label="Wholesale" value={approvalForm.wholesale_price} onChange={(v) => setApprovalForm((f) => ({ ...f, wholesale_price: v }))} c={c} />
                <Field label="Cost" value={approvalForm.cost_price} onChange={(v) => setApprovalForm((f) => ({ ...f, cost_price: v }))} c={c} />
                <Field label="Commission %" value={approvalForm.commission_rate} onChange={(v) => setApprovalForm((f) => ({ ...f, commission_rate: v }))} c={c} />
                <Field label="Vendor net" value={approvalForm.vendor_net_price} onChange={(v) => setApprovalForm((f) => ({ ...f, vendor_net_price: v }))} c={c} />
              </div>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ color: c.textMuted, fontSize: 12, fontWeight: 900 }}>Price review notes</span>
                <textarea value={approvalForm.price_review_notes} onChange={(e) => setApprovalForm((f) => ({ ...f, price_review_notes: e.target.value }))} rows={3} style={textareaStyle(c)} />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ color: c.textMuted, fontSize: 12, fontWeight: 900 }}>Admin notes</span>
                <textarea value={approvalForm.admin_review_notes} onChange={(e) => setApprovalForm((f) => ({ ...f, admin_review_notes: e.target.value }))} rows={3} style={textareaStyle(c)} />
              </label>

              <div style={{ display: "grid", gap: 8 }}>
                <button onClick={approveSelected} disabled={saving || !["submitted", "changes_requested"].includes(selected.submission_status)} style={buttonStyle("#16a34a")}>
                  {saving ? "Working..." : "Approve and publish"}
                </button>
                <button onClick={requestChanges} disabled={saving || selected.submission_status !== "submitted"} style={buttonStyle("#d97706")}>
                  Request changes
                </button>
                <button onClick={rejectSelected} disabled={saving || !["submitted", "changes_requested"].includes(selected.submission_status)} style={buttonStyle("#dc2626")}>
                  Reject
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, c }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ color: c.textMuted, fontSize: 12, fontWeight: 900 }}>{label}</span>
      <input type="number" min="0" value={value} onChange={(event) => onChange(event.target.value)} style={inputStyle(c)} />
    </label>
  );
}

function panelStyle(c, isDark) {
  return {
    background: c.card,
    border: `1px solid ${c.border}`,
    borderRadius: 14,
    overflow: "hidden",
    boxShadow: isDark ? "none" : "0 12px 32px rgba(15,23,42,.06)",
  };
}

function inputStyle(c) {
  return {
    width: "100%",
    minWidth: 0,
    background: c.inputBg || c.card,
    color: c.text,
    border: `1px solid ${c.border}`,
    borderRadius: 10,
    padding: "10px 12px",
    outline: "none",
  };
}

function selectStyle(c) {
  return {
    ...inputStyle(c),
    maxWidth: 220,
  };
}

function textareaStyle(c) {
  return {
    ...inputStyle(c),
    resize: "vertical",
    minHeight: 84,
  };
}

function thStyle(c) {
  return {
    color: c.textMuted,
    fontSize: 12,
    fontWeight: 900,
    textTransform: "uppercase",
    textAlign: "left",
    padding: "12px 14px",
    whiteSpace: "nowrap",
  };
}

function tdStyle(c) {
  return {
    color: c.text,
    padding: "14px",
    verticalAlign: "top",
    fontSize: 13,
  };
}

function buttonStyle(background) {
  return {
    border: "none",
    background,
    color: "white",
    borderRadius: 10,
    padding: "10px 14px",
    fontWeight: 900,
    cursor: "pointer",
  };
}
