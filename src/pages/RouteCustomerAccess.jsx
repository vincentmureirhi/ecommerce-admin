import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  listAdminRouteCustomers,
  saveRouteCustomerAccess,
} from "../api/routeCustomerAdmin";
import { useTheme } from "../context/ThemeContext";

function money(value) {
  const num = Number(value || 0);
  return `KES ${num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function SummaryCard({ title, value, subtitle, colors }) {
  return (
    <div
      style={{
        background: colors.card,
        border: `1px solid ${colors.border}`,
        borderRadius: 18,
        padding: 18,
        boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
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
          fontSize: 28,
          fontWeight: 800,
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

function AccessBadge({ hasAccount, isDark }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "6px 10px",
        borderRadius: 999,
        border: `1px solid ${
          hasAccount
            ? isDark
              ? "rgba(74, 222, 128, 0.35)"
              : "#a7f3d0"
            : isDark
            ? "rgba(96, 165, 250, 0.35)"
            : "#bfdbfe"
        }`,
        background: hasAccount
          ? isDark
            ? "rgba(16, 185, 129, 0.15)"
            : "#ecfdf5"
          : isDark
          ? "rgba(29, 78, 216, 0.18)"
          : "#eff6ff",
        color: hasAccount
          ? isDark
            ? "#4ade80"
            : "#047857"
          : isDark
          ? "#93c5fd"
          : "#1d4ed8",
        fontWeight: 800,
        fontSize: 12,
      }}
    >
      {hasAccount ? "Portal Active" : "No Portal Access"}
    </span>
  );
}

function buildDefaultForm(customer) {
  return {
    username: customer?.username ?? "",
    temporary_password: "",
    is_active:
      customer?.account_is_active === null || customer?.account_is_active === undefined
        ? true
        : Boolean(customer.account_is_active),
    credit_limit:
      customer?.credit_limit === null || customer?.credit_limit === undefined
        ? ""
        : String(customer.credit_limit),
    credit_notes: customer?.credit_notes ?? "",
    is_credit_active:
      customer?.is_credit_active === null || customer?.is_credit_active === undefined
        ? true
        : Boolean(customer.is_credit_active),
  };
}

export default function RouteCustomerAccess() {
  const { isDark } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const focusedCustomerId = searchParams.get("customer");

  const colors = {
    bg: isDark ? "#0f172a" : "#f8fafc",
    card: isDark ? "#1e293b" : "#ffffff",
    border: isDark ? "#334155" : "#e2e8f0",
    text: isDark ? "#f8fafc" : "#0f172a",
    textMuted: isDark ? "#94a3b8" : "#64748b",
    inputBg: isDark ? "#0f172a" : "#ffffff",
    inputText: isDark ? "#f8fafc" : "#0f172a",
    dangerBg: isDark ? "rgba(127,29,29,0.22)" : "#fef2f2",
    dangerBorder: isDark ? "rgba(239,68,68,0.4)" : "#fecaca",
    dangerText: isDark ? "#fca5a5" : "#b91c1c",
    successBg: isDark ? "rgba(20,83,45,0.22)" : "#f0fdf4",
    successBorder: isDark ? "rgba(34,197,94,0.4)" : "#bbf7d0",
    successText: isDark ? "#86efac" : "#166534",
  };

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [pageSuccess, setPageSuccess] = useState("");
  const [openId, setOpenId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [forms, setForms] = useState({});

  async function loadData() {
    setLoading(true);
    setPageError("");

    try {
      const res = await listAdminRouteCustomers();
      const customers = res?.data?.customers || [];
      setRows(customers);
    } catch (err) {
      setPageError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to load route customer access data"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (focusedCustomerId) {
      setOpenId(Number(focusedCustomerId));
    }
  }, [focusedCustomerId]);

  function getForm(customer) {
    return {
      ...buildDefaultForm(customer),
      ...(forms[customer.id] || {}),
    };
  }

  function updateForm(customerId, patch) {
    setForms((prev) => {
      const currentRow = rows.find((row) => row.id === customerId);
      const current = {
        ...buildDefaultForm(currentRow),
        ...(prev[customerId] || {}),
      };

      return {
        ...prev,
        [customerId]: {
          ...current,
          ...patch,
        },
      };
    });
  }

  async function handleSave(customer) {
    if (saving) return;

    const form = getForm(customer);

    const safeUsername = String(form.username ?? "").trim();
    const safeTemporaryPassword = String(form.temporary_password ?? "").trim();
    const safeCreditNotes = String(form.credit_notes ?? "").trim();
    const safeCreditLimitRaw = String(form.credit_limit ?? "").trim();

    setSaving(true);
    setPageError("");
    setPageSuccess("");

    try {
      const res = await saveRouteCustomerAccess(customer.id, {
        username: safeUsername || undefined,
        temporary_password: safeTemporaryPassword || undefined,
        is_active: Boolean(form.is_active),
        credit_limit: safeCreditLimitRaw === "" ? 0 : Number(safeCreditLimitRaw),
        credit_notes: safeCreditNotes || null,
        is_credit_active: Boolean(form.is_credit_active),
      });

      const issuedPassword = res?.data?.credentials?.temporary_password;

      setPageSuccess(
        issuedPassword
          ? `Access saved for ${customer.name}. Temporary password issued: ${issuedPassword}`
          : `Access and credit settings updated for ${customer.name}.`
      );

      setOpenId(customer.id);
      await loadData();
    } catch (err) {
      setPageError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to save route customer access"
      );
    } finally {
      setSaving(false);
    }
  }

  const sortedRows = useMemo(() => {
    if (!focusedCustomerId) return rows;
    const target = Number(focusedCustomerId);
    return [...rows].sort((a, b) => {
      if (a.id === target) return -1;
      if (b.id === target) return 1;
      return a.id - b.id;
    });
  }, [rows, focusedCustomerId]);

  const summary = useMemo(() => {
    const total = rows.length;
    const withAccount = rows.filter((r) => !!r.username).length;
    const withoutAccount = rows.filter((r) => !r.username).length;
    const withCredit = rows.filter((r) => Number(r.credit_limit || 0) > 0).length;

    return { total, withAccount, withoutAccount, withCredit };
  }, [rows]);

  const labelStyle = {
    display: "block",
    marginBottom: 6,
    fontWeight: 700,
    fontSize: 13,
    color: colors.text,
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
    boxSizing: "border-box",
    background: colors.inputBg,
    color: colors.inputText,
  };

  const textareaStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
    boxSizing: "border-box",
    resize: "vertical",
    background: colors.inputBg,
    color: colors.inputText,
  };

  if (loading) {
    return (
      <div
        style={{
          padding: 24,
          color: colors.textMuted,
          background: colors.bg,
          minHeight: "100vh",
        }}
      >
        Loading route customer access...
      </div>
    );
  }

  return (
    <div
      className="route-portal-access-page"
      style={{ background: colors.bg, minHeight: "100vh", padding: 20 }}
    >
      <style>{`
        .route-portal-access-page input::placeholder,
        .route-portal-access-page textarea::placeholder {
          color: ${isDark ? "#94a3b8" : "#64748b"};
          opacity: 1;
        }

        .route-portal-access-page input,
        .route-portal-access-page textarea,
        .route-portal-access-page select {
          outline: none;
        }

        .route-portal-access-page input:focus,
        .route-portal-access-page textarea:focus,
        .route-portal-access-page select:focus {
          border-color: #667eea !important;
          box-shadow: 0 0 0 3px ${
            isDark ? "rgba(102,126,234,0.18)" : "rgba(102,126,234,0.12)"
          };
        }
      `}</style>

      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 800,
              color: colors.text,
            }}
          >
            🔐 Route Portal Access
          </h1>
          <p
            style={{
              marginTop: 6,
              marginBottom: 0,
              color: colors.textMuted,
              fontSize: 14,
            }}
          >
            Manage usernames, temporary passwords, activation status, and credit limits for current route customers.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {focusedCustomerId ? (
            <button
              type="button"
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                next.delete("customer");
                setSearchParams(next);
                setOpenId(null);
              }}
              style={{
                padding: "11px 16px",
                background: "#64748b",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                cursor: "pointer",
                fontWeight: 800,
              }}
            >
              Clear Focus
            </button>
          ) : null}

          <button
            type="button"
            onClick={loadData}
            style={{
              padding: "11px 16px",
              background: colors.card,
              color: colors.text,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {focusedCustomerId ? (
        <div
          style={{
            marginBottom: 18,
            padding: 14,
            borderRadius: 14,
            border: `1px solid ${isDark ? "rgba(96,165,250,0.28)" : "#bfdbfe"}`,
            background: isDark ? "rgba(29,78,216,0.16)" : "#eff6ff",
            color: isDark ? "#bfdbfe" : "#1d4ed8",
            fontWeight: 700,
          }}
        >
          Focused customer opened from Customers page. You are now editing the selected route customer directly.
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <SummaryCard title="Current Route Customers" value={summary.total} subtitle="Existing route customers already in system" colors={colors} />
        <SummaryCard title="With Portal Access" value={summary.withAccount} subtitle="Already assigned usernames" colors={colors} />
        <SummaryCard title="Without Portal Access" value={summary.withoutAccount} subtitle="Need username and password" colors={colors} />
        <SummaryCard title="With Credit Set" value={summary.withCredit} subtitle="Credit limit greater than zero" colors={colors} />
      </div>

      {(pageError || pageSuccess) && (
        <div
          style={{
            marginBottom: 18,
            padding: 14,
            borderRadius: 14,
            border: `1px solid ${pageError ? colors.dangerBorder : colors.successBorder}`,
            background: pageError ? colors.dangerBg : colors.successBg,
            color: pageError ? colors.dangerText : colors.successText,
            fontWeight: 600,
          }}
        >
          {pageError || pageSuccess}
        </div>
      )}

      {sortedRows.length === 0 ? (
        <div
          style={{
            background: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: 18,
            padding: 28,
            color: colors.textMuted,
            textAlign: "center",
          }}
        >
          No route customers found.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {sortedRows.map((customer) => {
            const form = getForm(customer);
            const hasAccount = !!customer.username;
            const isFocused = focusedCustomerId && Number(focusedCustomerId) === Number(customer.id);

            return (
              <div
                key={customer.id}
                style={{
                  background: colors.card,
                  border: `2px solid ${isFocused ? "#1d4ed8" : colors.border}`,
                  borderRadius: 18,
                  padding: 20,
                  boxShadow: isFocused
                    ? "0 0 0 4px rgba(29,78,216,0.08)"
                    : "0 8px 24px rgba(15,23,42,0.04)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 14,
                    flexWrap: "wrap",
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: colors.text }}>
                      {customer.name}
                    </div>
                    <div style={{ marginTop: 6, color: colors.textMuted, fontSize: 14 }}>
                      {customer.phone || "No phone"} · {customer.location_name || "No location"} · {customer.region_name || "No region"}
                    </div>
                    <div style={{ marginTop: 6, color: colors.textMuted, fontSize: 13 }}>
                      Username: {customer.username || "Not assigned"} · Credit: {money(customer.credit_limit)}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
                    <AccessBadge hasAccount={hasAccount} isDark={isDark} />
                    <button
                      type="button"
                      onClick={() => setOpenId((prev) => (prev === customer.id ? null : customer.id))}
                      style={{
                        padding: "10px 14px",
                        background: "#1d4ed8",
                        color: "#fff",
                        border: "none",
                        borderRadius: 12,
                        cursor: "pointer",
                        fontWeight: 800,
                      }}
                    >
                      {openId === customer.id
                        ? "Close Access Settings"
                        : hasAccount
                        ? "Manage Access"
                        : "Create Access"}
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 12,
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: colors.textMuted }}>
                      Current Balance
                    </div>
                    <div style={{ marginTop: 4, color: colors.text, fontWeight: 700 }}>
                      {money(customer.current_balance)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: colors.textMuted }}>
                      Available Credit
                    </div>
                    <div style={{ marginTop: 4, color: colors.text, fontWeight: 700 }}>
                      {money(customer.available_credit)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: colors.textMuted }}>
                      Overdue Balance
                    </div>
                    <div style={{ marginTop: 4, color: colors.text, fontWeight: 700 }}>
                      {money(customer.overdue_balance)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: colors.textMuted }}>
                      Route Orders
                    </div>
                    <div style={{ marginTop: 4, color: colors.text, fontWeight: 700 }}>
                      {customer.total_route_orders || 0}
                    </div>
                  </div>
                </div>

                {openId === customer.id && (
                  <div
                    style={{
                      marginTop: 16,
                      paddingTop: 16,
                      borderTop: `1px solid ${colors.border}`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: colors.text,
                        marginBottom: 14,
                      }}
                    >
                      {hasAccount ? "Update Portal Access & Credit" : "Create Portal Access & Credit"}
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                        gap: 14,
                        marginBottom: 14,
                      }}
                    >
                      <div>
                        <label style={{ display: "block", marginBottom: 6, fontWeight: 700, fontSize: 13, color: colors.text }}>
                          Username
                        </label>
                        <input
                          type="text"
                          value={form.username ?? ""}
                          onChange={(e) =>
                            updateForm(customer.id, { username: e.target.value })
                          }
                          placeholder="e.g. paul.landi"
                          style={inputStyle}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", marginBottom: 6, fontWeight: 700, fontSize: 13, color: colors.text }}>
                          Temporary Password {hasAccount ? "(optional reset)" : "*"}
                        </label>
                        <input
                          type="text"
                          value={form.temporary_password ?? ""}
                          onChange={(e) =>
                            updateForm(customer.id, { temporary_password: e.target.value })
                          }
                          placeholder={
                            hasAccount
                              ? "Leave blank to keep current password"
                              : "Enter temporary password"
                          }
                          style={inputStyle}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", marginBottom: 6, fontWeight: 700, fontSize: 13, color: colors.text }}>
                          Credit Limit (KES)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={form.credit_limit ?? ""}
                          onChange={(e) =>
                            updateForm(customer.id, { credit_limit: e.target.value })
                          }
                          style={inputStyle}
                        />
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: 20,
                          alignItems: "center",
                          paddingTop: 28,
                          flexWrap: "wrap",
                          color: colors.text,
                        }}
                      >
                        <label
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                            fontWeight: 700,
                            fontSize: 13,
                            color: colors.text,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(form.is_active)}
                            onChange={(e) =>
                              updateForm(customer.id, { is_active: e.target.checked })
                            }
                          />
                          Portal access active
                        </label>

                        <label
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                            fontWeight: 700,
                            fontSize: 13,
                            color: colors.text,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(form.is_credit_active)}
                            onChange={(e) =>
                              updateForm(customer.id, { is_credit_active: e.target.checked })
                            }
                          />
                          Credit active
                        </label>
                      </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: "block", marginBottom: 6, fontWeight: 700, fontSize: 13, color: colors.text }}>
                        Credit Notes
                      </label>
                      <textarea
                        rows={3}
                        value={form.credit_notes ?? ""}
                        onChange={(e) =>
                          updateForm(customer.id, { credit_notes: e.target.value })
                        }
                        style={textareaStyle}
                        placeholder="Add internal notes for this customer's credit access"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSave(customer)}
                      disabled={saving}
                      style={{
                        padding: "12px 16px",
                        background: "#047857",
                        color: "#fff",
                        border: "none",
                        borderRadius: 12,
                        cursor: "pointer",
                        fontWeight: 800,
                      }}
                    >
                      {saving
                        ? "Saving..."
                        : hasAccount
                        ? "Update Access & Credit"
                        : "Create Access & Credit"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

