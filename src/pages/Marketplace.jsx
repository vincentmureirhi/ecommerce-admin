import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { getThemeColors } from "../utils/themeColors";
import {
  approveVendorApplication,
  createVendorPlan,
  listVendorApplications,
  listVendorPlans,
  listVendors,
  rejectVendorApplication,
  resetVendorOwnerPassword,
  updateVendor,
  updateVendorPlan,
} from "../api/vendors";

const money = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat("en-KE");

const tabs = [
  { id: "applications", label: "Applications" },
  { id: "vendors", label: "Vendors" },
  { id: "plans", label: "Plans" },
];

const statusTone = {
  submitted: "warning",
  under_review: "warning",
  approved: "success",
  rejected: "danger",
  active: "success",
  pending: "warning",
  suspended: "danger",
  closed: "muted",
  verified: "success",
  unverified: "muted",
  trial: "warning",
  past_due: "danger",
  cancelled: "muted",
};

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
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

function labelize(value) {
  return String(value || "-")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function readArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
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

function Badge({ value, isDark }) {
  const key = String(value || "").toLowerCase();
  const style = toneStyle(statusTone[key] || "muted", isDark);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        border: `1px solid ${style.border}`,
        background: style.background,
        color: style.color,
        borderRadius: 999,
        padding: "5px 10px",
        fontSize: 12,
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      {labelize(value)}
    </span>
  );
}

function MetricCard({ label, value, sub, c, isDark }) {
  return (
    <div
      style={{
        background: c.card,
        border: `1px solid ${c.border}`,
        borderRadius: 10,
        padding: 16,
        boxShadow: isDark ? "none" : "0 10px 26px rgba(15,23,42,0.05)",
      }}
    >
      <div style={{ color: c.textMuted, fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ color: c.text, fontSize: 26, fontWeight: 900, marginTop: 8 }}>{value}</div>
      {sub && <div style={{ color: c.textMuted, fontSize: 13, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function Panel({ title, action, children, c, isDark }) {
  return (
    <section
      style={{
        background: c.card,
        border: `1px solid ${c.border}`,
        borderRadius: 10,
        overflow: "hidden",
        boxShadow: isDark ? "none" : "0 10px 30px rgba(15,23,42,0.06)",
      }}
    >
      <div
        style={{
          padding: "16px 18px",
          borderBottom: `1px solid ${c.borderLight}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18, color: c.text }}>{title}</h2>
        {action}
      </div>
      <div style={{ padding: 18 }}>{children}</div>
    </section>
  );
}

function EmptyState({ c, children }) {
  return (
    <div
      style={{
        padding: 28,
        borderRadius: 10,
        border: `1px dashed ${c.border}`,
        color: c.textMuted,
        textAlign: "center",
      }}
    >
      {children}
    </div>
  );
}

function Table({ columns, rows, renderRow, empty, c }) {
  if (!rows.length) return <EmptyState c={c}>{empty}</EmptyState>;

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", minWidth: 900, borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                style={{
                  textAlign: "left",
                  color: c.textMuted,
                  fontSize: 12,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  padding: "0 10px 12px",
                  borderBottom: `1px solid ${c.borderLight}`,
                  whiteSpace: "nowrap",
                }}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{rows.map(renderRow)}</tbody>
      </table>
    </div>
  );
}

function Cell({ children, c, muted = false, align = "left" }) {
  return (
    <td
      style={{
        padding: "14px 10px",
        borderBottom: `1px solid ${c.borderLight}`,
        color: muted ? c.textMuted : c.text,
        fontSize: 14,
        verticalAlign: "top",
        textAlign: align,
      }}
    >
      {children}
    </td>
  );
}

function Button({ children, tone = "default", disabled, onClick, type = "button" }) {
  const colors = {
    default: { background: "#111827", color: "#fff", border: "#111827" },
    orange: { background: "#ff4f1f", color: "#fff", border: "#ff4f1f" },
    danger: { background: "#dc2626", color: "#fff", border: "#dc2626" },
    ghost: { background: "transparent", color: "#2563eb", border: "#cbd5e1" },
  };
  const style = colors[tone] || colors.default;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        border: `1px solid ${style.border}`,
        background: disabled ? "#94a3b8" : style.background,
        color: style.color,
        borderRadius: 8,
        padding: "9px 12px",
        fontWeight: 800,
        cursor: disabled ? "not-allowed" : "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

export default function Marketplace() {
  const { isDark } = useTheme();
  const c = getThemeColors(isDark);

  const [activeTab, setActiveTab] = useState("applications");
  const [applications, setApplications] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [approvalDraft, setApprovalDraft] = useState(null);
  const [credentials, setCredentials] = useState(null);
  const [passwordReset, setPasswordReset] = useState(null);
  const [newPlan, setNewPlan] = useState({
    code: "",
    name: "",
    monthly_fee: 0,
    commission_rate: 0,
    max_products: 25,
    featured_slots: 0,
    minimum_margin_percent: 0,
    description: "",
  });

  async function loadData(options = {}) {
    const silent = Boolean(options.silent);
    try {
      if (!silent) setLoading(true);
      setError("");

      const [applicationRows, vendorRows, planRows] = await Promise.all([
        listVendorApplications({ status: statusFilter, search }),
        listVendors({ status: activeTab === "vendors" ? statusFilter : "", search }),
        listVendorPlans(),
      ]);

      setApplications(readArray(applicationRows));
      setVendors(readArray(vendorRows));
      setPlans(readArray(planRows));
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to load marketplace data");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [activeTab, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => loadData({ silent: true }), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const stats = useMemo(() => {
    const pendingApplications = applications.filter((a) => ["submitted", "under_review"].includes(a.status)).length;
    const activeVendors = vendors.filter((v) => v.status === "active").length;
    const monthlyFees = vendors
      .filter((v) => v.status === "active")
      .reduce((sum, vendor) => sum + toNumber(vendor.monthly_fee), 0);
    const averageCommission =
      activeVendors > 0
        ? vendors
            .filter((v) => v.status === "active")
            .reduce((sum, vendor) => sum + toNumber(vendor.commission_rate), 0) / activeVendors
        : 0;

    return {
      pendingApplications,
      activeVendors,
      monthlyFees,
      averageCommission,
      activePlans: plans.filter((p) => p.is_active !== false).length,
    };
  }, [applications, plans, vendors]);

  function getPlan(id) {
    return plans.find((plan) => Number(plan.id) === Number(id)) || plans[0] || null;
  }

  function openApprove(application) {
    const plan = getPlan(application.preferred_plan_id);
    setSelectedApplication(application);
    setCredentials(null);
    setApprovalDraft({
      subscription_plan_id: plan?.id || "",
      monthly_fee: application.requested_monthly_fee || plan?.monthly_fee || 0,
      commission_rate: application.requested_commission_rate || plan?.commission_rate || 0,
      max_products: plan?.max_products || application.estimated_skus || 25,
      minimum_margin_percent: plan?.minimum_margin_percent || 0,
      product_approval_required: true,
      price_review_required: true,
      allow_vendor_discounts: Boolean(plan?.allow_vendor_discounts),
      fulfillment_model: application.fulfillment_preference || "xpose_reviewed",
      verification_status: "verified",
      subscription_status: "trial",
      create_owner_user: true,
      review_notes: "",
    });
  }

  function updateApprovalPlan(planId) {
    const plan = getPlan(planId);
    setApprovalDraft((prev) => ({
      ...prev,
      subscription_plan_id: plan?.id || "",
      monthly_fee: plan?.monthly_fee || 0,
      commission_rate: plan?.commission_rate || 0,
      max_products: plan?.max_products || 25,
      minimum_margin_percent: plan?.minimum_margin_percent || 0,
      allow_vendor_discounts: Boolean(plan?.allow_vendor_discounts),
      product_approval_required: plan?.product_approval_required !== false,
      price_review_required: plan?.price_review_required !== false,
    }));
  }

  async function submitApproval() {
    if (!selectedApplication || !approvalDraft) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const result = await approveVendorApplication(selectedApplication.id, approvalDraft);
      setSuccess(`${selectedApplication.store_name} approved as a marketplace vendor.`);
      setCredentials(result?.temporary_password ? result : null);
      await loadData({ silent: true });
      if (!result?.temporary_password) {
        setSelectedApplication(null);
        setApprovalDraft(null);
      }
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to approve vendor");
    } finally {
      setSaving(false);
    }
  }

  async function rejectApplication(application) {
    const reason = window.prompt(`Why are we rejecting ${application.store_name}?`);
    if (!reason || !reason.trim()) return;

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await rejectVendorApplication(application.id, { rejection_reason: reason.trim() });
      setSuccess(`${application.store_name} rejected.`);
      await loadData({ silent: true });
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to reject application");
    } finally {
      setSaving(false);
    }
  }

  async function patchVendor(vendor, payload) {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await updateVendor(vendor.id, payload);
      setSuccess(`${vendor.store_name} updated.`);
      await loadData({ silent: true });
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to update vendor");
    } finally {
      setSaving(false);
    }
  }

  async function resetOwnerPassword(vendor) {
    const reason = window.prompt(
      `Reset owner password for ${vendor.store_name}? Add a short reason for the audit log.`,
      "Owner forgot temporary password"
    );
    if (reason === null) return;

    setSaving(true);
    setError("");
    setSuccess("");
    setPasswordReset(null);
    try {
      const result = await resetVendorOwnerPassword(vendor.id, { reason: reason.trim() });
      setPasswordReset(result);
      setSuccess(`Owner password reset for ${vendor.store_name}. Copy the new temporary password now.`);
      await loadData({ silent: true });
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to reset owner password");
    } finally {
      setSaving(false);
    }
  }

  async function savePlan(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await createVendorPlan({
        ...newPlan,
        product_approval_required: true,
        price_review_required: true,
        allow_vendor_discounts: false,
        is_active: true,
      });
      setSuccess("Vendor plan created.");
      setNewPlan({
        code: "",
        name: "",
        monthly_fee: 0,
        commission_rate: 0,
        max_products: 25,
        featured_slots: 0,
        minimum_margin_percent: 0,
        description: "",
      });
      await loadData({ silent: true });
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to create plan");
    } finally {
      setSaving(false);
    }
  }

  async function togglePlan(plan) {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await updateVendorPlan(plan.id, { is_active: plan.is_active === false });
      setSuccess(`${plan.name} updated.`);
      await loadData({ silent: true });
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to update plan");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    background: c.inputBg,
    color: c.text,
    border: `1px solid ${c.border}`,
    borderRadius: 8,
    padding: "10px 12px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: c.bg, color: c.text, padding: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 18,
          alignItems: "flex-start",
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        <div>
          <div
            style={{
              color: "#ff4f1f",
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: 1,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            XPOSE Marketplace
          </div>
          <h1 style={{ margin: 0, fontSize: 30 }}>Vendor Control Center</h1>
          <p style={{ color: c.textMuted, margin: "8px 0 0", maxWidth: 760 }}>
            Review sellers, set monthly fees and commissions, and keep vendor product pricing under XPOSE approval.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search vendors, contacts, phone..."
            style={{ ...inputStyle, width: 260 }}
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            style={{ ...inputStyle, width: 170 }}
          >
            <option value="">All statuses</option>
            {activeTab === "applications" ? (
              <>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </>
            ) : (
              <>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="closed">Closed</option>
              </>
            )}
          </select>
          <Button tone="orange" disabled={loading} onClick={() => loadData()}>
            Refresh
          </Button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 14,
          marginBottom: 18,
        }}
      >
        <MetricCard label="Pending Review" value={number.format(stats.pendingApplications)} sub="Vendor applications" c={c} isDark={isDark} />
        <MetricCard label="Active Vendors" value={number.format(stats.activeVendors)} sub="Approved stores" c={c} isDark={isDark} />
        <MetricCard label="Monthly Fees" value={money.format(stats.monthlyFees)} sub="Expected vendor billing" c={c} isDark={isDark} />
        <MetricCard label="Avg Commission" value={`${stats.averageCommission.toFixed(1)}%`} sub="Across active vendors" c={c} isDark={isDark} />
        <MetricCard label="Active Plans" value={number.format(stats.activePlans)} sub="Commercial packages" c={c} isDark={isDark} />
      </div>

      {(error || success) && (
        <div
          style={{
            marginBottom: 16,
            padding: 14,
            borderRadius: 10,
            border: `1px solid ${error ? "#ef4444" : "#16a34a"}`,
            background: error
              ? isDark ? "rgba(239,68,68,0.14)" : "#fef2f2"
              : isDark ? "rgba(22,163,74,0.14)" : "#f0fdf4",
            color: error ? (isDark ? "#fecaca" : "#991b1b") : (isDark ? "#bbf7d0" : "#166534"),
            fontWeight: 700,
          }}
        >
          {error || success}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id);
              setStatusFilter("");
            }}
            style={{
              border: `1px solid ${activeTab === tab.id ? "#ff4f1f" : c.border}`,
              background: activeTab === tab.id ? "#ff4f1f" : c.card,
              color: activeTab === tab.id ? "#fff" : c.text,
              borderRadius: 999,
              padding: "10px 16px",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Panel title="Loading marketplace" c={c} isDark={isDark}>
          Loading vendor marketplace controls...
        </Panel>
      ) : (
        <>
          {activeTab === "applications" && (
            <Panel title="Vendor Applications" c={c} isDark={isDark}>
              <Table
                c={c}
                columns={["Store", "Contact", "Pricing", "Products", "Status", "Submitted", "Actions"]}
                rows={applications}
                empty="No vendor applications match this view."
                renderRow={(application) => (
                  <tr key={application.id}>
                    <Cell c={c}>
                      <strong>{application.store_name}</strong>
                      <div style={{ color: c.textMuted, fontSize: 12 }}>{application.legal_name || "No legal name"}</div>
                      <div style={{ color: c.textMuted, fontSize: 12 }}>{application.application_number}</div>
                    </Cell>
                    <Cell c={c}>
                      {application.contact_person}
                      <div style={{ color: c.textMuted, fontSize: 12 }}>{application.phone}</div>
                      <div style={{ color: c.textMuted, fontSize: 12 }}>{application.email}</div>
                    </Cell>
                    <Cell c={c}>
                      <strong>
                        {application.requested_monthly_fee
                          ? money.format(application.requested_monthly_fee)
                          : application.preferred_plan_name || "Plan review"}
                      </strong>
                      <div style={{ color: c.textMuted, fontSize: 12 }}>
                        {application.requested_commission_rate
                          ? `${application.requested_commission_rate}% requested commission`
                          : "Use plan commission"}
                      </div>
                    </Cell>
                    <Cell c={c}>
                      {number.format(toNumber(application.estimated_skus))} SKUs
                      <div style={{ color: c.textMuted, fontSize: 12 }}>
                        {(application.product_categories || []).join(", ") || "No categories listed"}
                      </div>
                    </Cell>
                    <Cell c={c}>
                      <Badge value={application.status} isDark={isDark} />
                    </Cell>
                    <Cell c={c} muted>{formatDate(application.created_at)}</Cell>
                    <Cell c={c}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {["submitted", "under_review"].includes(application.status) && (
                          <>
                            <Button tone="orange" disabled={saving} onClick={() => openApprove(application)}>
                              Approve
                            </Button>
                            <Button tone="danger" disabled={saving} onClick={() => rejectApplication(application)}>
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </Cell>
                  </tr>
                )}
              />
            </Panel>
          )}

          {activeTab === "vendors" && (
            <Panel title="Approved Vendors" c={c} isDark={isDark}>
              <Table
                c={c}
                columns={["Store", "Plan", "Commercials", "Products", "Status", "Subscription", "Actions"]}
                rows={vendors}
                empty="No vendors match this view."
                renderRow={(vendor) => (
                  <tr key={vendor.id}>
                    <Cell c={c}>
                      <strong>{vendor.store_name}</strong>
                      <div style={{ color: c.textMuted, fontSize: 12 }}>{vendor.contact_person}</div>
                      <div style={{ color: c.textMuted, fontSize: 12 }}>{vendor.email}</div>
                    </Cell>
                    <Cell c={c}>
                      {vendor.plan_name || "Custom"}
                      <div style={{ color: c.textMuted, fontSize: 12 }}>{vendor.fulfillment_model}</div>
                    </Cell>
                    <Cell c={c}>
                      <strong>{money.format(vendor.monthly_fee)}</strong>
                      <div style={{ color: c.textMuted, fontSize: 12 }}>{toNumber(vendor.commission_rate).toFixed(1)}% commission</div>
                    </Cell>
                    <Cell c={c}>
                      {number.format(vendor.approved_product_count || 0)} approved
                      <div style={{ color: c.textMuted, fontSize: 12 }}>
                        {number.format(vendor.pending_submission_count || 0)} pending / {number.format(vendor.max_products || 0)} max
                      </div>
                    </Cell>
                    <Cell c={c}>
                      <div style={{ display: "grid", gap: 6 }}>
                        <Badge value={vendor.status} isDark={isDark} />
                        <Badge value={vendor.verification_status} isDark={isDark} />
                      </div>
                    </Cell>
                    <Cell c={c}>
                      <Badge value={vendor.subscription_status || "trial"} isDark={isDark} />
                      <div style={{ color: c.textMuted, fontSize: 12, marginTop: 6 }}>
                        Ends {formatDate(vendor.subscription_current_period_end)}
                      </div>
                    </Cell>
                    <Cell c={c}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {vendor.status === "active" ? (
                          <Button tone="danger" disabled={saving} onClick={() => patchVendor(vendor, { status: "suspended" })}>
                            Suspend
                          </Button>
                        ) : (
                          <Button tone="orange" disabled={saving} onClick={() => patchVendor(vendor, { status: "active" })}>
                            Activate
                          </Button>
                        )}
                        {vendor.verification_status === "verified" ? (
                          <Button tone="ghost" disabled={saving} onClick={() => patchVendor(vendor, { verification_status: "pending" })}>
                            Mark pending
                          </Button>
                        ) : (
                          <Button tone="ghost" disabled={saving} onClick={() => patchVendor(vendor, { verification_status: "verified" })}>
                            Verify
                          </Button>
                        )}
                        <Button tone="ghost" disabled={saving} onClick={() => resetOwnerPassword(vendor)}>
                          Reset owner password
                        </Button>
                      </div>
                    </Cell>
                  </tr>
                )}
              />
            </Panel>
          )}

          {activeTab === "plans" && (
            <div style={{ display: "grid", gridTemplateColumns: "minmax(300px, 0.8fr) minmax(420px, 1.2fr)", gap: 18 }}>
              <Panel title="Create Plan" c={c} isDark={isDark}>
                <form onSubmit={savePlan} style={{ display: "grid", gap: 12 }}>
                  <input
                    value={newPlan.code}
                    onChange={(event) => setNewPlan((prev) => ({ ...prev, code: event.target.value }))}
                    placeholder="Plan code, e.g. enterprise"
                    style={inputStyle}
                    required
                  />
                  <input
                    value={newPlan.name}
                    onChange={(event) => setNewPlan((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="Plan name"
                    style={inputStyle}
                    required
                  />
                  <textarea
                    value={newPlan.description}
                    onChange={(event) => setNewPlan((prev) => ({ ...prev, description: event.target.value }))}
                    placeholder="Short commercial description"
                    rows={3}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                    <input
                      type="number"
                      value={newPlan.monthly_fee}
                      onChange={(event) => setNewPlan((prev) => ({ ...prev, monthly_fee: event.target.value }))}
                      placeholder="Monthly fee"
                      style={inputStyle}
                    />
                    <input
                      type="number"
                      value={newPlan.commission_rate}
                      onChange={(event) => setNewPlan((prev) => ({ ...prev, commission_rate: event.target.value }))}
                      placeholder="Commission %"
                      style={inputStyle}
                    />
                    <input
                      type="number"
                      value={newPlan.max_products}
                      onChange={(event) => setNewPlan((prev) => ({ ...prev, max_products: event.target.value }))}
                      placeholder="Max products"
                      style={inputStyle}
                    />
                    <input
                      type="number"
                      value={newPlan.featured_slots}
                      onChange={(event) => setNewPlan((prev) => ({ ...prev, featured_slots: event.target.value }))}
                      placeholder="Featured slots"
                      style={inputStyle}
                    />
                  </div>
                  <input
                    type="number"
                    value={newPlan.minimum_margin_percent}
                    onChange={(event) => setNewPlan((prev) => ({ ...prev, minimum_margin_percent: event.target.value }))}
                    placeholder="Minimum margin %"
                    style={inputStyle}
                  />
                  <Button tone="orange" type="submit" disabled={saving}>
                    Create plan
                  </Button>
                </form>
              </Panel>

              <Panel title="Commercial Plans" c={c} isDark={isDark}>
                <Table
                  c={c}
                  columns={["Plan", "Fee", "Commission", "Products", "Controls", "Actions"]}
                  rows={plans}
                  empty="No vendor plans found."
                  renderRow={(plan) => (
                    <tr key={plan.id}>
                      <Cell c={c}>
                        <strong>{plan.name}</strong>
                        <div style={{ color: c.textMuted, fontSize: 12 }}>{plan.code}</div>
                        <div style={{ color: c.textMuted, fontSize: 12 }}>{plan.description}</div>
                      </Cell>
                      <Cell c={c}>{money.format(plan.monthly_fee)}</Cell>
                      <Cell c={c}>{toNumber(plan.commission_rate).toFixed(1)}%</Cell>
                      <Cell c={c}>
                        {number.format(plan.max_products)} max
                        <div style={{ color: c.textMuted, fontSize: 12 }}>{number.format(plan.featured_slots)} featured slots</div>
                      </Cell>
                      <Cell c={c}>
                        <div style={{ display: "grid", gap: 4, color: c.textMuted, fontSize: 12 }}>
                          <span>Product review: {plan.product_approval_required ? "Yes" : "No"}</span>
                          <span>Price review: {plan.price_review_required ? "Yes" : "No"}</span>
                          <span>Min margin: {toNumber(plan.minimum_margin_percent).toFixed(1)}%</span>
                        </div>
                      </Cell>
                      <Cell c={c}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <Badge value={plan.is_active === false ? "inactive" : "active"} isDark={isDark} />
                          <Button tone="ghost" disabled={saving} onClick={() => togglePlan(plan)}>
                            {plan.is_active === false ? "Activate" : "Pause"}
                          </Button>
                        </div>
                      </Cell>
                    </tr>
                  )}
                />
              </Panel>
            </div>
          )}
        </>
      )}

      {passwordReset?.temporary_password && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.62)",
            zIndex: 60,
            display: "grid",
            placeItems: "center",
            padding: 18,
          }}
        >
          <div
            style={{
              width: "min(560px, 100%)",
              borderRadius: 12,
              background: c.card,
              border: `1px solid ${c.border}`,
              color: c.text,
              boxShadow: "0 24px 70px rgba(0,0,0,0.28)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: 18, borderBottom: `1px solid ${c.borderLight}` }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>Owner Password Reset</h2>
              <p style={{ margin: "6px 0 0", color: c.textMuted, fontSize: 13 }}>
                Share this with the store owner now. It will not be shown again after closing.
              </p>
            </div>
            <div style={{ padding: 18, display: "grid", gap: 12 }}>
              <div
                style={{
                  border: "1px solid #16a34a",
                  background: isDark ? "rgba(22,163,74,0.14)" : "#f0fdf4",
                  color: isDark ? "#bbf7d0" : "#166534",
                  borderRadius: 10,
                  padding: 14,
                  lineHeight: 1.7,
                }}
              >
                <strong>{passwordReset.store_name}</strong>
                <div>Username: {passwordReset.username || passwordReset.vendor_user?.username}</div>
                <div>Temporary password: {passwordReset.temporary_password}</div>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
                <Button
                  tone="ghost"
                  onClick={() => {
                    const text = `Vendor login\nStore: ${passwordReset.store_name}\nUsername: ${
                      passwordReset.username || passwordReset.vendor_user?.username || ""
                    }\nTemporary password: ${passwordReset.temporary_password}`;
                    navigator.clipboard?.writeText(text);
                  }}
                >
                  Copy details
                </Button>
                <Button tone="orange" onClick={() => setPasswordReset(null)}>
                  Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedApplication && approvalDraft && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.62)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 4000,
            padding: 20,
          }}
        >
          <div
            style={{
              background: c.card,
              color: c.text,
              border: `1px solid ${c.border}`,
              borderRadius: 12,
              width: "min(760px, 100%)",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
            }}
          >
            <div style={{ padding: 20, borderBottom: `1px solid ${c.borderLight}` }}>
              <h2 style={{ margin: 0 }}>Approve {selectedApplication.store_name}</h2>
              <p style={{ margin: "8px 0 0", color: c.textMuted }}>
                Set the commercial terms before this vendor receives marketplace access.
              </p>
            </div>

            <div style={{ padding: 20, display: "grid", gap: 14 }}>
              {credentials?.temporary_password && (
                <div
                  style={{
                    border: "1px solid #16a34a",
                    background: isDark ? "rgba(22,163,74,0.14)" : "#f0fdf4",
                    color: isDark ? "#bbf7d0" : "#166534",
                    borderRadius: 10,
                    padding: 14,
                  }}
                >
                  <strong>Owner account created</strong>
                  <div style={{ marginTop: 8 }}>Username: {credentials.owner_user?.username}</div>
                  <div>Temporary password: {credentials.temporary_password}</div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                <label>
                  <span style={{ display: "block", color: c.textMuted, fontSize: 12, marginBottom: 6 }}>Plan</span>
                  <select
                    value={approvalDraft.subscription_plan_id}
                    onChange={(event) => updateApprovalPlan(event.target.value)}
                    style={inputStyle}
                  >
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span style={{ display: "block", color: c.textMuted, fontSize: 12, marginBottom: 6 }}>Verification</span>
                  <select
                    value={approvalDraft.verification_status}
                    onChange={(event) => setApprovalDraft((prev) => ({ ...prev, verification_status: event.target.value }))}
                    style={inputStyle}
                  >
                    <option value="verified">Verified</option>
                    <option value="pending">Pending</option>
                    <option value="unverified">Unverified</option>
                  </select>
                </label>
                <label>
                  <span style={{ display: "block", color: c.textMuted, fontSize: 12, marginBottom: 6 }}>Monthly fee</span>
                  <input
                    type="number"
                    value={approvalDraft.monthly_fee}
                    onChange={(event) => setApprovalDraft((prev) => ({ ...prev, monthly_fee: event.target.value }))}
                    style={inputStyle}
                  />
                </label>
                <label>
                  <span style={{ display: "block", color: c.textMuted, fontSize: 12, marginBottom: 6 }}>Commission %</span>
                  <input
                    type="number"
                    value={approvalDraft.commission_rate}
                    onChange={(event) => setApprovalDraft((prev) => ({ ...prev, commission_rate: event.target.value }))}
                    style={inputStyle}
                  />
                </label>
                <label>
                  <span style={{ display: "block", color: c.textMuted, fontSize: 12, marginBottom: 6 }}>Max products</span>
                  <input
                    type="number"
                    value={approvalDraft.max_products}
                    onChange={(event) => setApprovalDraft((prev) => ({ ...prev, max_products: event.target.value }))}
                    style={inputStyle}
                  />
                </label>
                <label>
                  <span style={{ display: "block", color: c.textMuted, fontSize: 12, marginBottom: 6 }}>Minimum margin %</span>
                  <input
                    type="number"
                    value={approvalDraft.minimum_margin_percent}
                    onChange={(event) => setApprovalDraft((prev) => ({ ...prev, minimum_margin_percent: event.target.value }))}
                    style={inputStyle}
                  />
                </label>
                <label>
                  <span style={{ display: "block", color: c.textMuted, fontSize: 12, marginBottom: 6 }}>Fulfillment model</span>
                  <select
                    value={approvalDraft.fulfillment_model}
                    onChange={(event) => setApprovalDraft((prev) => ({ ...prev, fulfillment_model: event.target.value }))}
                    style={inputStyle}
                  >
                    <option value="xpose_reviewed">XPOSE reviewed</option>
                    <option value="xpose_fulfilled">XPOSE fulfilled</option>
                    <option value="vendor_fulfilled">Vendor fulfilled</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </label>
                <label>
                  <span style={{ display: "block", color: c.textMuted, fontSize: 12, marginBottom: 6 }}>Subscription state</span>
                  <select
                    value={approvalDraft.subscription_status}
                    onChange={(event) => setApprovalDraft((prev) => ({ ...prev, subscription_status: event.target.value }))}
                    style={inputStyle}
                  >
                    <option value="trial">Trial</option>
                    <option value="active">Active</option>
                  </select>
                </label>
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                {[
                  ["product_approval_required", "Require admin product approval"],
                  ["price_review_required", "Require price review before products go live"],
                  ["allow_vendor_discounts", "Allow vendor discounts later"],
                  ["create_owner_user", "Create vendor owner login"],
                ].map(([key, label]) => (
                  <label key={key} style={{ display: "flex", alignItems: "center", gap: 10, color: c.text }}>
                    <input
                      type="checkbox"
                      checked={Boolean(approvalDraft[key])}
                      onChange={(event) => setApprovalDraft((prev) => ({ ...prev, [key]: event.target.checked }))}
                    />
                    {label}
                  </label>
                ))}
              </div>

              <textarea
                value={approvalDraft.review_notes}
                onChange={(event) => setApprovalDraft((prev) => ({ ...prev, review_notes: event.target.value }))}
                placeholder="Internal approval notes"
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>

            <div
              style={{
                padding: 20,
                borderTop: `1px solid ${c.borderLight}`,
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <Button
                tone="ghost"
                disabled={saving}
                onClick={() => {
                  setSelectedApplication(null);
                  setApprovalDraft(null);
                  setCredentials(null);
                }}
              >
                Close
              </Button>
              {!credentials?.temporary_password && (
                <Button tone="orange" disabled={saving} onClick={submitApproval}>
                  {saving ? "Approving..." : "Approve vendor"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
