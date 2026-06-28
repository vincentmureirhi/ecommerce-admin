import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { getThemeColors } from "../utils/themeColors";
import { listProducts } from "../api/products";
import { listCategories } from "../api/categories";
import { listRegions } from "../api/regions";
import {
  createCoupon,
  createMarketingCampaign,
  getCampaignTargets,
  getMarketingAnalytics,
  listCoupons,
  listMarketingCampaigns,
  listSalesRepReferralCodes,
  replaceCampaignTargets,
  syncSalesRepReferralCodes,
  updateCoupon,
  updateMarketingCampaign,
} from "../api/marketing";

const campaignDefaults = {
  name: "",
  campaign_type: "general",
  status: "draft",
  customer_scope: "all",
  placement: "home",
  starts_at: "",
  ends_at: "",
  priority: 0,
  hero_title: "",
  hero_subtitle: "",
  badge_label: "",
  cta_label: "Shop now",
  cta_url: "/products",
  accent_color: "#ff5429",
  auto_activate: false,
  auto_expire: true,
  sms_enabled: false,
  sms_message: "",
  sms_audience: "campaign_scope",
  description: "",
};

const couponDefaults = {
  campaign_id: "",
  code: "",
  name: "",
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

function payloadData(value) {
  return value?.data ?? value ?? {};
}

function rowsFrom(value, key) {
  const payload = payloadData(value);
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.[key])) return payload[key];
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function money(value) {
  return `KES ${Number(value || 0).toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
}

function percent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function toIso(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function numberOrNull(value) {
  if (value === "" || value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatDate(value) {
  if (!value) return "Open";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Open";
  return date.toLocaleString("en-KE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function StatusPill({ status }) {
  const value = String(status || "draft").toLowerCase();
  const styles = {
    active: ["#dcfce7", "#166534"],
    paused: ["#fef3c7", "#92400e"],
    draft: ["#e0e7ff", "#3730a3"],
    ended: ["#e2e8f0", "#334155"],
    expired: ["#fee2e2", "#991b1b"],
  };
  const [background, color] = styles[value] || styles.draft;
  return <span style={{ background, color, borderRadius: 999, padding: "5px 10px", fontSize: 12, fontWeight: 900 }}>{value}</span>;
}

function Card({ children, color, style = {} }) {
  return <div style={{ background: color, border: "1px solid rgba(148,163,184,.25)", borderRadius: 12, padding: 18, ...style }}>{children}</div>;
}

function Field({ label, children }) {
  return <label style={{ display: "grid", gap: 6, fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>{label}{children}</label>;
}

function Toggle({ label, checked, onChange }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, fontWeight: 800 }}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

function TargetList({ title, rows, selectedIds, onToggle, labelFor }) {
  return (
    <div>
      <div style={{ fontWeight: 900, marginBottom: 8 }}>{title} <span style={{ opacity: .6 }}>({selectedIds.length})</span></div>
      <div style={{ border: "1px solid rgba(148,163,184,.25)", borderRadius: 10, padding: 8, maxHeight: 230, overflowY: "auto", display: "grid", gap: 5 }}>
        {rows.length === 0 && <div style={{ padding: 8, opacity: .65 }}>No records found</div>}
        {rows.map((row) => {
          const id = Number(row.id);
          return (
            <label key={id} style={{ display: "flex", gap: 8, alignItems: "center", padding: "7px 8px", borderRadius: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={selectedIds.includes(id)} onChange={() => onToggle(id)} />
              <span>{labelFor(row)}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default function Marketing() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [campaigns, setCampaigns] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [referrals, setReferrals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [regions, setRegions] = useState([]);
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [campaignForm, setCampaignForm] = useState(campaignDefaults);
  const [couponForm, setCouponForm] = useState(couponDefaults);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [targetIds, setTargetIds] = useState({ product_ids: [], category_ids: [], region_ids: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const inputStyle = {
    width: "100%", border: `1px solid ${colors.border}`, borderRadius: 9, padding: "10px 11px",
    background: colors.card, color: colors.text, boxSizing: "border-box", outline: "none",
  };
  const buttonStyle = { border: 0, borderRadius: 9, padding: "10px 13px", fontWeight: 900, cursor: "pointer" };
  const summary = analytics?.summary || {};
  const activeCampaigns = useMemo(() => campaigns.filter((row) => row.status === "active").length, [campaigns]);

  function notify(text) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2800);
  }

  async function loadDashboard() {
    setLoading(true);
    setError("");
    try {
      const [campaignRes, couponRes, analyticsRes, referralRes, categoryRes, regionRes] = await Promise.all([
        listMarketingCampaigns({ limit: 100 }), listCoupons({ limit: 100 }), getMarketingAnalytics(30),
        listSalesRepReferralCodes(), listCategories(), listRegions(),
      ]);
      setCampaigns(rowsFrom(campaignRes, "campaigns"));
      setCoupons(rowsFrom(couponRes, "coupons"));
      setAnalytics(payloadData(analyticsRes));
      setReferrals(rowsFrom(referralRes, "referrals"));
      setCategories(rowsFrom(categoryRes, "categories"));
      setRegions(rowsFrom(regionRes, "regions"));
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Marketing data could not be loaded");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadDashboard(); }, []);

  useEffect(() => {
    if (!selectedCampaignId) {
      setTargetIds({ product_ids: [], category_ids: [], region_ids: [] });
      return;
    }
    getCampaignTargets(selectedCampaignId).then((response) => {
      const data = payloadData(response);
      setTargetIds({
        product_ids: (data.products || []).map((row) => Number(row.id)),
        category_ids: (data.categories || []).map((row) => Number(row.id)),
        region_ids: (data.regions || []).map((row) => Number(row.id)),
      });
    }).catch((err) => setError(err?.response?.data?.message || "Campaign targets could not be loaded"));
  }, [selectedCampaignId]);

  async function searchProducts() {
    try {
      const response = await listProducts({ search: productSearch.trim() });
      setProducts(rowsFrom(response, "products").slice(0, 100));
    } catch (err) {
      setError(err?.response?.data?.message || "Products could not be loaded");
    }
  }

  async function submitCampaign(event) {
    event.preventDefault();
    setSaving(true); setError("");
    try {
      await createMarketingCampaign({
        ...campaignForm,
        priority: Number(campaignForm.priority || 0),
        starts_at: toIso(campaignForm.starts_at),
        ends_at: toIso(campaignForm.ends_at),
      });
      setCampaignForm(campaignDefaults);
      notify("Campaign created");
      await loadDashboard();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Campaign could not be created");
    } finally { setSaving(false); }
  }

  async function submitCoupon(event) {
    event.preventDefault();
    setSaving(true); setError("");
    try {
      await createCoupon({
        ...couponForm,
        campaign_id: numberOrNull(couponForm.campaign_id),
        discount_value: numberOrNull(couponForm.discount_value),
        max_discount_amount: numberOrNull(couponForm.max_discount_amount),
        min_order_amount: numberOrNull(couponForm.min_order_amount) || 0,
        starts_at: toIso(couponForm.starts_at), ends_at: toIso(couponForm.ends_at),
        max_total_uses: numberOrNull(couponForm.max_total_uses),
        max_uses_per_phone: numberOrNull(couponForm.max_uses_per_phone),
      });
      setCouponForm(couponDefaults);
      notify("Coupon created");
      await loadDashboard();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Coupon could not be created");
    } finally { setSaving(false); }
  }

  function toggleTarget(key, id) {
    setTargetIds((current) => ({
      ...current,
      [key]: current[key].includes(id) ? current[key].filter((value) => value !== id) : [...current[key], id],
    }));
  }

  async function saveTargets() {
    if (!selectedCampaignId) return;
    setSaving(true); setError("");
    try {
      await replaceCampaignTargets(selectedCampaignId, targetIds);
      notify("Campaign audience saved");
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Targets could not be saved");
    } finally { setSaving(false); }
  }

  async function toggleCampaign(campaign) {
    await updateMarketingCampaign(campaign.id, { status: campaign.status === "active" ? "paused" : "active" });
    await loadDashboard();
  }

  async function toggleCoupon(coupon) {
    await updateCoupon(coupon.id, { status: coupon.status === "active" ? "paused" : "active" });
    await loadDashboard();
  }

  async function syncReferrals() {
    await syncSalesRepReferralCodes();
    notify("Sales rep referral codes synchronized");
    await loadDashboard();
  }

  return (
    <div style={{ color: colors.text, display: "grid", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div><div style={{ color: "#f97316", fontWeight: 900, fontSize: 12 }}>MARKETING</div><h1 style={{ margin: "5px 0", fontSize: 34 }}>Growth command center</h1><p style={{ margin: 0, color: colors.textMuted }}>Offers, audiences, route referrals, and measured revenue.</p></div>
        <button onClick={loadDashboard} style={{ ...buttonStyle, background: "#111827", color: "#fff" }}>Refresh</button>
      </div>

      {error && <Card color="#fee2e2" style={{ color: "#991b1b" }}>{error}</Card>}
      {message && <Card color="#dcfce7" style={{ color: "#166534" }}>{message}</Card>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 10 }}>
        {[
          ["Active campaigns", summary.active_campaigns ?? activeCampaigns],
          ["Impressions", summary.impressions || 0],
          ["Clicks", summary.clicks || 0],
          ["Conversions", summary.conversions || 0],
          ["Conversion rate", percent(summary.conversion_rate)],
          ["Revenue", money(summary.attributed_revenue)],
          ["Average order", money(summary.average_order_value)],
        ].map(([label, value]) => <Card key={label} color={colors.card}><div style={{ fontSize: 24, fontWeight: 950 }}>{value}</div><div style={{ color: colors.textMuted, fontSize: 13 }}>{label}</div></Card>)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(330px,1fr))", gap: 15 }}>
        <Card color={colors.card}>
          <h2 style={{ marginTop: 0 }}>Create campaign</h2>
          <form onSubmit={submitCampaign} style={{ display: "grid", gap: 11 }}>
            <Field label="Name"><input required style={inputStyle} value={campaignForm.name} onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })} /></Field>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 9 }}>
              <Field label="Type"><select style={inputStyle} value={campaignForm.campaign_type} onChange={(e) => setCampaignForm({ ...campaignForm, campaign_type: e.target.value })}><option value="general">General</option><option value="flash">Flash</option><option value="bundle">Bulk</option><option value="route">Route</option><option value="referral">Referral</option><option value="clearance">Clearance</option></select></Field>
              <Field label="Status"><select style={inputStyle} value={campaignForm.status} onChange={(e) => setCampaignForm({ ...campaignForm, status: e.target.value })}><option value="draft">Draft</option><option value="active">Active</option><option value="paused">Paused</option></select></Field>
              <Field label="Audience"><select style={inputStyle} value={campaignForm.customer_scope} onChange={(e) => setCampaignForm({ ...campaignForm, customer_scope: e.target.value })}><option value="all">Everyone</option><option value="normal">Storefront</option><option value="route">Route customers</option><option value="vendor">Vendors</option></select></Field>
              <Field label="Placement"><select style={inputStyle} value={campaignForm.placement} onChange={(e) => setCampaignForm({ ...campaignForm, placement: e.target.value })}><option value="home">Home</option><option value="shop">Shop</option><option value="checkout">Checkout</option><option value="route_portal">Route portal</option><option value="all">Everywhere</option></select></Field>
            </div>
            <Field label="Headline"><input style={inputStyle} value={campaignForm.hero_title} onChange={(e) => setCampaignForm({ ...campaignForm, hero_title: e.target.value })} /></Field>
            <Field label="Campaign message"><textarea rows={2} style={inputStyle} value={campaignForm.hero_subtitle} onChange={(e) => setCampaignForm({ ...campaignForm, hero_subtitle: e.target.value })} /></Field>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 9 }}><Field label="Starts"><input type="datetime-local" style={inputStyle} value={campaignForm.starts_at} onChange={(e) => setCampaignForm({ ...campaignForm, starts_at: e.target.value })} /></Field><Field label="Ends"><input type="datetime-local" style={inputStyle} value={campaignForm.ends_at} onChange={(e) => setCampaignForm({ ...campaignForm, ends_at: e.target.value })} /></Field></div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}><Toggle label="Auto start" checked={campaignForm.auto_activate} onChange={(value) => setCampaignForm({ ...campaignForm, auto_activate: value })} /><Toggle label="Auto end" checked={campaignForm.auto_expire} onChange={(value) => setCampaignForm({ ...campaignForm, auto_expire: value })} /><Toggle label="SMS opt-in audience" checked={campaignForm.sms_enabled} onChange={(value) => setCampaignForm({ ...campaignForm, sms_enabled: value })} /></div>
            {campaignForm.sms_enabled && <Field label="SMS message"><textarea maxLength={300} rows={2} style={inputStyle} value={campaignForm.sms_message} onChange={(e) => setCampaignForm({ ...campaignForm, sms_message: e.target.value })} /></Field>}
            <button disabled={saving} style={{ ...buttonStyle, background: "#f97316", color: "#fff" }}>{saving ? "Saving..." : "Create campaign"}</button>
          </form>
        </Card>

        <Card color={colors.card}>
          <h2 style={{ marginTop: 0 }}>Create coupon</h2>
          <form onSubmit={submitCoupon} style={{ display: "grid", gap: 11 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 9 }}><Field label="Code"><input required style={inputStyle} value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} /></Field><Field label="Campaign"><select style={inputStyle} value={couponForm.campaign_id} onChange={(e) => setCouponForm({ ...couponForm, campaign_id: e.target.value })}><option value="">Standalone</option>{campaigns.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></Field></div>
            <Field label="Name"><input required style={inputStyle} value={couponForm.name} onChange={(e) => setCouponForm({ ...couponForm, name: e.target.value })} /></Field>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 9 }}><Field label="Discount"><select style={inputStyle} value={couponForm.discount_type} onChange={(e) => setCouponForm({ ...couponForm, discount_type: e.target.value })}><option value="percentage">Percentage</option><option value="fixed_amount">Fixed amount</option></select></Field><Field label="Value"><input required type="number" min="1" step="0.01" style={inputStyle} value={couponForm.discount_value} onChange={(e) => setCouponForm({ ...couponForm, discount_value: e.target.value })} /></Field></div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 9 }}><Field label="Minimum order"><input type="number" min="0" style={inputStyle} value={couponForm.min_order_amount} onChange={(e) => setCouponForm({ ...couponForm, min_order_amount: e.target.value })} /></Field><Field label="Maximum discount"><input type="number" min="0" style={inputStyle} value={couponForm.max_discount_amount} onChange={(e) => setCouponForm({ ...couponForm, max_discount_amount: e.target.value })} /></Field></div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))", gap: 9 }}><Field label="Status"><select style={inputStyle} value={couponForm.status} onChange={(e) => setCouponForm({ ...couponForm, status: e.target.value })}><option value="draft">Draft</option><option value="active">Active</option><option value="paused">Paused</option></select></Field><Field label="Customer scope"><select style={inputStyle} value={couponForm.customer_scope} onChange={(e) => setCouponForm({ ...couponForm, customer_scope: e.target.value })}><option value="all">Everyone</option><option value="normal">Storefront</option><option value="route">Route customers</option><option value="vendor">Vendors</option></select></Field><Field label="Applies to"><select style={inputStyle} value={couponForm.applies_to} onChange={(e) => setCouponForm({ ...couponForm, applies_to: e.target.value })}><option value="all">All products</option><option value="campaign_targets">Campaign targets</option></select></Field></div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 9 }}><Field label="Starts"><input type="datetime-local" style={inputStyle} value={couponForm.starts_at} onChange={(e) => setCouponForm({ ...couponForm, starts_at: e.target.value })} /></Field><Field label="Ends"><input type="datetime-local" style={inputStyle} value={couponForm.ends_at} onChange={(e) => setCouponForm({ ...couponForm, ends_at: e.target.value })} /></Field></div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 9 }}><Field label="Total uses"><input type="number" min="1" style={inputStyle} value={couponForm.max_total_uses} onChange={(e) => setCouponForm({ ...couponForm, max_total_uses: e.target.value })} /></Field><Field label="Uses per phone"><input type="number" min="1" style={inputStyle} value={couponForm.max_uses_per_phone} onChange={(e) => setCouponForm({ ...couponForm, max_uses_per_phone: e.target.value })} /></Field></div>
            <button disabled={saving} style={{ ...buttonStyle, background: "#111827", color: "#fff" }}>{saving ? "Saving..." : "Create coupon"}</button>
          </form>
        </Card>
      </div>

      <Card color={colors.card}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}><div><h2 style={{ margin: 0 }}>Campaign targeting</h2><p style={{ color: colors.textMuted, margin: "4px 0 0" }}>Products, categories, and route regions.</p></div><button disabled={!selectedCampaignId || saving} onClick={saveTargets} style={{ ...buttonStyle, background: "#2563eb", color: "#fff" }}>Save audience</button></div>
        <select style={{ ...inputStyle, marginTop: 14 }} value={selectedCampaignId} onChange={(e) => setSelectedCampaignId(e.target.value)}><option value="">Select campaign</option>{campaigns.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select>
        {selectedCampaignId && <>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}><input style={inputStyle} placeholder="Search products by name or SKU" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); searchProducts(); } }} /><button onClick={searchProducts} style={{ ...buttonStyle, background: colors.text, color: colors.card }}>Search</button></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12, marginTop: 14 }}>
            <TargetList title="Products" rows={products} selectedIds={targetIds.product_ids} onToggle={(id) => toggleTarget("product_ids", id)} labelFor={(row) => `${row.name}${row.sku ? ` (${row.sku})` : ""}`} />
            <TargetList title="Categories" rows={categories} selectedIds={targetIds.category_ids} onToggle={(id) => toggleTarget("category_ids", id)} labelFor={(row) => row.name} />
            <TargetList title="Regions" rows={regions} selectedIds={targetIds.region_ids} onToggle={(id) => toggleTarget("region_ids", id)} labelFor={(row) => row.name} />
          </div>
        </>}
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(330px,1fr))", gap: 15 }}>
        <Card color={colors.card}><h2 style={{ marginTop: 0 }}>Campaign performance</h2><div style={{ overflowX: "auto" }}><table style={{ width: "100%", minWidth: 620, borderCollapse: "collapse" }}><thead><tr style={{ textAlign: "left", color: colors.textMuted }}><th>Campaign</th><th>Views</th><th>Clicks</th><th>Orders</th><th>Revenue</th></tr></thead><tbody>{(analytics.top_campaigns || []).map((row) => <tr key={row.id} style={{ borderTop: `1px solid ${colors.border}` }}><td style={{ padding: "10px 0" }}><strong>{row.name}</strong></td><td>{row.impressions || 0}</td><td>{row.clicks || 0}</td><td>{row.conversions || 0}</td><td>{money(row.attributed_revenue)}</td></tr>)}</tbody></table></div></Card>
        <Card color={colors.card}><h2 style={{ marginTop: 0 }}>Top coupons</h2><div style={{ overflowX: "auto" }}><table style={{ width: "100%", minWidth: 520, borderCollapse: "collapse" }}><thead><tr style={{ textAlign: "left", color: colors.textMuted }}><th>Code</th><th>Uses</th><th>Average order</th><th>Revenue</th></tr></thead><tbody>{(analytics.top_coupons || []).map((row) => <tr key={row.id} style={{ borderTop: `1px solid ${colors.border}` }}><td style={{ padding: "10px 0" }}><strong>{row.code}</strong></td><td>{row.redemptions || 0}</td><td>{money(row.average_order_value)}</td><td>{money(row.attributed_revenue)}</td></tr>)}</tbody></table></div></Card>
      </div>

      <Card color={colors.card}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}><h2 style={{ margin: 0 }}>Sales rep referral codes</h2><button onClick={syncReferrals} style={{ ...buttonStyle, background: "#059669", color: "#fff" }}>Sync codes</button></div>
        <div style={{ overflowX: "auto", marginTop: 12 }}><table style={{ width: "100%", minWidth: 650, borderCollapse: "collapse" }}><thead><tr style={{ textAlign: "left", color: colors.textMuted }}><th>Sales rep</th><th>Code</th><th>Applications</th><th>Approved</th><th>Reward</th></tr></thead><tbody>{referrals.map((row) => <tr key={row.id} style={{ borderTop: `1px solid ${colors.border}` }}><td style={{ padding: 10 }}>{row.sales_rep_name}</td><td><strong>{row.code}</strong></td><td>{row.applications || 0}</td><td>{row.approved_referrals || 0}</td><td>{row.reward_points || 0} points</td></tr>)}</tbody></table></div>
      </Card>

      <Card color={colors.card}><h2 style={{ marginTop: 0 }}>Campaign register</h2>{loading ? <p>Loading...</p> : <div style={{ overflowX: "auto" }}><table style={{ width: "100%", minWidth: 850, borderCollapse: "collapse" }}><thead><tr style={{ textAlign: "left", color: colors.textMuted }}><th>Campaign</th><th>Status</th><th>Audience</th><th>Window</th><th>Revenue</th><th>Action</th></tr></thead><tbody>{campaigns.map((row) => <tr key={row.id} style={{ borderTop: `1px solid ${colors.border}` }}><td style={{ padding: 10 }}><strong>{row.name}</strong><div style={{ fontSize: 12, color: colors.textMuted }}>{row.campaign_code}</div></td><td><StatusPill status={row.status} /></td><td>{row.customer_scope} / {row.placement || "home"}</td><td>{formatDate(row.starts_at)} - {formatDate(row.ends_at)}</td><td>{money(row.attributed_revenue)}</td><td><button onClick={() => toggleCampaign(row)} style={{ ...buttonStyle, padding: "7px 9px", background: row.status === "active" ? "#fef3c7" : "#dcfce7" }}>{row.status === "active" ? "Pause" : "Activate"}</button></td></tr>)}</tbody></table></div>}</Card>

      <Card color={colors.card}><h2 style={{ marginTop: 0 }}>Coupon register</h2><div style={{ overflowX: "auto" }}><table style={{ width: "100%", minWidth: 760, borderCollapse: "collapse" }}><thead><tr style={{ textAlign: "left", color: colors.textMuted }}><th>Coupon</th><th>Status</th><th>Discount</th><th>Minimum</th><th>Uses</th><th>Action</th></tr></thead><tbody>{coupons.map((row) => <tr key={row.id} style={{ borderTop: `1px solid ${colors.border}` }}><td style={{ padding: 10 }}><strong>{row.code}</strong><div style={{ fontSize: 12, color: colors.textMuted }}>{row.name}</div></td><td><StatusPill status={row.status} /></td><td>{row.discount_type === "percentage" ? `${Number(row.discount_value)}%` : money(row.discount_value)}</td><td>{money(row.min_order_amount)}</td><td>{row.redemption_count || 0}</td><td><button onClick={() => toggleCoupon(row)} style={{ ...buttonStyle, padding: "7px 9px", background: row.status === "active" ? "#fef3c7" : "#dcfce7" }}>{row.status === "active" ? "Pause" : "Activate"}</button></td></tr>)}</tbody></table></div></Card>
    </div>
  );
}