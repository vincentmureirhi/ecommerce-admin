import React, { useEffect, useMemo, useState } from "react";
import { useRouteCustomerAuth } from "../context/RouteCustomerAuthContext.jsx";
import { useTheme } from "../context/ThemeContext";
import { changeRouteCustomerPassword } from "../api/routeCustomerPortal";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

function formatMoney(value) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function formatRouteOrderState(status) {
  const normalized = String(status || "").toLowerCase();
  const labels = {
    pending: "Captured for route planning",
    processing: "Being prepared at the shop",
    packed: "Packed for the route",
    dispatched: "Out with delivery team",
    completed: "Delivered",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };

  return labels[normalized] || status || "Captured";
}

function clampPercent(value) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, numeric));
}

function SummaryCard({ title, value, subtitle, colors }) {
  return (
    <div
      style={{
        background: colors.card,
        border: `1px solid ${colors.border}`,
        borderRadius: 18,
        padding: 18,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: colors.textMuted,
          marginBottom: 8,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 26,
          fontWeight: 900,
          color: colors.text,
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 13,
          color: colors.textMuted,
        }}
      >
        {subtitle}
      </div>
    </div>
  );
}

function SectionCard({ title, children, colors }) {
  return (
    <div
      style={{
        background: colors.card,
        border: `1px solid ${colors.border}`,
        borderRadius: 18,
        padding: 18,
      }}
    >
      <div style={{ fontWeight: 900, color: colors.text, marginBottom: 12, fontSize: 17 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function ProgressBar({ value, colors }) {
  const percent = clampPercent(value);
  const fill = percent >= 85 ? "#dc2626" : percent >= 60 ? "#f59e0b" : "#16a34a";

  return (
    <div>
      <div
        style={{
          height: 10,
          borderRadius: 999,
          background: colors.border,
          overflow: "hidden",
        }}
      >
        <div style={{ width: `${percent}%`, height: "100%", background: fill }} />
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: colors.textMuted }}>
        {percent}% of credit currently used
      </div>
    </div>
  );
}

function NoticeCard({ notice, colors, isDark }) {
  const palette = {
    danger: ["#dc2626", isDark ? "rgba(220,38,38,0.14)" : "#fef2f2"],
    warning: ["#f59e0b", isDark ? "rgba(245,158,11,0.14)" : "#fffbeb"],
    info: ["#2563eb", isDark ? "rgba(37,99,235,0.14)" : "#eff6ff"],
  };
  const [accent, bg] = palette[notice?.tone] || palette.info;

  return (
    <div
      style={{
        border: `1px solid ${colors.border}`,
        borderLeft: `4px solid ${accent}`,
        background: bg,
        borderRadius: 14,
        padding: 14,
      }}
    >
      <div style={{ fontWeight: 900, color: colors.text }}>{notice?.title || "Account notice"}</div>
      <div style={{ marginTop: 5, color: colors.textMuted, fontSize: 13, lineHeight: 1.55 }}>
        {notice?.message || "Review your account details."}
      </div>
    </div>
  );
}

function DetailLine({ label, value, colors }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 800, color: colors.textMuted }}>{label}</div>
      <div style={{ marginTop: 4, color: colors.text, fontWeight: 800 }}>{value || "-"}</div>
    </div>
  );
}

function PasswordInput({ label, value, onChange, autoComplete, colors }) {
  return (
    <label style={{ display: "grid", gap: 7 }}>
      <span style={{ fontSize: 12, color: colors.textMuted, fontWeight: 900 }}>{label}</span>
      <input
        type="password"
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        style={{
          width: "100%",
          borderRadius: 13,
          border: `1px solid ${colors.border}`,
          background: colors.buttonBg,
          color: colors.text,
          padding: "12px 13px",
          outline: "none",
          fontSize: 14,
          boxSizing: "border-box",
        }}
      />
    </label>
  );
}

export default function RouteCustomerDashboard() {
  const routeAuth = useRouteCustomerAuth?.() || {};
  const theme = useTheme?.() || {};

  const isDark = Boolean(theme?.isDark);
  const toggleTheme =
    typeof theme?.toggleTheme === "function" ? theme.toggleTheme : () => {};

  const routeCustomerToken = routeAuth?.routeCustomerToken || null;
  const routeCustomerUser = routeAuth?.routeCustomerUser || null;
  const routeCustomerAccount = routeAuth?.routeCustomerAccount || null;
  const setRouteCustomerAccount =
    typeof routeAuth?.setRouteCustomerAccount === "function"
      ? routeAuth.setRouteCustomerAccount
      : () => {};
  const routeLogout =
    typeof routeAuth?.logout === "function" ? routeAuth.logout : () => {};

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const colors = useMemo(
    () => ({
      bg: isDark ? "#020617" : "#f8fafc",
      topbar: isDark ? "#0f172a" : "#ffffff",
      card: isDark ? "#111827" : "#ffffff",
      border: isDark ? "#1e293b" : "#e2e8f0",
      text: isDark ? "#f8fafc" : "#0f172a",
      textMuted: isDark ? "#94a3b8" : "#64748b",
      accent: "#2563eb",
      dangerBg: isDark ? "rgba(127,29,29,0.22)" : "#fef2f2",
      dangerBorder: isDark ? "rgba(239,68,68,0.35)" : "#fecaca",
      dangerText: isDark ? "#fca5a5" : "#b91c1c",
      buttonBg: isDark ? "#1e293b" : "#f8fafc",
      buttonText: isDark ? "#f8fafc" : "#0f172a",
    }),
    [isDark]
  );

  useEffect(() => {
    async function loadDashboard() {
      if (!routeCustomerToken) {
        window.location.href = "/route-login";
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_BASE}/route-customer-portal/dashboard/me`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${routeCustomerToken}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok || data?.success === false) {
          throw new Error(
            data?.message || data?.error || "Failed to load dashboard."
          );
        }

        setDashboard(data?.data || null);
      } catch (err) {
        setError(err?.message || "Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [routeCustomerToken]);

  function handleLogout() {
    routeLogout();
    window.location.href = "/route-login";
  }

  function updatePasswordForm(field, value) {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
    setPasswordError("");
    setPasswordMessage("");
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();

    if (passwordSaving) return;

    const payload = {
      current_password: passwordForm.current_password,
      new_password: passwordForm.new_password,
      confirm_password: passwordForm.confirm_password,
    };

    if (!payload.current_password || !payload.new_password || !payload.confirm_password) {
      setPasswordError("Fill in all password fields.");
      return;
    }

    if (payload.new_password !== payload.confirm_password) {
      setPasswordError("The new password and confirmation do not match.");
      return;
    }

    if (payload.new_password.length < 8) {
      setPasswordError("Use at least 8 characters for the new password.");
      return;
    }

    setPasswordSaving(true);
    setPasswordError("");
    setPasswordMessage("");

    try {
      await changeRouteCustomerPassword(payload);

      const nextAccount = {
        ...(dashboard?.account || routeCustomerAccount || {}),
        must_change_password: false,
      };

      setDashboard((prev) =>
        prev
          ? {
              ...prev,
              account: nextAccount,
              route_insights: {
                ...(prev.route_insights || {}),
                suggested_action:
                  prev.route_insights?.suggested_action === "Change your password"
                    ? "Prepare your next route order"
                    : prev.route_insights?.suggested_action,
              },
              portal_notices: (prev.portal_notices || []).filter(
                (notice) => notice?.type !== "security"
              ),
            }
          : prev
      );
      setRouteCustomerAccount(nextAccount);
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
      setPasswordMessage("Password updated. Your route account is now secured.");
      setPasswordOpen(false);
    } catch (err) {
      setPasswordError(
        err?.response?.data?.message || err?.message || "Failed to change password."
      );
    } finally {
      setPasswordSaving(false);
    }
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: colors.bg,
          color: colors.text,
          padding: 20,
        }}
      >
        Loading route customer dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: colors.bg,
          color: colors.text,
          padding: 20,
        }}
      >
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            background: colors.card,
            border: `1px solid ${colors.dangerBorder}`,
            borderRadius: 18,
            padding: 20,
          }}
        >
          <div
            style={{
              fontWeight: 900,
              color: colors.dangerText,
              marginBottom: 10,
            }}
          >
            Failed to load dashboard
          </div>

          <div
            style={{
              color: colors.text,
              marginBottom: 16,
            }}
          >
            {error}
          </div>

          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: "12px 16px",
              borderRadius: 14,
              border: "none",
              background: colors.accent,
              color: "#fff",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const summary = dashboard?.financial_summary || {};
  const recentOrders = dashboard?.recent_orders || [];
  const assignedRep = dashboard?.assigned_sales_rep || {};
  const servedByReps = dashboard?.served_by_sales_reps || [];
  const account = dashboard?.account || {};
  const customer = dashboard?.customer || routeCustomerUser || {};
  const insights = dashboard?.route_insights || {};
  const regionRank = dashboard?.region_rank || null;
  const topProducts = dashboard?.top_products || [];
  const creditRequests = dashboard?.recent_credit_requests || [];
  const notices = dashboard?.portal_notices || [];
  const routeRewards = dashboard?.route_rewards || {};
  const rewardAccount = routeRewards.account || {};
  const rewardActivity = routeRewards.recent_activity || [];
  const regionalOffers = dashboard?.regional_offers || [];
  const referral = dashboard?.referral || null;
  const creditUsagePercent = clampPercent(insights.credit_usage_percent);
  const latestOrder = recentOrders[0] || null;
  const regionRankText = regionRank?.region_rank
    ? `#${regionRank.region_rank} of ${regionRank.total_ranked_customers || "-"}`
    : "-";
  const callRepHref = assignedRep?.phone_number
    ? `tel:${assignedRep.phone_number}`
    : null;
  const securityNeedsAttention = Boolean(account?.must_change_password);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.bg,
        color: colors.text,
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: colors.topbar,
          borderBottom: `1px solid ${colors.border}`,
          padding: "14px 16px",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: colors.text,
              }}
            >
              Route Customer Portal
            </div>

            <div
              style={{
                marginTop: 4,
                color: colors.textMuted,
                fontSize: 14,
              }}
            >
              Welcome, {customer?.name || "Customer"}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={toggleTheme}
              style={{
                padding: "11px 14px",
                borderRadius: 12,
                border: `1px solid ${colors.border}`,
                background: colors.buttonBg,
                color: colors.buttonText,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {isDark ? "Light mode" : "Dark mode"}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              style={{
                padding: "11px 14px",
                borderRadius: 12,
                border: "none",
                background: "#b91c1c",
                color: "#fff",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: 16,
        }}
      >        <section
          style={{
            marginBottom: 18,
            borderRadius: 24,
            padding: 20,
            overflow: "hidden",
            border: `1px solid ${isDark ? "#1f2937" : "#dbeafe"}`,
            background: isDark
              ? "linear-gradient(135deg, #020617 0%, #0f172a 52%, #172554 100%)"
              : "linear-gradient(135deg, #eff6ff 0%, #ffffff 48%, #ecfeff 100%)",
            boxShadow: isDark
              ? "0 24px 60px rgba(0,0,0,0.28)"
              : "0 24px 60px rgba(37,99,235,0.10)",
          }}
        >
          <div
            style={{
              display: "grid",
              gap: 18,
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              alignItems: "stretch",
            }}
          >
            <div style={{ display: "grid", gap: 16 }}>
              <div
                style={{
                  width: "fit-content",
                  borderRadius: 999,
                  padding: "7px 11px",
                  border: `1px solid ${isDark ? "#334155" : "#bfdbfe"}`,
                  color: isDark ? "#bfdbfe" : "#1d4ed8",
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: 0,
                }}
              >
                ROUTE ACCOUNT
              </div>

              <div>
                <div
                  style={{
                    fontSize: "clamp(30px, 6vw, 58px)",
                    lineHeight: 1,
                    fontWeight: 950,
                    color: colors.text,
                  }}
                >
                  {customer?.name || "Route customer"}
                </div>
                <div style={{ marginTop: 10, color: colors.textMuted, fontSize: 16 }}>
                  {summary.location_name || "Route location pending"} - {summary.region_name || "Region pending"}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setPasswordOpen((open) => !open);
                    setPasswordError("");
                    setPasswordMessage("");
                  }}
                  style={{
                    border: "none",
                    borderRadius: 14,
                    padding: "12px 15px",
                    background: securityNeedsAttention ? "#f97316" : colors.accent,
                    color: "#fff",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  {securityNeedsAttention ? "Secure account" : "Change password"}
                </button>

                {callRepHref ? (
                  <a
                    href={callRepHref}
                    style={{
                      borderRadius: 14,
                      padding: "12px 15px",
                      border: `1px solid ${colors.border}`,
                      color: colors.text,
                      textDecoration: "none",
                      fontWeight: 900,
                      background: colors.card,
                    }}
                  >
                    Call sales rep
                  </a>
                ) : null}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: 12,
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              }}
            >
              <SummaryCard
                title="Credit Room"
                value={`KES ${formatMoney(summary.available_credit)}`}
                subtitle="Available for route orders"
                colors={colors}
              />
              <SummaryCard
                title="This Month"
                value={`KES ${formatMoney(insights.month_order_value)}`}
                subtitle={`${insights.month_order_count || 0} order${Number(insights.month_order_count || 0) === 1 ? "" : "s"}`}
                colors={colors}
              />
              <SummaryCard
                title="Route Rank"
                value={regionRankText}
                subtitle="Within your region"
                colors={colors}
              />
              <SummaryCard
                title="Latest Order"
                value={latestOrder ? `KES ${formatMoney(latestOrder.total_amount)}` : "-"}
                subtitle={latestOrder ? formatRouteOrderState(latestOrder.order_status) : "No route order yet"}
                colors={colors}
              />
            </div>
          </div>
        </section>

        <section style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", marginBottom: 18 }}>
          <SectionCard title="Route rewards" colors={colors}>
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
              <SummaryCard title="Points" value={Number(rewardAccount.points_balance || 0).toLocaleString()} subtitle="Available balance" colors={colors} />
              <SummaryCard title="Tier" value={String(rewardAccount.tier || "starter").toUpperCase()} subtitle={`${Number(rewardAccount.lifetime_points || 0).toLocaleString()} lifetime points`} colors={colors} />
            </div>
            {rewardActivity.length > 0 ? (
              <div style={{ marginTop: 12, display: "grid", gap: 7 }}>
                {rewardActivity.slice(0, 3).map((entry) => (
                  <div key={entry.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, color: colors.textMuted, fontSize: 13 }}>
                    <span>{entry.description || "Route reward"}</span><strong style={{ color: "#16a34a" }}>+{entry.points}</strong>
                  </div>
                ))}
              </div>
            ) : <div style={{ marginTop: 12, color: colors.textMuted }}>Points begin with your next route order.</div>}
          </SectionCard>

          <SectionCard title="Invite a business" colors={colors}>
            {referral ? (
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ color: colors.textMuted }}>Share your sales rep code with another shop applying for route delivery.</div>
                <div style={{ padding: 14, borderRadius: 12, border: `1px dashed ${colors.border}`, fontSize: 22, fontWeight: 950, letterSpacing: 1 }}>{referral.code}</div>
                <button type="button" onClick={() => navigator.clipboard?.writeText(`https://xpose-distributors.vercel.app/route-delivery?ref=${encodeURIComponent(referral.code)}`)} style={{ padding: "11px 14px", border: 0, borderRadius: 10, background: colors.accent, color: "#fff", fontWeight: 900, cursor: "pointer" }}>Copy application link</button>
              </div>
            ) : <div style={{ color: colors.textMuted }}>Your referral code will appear after a sales rep is assigned.</div>}
          </SectionCard>
        </section>

        {regionalOffers.length > 0 ? (
          <SectionCard title="Offers for your route" colors={colors}>
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
              {regionalOffers.map((offer) => (
                <div key={offer.id} style={{ border: `1px solid ${colors.border}`, borderRadius: 14, padding: 16, borderTop: `4px solid ${offer.accent_color || "#f97316"}` }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: colors.textMuted }}>{offer.badge_label || "ROUTE OFFER"}</div>
                  <div style={{ marginTop: 7, fontSize: 20, fontWeight: 950 }}>{offer.hero_title || offer.name}</div>
                  <div style={{ marginTop: 7, color: colors.textMuted }}>{offer.hero_subtitle || offer.description}</div>
                  {(offer.coupons || []).map((coupon) => <div key={coupon.code} style={{ marginTop: 10, fontWeight: 900 }}>Code: {coupon.code}</div>)}
                </div>
              ))}
            </div>
          </SectionCard>
        ) : null}

        {(passwordOpen || securityNeedsAttention || passwordMessage) ? (
          <SectionCard title="Account security" colors={colors}>
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ color: colors.textMuted, lineHeight: 1.55 }}>
                Use a private password for this route account. Keep it away from staff who should not see credit and order history.
              </div>

              {passwordMessage ? (
                <div
                  style={{
                    borderRadius: 13,
                    padding: 12,
                    background: isDark ? "rgba(22,163,74,0.14)" : "#f0fdf4",
                    border: `1px solid ${isDark ? "rgba(34,197,94,0.35)" : "#bbf7d0"}`,
                    color: isDark ? "#86efac" : "#166534",
                    fontWeight: 800,
                  }}
                >
                  {passwordMessage}
                </div>
              ) : null}

              {passwordError ? (
                <div
                  style={{
                    borderRadius: 13,
                    padding: 12,
                    background: colors.dangerBg,
                    border: `1px solid ${colors.dangerBorder}`,
                    color: colors.dangerText,
                    fontWeight: 800,
                  }}
                >
                  {passwordError}
                </div>
              ) : null}

              {(passwordOpen || securityNeedsAttention) ? (
                <form onSubmit={handlePasswordSubmit} style={{ display: "grid", gap: 12 }}>
                  <div
                    style={{
                      display: "grid",
                      gap: 12,
                      gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                    }}
                  >
                    <PasswordInput
                      label="Current password"
                      value={passwordForm.current_password}
                      onChange={(event) => updatePasswordForm("current_password", event.target.value)}
                      autoComplete="current-password"
                      colors={colors}
                    />
                    <PasswordInput
                      label="New password"
                      value={passwordForm.new_password}
                      onChange={(event) => updatePasswordForm("new_password", event.target.value)}
                      autoComplete="new-password"
                      colors={colors}
                    />
                    <PasswordInput
                      label="Confirm new password"
                      value={passwordForm.confirm_password}
                      onChange={(event) => updatePasswordForm("confirm_password", event.target.value)}
                      autoComplete="new-password"
                      colors={colors}
                    />
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button
                      type="submit"
                      disabled={passwordSaving}
                      style={{
                        border: "none",
                        borderRadius: 14,
                        padding: "12px 16px",
                        background: passwordSaving ? "#94a3b8" : "#16a34a",
                        color: "#fff",
                        fontWeight: 900,
                        cursor: passwordSaving ? "not-allowed" : "pointer",
                      }}
                    >
                      {passwordSaving ? "Updating..." : "Update password"}
                    </button>
                    {!securityNeedsAttention ? (
                      <button
                        type="button"
                        onClick={() => setPasswordOpen(false)}
                        style={{
                          borderRadius: 14,
                          padding: "12px 16px",
                          background: colors.buttonBg,
                          color: colors.buttonText,
                          border: `1px solid ${colors.border}`,
                          fontWeight: 900,
                          cursor: "pointer",
                        }}
                      >
                        Close
                      </button>
                    ) : null}
                  </div>
                </form>
              ) : null}
            </div>
          </SectionCard>
        ) : null}

        {notices.length > 0 ? (
          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              marginTop: 18,
              marginBottom: 18,
            }}
          >
            {notices.map((notice, idx) => (
              <NoticeCard key={`${notice.type || "notice"}-${idx}`} notice={notice} colors={colors} isDark={isDark} />
            ))}
          </div>
        ) : null}

        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            marginBottom: 18,
          }}
        >
          <SectionCard title="Route account command" colors={colors}>
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 900, color: colors.textMuted, marginBottom: 6 }}>
                  Credit usage
                </div>
                <ProgressBar value={creditUsagePercent} colors={colors} />
              </div>
              <div
                style={{
                  display: "grid",
                  gap: 12,
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                }}
              >
                <div>
                  <div style={{ fontSize: 12, color: colors.textMuted, fontWeight: 800 }}>Next action</div>
                  <div style={{ marginTop: 4, color: colors.text, fontWeight: 900 }}>{insights.suggested_action || "Prepare next route order"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: colors.textMuted, fontWeight: 800 }}>Latest order</div>
                  <div style={{ marginTop: 4, color: colors.text, fontWeight: 900 }}>
                    {latestOrder ? `${latestOrder.order_number || `Order #${latestOrder.id}`} - KES ${formatMoney(latestOrder.total_amount)}` : "No order yet"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: colors.textMuted, fontWeight: 800 }}>Route area</div>
                  <div style={{ marginTop: 4, color: colors.text, fontWeight: 900 }}>{summary.location_name || summary.region_name || "Not assigned"}</div>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Region pulse" colors={colors}>
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: colors.textMuted, fontWeight: 800 }}>Your rank this month</div>
                <div style={{ marginTop: 4, color: colors.text, fontSize: 30, fontWeight: 950 }}>{regionRankText}</div>
              </div>
              <div style={{ color: colors.textMuted, fontSize: 13, lineHeight: 1.6 }}>
                Month value: KES {formatMoney(regionRank?.month_value || 0)} across {regionRank?.month_orders || 0} order{Number(regionRank?.month_orders || 0) === 1 ? "" : "s"}.
              </div>
            </div>
          </SectionCard>
        </div>

        <div
          style={{
            display: "grid",
            gap: 14,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            marginBottom: 18,
          }}
        >
          <SummaryCard
            title="This Month"
            value={`KES ${formatMoney(insights.month_order_value)}`}
            subtitle={`${insights.month_order_count || 0} route order${Number(insights.month_order_count || 0) === 1 ? "" : "s"}`}
            colors={colors}
          />
          <SummaryCard
            title="30-Day Value"
            value={`KES ${formatMoney(insights.rolling_30d_order_value)}`}
            subtitle={`${insights.rolling_30d_order_count || 0} recent order${Number(insights.rolling_30d_order_count || 0) === 1 ? "" : "s"}`}
            colors={colors}
          />
          <SummaryCard
            title="Average Order"
            value={`KES ${formatMoney(insights.average_order_value)}`}
            subtitle="Across your route history"
            colors={colors}
          />
          <SummaryCard
            title="Sales Reps Served"
            value={insights.reps_served_count || 0}
            subtitle="Reps who have captured your orders"
            colors={colors}
          />
        </div>

        <div
          style={{
            display: "grid",
            gap: 14,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            marginBottom: 18,
          }}
        >
          <SummaryCard
            title="Credit Limit"
            value={`KES ${formatMoney(summary.credit_limit)}`}
            subtitle="Approved limit"
            colors={colors}
          />
          <SummaryCard
            title="Available Credit"
            value={`KES ${formatMoney(summary.available_credit)}`}
            subtitle="Currently available"
            colors={colors}
          />
          <SummaryCard
            title="Credit Used"
            value={`KES ${formatMoney(summary.current_balance)}`}
            subtitle="Route credit currently occupied"
            colors={colors}
          />
          <SummaryCard
            title="Needs Review"
            value={`KES ${formatMoney(summary.overdue_balance)}`}
            subtitle="Amount marked for account review"
            colors={colors}
          />
        </div>

        <div
          style={{
            display: "grid",
            gap: 14,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            marginBottom: 18,
          }}
        >
          <SummaryCard
            title="Total Route Orders"
            value={summary.total_route_orders || 0}
            subtitle="Orders served to you"
            colors={colors}
          />
          <SummaryCard
            title="Total Ordered Value"
            value={`KES ${formatMoney(summary.total_ordered_value)}`}
            subtitle="All route orders"
            colors={colors}
          />
          <SummaryCard
            title="Route Value Cleared"
            value={`KES ${formatMoney(summary.total_paid_value)}`}
            subtitle="Confirmed route value"
            colors={colors}
          />
          <SummaryCard
            title="Last Route Order"
            value={summary.last_route_order_at ? formatDateTime(summary.last_route_order_at) : "-"}
            subtitle="Most recent order"
            colors={colors}
          />
        </div>

        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            marginBottom: 18,
          }}
        >
          <div
            style={{
              background: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: 18,
              padding: 18,
            }}
          >
            <div
              style={{
                fontWeight: 900,
                color: colors.text,
                marginBottom: 12,
                fontSize: 17,
              }}
            >
              Profile
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: colors.textMuted }}>Name</div>
                <div style={{ color: colors.text }}>{customer?.name || "-"}</div>
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: colors.textMuted }}>Phone</div>
                <div style={{ color: colors.text }}>{customer?.phone || "-"}</div>
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: colors.textMuted }}>Email</div>
                <div style={{ color: colors.text }}>{customer?.email || "-"}</div>
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: colors.textMuted }}>Member Since</div>
                <div style={{ color: colors.text }}>{formatDateTime(customer?.member_since)}</div>
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: colors.textMuted }}>Portal Username</div>
                <div style={{ color: colors.text }}>{account?.username || "-"}</div>
              </div>
            </div>
          </div>

          <div
            style={{
              background: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: 18,
              padding: 18,
            }}
          >
            <div
              style={{
                fontWeight: 900,
                color: colors.text,
                marginBottom: 12,
                fontSize: 17,
              }}
            >
              Sales Support
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: colors.textMuted }}>Assigned Sales Rep</div>
                <div style={{ color: colors.text }}>{assignedRep?.name || "Not assigned"}</div>
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: colors.textMuted }}>Rep Phone</div>
                <div style={{ color: colors.text }}>{assignedRep?.phone_number || "-"}</div>
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: colors.textMuted }}>Rep Email</div>
                <div style={{ color: colors.text }}>{assignedRep?.email || "-"}</div>
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: colors.textMuted }}>Served By Other Reps</div>
                <div style={{ color: colors.text }}>
                  {servedByReps.length > 0
                    ? servedByReps.map((rep) => rep.full_name || rep.email || "Unknown").join(", ")
                    : "No additional sales reps recorded"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <SectionCard title="Frequently Ordered" colors={colors}>
          {topProducts.length === 0 ? (
            <div style={{ color: colors.textMuted }}>
              Your regular route products will appear here after orders are captured.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: 12,
                gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
              }}
            >
              {topProducts.map((product) => (
                <div
                  key={`${product.product_id || product.name}-${product.sku || ""}`}
                  style={{
                    border: `1px solid ${colors.border}`,
                    borderRadius: 14,
                    padding: 14,
                    background: isDark ? "#0f172a" : "#f8fafc",
                  }}
                >
                  <div style={{ fontWeight: 900, color: colors.text }}>
                    {product.name || "Route product"}
                  </div>
                  <div style={{ marginTop: 5, fontSize: 12, color: colors.textMuted }}>
                    {product.sku || "No SKU"}
                  </div>
                  <div style={{ marginTop: 12, fontWeight: 900, color: colors.text }}>
                    {Number(product.total_units || 0).toLocaleString()} units
                  </div>
                  <div style={{ marginTop: 4, fontSize: 13, color: colors.textMuted }}>
                    KES {formatMoney(product.total_value)} ordered
                  </div>
                  <div style={{ marginTop: 4, fontSize: 12, color: colors.textMuted }}>
                    Last: {formatDateTime(product.last_ordered_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          }}
        >
          <div
            style={{
              background: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: 18,
              padding: 18,
            }}
          >
            <div
              style={{
                fontWeight: 900,
                color: colors.text,
                marginBottom: 12,
                fontSize: 17,
              }}
            >
              Recent Orders
            </div>

            {recentOrders.length === 0 ? (
              <div style={{ color: colors.textMuted }}>No recent route orders found.</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      border: `1px solid ${colors.border}`,
                      background: isDark ? "#0f172a" : "#f8fafc",
                    }}
                  >
                    <div style={{ fontWeight: 800, color: colors.text }}>
                      {order.order_number || `Order #${order.id}`}
                    </div>
                    <div style={{ color: colors.textMuted, fontSize: 13, marginTop: 4 }}>
                      Route state: {formatRouteOrderState(order.order_status)}
                    </div>
                    <div style={{ color: colors.textMuted, fontSize: 13, marginTop: 4 }}>
                      Route value: KES {formatMoney(order.total_amount)}
                    </div>
                    <div style={{ color: colors.textMuted, fontSize: 13, marginTop: 4 }}>
                      Sales Rep: {order.sales_rep_name || order.sales_rep_email || "-"}
                    </div>
                    <div style={{ color: colors.textMuted, fontSize: 13, marginTop: 4 }}>
                      Created: {formatDateTime(order.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            style={{
              background: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: 18,
              padding: 18,
            }}
          >
            <div
              style={{
                fontWeight: 900,
                color: colors.text,
                marginBottom: 12,
                fontSize: 17,
              }}
            >
              Credit Reviews
            </div>

            {creditRequests.length === 0 ? (
              <div style={{ color: colors.textMuted }}>No credit review requests yet.</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {creditRequests.map((request) => (
                  <div
                    key={request.id}
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      border: `1px solid ${colors.border}`,
                      background: isDark ? "#0f172a" : "#f8fafc",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ fontWeight: 900, color: colors.text }}>
                        KES {formatMoney(request.requested_credit_limit)}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 900,
                          color:
                            request.status === "approved"
                              ? "#16a34a"
                              : request.status === "rejected"
                              ? "#dc2626"
                              : "#f59e0b",
                        }}
                      >
                        {(request.status || "pending").toUpperCase()}
                      </div>
                    </div>
                    <div style={{ color: colors.textMuted, fontSize: 13, marginTop: 4 }}>
                      Current limit: KES {formatMoney(request.current_credit_limit)}
                    </div>
                    <div style={{ color: colors.textMuted, fontSize: 13, marginTop: 4 }}>
                      {request.request_reason || request.admin_notes || "Awaiting account review."}
                    </div>
                    <div style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>
                      Sent: {formatDateTime(request.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}