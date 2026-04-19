import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import {
  listPayments,
  getPaymentSummary,
  getPayment,
  reconcilePayment,
  createPayment,
} from "../api/payments";

function money(value) {
  return `KSh ${parseFloat(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
  })}`;
}

function downloadCSV(rows) {
  const headers = [
    "Payment ID",
    "Order ID",
    "Order Number",
    "Customer",
    "Expected Amount",
    "Received Amount",
    "Method",
    "Source",
    "Status",
    "Reconciliation",
    "Receipt",
    "Phone",
    "Created At",
  ];

  const body = rows.map((p) => [
    p.id,
    p.order_id || "",
    p.order_number || "",
    p.customer_name || "",
    p.expected_amount || "",
    p.received_amount || "",
    p.method || "",
    p.source || "",
    p.status || "",
    p.reconciliation_status || "",
    p.mpesa_receipt || "",
    p.customer_phone || p.order_customer_phone || "",
    p.created_at || "",
  ]);

  const csv = [headers, ...body]
    .map((row) =>
      row
        .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function getStatusChip(payment, isDark) {
  const status = String(payment.status || "").toLowerCase();

  if (status === "completed" || status === "manually_resolved") {
    return {
      label: status === "manually_resolved" ? "MANUAL OK" : "COMPLETED",
      bg: isDark ? "rgba(16,185,129,0.20)" : "#d1fae5",
      color: isDark ? "#4ade80" : "#047857",
    };
  }

  if (status === "pending" || status === "initiated") {
    return {
      label: status.toUpperCase(),
      bg: isDark ? "rgba(245,158,11,0.20)" : "#fef3c7",
      color: isDark ? "#fbbf24" : "#b45309",
    };
  }

  if (status === "timeout") {
    return {
      label: "TIMEOUT",
      bg: isDark ? "rgba(239,68,68,0.20)" : "#fee2e2",
      color: isDark ? "#fca5a5" : "#dc2626",
    };
  }

  if (status === "cancelled") {
    return {
      label: "CANCELLED",
      bg: isDark ? "rgba(148,163,184,0.20)" : "#e2e8f0",
      color: isDark ? "#cbd5e1" : "#475569",
    };
  }

  if (status === "reversed") {
    return {
      label: "REVERSED",
      bg: isDark ? "rgba(168,85,247,0.20)" : "#ede9fe",
      color: isDark ? "#c4b5fd" : "#7c3aed",
    };
  }

  return {
    label: "FAILED",
    bg: isDark ? "rgba(239,68,68,0.20)" : "#fee2e2",
    color: isDark ? "#fca5a5" : "#dc2626",
  };
}

function getReconChip(payment, isDark) {
  const status = String(payment.reconciliation_status || "").toLowerCase();

  if (status === "matched") {
    return {
      label: "MATCHED",
      bg: isDark ? "rgba(16,185,129,0.20)" : "#d1fae5",
      color: isDark ? "#4ade80" : "#047857",
    };
  }

  if (status === "awaiting_callback") {
    return {
      label: "WAITING",
      bg: isDark ? "rgba(59,130,246,0.20)" : "#dbeafe",
      color: isDark ? "#93c5fd" : "#1d4ed8",
    };
  }

  if (status === "manual_override") {
    return {
      label: "MANUAL",
      bg: isDark ? "rgba(168,85,247,0.20)" : "#ede9fe",
      color: isDark ? "#c4b5fd" : "#7c3aed",
    };
  }

  if (status === "mismatch") {
    return {
      label: "MISMATCH",
      bg: isDark ? "rgba(245,158,11,0.20)" : "#fef3c7",
      color: isDark ? "#fbbf24" : "#b45309",
    };
  }

  return {
    label: "REVIEW",
    bg: isDark ? "rgba(239,68,68,0.20)" : "#fee2e2",
    color: isDark ? "#fca5a5" : "#dc2626",
  };
}

function SummaryCard({ icon, title, value, subtitle, c }) {
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
      <div style={{ fontSize: 24, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: c.muted, marginBottom: 10 }}>
        {title}
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: c.text, lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: c.muted, marginTop: 10 }}>{subtitle}</div>
    </div>
  );
}

function PaymentsDetailModal({
  payment,
  isDark,
  onClose,
  onSaved,
}) {
  const c = isDark
    ? { bg: "#0f172a", card: "#1e293b", text: "#f1f5f9", border: "#334155", muted: "#94a3b8", inputBg: "#0f172a" }
    : { bg: "#f8fafc", card: "#ffffff", text: "#111827", border: "#e5e7eb", muted: "#6b7280", inputBg: "#ffffff" };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState(null);
  const [err, setErr] = useState("");

  const [status, setStatus] = useState("");
  const [reconciliationStatus, setReconciliationStatus] = useState("");
  const [receivedAmount, setReceivedAmount] = useState("");
  const [receipt, setReceipt] = useState("");
  const [reference, setReference] = useState("");
  const [failureReason, setFailureReason] = useState("");
  const [manualNotes, setManualNotes] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setErr("");

        const res = await getPayment(payment.id);
        const p = res?.data || res;

        if (!active) return;

        setDetail(p);
        setStatus(p.status || "");
        setReconciliationStatus(p.reconciliation_status || "manual_review");
        setReceivedAmount(String(p.received_amount ?? p.amount ?? ""));
        setReceipt(p.mpesa_receipt || "");
        setReference(p.reference || "");
        setFailureReason(p.failure_reason || "");
        setManualNotes(p.manual_notes || "");
      } catch (e) {
        if (active) setErr(e?.message || "Failed to load payment");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [payment.id]);

  async function handleSave() {
    try {
      setSaving(true);
      setErr("");

      await reconcilePayment(payment.id, {
        status,
        reconciliation_status: reconciliationStatus,
        received_amount: receivedAmount,
        mpesa_receipt: receipt,
        reference,
        failure_reason: failureReason,
        manual_notes: manualNotes,
      });

      await onSaved();
      onClose();
    } catch (e) {
      setErr(e?.message || "Failed to reconcile payment");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          zIndex: 1300,
        }}
      />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(900px, 94vw)",
          maxHeight: "88vh",
          overflowY: "auto",
          background: c.card,
          border: `1px solid ${c.border}`,
          borderRadius: 14,
          padding: 22,
          zIndex: 1301,
          boxShadow: "0 20px 50px rgba(0,0,0,0.30)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12, marginBottom: 18 }}>
          <div>
            <h2 style={{ margin: 0, color: c.text, fontSize: 24 }}>Payment #{payment.id}</h2>
            <div style={{ color: c.muted, fontSize: 13, marginTop: 4 }}>
              Automatic M-Pesa tracking + manual admin reconciliation
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              border: `1px solid ${c.border}`,
              background: c.bg,
              color: c.text,
              borderRadius: 10,
              padding: "8px 12px",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Close
          </button>
        </div>

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
            {err}
          </div>
        )}

        {loading ? (
          <div style={{ padding: 30, textAlign: "center", color: c.muted }}>Loading payment...</div>
        ) : detail ? (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 16,
                marginBottom: 20,
              }}
            >
              <div style={detailCard(c)}>
                <DetailRow label="Order #" value={detail.order_number || "—"} c={c} />
                <DetailRow label="Customer" value={detail.customer_name || "—"} c={c} />
                <DetailRow label="Phone" value={detail.customer_phone || detail.order_customer_phone || "—"} c={c} />
                <DetailRow label="Order Type" value={detail.order_type || "—"} c={c} />
                <DetailRow label="Expected Amount" value={money(detail.expected_amount || detail.amount)} c={c} />
                <DetailRow label="Received Amount" value={money(detail.received_amount || 0)} c={c} />
                <DetailRow label="Outstanding" value={money(detail.order_balance_due || 0)} c={c} />
              </div>

              <div style={detailCard(c)}>
                <DetailRow label="Status" value={detail.status || "—"} c={c} />
                <DetailRow label="Reconciliation" value={detail.reconciliation_status || "—"} c={c} />
                <DetailRow label="Method" value={detail.method || "—"} c={c} />
                <DetailRow label="Source" value={detail.source || "—"} c={c} />
                <DetailRow label="Receipt" value={detail.mpesa_receipt || "—"} c={c} />
                <DetailRow label="Failure Reason" value={detail.failure_reason || "—"} c={c} />
                <DetailRow label="Created" value={detail.created_at ? new Date(detail.created_at).toLocaleString() : "—"} c={c} />
              </div>
            </div>

            <div style={detailCard(c)}>
              <h3 style={{ marginTop: 0, marginBottom: 14, color: c.text, fontSize: 16 }}>Manual Reconciliation</h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 14,
                }}
              >
                <Field label="Status" c={c}>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle(c)}>
                    <option value="initiated">initiated</option>
                    <option value="pending">pending</option>
                    <option value="completed">completed</option>
                    <option value="failed">failed</option>
                    <option value="cancelled">cancelled</option>
                    <option value="timeout">timeout</option>
                    <option value="reversed">reversed</option>
                    <option value="manually_resolved">manually_resolved</option>
                  </select>
                </Field>

                <Field label="Reconciliation Status" c={c}>
                  <select value={reconciliationStatus} onChange={(e) => setReconciliationStatus(e.target.value)} style={inputStyle(c)}>
                    <option value="matched">matched</option>
                    <option value="awaiting_callback">awaiting_callback</option>
                    <option value="mismatch">mismatch</option>
                    <option value="manual_review">manual_review</option>
                    <option value="manual_override">manual_override</option>
                  </select>
                </Field>

                <Field label="Received Amount" c={c}>
                  <input type="number" step="0.01" min="0" value={receivedAmount} onChange={(e) => setReceivedAmount(e.target.value)} style={inputStyle(c)} />
                </Field>

                <Field label="M-Pesa Receipt" c={c}>
                  <input type="text" value={receipt} onChange={(e) => setReceipt(e.target.value)} style={inputStyle(c)} />
                </Field>

                <Field label="Reference" c={c}>
                  <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} style={inputStyle(c)} />
                </Field>

                <Field label="Failure Reason" c={c}>
                  <input type="text" value={failureReason} onChange={(e) => setFailureReason(e.target.value)} style={inputStyle(c)} />
                </Field>

                <div style={{ gridColumn: "1 / -1" }}>
                  <Field label="Manual Notes" c={c}>
                    <textarea
                      rows={4}
                      value={manualNotes}
                      onChange={(e) => setManualNotes(e.target.value)}
                      style={{ ...inputStyle(c), resize: "vertical" }}
                    />
                  </Field>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
                <button
                  onClick={onClose}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: `1px solid ${c.border}`,
                    background: c.bg,
                    color: c.text,
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "none",
                    background: "#16a34a",
                    color: "white",
                    cursor: saving ? "not-allowed" : "pointer",
                    fontWeight: 700,
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? "Saving..." : "Save Reconciliation"}
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}

function ManualPaymentModal({ isDark, onClose, onSaved }) {
  const c = isDark
    ? { bg: "#0f172a", card: "#1e293b", text: "#f1f5f9", border: "#334155", muted: "#94a3b8", inputBg: "#0f172a" }
    : { bg: "#f8fafc", card: "#ffffff", text: "#111827", border: "#e5e7eb", muted: "#6b7280", inputBg: "#ffffff" };

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({
    order_id: "",
    amount: "",
    method: "cash",
    customer_phone: "",
    reference: "",
    notes: "",
  });

  async function handleSave() {
    try {
      setSaving(true);
      setErr("");

      await createPayment({
        order_id: Number(form.order_id),
        amount: Number(form.amount),
        method: form.method,
        customer_phone: form.customer_phone || null,
        reference: form.reference || null,
        notes: form.notes || null,
      });

      await onSaved();
      onClose();
    } catch (e) {
      setErr(e?.message || "Failed to record manual payment");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          zIndex: 1350,
        }}
      />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(620px, 94vw)",
          background: c.card,
          border: `1px solid ${c.border}`,
          borderRadius: 14,
          padding: 22,
          zIndex: 1351,
          boxShadow: "0 20px 50px rgba(0,0,0,0.30)",
        }}
      >
        <h2 style={{ marginTop: 0, color: c.text }}>Record Manual Payment</h2>
        <p style={{ color: c.muted, fontSize: 13, marginTop: 0 }}>
          Use this for route settlements, cash collections, or manual rescue when M-Pesa sandbox fails.
        </p>

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
            {err}
          </div>
        )}

        <div style={{ display: "grid", gap: 14 }}>
          <Field label="Order ID" c={c}>
            <input
              type="number"
              min="1"
              value={form.order_id}
              onChange={(e) => setForm({ ...form, order_id: e.target.value })}
              style={inputStyle(c)}
            />
          </Field>

          <Field label="Amount" c={c}>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              style={inputStyle(c)}
            />
          </Field>

          <Field label="Method" c={c}>
            <select
              value={form.method}
              onChange={(e) => setForm({ ...form, method: e.target.value })}
              style={inputStyle(c)}
            >
              <option value="cash">cash</option>
              <option value="mpesa">mpesa</option>
              <option value="bank">bank</option>
              <option value="card">card</option>
              <option value="other">other</option>
            </select>
          </Field>

          <Field label="Customer Phone (optional)" c={c}>
            <input
              type="text"
              value={form.customer_phone}
              onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
              style={inputStyle(c)}
            />
          </Field>

          <Field label="Reference (optional)" c={c}>
            <input
              type="text"
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
              style={inputStyle(c)}
            />
          </Field>

          <Field label="Notes" c={c}>
            <textarea
              rows={4}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              style={{ ...inputStyle(c), resize: "vertical" }}
            />
          </Field>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
          <button
            onClick={onClose}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: `1px solid ${c.border}`,
              background: c.bg,
              color: c.text,
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "none",
              background: "#16a34a",
              color: "white",
              cursor: saving ? "not-allowed" : "pointer",
              fontWeight: 700,
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Saving..." : "Record Payment"}
          </button>
        </div>
      </div>
    </>
  );
}

function Field({ label, c, children }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: c.muted, marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function DetailRow({ label, value, c }) {
  return (
    <div style={{ padding: "8px 0", borderBottom: `1px solid ${c.border}` }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: c.muted, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, color: c.text, fontWeight: 600, wordBreak: "break-word" }}>{value}</div>
    </div>
  );
}

function detailCard(c) {
  return {
    background: c.bg,
    border: `1px solid ${c.border}`,
    borderRadius: 12,
    padding: 16,
  };
}

function inputStyle(c) {
  return {
    width: "100%",
    padding: "10px 12px",
    border: `1px solid ${c.border}`,
    borderRadius: 8,
    fontSize: 13,
    background: c.inputBg,
    color: c.text,
    boxSizing: "border-box",
  };
}

export default function Payments() {
  const { isDark } = useTheme();

  const colors = {
    light: { bg: "#f8f9fa", card: "#ffffff", text: "#1a1a1a", border: "#e5e7eb", muted: "#666", inputBg: "#ffffff" },
    dark: { bg: "#0f172a", card: "#1e293b", text: "#f1f5f9", border: "#334155", muted: "#94a3b8", inputBg: "#0b1220" },
  };

  const c = isDark ? colors.dark : colors.light;

  const [allPayments, setAllPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [err, setErr] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    method: "all",
    source: "all",
    recon: "all",
    dateRange: "7days",
  });

  async function loadPayments() {
    try {
      setLoading(true);
      setErr("");

      const [paymentsRes, summaryRes] = await Promise.all([
        listPayments(),
        getPaymentSummary(),
      ]);

      setAllPayments(Array.isArray(paymentsRes?.data) ? paymentsRes.data : []);
      setSummary(summaryRes?.data || null);
    } catch (e) {
      setErr(e?.message || "Failed to load payments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayments();
  }, []);

  const filteredPayments = useMemo(() => {
    const now = new Date();

    return allPayments.filter((p) => {
      const created = p.created_at ? new Date(p.created_at) : null;
      const ageDays = created ? (now - created) / (1000 * 60 * 60 * 24) : 9999;

      const dateOk =
        filters.dateRange === "all"
          ? true
          : filters.dateRange === "today"
          ? ageDays < 1
          : filters.dateRange === "7days"
          ? ageDays <= 7
          : filters.dateRange === "30days"
          ? ageDays <= 30
          : true;

      const searchText = filters.search.trim().toLowerCase();
      const searchOk =
        !searchText ||
        String(p.id || "").toLowerCase().includes(searchText) ||
        String(p.order_id || "").toLowerCase().includes(searchText) ||
        String(p.order_number || "").toLowerCase().includes(searchText) ||
        String(p.customer_name || "").toLowerCase().includes(searchText) ||
        String(p.customer_phone || p.order_customer_phone || "").toLowerCase().includes(searchText) ||
        String(p.mpesa_receipt || "").toLowerCase().includes(searchText) ||
        String(p.reference || "").toLowerCase().includes(searchText);

      const statusOk = filters.status === "all" || p.status === filters.status;
      const methodOk = filters.method === "all" || (p.method || "") === filters.method;
      const sourceOk = filters.source === "all" || (p.source || "") === filters.source;
      const reconOk = filters.recon === "all" || (p.reconciliation_status || "") === filters.recon;

      return dateOk && searchOk && statusOk && methodOk && sourceOk && reconOk;
    });
  }, [allPayments, filters]);

  return (
    <div style={{ background: c.bg, minHeight: "100vh", padding: "20px" }}>
      <div style={{ marginBottom: 30, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: "0 0 5px 0", fontSize: "28px", fontWeight: 800, color: c.text }}>💳 Payments</h1>
          <p style={{ margin: 0, color: c.muted, fontSize: "14px" }}>
            Automatic M-Pesa tracking for normal customers, manual reconciliation for failures, and route settlement control
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => setShowManualModal(true)}
            style={{
              padding: "10px 16px",
              background: "#16a34a",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            + Manual Payment
          </button>

          <button
            onClick={() => downloadCSV(filteredPayments)}
            style={{
              padding: "10px 16px",
              background: "#667eea",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      {err && (
        <div
          style={{
            background: isDark ? "rgba(239,68,68,0.10)" : "#fee2e2",
            color: isDark ? "#fca5a5" : "#b91c1c",
            border: `1px solid ${isDark ? "rgba(239,68,68,0.25)" : "#fecaca"}`,
            padding: 12,
            borderRadius: 8,
            marginBottom: 20,
          }}
        >
          {err}
        </div>
      )}

      {!loading && summary && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 14,
            marginBottom: 20,
          }}
        >
          <SummaryCard icon="💰" title="Total Collected" value={money(summary.total_collected || 0)} subtitle="Completed + manually resolved" c={c} />
          <SummaryCard icon="✅" title="Completed" value={summary.completed_count || 0} subtitle="Successful payments" c={c} />
          <SummaryCard icon="⏳" title="Pending" value={summary.pending_count || 0} subtitle="Waiting for callback" c={c} />
          <SummaryCard icon="❌" title="Failed / Timeout" value={summary.failed_count || 0} subtitle="Need follow-up" c={c} />
          <SummaryCard icon="⚠️" title="Needs Review" value={summary.needs_review_count || 0} subtitle="Mismatch or manual review" c={c} />
          <SummaryCard icon="📱" title="STK Success Rate" value={`${summary.stk_success_rate || 0}%`} subtitle="Sandbox-aware automatic flow" c={c} />
        </div>
      )}

      <div
        style={{
          background: c.card,
          border: `1px solid ${c.border}`,
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "2fr repeat(5, 1fr)", gap: 12 }}>
          <input
            type="text"
            placeholder="Search order, customer, phone, receipt, reference..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={inputStyle(c)}
          />

          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} style={inputStyle(c)}>
            <option value="all">All Status</option>
            <option value="initiated">initiated</option>
            <option value="pending">pending</option>
            <option value="completed">completed</option>
            <option value="failed">failed</option>
            <option value="cancelled">cancelled</option>
            <option value="timeout">timeout</option>
            <option value="reversed">reversed</option>
            <option value="manually_resolved">manually_resolved</option>
          </select>

          <select value={filters.method} onChange={(e) => setFilters({ ...filters, method: e.target.value })} style={inputStyle(c)}>
            <option value="all">All Method</option>
            <option value="mpesa">mpesa</option>
            <option value="cash">cash</option>
            <option value="bank">bank</option>
            <option value="card">card</option>
            <option value="other">other</option>
          </select>

          <select value={filters.source} onChange={(e) => setFilters({ ...filters, source: e.target.value })} style={inputStyle(c)}>
            <option value="all">All Source</option>
            <option value="mpesa_auto">mpesa_auto</option>
            <option value="manual">manual</option>
            <option value="route_settlement">route_settlement</option>
          </select>

          <select value={filters.recon} onChange={(e) => setFilters({ ...filters, recon: e.target.value })} style={inputStyle(c)}>
            <option value="all">All Reconciliation</option>
            <option value="matched">matched</option>
            <option value="awaiting_callback">awaiting_callback</option>
            <option value="mismatch">mismatch</option>
            <option value="manual_review">manual_review</option>
            <option value="manual_override">manual_override</option>
          </select>

          <select value={filters.dateRange} onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })} style={inputStyle(c)}>
            <option value="today">Today</option>
            <option value="7days">7 Days</option>
            <option value="30days">30 Days</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      <div
        style={{
          marginBottom: 20,
          padding: "12px 16px",
          background: c.card,
          borderRadius: "8px",
          border: `1px solid ${c.border}`,
          fontSize: "13px",
          color: c.muted,
        }}
      >
        Showing <strong>{filteredPayments.length}</strong> of <strong>{allPayments.length}</strong> payments
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: c.muted }}>⏳ Loading payments...</div>
      ) : filteredPayments.length === 0 ? (
        <div
          style={{
            background: c.card,
            borderRadius: 8,
            padding: 40,
            textAlign: "center",
            color: c.muted,
            border: `1px solid ${c.border}`,
          }}
        >
          No payments found
        </div>
      ) : (
        <div
          style={{
            background: c.card,
            borderRadius: 8,
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            border: `1px solid ${c.border}`,
            overflowX: "auto",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: 1700 }}>
            <thead>
              <tr style={{ background: isDark ? "#0f172a" : "#f8f9fa", borderBottom: `2px solid ${c.border}` }}>
                <th style={thStyle(c)}>Payment ID</th>
                <th style={thStyle(c)}>Order #</th>
                <th style={thStyle(c)}>Customer</th>
                <th style={{ ...thStyle(c), textAlign: "right" }}>Expected</th>
                <th style={{ ...thStyle(c), textAlign: "right" }}>Received</th>
                <th style={thStyle(c)}>Method</th>
                <th style={thStyle(c)}>Source</th>
                <th style={thStyle(c)}>Status</th>
                <th style={thStyle(c)}>Reconciliation</th>
                <th style={thStyle(c)}>M-Pesa Receipt</th>
                <th style={thStyle(c)}>Reason</th>
                <th style={thStyle(c)}>Date</th>
                <th style={{ ...thStyle(c), textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment, idx) => {
                const statusChip = getStatusChip(payment, isDark);
                const reconChip = getReconChip(payment, isDark);
                const needsReview =
                  payment.reconciliation_status === "mismatch" ||
                  payment.reconciliation_status === "manual_review";

                return (
                  <tr
                    key={payment.id}
                    style={{
                      borderBottom: `1px solid ${c.border}`,
                      background: needsReview
                        ? isDark
                          ? "rgba(245,158,11,0.06)"
                          : "rgba(245,158,11,0.04)"
                        : idx % 2 === 0
                        ? "transparent"
                        : isDark
                        ? "rgba(255,255,255,0.01)"
                        : "#fafafa",
                    }}
                  >
                    <td style={tdPrimary(c)}>#{payment.id}</td>
                    <td style={tdPrimary(c)}>{payment.order_number || payment.order_id || "—"}</td>
                    <td style={tdMuted(c)}>{payment.customer_name || "—"}</td>
                    <td style={{ ...tdPrimary(c), textAlign: "right" }}>{money(payment.expected_amount || payment.amount)}</td>
                    <td style={{ ...tdPrimary(c), textAlign: "right" }}>{money(payment.received_amount || 0)}</td>
                    <td style={tdMuted(c)}>{(payment.method || "—").toUpperCase()}</td>
                    <td style={tdMuted(c)}>{payment.source || "—"}</td>

                    <td style={tdBase}>
                      <span
                        style={{
                          background: statusChip.bg,
                          color: statusChip.color,
                          padding: "6px 10px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          display: "inline-block",
                        }}
                      >
                        {statusChip.label}
                      </span>
                    </td>

                    <td style={tdBase}>
                      <span
                        style={{
                          background: reconChip.bg,
                          color: reconChip.color,
                          padding: "6px 10px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          display: "inline-block",
                        }}
                      >
                        {reconChip.label}
                      </span>
                    </td>

                    <td style={tdMuted(c)}>{payment.mpesa_receipt || "—"}</td>
                    <td style={{ ...tdMuted(c), maxWidth: 180 }}>{payment.failure_reason || "—"}</td>
                    <td style={tdMuted(c)}>
                      {payment.created_at ? new Date(payment.created_at).toLocaleString() : "—"}
                    </td>

                    <td style={{ ...tdBase, textAlign: "center" }}>
                      <button
                        onClick={() => setSelectedPayment(payment)}
                        style={{
                          background: "#667eea",
                          color: "white",
                          border: "none",
                          padding: "6px 12px",
                          borderRadius: 6,
                          cursor: "pointer",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedPayment && (
        <PaymentsDetailModal
          payment={selectedPayment}
          isDark={isDark}
          onClose={() => setSelectedPayment(null)}
          onSaved={loadPayments}
        />
      )}

      {showManualModal && (
        <ManualPaymentModal
          isDark={isDark}
          onClose={() => setShowManualModal(false)}
          onSaved={loadPayments}
        />
      )}
    </div>
  );
}

const tdBase = {
  padding: 14,
  fontSize: 13,
  verticalAlign: "top",
};

function tdPrimary(c) {
  return {
    ...tdBase,
    color: c.text,
    fontWeight: 700,
  };
}

function tdMuted(c) {
  return {
    ...tdBase,
    color: c.muted,
  };
}

function thStyle(c) {
  return {
    padding: 14,
    textAlign: "left",
    fontSize: 12,
    fontWeight: 800,
    color: c.muted,
  };
}
