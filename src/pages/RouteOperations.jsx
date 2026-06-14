import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { getThemeColors } from "../utils/themeColors";
import { listRegions } from "../api/regions";
import { getRouteOperations } from "../api/routeOperations";

const FILTERS = [
  { value: "thismonth", label: "This month" },
  { value: "30days", label: "30 days" },
  { value: "7days", label: "7 days" },
  { value: "today", label: "Today" },
];

const statusLabels = {
  pending: "Captured",
  processing: "Shop queue",
  dispatched: "Out for delivery",
  completed: "Delivered",
  cancelled: "Cancelled",
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(toNumber(value));

const formatNumber = (value) =>
  new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(toNumber(value));

const formatDate = (value) => {
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
};

const extractList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

function EmptyState({ label, muted }) {
  return (
    <div
      style={{
        padding: 24,
        color: muted,
        textAlign: "center",
        border: `1px dashed ${muted}`,
        borderRadius: 10,
        opacity: 0.75,
      }}
    >
      {label}
    </div>
  );
}

function Section({ title, action, children, c }) {
  return (
    <section
      style={{
        background: c.card,
        border: `1px solid ${c.border}`,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "18px 20px",
          borderBottom: `1px solid ${c.borderLight}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 17, color: c.text }}>{title}</h2>
        {action}
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </section>
  );
}

function Table({ columns, rows, renderRow, empty, c }) {
  if (!rows.length) return <EmptyState label={empty} muted={c.textMuted} />;

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                style={{
                  textAlign: "left",
                  color: c.textMuted,
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                  padding: "0 12px 12px",
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

function Cell({ children, muted = false, align = "left", c }) {
  return (
    <td
      style={{
        padding: "14px 12px",
        borderBottom: `1px solid ${c.borderLight}`,
        color: muted ? c.textMuted : c.text,
        fontSize: 14,
        textAlign: align,
        verticalAlign: "top",
      }}
    >
      {children}
    </td>
  );
}

function RegionBar({ region, maxValue, c }) {
  const value = toNumber(region.route_value);
  const width = maxValue > 0 ? Math.max(6, Math.round((value / maxValue) * 100)) : 0;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <strong style={{ color: c.text }}>{region.name}</strong>
        <span style={{ color: c.textMuted }}>{formatCurrency(value)}</span>
      </div>
      <div
        style={{
          height: 8,
          background: c.buttonBg,
          borderRadius: 999,
          overflow: "hidden",
          marginTop: 8,
        }}
      >
        <div
          style={{
            width: `${width}%`,
            height: "100%",
            background: "linear-gradient(90deg, #ff4f1f, #f59e0b, #10b981)",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          color: c.textMuted,
          fontSize: 12,
          marginTop: 6,
        }}
      >
        <span>{formatNumber(region.order_count)} orders</span>
        <span>{formatNumber(region.buying_route_customers)} buying customers</span>
      </div>
    </div>
  );
}

export default function RouteOperations() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const c = getThemeColors(isDark);

  const [filter, setFilter] = useState("thismonth");
  const [regionId, setRegionId] = useState("");
  const [regions, setRegions] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError("");

      const [regionsPayload, routePayload] = await Promise.all([
        listRegions(),
        getRouteOperations({
          filter,
          region_id: regionId || undefined,
          limit: 10,
        }),
      ]);

      setRegions(extractList(regionsPayload));
      setData(routePayload || {});
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Route operations load error:", err);
      setError(err?.response?.data?.error || err?.message || "Failed to load route operations");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [filter, regionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const timer = setInterval(() => loadData(true), 60000);
    return () => clearInterval(timer);
  }, [loadData]);

  const summary = data?.summary || {};
  const regionLeaderboard = Array.isArray(data?.region_leaderboard) ? data.region_leaderboard : [];
  const topCustomers = Array.isArray(data?.top_route_customers) ? data.top_route_customers : [];
  const topSalesReps = Array.isArray(data?.top_sales_reps) ? data.top_sales_reps : [];
  const topProducts = Array.isArray(data?.top_products) ? data.top_products : [];
  const recentOrders = Array.isArray(data?.recent_route_orders) ? data.recent_route_orders : [];
  const statusSummary = Array.isArray(data?.status_summary) ? data.status_summary : [];
  const dayPattern = Array.isArray(data?.day_pattern) ? data.day_pattern : [];

  const maxRegionValue = useMemo(
    () => Math.max(...regionLeaderboard.map((region) => toNumber(region.route_value)), 0),
    [regionLeaderboard]
  );

  const summaryCards = [
    {
      label: "Route value",
      value: formatCurrency(summary.route_value),
      detail: "Delivery collection and approved credit route sales",
      color: "#ff4f1f",
    },
    {
      label: "Route orders",
      value: formatNumber(summary.route_orders),
      detail: `${formatNumber(summary.shop_work_queue)} in shop queue`,
      color: "#2563eb",
    },
    {
      label: "Route customers",
      value: formatNumber(summary.total_route_customers),
      detail: `${formatNumber(summary.buying_route_customers)} ordered in this period`,
      color: "#0f766e",
    },
    {
      label: "Active reps",
      value: formatNumber(summary.active_sales_reps),
      detail: "Reps with captured route orders",
      color: "#7c3aed",
    },
    {
      label: "Delivery queue",
      value: formatNumber(summary.delivery_queue),
      detail: "Orders already dispatched",
      color: "#f59e0b",
    },
    {
      label: "Average order",
      value: formatCurrency(summary.average_order_value),
      detail: "Average route basket value",
      color: "#16a34a",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: c.bg, color: c.text, padding: 24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 24,
        }}
      >
        <div>
          <div
            style={{
              color: "#ff4f1f",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 1,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Route Command
          </div>
          <h1 style={{ margin: 0, fontSize: 30 }}>Route Operations</h1>
          <p style={{ color: c.textMuted, margin: "8px 0 0", maxWidth: 760 }}>
            Region performance, route customer buying power, sales rep output, product movement,
            and delivery queues in one live view.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            style={{
              background: c.inputBg,
              color: c.text,
              border: `1px solid ${c.border}`,
              borderRadius: 8,
              padding: "10px 12px",
              minWidth: 130,
            }}
          >
            {FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={regionId}
            onChange={(event) => setRegionId(event.target.value)}
            style={{
              background: c.inputBg,
              color: c.text,
              border: `1px solid ${c.border}`,
              borderRadius: 8,
              padding: "10px 12px",
              minWidth: 170,
            }}
          >
            <option value="">All regions</option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => loadData()}
            style={{
              border: "none",
              borderRadius: 8,
              padding: "11px 16px",
              fontWeight: 700,
              background: "#ff4f1f",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {lastUpdated && (
        <div style={{ color: c.textMuted, fontSize: 12, marginBottom: 16 }}>
          Live refresh every 60 seconds. Last update {formatDate(lastUpdated)}.
        </div>
      )}

      {error && (
        <div
          style={{
            padding: 14,
            borderRadius: 10,
            background: isDark ? "rgba(239, 68, 68, 0.14)" : "#fff1f2",
            border: "1px solid rgba(239, 68, 68, 0.35)",
            color: isDark ? "#fecaca" : "#991b1b",
            marginBottom: 20,
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, background: c.card, borderRadius: 12, border: `1px solid ${c.border}` }}>
          Loading route operations...
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap: 14,
              marginBottom: 20,
            }}
          >
            {summaryCards.map((card) => (
              <div
                key={card.label}
                style={{
                  background: c.card,
                  border: `1px solid ${c.border}`,
                  borderRadius: 12,
                  padding: 18,
                  boxShadow: isDark ? "none" : "0 12px 28px rgba(15, 23, 42, 0.05)",
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 4,
                    background: card.color,
                    borderRadius: 999,
                    marginBottom: 14,
                  }}
                />
                <div style={{ color: c.textMuted, fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>
                  {card.label}
                </div>
                <div style={{ fontSize: 27, fontWeight: 800, marginTop: 8 }}>{card.value}</div>
                <div style={{ color: c.textMuted, marginTop: 8, fontSize: 13 }}>{card.detail}</div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 14,
              marginBottom: 20,
            }}
          >
            {[
              ["Main region capture", "Mon-Tue", "Sales reps collect route orders in the assigned region."],
              ["Shop close", "Wed", "Orders are finalized, packed, and prepared for dispatch."],
              ["Main route delivery", "Thu-Sat", "Delivery team completes drops and collection on delivery."],
              ["MWATATE route", "Thu-Fri capture, Sat delivery", "Weekly MWATATE run stays visible as its own rhythm."],
            ].map(([title, cadence, detail]) => (
              <div
                key={title}
                style={{
                  background: isDark ? "#111827" : "#111827",
                  color: "#fff",
                  borderRadius: 12,
                  padding: 18,
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div style={{ color: "#f97316", fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>
                  {cadence}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, marginTop: 8 }}>{title}</div>
                <div style={{ color: "#cbd5e1", marginTop: 8, lineHeight: 1.5 }}>{detail}</div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 20,
              marginBottom: 20,
            }}
          >
            <Section title="Region Leaderboard" c={c}>
              {regionLeaderboard.length ? (
                <div style={{ display: "grid", gap: 18 }}>
                  {regionLeaderboard.slice(0, 8).map((region) => (
                    <RegionBar key={region.id || region.name} region={region} maxValue={maxRegionValue} c={c} />
                  ))}
                </div>
              ) : (
                <EmptyState label="No route sales for this period." muted={c.textMuted} />
              )}
            </Section>

            <Section title="Regional Breakdown" c={c}>
              <Table
                c={c}
                columns={["Region", "Value", "Orders", "Customers", "Shop queue", "Delivery", "Last order"]}
                rows={regionLeaderboard}
                empty="No regional route data yet."
                renderRow={(region) => (
                  <tr key={region.id || region.name}>
                    <Cell c={c}>
                      <button
                        type="button"
                        onClick={() => navigate(`/regions/${region.id}`)}
                        style={{
                          border: "none",
                          background: "transparent",
                          padding: 0,
                          color: "#2563eb",
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        {region.name}
                      </button>
                    </Cell>
                    <Cell c={c}>{formatCurrency(region.route_value)}</Cell>
                    <Cell c={c}>{formatNumber(region.order_count)}</Cell>
                    <Cell c={c}>
                      {formatNumber(region.buying_route_customers)} / {formatNumber(region.total_route_customers)}
                    </Cell>
                    <Cell c={c}>{formatNumber(region.shop_work_queue)}</Cell>
                    <Cell c={c}>{formatNumber(region.delivery_queue)}</Cell>
                    <Cell c={c} muted>{formatDate(region.last_order_at)}</Cell>
                  </tr>
                )}
              />
            </Section>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
              gap: 20,
              marginBottom: 20,
            }}
          >
            <Section title="Highest Purchasing Route Customers" c={c}>
              <Table
                c={c}
                columns={["Customer", "Region", "Orders", "Value", "Last order"]}
                rows={topCustomers}
                empty="No buying route customers in this period."
                renderRow={(customer) => (
                  <tr key={`${customer.id || customer.phone}-${customer.name}`}>
                    <Cell c={c}>
                      <strong>{customer.name || "Route customer"}</strong>
                      <div style={{ color: c.textMuted, fontSize: 12 }}>{customer.phone || "-"}</div>
                    </Cell>
                    <Cell c={c}>
                      {customer.region_name || "-"}
                      <div style={{ color: c.textMuted, fontSize: 12 }}>{customer.location_name || ""}</div>
                    </Cell>
                    <Cell c={c}>{formatNumber(customer.order_count)}</Cell>
                    <Cell c={c}>{formatCurrency(customer.total_spent)}</Cell>
                    <Cell c={c} muted>{formatDate(customer.last_order_at)}</Cell>
                  </tr>
                )}
              />
            </Section>

            <Section title="Best Selling Sales Reps" c={c}>
              <Table
                c={c}
                columns={["Rep", "Orders", "Customers", "Route value", "Last order"]}
                rows={topSalesReps}
                empty="No sales rep route orders in this period."
                renderRow={(rep) => (
                  <tr key={rep.id || rep.name}>
                    <Cell c={c}>
                      <strong>{rep.name || "Unassigned"}</strong>
                      <div style={{ color: c.textMuted, fontSize: 12 }}>{rep.phone || "-"}</div>
                    </Cell>
                    <Cell c={c}>{formatNumber(rep.order_count)}</Cell>
                    <Cell c={c}>{formatNumber(rep.customer_count)}</Cell>
                    <Cell c={c}>{formatCurrency(rep.route_value)}</Cell>
                    <Cell c={c} muted>{formatDate(rep.last_order_at)}</Cell>
                  </tr>
                )}
              />
            </Section>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
              gap: 20,
              marginBottom: 20,
            }}
          >
            <Section title="Best Selling Products On Route" c={c}>
              <Table
                c={c}
                columns={["Product", "Units", "Orders", "Value", "Stock"]}
                rows={topProducts}
                empty="No product movement for route orders yet."
                renderRow={(product) => (
                  <tr key={product.id || product.name}>
                    <Cell c={c}>
                      <strong>{product.name || "Product"}</strong>
                      <div style={{ color: c.textMuted, fontSize: 12 }}>{product.sku || "-"}</div>
                    </Cell>
                    <Cell c={c}>{formatNumber(product.units_ordered)}</Cell>
                    <Cell c={c}>{formatNumber(product.order_count)}</Cell>
                    <Cell c={c}>{formatCurrency(product.route_value)}</Cell>
                    <Cell c={c}>{formatNumber(product.current_stock)}</Cell>
                  </tr>
                )}
              />
            </Section>

            <Section title="Order Stage Mix" c={c}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
                {statusSummary.length ? (
                  statusSummary.map((stage) => (
                    <div
                      key={stage.status}
                      style={{
                        border: `1px solid ${c.borderLight}`,
                        borderRadius: 10,
                        padding: 14,
                        background: c.rowBg2,
                      }}
                    >
                      <div style={{ color: c.textMuted, fontSize: 12, textTransform: "uppercase", fontWeight: 800 }}>
                        {statusLabels[stage.status] || stage.status}
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>
                        {formatNumber(stage.order_count)}
                      </div>
                      <div style={{ color: c.textMuted, fontSize: 12, marginTop: 4 }}>
                        {formatCurrency(stage.route_value)}
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState label="No route stage activity yet." muted={c.textMuted} />
                )}
              </div>

              <div style={{ marginTop: 18 }}>
                <h3 style={{ fontSize: 14, margin: "0 0 10px", color: c.textMuted }}>Capture by day</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(86px, 1fr))", gap: 8 }}>
                  {dayPattern.map((day) => (
                    <div
                      key={day.day_number}
                      style={{
                        padding: 10,
                        borderRadius: 10,
                        background: c.rowBg2,
                        border: `1px solid ${c.borderLight}`,
                      }}
                    >
                      <strong style={{ display: "block" }}>{String(day.day_name || "").trim()}</strong>
                      <span style={{ color: c.textMuted, fontSize: 12 }}>
                        {formatNumber(day.order_count)} orders
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          </div>

          <Section
            title="Recent Route Orders"
            c={c}
            action={
              <button
                type="button"
                onClick={() => navigate("/orders")}
                style={{
                  border: `1px solid ${c.border}`,
                  background: c.inputBg,
                  color: c.text,
                  borderRadius: 8,
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Open orders
              </button>
            }
          >
            <Table
              c={c}
              columns={["Order", "Customer", "Region", "Rep", "Stage", "Value", "Captured"]}
              rows={recentOrders}
              empty="No route orders captured in this period."
              renderRow={(order) => (
                <tr key={order.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/orders/${order.id}`)}>
                  <Cell c={c}>
                    <strong style={{ color: "#2563eb" }}>{order.order_number}</strong>
                  </Cell>
                  <Cell c={c}>
                    {order.customer_name || "Route customer"}
                    <div style={{ color: c.textMuted, fontSize: 12 }}>{order.customer_phone || "-"}</div>
                  </Cell>
                  <Cell c={c}>
                    {order.region_name || "-"}
                    <div style={{ color: c.textMuted, fontSize: 12 }}>{order.location_name || ""}</div>
                  </Cell>
                  <Cell c={c}>{order.sales_rep_name || "Unassigned"}</Cell>
                  <Cell c={c}>{statusLabels[order.order_status] || order.order_status || "Captured"}</Cell>
                  <Cell c={c}>{formatCurrency(order.total_amount)}</Cell>
                  <Cell c={c} muted>{formatDate(order.created_at)}</Cell>
                </tr>
              )}
            />
          </Section>
        </>
      )}
    </div>
  );
}
