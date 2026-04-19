import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import {
  listCustomers,
  deleteCustomer,
  createCustomer,
  updateCustomer,
} from "../api/customers";
import { listLocations } from "../api/locations";
import { listSalesReps } from "../api/salesReps";
import { listAdminRouteCustomers } from "../api/routeCustomerAdmin";

function SummaryCard({ title, value, subtitle, colors }) {
  return (
    <div
      style={{
        background: colors.card,
        border: `1px solid ${colors.border}`,
        borderRadius: 14,
        padding: 16,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ fontSize: 12, color: colors.textMuted, fontWeight: 700, marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: colors.text, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, marginTop: 8, color: colors.textMuted }}>
        {subtitle}
      </div>
    </div>
  );
}

function Pill({ text, bg, color, border }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 9px",
        borderRadius: 999,
        background: bg,
        color,
        border: `1px solid ${border}`,
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
}

export default function Customers() {
  const { isDark } = useTheme();
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const colors = {
    bg: isDark ? "#0f172a" : "#f8fafc",
    card: isDark ? "#1e293b" : "#ffffff",
    border: isDark ? "#334155" : "#e5e7eb",
    text: isDark ? "#f1f5f9" : "#1a1a1a",
    textMuted: isDark ? "#94a3b8" : "#64748b",
    inputBg: isDark ? "#0f172a" : "#ffffff",
    headerBg: isDark ? "#0f172a" : "#f8fafc",
    rowAlt: isDark ? "#162133" : "#fafafa",
    buttonBg: isDark ? "#334155" : "#f1f5f9",
  };

  const locationFromUrl = searchParams.get("location") || "";

  const [rows, setRows] = useState([]);
  const [locations, setLocations] = useState([]);
  const [salesReps, setSalesReps] = useState([]);
  const [routePortalRows, setRoutePortalRows] = useState([]);

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState(locationFromUrl);

  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    customer_type: "normal",
    location_id: "",
    sales_rep_id: "",
    is_active: true,
  });

  async function loadData() {
    setErr("");
    setLoading(true);

    try {
      const filters = { search };
      if (typeFilter) filters.customer_type = typeFilter;
      if (statusFilter) filters.status = statusFilter;
      if (locationFilter) filters.location_id = locationFilter;

      const results = await Promise.allSettled([
        listCustomers(filters),
        listLocations(),
        listSalesReps(),
        listAdminRouteCustomers(),
      ]);

      const customerData =
        results[0].status === "fulfilled" ? results[0].value : { data: [] };
      const locationData =
        results[1].status === "fulfilled" ? results[1].value : { data: [] };
      const repData =
        results[2].status === "fulfilled" ? results[2].value : { data: [] };
      const routePortalData =
        results[3].status === "fulfilled" ? results[3].value : { data: { customers: [] } };

      if (results[0].status === "rejected") {
        throw results[0].reason;
      }

      setRows(Array.isArray(customerData.data) ? customerData.data : []);
      setLocations(Array.isArray(locationData.data) ? locationData.data : []);
      setSalesReps(Array.isArray(repData.data) ? repData.data : []);
      setRoutePortalRows(
        Array.isArray(routePortalData?.data?.customers)
          ? routePortalData.data.customers
          : []
      );
    } catch (e) {
      setErr(e?.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLocationFilter(locationFromUrl);
  }, [locationFromUrl]);

  useEffect(() => {
    loadData();
  }, [search, typeFilter, statusFilter, locationFilter]);

  function resetForm() {
    setEditingCustomer(null);
    setForm({
      name: "",
      phone: "",
      email: "",
      customer_type: "normal",
      location_id: "",
      sales_rep_id: "",
      is_active: true,
    });
  }

  function openCreate() {
    resetForm();
    setShowForm(true);
    setErr("");
  }

  function openEdit(customer) {
    setEditingCustomer(customer);
    setForm({
      name: customer.name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      customer_type: customer.customer_type || "normal",
      location_id: customer.location_id ? String(customer.location_id) : "",
      sales_rep_id: customer.sales_rep_id ? String(customer.sales_rep_id) : "",
      is_active: customer.is_active !== false,
    });
    setShowForm(true);
    setErr("");
  }

  async function onDelete(id) {
    if (!window.confirm("Are you sure you want to delete this customer?")) return;

    try {
      await deleteCustomer(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      setErr(e?.message || "Failed to delete customer");
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!form.name.trim() || !form.phone.trim()) {
      return setErr("Customer name and phone are required");
    }

    if (form.customer_type === "route" && !form.location_id) {
      return setErr("Route customers must have a location");
    }

    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        customer_type: form.customer_type,
        location_id: form.location_id ? parseInt(form.location_id, 10) : null,
        sales_rep_id: form.sales_rep_id ? parseInt(form.sales_rep_id, 10) : null,
        is_active: !!form.is_active,
      };

      if (editingCustomer?.id) {
        await updateCustomer(editingCustomer.id, payload);
      } else {
        await createCustomer(payload);
      }

      setShowForm(false);
      resetForm();
      await loadData();
    } catch (e) {
      setErr(e?.message || "Failed to save customer");
    }
  }

  function handleLocationFilterChange(value) {
    setLocationFilter(value);

    const next = new URLSearchParams(searchParams);
    if (value) next.set("location", value);
    else next.delete("location");
    setSearchParams(next);
  }

  function clearAllFilters() {
    setSearch("");
    setTypeFilter("");
    setStatusFilter("");
    handleLocationFilterChange("");
  }

  const routePortalMap = useMemo(() => {
    const map = new Map();
    for (const row of routePortalRows) {
      map.set(Number(row.id), row);
    }
    return map;
  }, [routePortalRows]);

  const mergedRows = useMemo(() => {
    return rows.map((row) => {
      const portalMeta = routePortalMap.get(Number(row.id)) || null;
      return {
        ...row,
        portal_username: portalMeta?.username || null,
        portal_is_active: portalMeta?.account_is_active ?? null,
        credit_is_active: portalMeta?.is_credit_active ?? null,
        credit_limit: portalMeta?.credit_limit ?? null,
        current_balance: portalMeta?.current_balance ?? null,
      };
    });
  }, [rows, routePortalMap]);

  const selectedLocation = useMemo(() => {
    if (!locationFilter) return null;
    return locations.find((loc) => String(loc.id) === String(locationFilter)) || null;
  }, [locationFilter, locations]);

  const summary = useMemo(() => {
    const total = mergedRows.length;
    const routeCustomers = mergedRows.filter((r) => r.customer_type === "route").length;
    const normalCustomers = mergedRows.filter((r) => r.customer_type === "normal").length;
    const activeCustomers = mergedRows.filter((r) => r.is_active).length;
    const portalEnabled = mergedRows.filter((r) => !!r.portal_username).length;
    const creditEnabled = mergedRows.filter((r) => r.credit_is_active === true).length;

    return {
      total,
      routeCustomers,
      normalCustomers,
      activeCustomers,
      portalEnabled,
      creditEnabled,
    };
  }, [mergedRows]);

  const hasActiveFilters = Boolean(
    search.trim() || typeFilter || statusFilter || locationFilter
  );

  if (loading) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          color: colors.textMuted,
          background: colors.bg,
          minHeight: "100vh",
        }}
      >
        Loading customers...
      </div>
    );
  }

  return (
    <div style={{ background: colors.bg, minHeight: "100vh", padding: 20 }}>
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
              marginTop: 0,
              marginBottom: 5,
              fontSize: 28,
              fontWeight: 700,
              color: colors.text,
            }}
          >
            👥 Customers
          </h1>
          <p style={{ margin: 0, color: colors.textMuted, fontSize: 13 }}>
            Manage normal and route customers, plus route portal and credit visibility
          </p>
        </div>

        <button
          onClick={openCreate}
          style={{
            padding: "10px 16px",
            background: "#667eea",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          + Add Customer
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <SummaryCard title="Total Customers" value={summary.total} subtitle="All visible customers" colors={colors} />
        <SummaryCard title="Route Customers" value={summary.routeCustomers} subtitle="Location-based route customers" colors={colors} />
        <SummaryCard title="Normal Customers" value={summary.normalCustomers} subtitle="Standard customers" colors={colors} />
        <SummaryCard title="Active Customers" value={summary.activeCustomers} subtitle="Currently active" colors={colors} />
        <SummaryCard title="Portal Enabled" value={summary.portalEnabled} subtitle="Route customers with credentials" colors={colors} />
        <SummaryCard title="Credit Enabled" value={summary.creditEnabled} subtitle="Route customers with active credit" colors={colors} />
      </div>

      {err && (
        <div
          style={{
            background: isDark ? "rgba(220, 53, 69, 0.1)" : "#fee",
            color: isDark ? "#ff6b6b" : "#c33",
            padding: 12,
            borderRadius: 8,
            marginBottom: 20,
            border: `1px solid ${isDark ? "rgba(220,53,69,0.3)" : "#fdd"}`,
          }}
        >
          ⚠️ {err}
        </div>
      )}

      <div
        style={{
          background: colors.card,
          border: `1px solid ${colors.border}`,
          borderRadius: 14,
          padding: 16,
          marginBottom: 18,
          display: "grid",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr auto",
            gap: 12,
            alignItems: "center",
          }}
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, email..."
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 10,
              border: `1px solid ${colors.border}`,
              background: colors.inputBg,
              color: colors.text,
            }}
          />

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: `1px solid ${colors.border}`,
              background: colors.inputBg,
              color: colors.text,
            }}
          >
            <option value="">All Types</option>
            <option value="normal">Normal</option>
            <option value="route">Route</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: `1px solid ${colors.border}`,
              background: colors.inputBg,
              color: colors.text,
            }}
          >
            <option value="">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          <select
            value={locationFilter}
            onChange={(e) => handleLocationFilterChange(e.target.value)}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: `1px solid ${colors.border}`,
              background: colors.inputBg,
              color: colors.text,
            }}
          >
            <option value="">All Locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
                {loc.region_name ? ` · ${loc.region_name}` : ""}
              </option>
            ))}
          </select>

          <button
            onClick={clearAllFilters}
            style={{
              padding: "10px 12px",
              background: "#dc3545",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Clear
          </button>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => setTypeFilter("")}
            style={{
              padding: "8px 12px",
              background: typeFilter === "" ? "#1d4ed8" : colors.buttonBg,
              color: typeFilter === "" ? "#fff" : colors.text,
              border: "none",
              borderRadius: 999,
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            All Customers
          </button>

          <button
            onClick={() => setTypeFilter("route")}
            style={{
              padding: "8px 12px",
              background: typeFilter === "route" ? "#1d4ed8" : colors.buttonBg,
              color: typeFilter === "route" ? "#fff" : colors.text,
              border: "none",
              borderRadius: 999,
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Route Customers Only
          </button>

          <button
            onClick={() => setTypeFilter("normal")}
            style={{
              padding: "8px 12px",
              background: typeFilter === "normal" ? "#1d4ed8" : colors.buttonBg,
              color: typeFilter === "normal" ? "#fff" : colors.text,
              border: "none",
              borderRadius: 999,
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Normal Customers Only
          </button>
        </div>
      </div>

      {hasActiveFilters && (
        <div
          style={{
            marginBottom: 18,
            padding: 12,
            borderRadius: 8,
            background: isDark ? "rgba(102,126,234,0.12)" : "#eef2ff",
            border: `1px solid ${isDark ? "rgba(102,126,234,0.25)" : "#dbeafe"}`,
            color: colors.text,
            fontSize: 13,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {search ? <span><strong>Search:</strong> {search}</span> : null}
            {typeFilter ? <span><strong>Type:</strong> {typeFilter}</span> : null}
            {statusFilter ? <span><strong>Status:</strong> {statusFilter}</span> : null}
            {selectedLocation ? (
              <span>
                <strong>Location:</strong> {selectedLocation.name}
                {selectedLocation.region_name ? ` · ${selectedLocation.region_name}` : ""}
              </span>
            ) : null}
          </div>
        </div>
      )}

      {showForm && (
        <div
          style={{
            background: colors.card,
            padding: 20,
            borderRadius: 14,
            marginBottom: 20,
            border: `1px solid ${colors.border}`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 16, color: colors.text }}>
            {editingCustomer ? "Edit Customer" : "Create Customer"}
          </h3>

          <form onSubmit={onSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 14,
                marginBottom: 14,
              }}
            >
              <div>
                <label style={{ display: "block", marginBottom: 6, color: colors.text, fontWeight: 700 }}>
                  Name *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: `1px solid ${colors.border}`,
                    background: colors.inputBg,
                    color: colors.text,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, color: colors.text, fontWeight: 700 }}>
                  Phone *
                </label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: `1px solid ${colors.border}`,
                    background: colors.inputBg,
                    color: colors.text,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, color: colors.text, fontWeight: 700 }}>
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: `1px solid ${colors.border}`,
                    background: colors.inputBg,
                    color: colors.text,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, color: colors.text, fontWeight: 700 }}>
                  Customer Type
                </label>
                <select
                  value={form.customer_type}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      customer_type: e.target.value,
                      location_id: e.target.value === "route" ? prev.location_id : "",
                    }))
                  }
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: `1px solid ${colors.border}`,
                    background: colors.inputBg,
                    color: colors.text,
                    boxSizing: "border-box",
                  }}
                >
                  <option value="normal">Normal</option>
                  <option value="route">Route</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, color: colors.text, fontWeight: 700 }}>
                  Location {form.customer_type === "route" ? "*" : ""}
                </label>
                <select
                  value={form.location_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, location_id: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: `1px solid ${colors.border}`,
                    background: colors.inputBg,
                    color: colors.text,
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">Select location</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                      {loc.region_name ? ` · ${loc.region_name}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, color: colors.text, fontWeight: 700 }}>
                  Assigned Sales Rep
                </label>
                <select
                  value={form.sales_rep_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, sales_rep_id: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: `1px solid ${colors.border}`,
                    background: colors.inputBg,
                    color: colors.text,
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">None</option>
                  {salesReps.map((rep) => (
                    <option key={rep.id} value={rep.id}>
                      {rep.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                color: colors.text,
                marginBottom: 16,
                fontWeight: 700,
              }}
            >
              <input
                type="checkbox"
                checked={!!form.is_active}
                onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
              />
              Customer is active
            </label>

            {form.customer_type === "route" && (
              <div
                style={{
                  marginBottom: 16,
                  padding: 12,
                  borderRadius: 12,
                  background: isDark ? "rgba(29,78,216,0.16)" : "#eff6ff",
                  border: `1px solid ${isDark ? "rgba(96,165,250,0.28)" : "#bfdbfe"}`,
                  color: isDark ? "#bfdbfe" : "#1d4ed8",
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                This customer will still need portal credentials and credit configuration later in
                <strong> Route Portal Access</strong>.
              </div>
            )}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="submit"
                style={{
                  padding: "12px 16px",
                  background: "#16a34a",
                  color: "white",
                  border: "none",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                {editingCustomer ? "Update Customer" : "Create Customer"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                style={{
                  padding: "12px 16px",
                  background: "#64748b",
                  color: "white",
                  border: "none",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div
        style={{
          background: colors.card,
          borderRadius: 14,
          border: `1px solid ${colors.border}`,
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            overflowX: "auto",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1180 }}>
            <thead>
              <tr style={{ background: colors.headerBg }}>
                <th style={{ padding: 12, textAlign: "left", color: colors.textMuted, fontSize: 12 }}>Customer</th>
                <th style={{ padding: 12, textAlign: "left", color: colors.textMuted, fontSize: 12 }}>Contact</th>
                <th style={{ padding: 12, textAlign: "left", color: colors.textMuted, fontSize: 12 }}>Type</th>
                <th style={{ padding: 12, textAlign: "left", color: colors.textMuted, fontSize: 12 }}>Location / Rep</th>
                <th style={{ padding: 12, textAlign: "left", color: colors.textMuted, fontSize: 12 }}>Portal / Credit</th>
                <th style={{ padding: 12, textAlign: "left", color: colors.textMuted, fontSize: 12 }}>Status</th>
                <th style={{ padding: 12, textAlign: "right", color: colors.textMuted, fontSize: 12 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mergedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: 28,
                      textAlign: "center",
                      color: colors.textMuted,
                    }}
                  >
                    No customers found
                  </td>
                </tr>
              ) : (
                mergedRows.map((customer, index) => {
                  const isRoute = customer.customer_type === "route";

                  return (
                    <tr
                      key={customer.id}
                      style={{
                        background: index % 2 ? colors.rowAlt : colors.card,
                        borderTop: `1px solid ${colors.border}`,
                      }}
                    >
                      <td style={{ padding: 12 }}>
                        <div style={{ color: colors.text, fontWeight: 700 }}>{customer.name}</div>
                        <div style={{ color: colors.textMuted, fontSize: 12 }}>
                          ID: {customer.id}
                        </div>
                      </td>

                      <td style={{ padding: 12 }}>
                        <div style={{ color: colors.text, fontSize: 13 }}>{customer.phone || "—"}</div>
                        <div style={{ color: colors.textMuted, fontSize: 12 }}>{customer.email || "No email"}</div>
                      </td>

                      <td style={{ padding: 12 }}>
                        {isRoute ? (
                          <Pill
                            text="Route Customer"
                            bg={isDark ? "rgba(29,78,216,0.16)" : "#eff6ff"}
                            color={isDark ? "#bfdbfe" : "#1d4ed8"}
                            border={isDark ? "rgba(96,165,250,0.28)" : "#bfdbfe"}
                          />
                        ) : (
                          <Pill
                            text="Normal Customer"
                            bg={isDark ? "rgba(100,116,139,0.16)" : "#f1f5f9"}
                            color={isDark ? "#cbd5e1" : "#334155"}
                            border={isDark ? "rgba(148,163,184,0.25)" : "#cbd5e1"}
                          />
                        )}
                      </td>

                      <td style={{ padding: 12 }}>
                        <div style={{ color: colors.text, fontSize: 13 }}>
                          {customer.location_name || "No location"}
                        </div>
                        <div style={{ color: colors.textMuted, fontSize: 12 }}>
                          {customer.sales_rep_name || customer.sales_rep_id ? `Rep ID: ${customer.sales_rep_id}` : "No rep assigned"}
                        </div>
                      </td>

                      <td style={{ padding: 12 }}>
                        {isRoute ? (
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {customer.portal_username ? (
                              <Pill
                                text={`Portal: ${customer.portal_username}`}
                                bg={isDark ? "rgba(16,185,129,0.16)" : "#ecfdf5"}
                                color={isDark ? "#86efac" : "#047857"}
                                border={isDark ? "rgba(74,222,128,0.28)" : "#a7f3d0"}
                              />
                            ) : (
                              <Pill
                                text="Portal Not Issued"
                                bg={isDark ? "rgba(234,88,12,0.18)" : "#fff7ed"}
                                color={isDark ? "#fdba74" : "#c2410c"}
                                border={isDark ? "rgba(251,146,60,0.28)" : "#fed7aa"}
                              />
                            )}

                            {customer.credit_is_active === true ? (
                              <Pill
                                text={`Credit Enabled${customer.credit_limit ? ` · KES ${Number(customer.credit_limit).toLocaleString()}` : ""}`}
                                bg={isDark ? "rgba(16,185,129,0.16)" : "#ecfdf5"}
                                color={isDark ? "#86efac" : "#047857"}
                                border={isDark ? "rgba(74,222,128,0.28)" : "#a7f3d0"}
                              />
                            ) : (
                              <Pill
                                text="Credit Disabled"
                                bg={isDark ? "rgba(220,38,38,0.16)" : "#fef2f2"}
                                color={isDark ? "#fca5a5" : "#b91c1c"}
                                border={isDark ? "rgba(248,113,113,0.28)" : "#fecaca"}
                              />
                            )}
                          </div>
                        ) : (
                          <span style={{ color: colors.textMuted, fontSize: 12 }}>
                            Not applicable
                          </span>
                        )}
                      </td>

                      <td style={{ padding: 12 }}>
                        {customer.is_active ? (
                          <Pill
                            text="Active"
                            bg={isDark ? "rgba(16,185,129,0.16)" : "#ecfdf5"}
                            color={isDark ? "#86efac" : "#047857"}
                            border={isDark ? "rgba(74,222,128,0.28)" : "#a7f3d0"}
                          />
                        ) : (
                          <Pill
                            text="Inactive"
                            bg={isDark ? "rgba(220,38,38,0.16)" : "#fef2f2"}
                            color={isDark ? "#fca5a5" : "#b91c1c"}
                            border={isDark ? "rgba(248,113,113,0.28)" : "#fecaca"}
                          />
                        )}
                      </td>

                      <td style={{ padding: 12, textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                          <button
                            onClick={() => nav(`/customers/${customer.id}`)}
                            style={{
                              padding: "7px 10px",
                              background: "#334155",
                              color: "white",
                              border: "none",
                              borderRadius: 8,
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            View
                          </button>

                          <button
                            onClick={() => openEdit(customer)}
                            style={{
                              padding: "7px 10px",
                              background: "#667eea",
                              color: "white",
                              border: "none",
                              borderRadius: 8,
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            Edit
                          </button>

                          {isRoute && (
                            <button
                              onClick={() => nav(`/route-customer-access?customer=${customer.id}`)}
                              style={{
                                padding: "7px 10px",
                                background: "#0f766e",
                                color: "white",
                                border: "none",
                                borderRadius: 8,
                                cursor: "pointer",
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            >
                              Open in Route Portal Access
                            </button>
                          )}

                          <button
                            onClick={() => onDelete(customer.id)}
                            style={{
                              padding: "7px 10px",
                              background: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: 8,
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

