import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { getThemeColors } from "../utils/themeColors";
import {
  createCoupon,
  createMarketingCampaign,
  listCoupons,
  listMarketingCampaigns,
  updateCoupon,
  updateMarketingCampaign,
} from "../api/marketing";

const campaignDefaults = {
  name: "",
  campaign_code: "",
  campaign_type: "general",
  status: "draft",
  customer_scope: "all",
  starts_at: "",
  ends_at: "",
  priority: 0,
  hero_title: "",
  hero_subtitle: "",
  badge_label: "",
  cta_label: "Shop now",
  cta_url: "/products",
  budget_amount: "",
  target_amount: "",
  description: "",
};

const couponDefaults = {
  campaign_id: "",
  code: "",
  name: "",
  description: "",
  status: "draft",
  discount_type: "percentage",
  discount_value: "",
  max_discount_amount: "",
  min_order_amount: "",
  customer_scope: "all",
  applies_to: "all",
  starts_at: "",
  ends_at: "",
  max_total_uses: "",
  max_uses_per_phone: "1",
};

function asArray(value, key) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.[key])) return value.data[key];
  return [];
}

function unwrap(value, key) {
  return value?.data?.[key] || value?.data || value || {};
}

function money(value) {
  return `KES ${Number(value || 0).toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
}

function formatDate(value) {
  if (!value) return "No limit";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No limit";
  return date.toLocaleString("en-KE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function toIso(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function cleanNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function StatusPill({ status }) {
  const normalized = String(status || "draft").toLowerCase();
  const map = {
    active: { bg: "#dcfce7", color: "#166534", text: "Active" },
    paused: { bg: "#fef3c7", color: "#92400e", text: "Paused" },
    draft: { bg: "#e0e7ff", color: "#3730a3", text: "Draft" },
    expired: { bg: "#fee2e2", color: "#991b1b", text: "Expired" },
  };
  const item = map[normalized] || map.draft;
  return (
    <span style={{ background: item.bg, color: item.color, borderRadius: 999, padding: "5px 10px", fontSize: 12, fontWeight: 800 }}>
      {item.text}
    </span>
  );
}

function Card({ children, style = {} }) {
  return <div style={{ borderRadius: 16, padding: 18, border: "1px solid rgba(148,163,184,0.22)", ...style }}>{children}</div>;
}

function Field({ label, children }) {
  return (
    <label style={{ display: "grid", gap: 7, fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.4 }}>
      {label}
      {children}
    </label>
  );
}

export default function Marketing() {
  const { isDark } = useTheme();
  const c = getThemeColors(isDark);
  const [campaigns, setCampaigns] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [campaignForm, setCampaignForm] = useState(campaignDefaults);
  const [couponForm, setCouponForm] = useState(couponDefaults);

  const activeCampaigns = useMemo(() => campaigns.filter((campaign) => campaign.status === "active"), [campaigns]);
  const activeCoupons = useMemo(() => coupons.filter((coupon) => coupon.status === "active"), [coupons]);
  const redemptions = useMemo(() => coupons.reduce((sum, coupon) => sum + Number(coupon.redemption_count || 0), 0), [coupons]);
  const discountGiven = useMemo(() => coupons.reduce((sum, coupon) => sum + Number(coupon.discount_given || 0), 0), [coupons]);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const [campaignRes, couponRes] = await Promise.all([
        listMarketingCampaigns({ limit: 80 }),
        listCoupons({ limit: 100 }),
      ]);
      setCampaigns(asArray(campaignRes, "campaigns"));
      setCoupons(asArray(couponRes, "coupons"));
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load marketing command center");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function showMessage(text) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2600);
  }

  async function submitCampaign(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...campaignForm,
        priority: Number(campaignForm.priority || 0),
        starts_at: toIso(campaignForm.starts_at),
        ends_at: toIso(campaignForm.ends_at),
        budget_amount: cleanNumber(campaignForm.budget_amount),
        target_amount: cleanNumber(campaignForm.target_amount),
      };
      await createMarketingCampaign(payload);
      setCampaignForm(campaignDefaults);
      showMessage("Campaign created");
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to create campaign");
    } finally {
      setSaving(false);
    }
  }

  async function submitCoupon(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...couponForm,
        campaign_id: cleanNumber(couponForm.campaign_id),
        discount_value: cleanNumber(couponForm.discount_value),
        max_discount_amount: cleanNumber(couponForm.max_discount_amount),
        min_order_amount: cleanNumber(couponForm.min_order_amount) || 0,
        starts_at: toIso(couponForm.starts_at),
        ends_at: toIso(couponForm.ends_at),
        max_total_uses: cleanNumber(couponForm.max_total_uses),
        max_uses_per_phone: cleanNumber(couponForm.max_uses_per_phone),
      };
      await createCoupon(payload);
      setCouponForm(couponDefaults);
      showMessage("Coupon created");
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to create coupon");
    } finally {
      setSaving(false);
    }
  }

  async function setCampaignStatus(campaign, status) {
    try {
      await updateMarketingCampaign(campaign.id, { status });
      showMessage(`Campaign ${status}`);
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to update campaign");
    }
  }

  async function setCouponStatus(coupon, status) {
    try {
      await updateCoupon(coupon.id, { status });
      showMessage(`Coupon ${status}`);
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to update coupon");
    }
  }

  const inputStyle = {
    width: "100%",
    border: `1px solid ${c.border}`,
    borderRadius: 10,
    padding: "11px 12px",
    background: c.card,
    color: c.text,
    boxSizing: "border-box",
    outline: "none",
  };

  const buttonStyle = {
    border: 0,
    borderRadius: 10,
    padding: "11px 14px",
    fontWeight: 900,
    cursor: "pointer",
  };

  return (
    <div style={{ color: c.text, display: "grid", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 12, color: "#f97316", fontWeight: 900, textTransform: "uppercase", letterSpacing: 1 }}>Marketing desk</div>
          <h1 style={{ margin: "6px 0 4px", fontSize: 34 }}>Campaigns and coupons</h1>
          <p style={{ margin: 0, color: c.textMuted, maxWidth: 720 }}>
            Launch controlled offers, track redemption, and keep checkout discounts verified by the backend.
          </p>
        </div>
        <button onClick={loadData} style={{ ...buttonStyle, background: "#111827", color: "#fff" }}>Refresh</button>
      </div>

      {error && <Card style={{ background: "#fee2e2", color: "#991b1b" }}>{error}</Card>}
      {message && <Card style={{ background: "#dcfce7", color: "#166534" }}>{message}</Card>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
        <Card style={{ background: c.card }}><strong style={{ fontSize: 26 }}>{campaigns.length}</strong><div style={{ color: c.textMuted }}>Campaigns</div></Card>
        <Card style={{ background: c.card }}><strong style={{ fontSize: 26 }}>{activeCampaigns.length}</strong><div style={{ color: c.textMuted }}>Active campaigns</div></Card>
        <Card style={{ background: c.card }}><strong style={{ fontSize: 26 }}>{activeCoupons.length}</strong><div style={{ color: c.textMuted }}>Active coupons</div></Card>
        <Card style={{ background: c.card }}><strong style={{ fontSize: 26 }}>{redemptions}</strong><div style={{ color: c.textMuted }}>Redemptions</div></Card>
        <Card style={{ background: c.card }}><strong style={{ fontSize: 26 }}>{money(discountGiven)}</strong><div style={{ color: c.textMuted }}>Discount given</div></Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
        <Card style={{ background: c.card }}>
          <h2 style={{ marginTop: 0 }}>Create campaign</h2>
          <form onSubmit={submitCampaign} style={{ display: "grid", gap: 12 }}>
            <Field label="Campaign name"><input required style={inputStyle} value={campaignForm.name} onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })} /></Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Type"><select style={inputStyle} value={campaignForm.campaign_type} onChange={(e) => setCampaignForm({ ...campaignForm, campaign_type: e.target.value })}><option value="general">General</option><option value="flash">Flash</option><option value="bundle">Bulk saver</option><option value="route">Route growth</option><option value="vendor">Vendor</option></select></Field>
              <Field label="Status"><select style={inputStyle} value={campaignForm.status} onChange={(e) => setCampaignForm({ ...campaignForm, status: e.target.value })}><option value="draft">Draft</option><option value="active">Active</option><option value="paused">Paused</option></select></Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Starts"><input type="datetime-local" style={inputStyle} value={campaignForm.starts_at} onChange={(e) => setCampaignForm({ ...campaignForm, starts_at: e.target.value })} /></Field>
              <Field label="Ends"><input type="datetime-local" style={inputStyle} value={campaignForm.ends_at} onChange={(e) => setCampaignForm({ ...campaignForm, ends_at: e.target.value })} /></Field>
            </div>
            <Field label="Hero title"><input style={inputStyle} value={campaignForm.hero_title} onChange={(e) => setCampaignForm({ ...campaignForm, hero_title: e.target.value })} /></Field>
            <Field label="Short note"><textarea rows={3} style={inputStyle} value={campaignForm.description} onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })} /></Field>
            <button disabled={saving} style={{ ...buttonStyle, background: "#f97316", color: "#fff" }}>{saving ? "Saving..." : "Create campaign"}</button>
          </form>
        </Card>

        <Card style={{ background: c.card }}>
          <h2 style={{ marginTop: 0 }}>Create coupon</h2>
          <form onSubmit={submitCoupon} style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Code"><input required style={{ ...inputStyle, textTransform: "uppercase" }} value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} /></Field>
              <Field label="Campaign"><select style={inputStyle} value={couponForm.campaign_id} onChange={(e) => setCouponForm({ ...couponForm, campaign_id: e.target.value })}><option value="">No campaign</option>{campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}</select></Field>
            </div>
            <Field label="Coupon name"><input required style={inputStyle} value={couponForm.name} onChange={(e) => setCouponForm({ ...couponForm, name: e.target.value })} /></Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Discount type"><select style={inputStyle} value={couponForm.discount_type} onChange={(e) => setCouponForm({ ...couponForm, discount_type: e.target.value })}><option value="percentage">Percentage</option><option value="fixed_amount">Fixed amount</option></select></Field>
              <Field label="Discount value"><input required type="number" min="1" step="0.01" style={inputStyle} value={couponForm.discount_value} onChange={(e) => setCouponForm({ ...couponForm, discount_value: e.target.value })} /></Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Minimum order"><input type="number" min="0" style={inputStyle} value={couponForm.min_order_amount} onChange={(e) => setCouponForm({ ...couponForm, min_order_amount: e.target.value })} /></Field>
              <Field label="Max discount"><input type="number" min="0" style={inputStyle} value={couponForm.max_discount_amount} onChange={(e) => setCouponForm({ ...couponForm, max_discount_amount: e.target.value })} /></Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Status"><select style={inputStyle} value={couponForm.status} onChange={(e) => setCouponForm({ ...couponForm, status: e.target.value })}><option value="draft">Draft</option><option value="active">Active</option><option value="paused">Paused</option></select></Field>
              <Field label="Customer scope"><select style={inputStyle} value={couponForm.customer_scope} onChange={(e) => setCouponForm({ ...couponForm, customer_scope: e.target.value })}><option value="all">All</option><option value="normal">Normal customers</option><option value="route">Route customers</option><option value="vendor">Vendor</option></select></Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Total uses"><input type="number" min="1" style={inputStyle} value={couponForm.max_total_uses} onChange={(e) => setCouponForm({ ...couponForm, max_total_uses: e.target.value })} /></Field>
              <Field label="Uses per phone"><input type="number" min="1" style={inputStyle} value={couponForm.max_uses_per_phone} onChange={(e) => setCouponForm({ ...couponForm, max_uses_per_phone: e.target.value })} /></Field>
            </div>
            <button disabled={saving} style={{ ...buttonStyle, background: "#111827", color: "#fff" }}>{saving ? "Saving..." : "Create coupon"}</button>
          </form>
        </Card>
      </div>

      <Card style={{ background: c.card }}>
        <h2 style={{ marginTop: 0 }}>Campaign register</h2>
        {loading ? <p>Loading...</p> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
              <thead><tr style={{ color: c.textMuted, textAlign: "left" }}><th style={{ padding: 10 }}>Campaign</th><th>Status</th><th>Window</th><th>Coupons</th><th>Revenue</th><th>Action</th></tr></thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} style={{ borderTop: `1px solid ${c.border}` }}>
                    <td style={{ padding: 10 }}><strong>{campaign.name}</strong><div style={{ color: c.textMuted, fontSize: 12 }}>{campaign.campaign_code}</div></td>
                    <td><StatusPill status={campaign.status} /></td>
                    <td style={{ color: c.textMuted, fontSize: 13 }}>{formatDate(campaign.starts_at)} - {formatDate(campaign.ends_at)}</td>
                    <td>{campaign.coupon_count || 0}</td>
                    <td>{money(campaign.attributed_revenue)}</td>
                    <td><button style={{ ...buttonStyle, padding: "8px 10px", background: campaign.status === "active" ? "#fef3c7" : "#dcfce7", color: campaign.status === "active" ? "#92400e" : "#166534" }} onClick={() => setCampaignStatus(campaign, campaign.status === "active" ? "paused" : "active")}>{campaign.status === "active" ? "Pause" : "Activate"}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card style={{ background: c.card }}>
        <h2 style={{ marginTop: 0 }}>Coupon register</h2>
        {loading ? <p>Loading...</p> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
              <thead><tr style={{ color: c.textMuted, textAlign: "left" }}><th style={{ padding: 10 }}>Coupon</th><th>Status</th><th>Discount</th><th>Minimum</th><th>Uses</th><th>Discount given</th><th>Action</th></tr></thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.id} style={{ borderTop: `1px solid ${c.border}` }}>
                    <td style={{ padding: 10 }}><strong>{coupon.code}</strong><div style={{ color: c.textMuted, fontSize: 12 }}>{coupon.name}{coupon.campaign_name ? ` - ${coupon.campaign_name}` : ""}</div></td>
                    <td><StatusPill status={coupon.status} /></td>
                    <td>{coupon.discount_type === "percentage" ? `${Number(coupon.discount_value)}%` : money(coupon.discount_value)}</td>
                    <td>{money(coupon.min_order_amount)}</td>
                    <td>{coupon.redemption_count || 0}{coupon.max_total_uses ? ` / ${coupon.max_total_uses}` : ""}</td>
                    <td>{money(coupon.discount_given)}</td>
                    <td><button style={{ ...buttonStyle, padding: "8px 10px", background: coupon.status === "active" ? "#fef3c7" : "#dcfce7", color: coupon.status === "active" ? "#92400e" : "#166534" }} onClick={() => setCouponStatus(coupon, coupon.status === "active" ? "paused" : "active")}>{coupon.status === "active" ? "Pause" : "Activate"}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
