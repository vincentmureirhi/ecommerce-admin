import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { getThemeColors } from "../utils/themeColors";
import {
  listOrders,
  getOrderForPrint,
  getOrderStatistics,
} from "../api/orders";
import { getCustomerById } from "../api/customers";
import { listSalesReps } from "../api/salesReps";
import { getOrderStatusMeta } from "../utils/orderStatus";
import { openOrderPrintWindow } from "../utils/orderPrint";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://ecommerce-backend-9s3f.onrender.com/api";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  API_BASE_URL.replace(/\/api\/?$/, "");

const LIVE_REFRESH_INTERVAL_MS = 20000;

function money(value) {
  return `KES ${parseFloat(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
  })}`;
}

function extractPrintableBody(html) {
  const text = String(html || "");
  const bodyMatch = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return bodyMatch ? bodyMatch[1] : text;
}

function buildBatchPrintHtml(orderDocs, title) {
  const pages = orderDocs
    .map(({ order, html }) => {
      const body = extractPrintableBody(html);
      return `
        <section class="order-print-page">
          <div class="batch-header">
            <strong>${order.order_number || `Order #${order.id}`}</strong>
            <span>${order.customer_name || "Customer"}</span>
          </div>
          ${body}
        </section>
      `;
    })
    .join("");

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          body { margin: 0; font-family: Arial, sans-serif; color: #111827; background: #fff; }
          .batch-title { padding: 18px 22px; border-bottom: 1px solid #e5e7eb; }
          .batch-title h1 { margin: 0 0 4px; font-size: 18px; }
          .batch-title p { margin: 0; font-size: 12px; color: #6b7280; }
          .order-print-page { page-break-after: always; padding: 16px 18px 24px; }
          .order-print-page:last-child { page-break-after: auto; }
          .batch-header { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 12px; padding: 10px 12px; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 12px; }
          @media print {
            .batch-title { display: none; }
            .order-print-page { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="batch-title">
          <h1>${title}</h1>
          <p>${orderDocs.length} order sheet${orderDocs.length === 1 ? "" : "s"} prepared for cashier printing.</p>
        </div>
        ${pages}
      </body>
    </html>
  `;
}

function getOrderStatusStyle(status, isDark) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "completed") {
    return {
      bg: isDark ? "rgba(16, 185, 129, 0.2)" : "#d4edda",
      color: isDark ? "#4ade80" : "#155724",
    };
  }

  if (normalized === "pending") {
    return {
      bg: isDark ? "rgba(245, 158, 11, 0.2)" : "#fff3cd",
      color: isDark ? "#fbbf24" : "#856404",
    };
  }

  if (normalized === "processing") {
    return {
      bg: isDark ? "rgba(59, 130, 246, 0.2)" : "#dbeafe",
      color: isDark ? "#93c5fd" : "#1d4ed8",
    };
  }

  if (normalized === "dispatched") {
    return {
      bg: isDark ? "rgba(139, 92, 246, 0.2)" : "#ede9fe",
      color: isDark ? "#a78bfa" : "#5b21b6",
    };
  }

  return {
    bg: isDark ? "rgba(220, 53, 69, 0.2)" : "#f8d7da",
    color: isDark ? "#ff6b6b" : "#721c24",
  };
}

function getSettlementStyle(order, isDark) {
  if (order.order_type === "route") {
    if (order.payment_state === "paid") {
      return {
        label: "Paid",
        bg: isDark ? "rgba(16, 185, 129, 0.2)" : "#d4edda",
        color: isDark ? "#4ade80" : "#155724",
      };
    }

    if (order.payment_state === "partial") {
      return {
        label: "Partial",
        bg: isDark ? "rgba(59, 130, 246, 0.2)" : "#dbeafe",
        color: isDark ? "#93c5fd" : "#1d4ed8",
      };
    }

    if (order.payment_state === "overdue") {
      return {
        label: "Overdue",
        bg: isDark ? "rgba(220, 53, 69, 0.2)" : "#f8d7da",
        color: isDark ? "#ff6b6b" : "#721c24",
      };
    }

    return {
      label: "Unpaid",
      bg: isDark ? "rgba(245, 158, 11, 0.2)" : "#fff3cd",
      color: isDark ? "#fbbf24" : "#856404",
    };
  }

  if (order.payment_status === "completed") {
    return {
      label: "Paid",
      bg: isDark ? "rgba(16, 185, 129, 0.2)" : "#d4edda",
      color: isDark ? "#4ade80" : "#155724",
    };
  }

  if (order.payment_status === "failed") {
    return {
      label: "Failed",
      bg: isDark ? "rgba(220, 53, 69, 0.2)" : "#f8d7da",
      color: isDark ? "#ff6b6b" : "#721c24",
    };
  }

  return {
    label: "Pending",
    bg: isDark ? "rgba(245, 158, 11, 0.2)" : "#fff3cd",
    color: isDark ? "#fbbf24" : "#856404",
  };
}

function getPrintedStyle(order, isDark) {
  if (order.is_printed) {
    return {
      label: "Acknowledged",
      bg: isDark ? "rgba(16, 185, 129, 0.2)" : "#d4edda",
      color: isDark ? "#4ade80" : "#155724",
    };
  }

  return {
    label: "Needs Print",
    bg: isDark ? "rgba(148, 163, 184, 0.2)" : "#e2e8f0",
    color: isDark ? "#cbd5e1" : "#475569",
  };
}

function SummaryCard({ title, value, subtitle, c }) {
  return (
    <div
      style={{
        background: c.card,
        border: `1px solid ${c.border}`,
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: c.textMuted, marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: c.text }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: c.textMuted, marginTop: 8 }}>
        {subtitle}
      </div>
    </div>
  );
}

export default function Orders() {
  const { isDark } = useTheme();
  const c = getThemeColors(isDark);
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const customerFromUrl = searchParams.get("customer") || "";
  const salesRepFromUrl = searchParams.get("sales_rep") || "";

  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [salesReps, setSalesReps] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [printingId, setPrintingId] = useState(null);
  const [batchPrinting, setBatchPrinting] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [lastLiveRefreshAt, setLastLiveRefreshAt] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedSalesRep, setSelectedSalesRep] = useState(null);
  const socketRef = useRef(null);
  const loadDataRef = useRef(null);

  const [search, setSearch] = useState("");
  const [orderType, setOrderType] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [printedStatus, setPrintedStatus] = useState("");
  const [paymentState, setPaymentState] = useState("");
  const [salesRepFilter, setSalesRepFilter] = useState(salesRepFromUrl);

  const loadData = useCallback(async (options = {}) => {
    const silent = Boolean(options.silent);
    setErr("");
    if (!silent) setLoading(true);

    try {
      const filters = {};
      if (search) filters.search = search;
      if (orderType) filters.order_type = orderType;
      if (orderStatus) filters.order_status = orderStatus;
      if (customerFromUrl) filters.customer_id = customerFromUrl;
      if (printedStatus) filters.printed_status = printedStatus;
      if (paymentState) filters.payment_state = paymentState;
      if (salesRepFilter) filters.sales_rep_id = salesRepFilter;

      const [orderData, customerData, statsData, repsData] = await Promise.all([
        listOrders(filters),
        customerFromUrl ? getCustomerById(customerFromUrl) : Promise.resolve(null),
        getOrderStatistics(),
        listSalesReps(),
      ]);

      setRows(Array.isArray(orderData.data) ? orderData.data : []);
      setSelectedCustomer(customerData?.data || null);
      setStats(statsData?.data || null);
      setSalesReps(Array.isArray(repsData.data || repsData) ? repsData.data || repsData : []);
      if (silent) setLastLiveRefreshAt(new Date());
    } catch (e) {
      setErr(e?.message || "Failed to load orders");
      setSelectedCustomer(null);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [customerFromUrl, orderStatus, orderType, paymentState, printedStatus, salesRepFilter, search]);

  useEffect(() => {
    loadDataRef.current = loadData;
  }, [loadData]);

  async function handlePrint(orderId) {
    try {
      setPrintingId(orderId);

      const res = await getOrderForPrint(orderId);
      const html = res?.data?.html;
      openOrderPrintWindow(html);

      await loadData({ silent: true });
    } catch (e) {
      setErr(e?.message || "Failed to print order");
    } finally {
      setPrintingId(null);
    }
  }

  async function handleBatchPrint(options = {}) {
    if (!salesRepFilter) {
      setErr("Select a sales rep before using cashier batch print.");
      return;
    }

    let printableRows = rows.filter((order) => String(order.sales_rep_id || "") === String(salesRepFilter));
    if (options.routeOnly) {
      printableRows = printableRows.filter((order) => order.order_type === "route");
    }
    if (options.pendingOnly) {
      printableRows = printableRows.filter((order) => !order.is_printed);
    }

    if (printableRows.length === 0) {
      setErr("No visible orders match that print selection.");
      return;
    }

    try {
      setErr("");
      setBatchPrinting(true);
      const docs = await Promise.all(
        printableRows.map(async (order) => {
          const res = await getOrderForPrint(order.id);
          return {
            order,
            html: res?.data?.html || res?.html || "",
          };
        })
      );

      const repName = activeSalesRep?.name || selectedSalesRep?.name || `Sales Rep #${salesRepFilter}`;
      openOrderPrintWindow(buildBatchPrintHtml(docs, `${repName} - Route Order Sheets`));
      await loadData({ silent: true });
    } catch (e) {
      setErr(e?.message || "Failed to batch print sales rep orders");
    } finally {
      setBatchPrinting(false);
    }
  }

  function clearCustomerFilter() {
    const next = new URLSearchParams(searchParams);
    next.delete("customer");
    setSearchParams(next);
  }

  function updateSalesRepFilter(value) {
    setSalesRepFilter(value);
    const next = new URLSearchParams(searchParams);
    if (value) next.set("sales_rep", value);
    else next.delete("sales_rep");
    setSearchParams(next, { replace: true });
  }

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      timeout: 10000,
    });

    socketRef.current = socket;

    const refreshOrders = (payload = {}) => {
      const eventType = String(payload?.type || "");
      if (!eventType || eventType.includes("order")) {
        loadDataRef.current?.({ silent: true });
      }
    };

    socket.on("connect", () => {
      setSocketConnected(true);
      socket.emit("subscribe:dashboard");
    });
    socket.on("disconnect", () => setSocketConnected(false));
    socket.on("dashboard:updated", refreshOrders);

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("dashboard:updated", refreshOrders);
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      loadData({ silent: true });
    }, LIVE_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    if (salesRepFromUrl) {
      setSalesRepFilter(salesRepFromUrl);
      const found = salesReps.find((r) => String(r.id) === String(salesRepFromUrl));
      setSelectedSalesRep(found || null);
    } else {
      setSelectedSalesRep(null);
    }
  }, [salesRepFromUrl, salesReps]);

  const activeSalesRep = useMemo(
    () => salesReps.find((rep) => String(rep.id) === String(salesRepFilter)) || null,
    [salesRepFilter, salesReps]
  );

  const salesRepRows = useMemo(
    () => rows.filter((order) => String(order.sales_rep_id || "") === String(salesRepFilter)),
    [rows, salesRepFilter]
  );

  const salesRepRouteRows = useMemo(
    () => salesRepRows.filter((order) => order.order_type === "route"),
    [salesRepRows]
  );

  const salesRepPendingPrintRows = useMemo(
    () => salesRepRows.filter((order) => !order.is_printed),
    [salesRepRows]
  );

  if (loading) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          color: c.textMuted,
          background: c.bg,
          minHeight: "100vh",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div style={{ background: c.bg, minHeight: "100vh", padding: "20px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            marginTop: 0,
            marginBottom: 6,
            fontSize: 30,
            fontWeight: 800,
            color: c.text,
          }}
        >
          📦 Orders
        </h1>
        <p style={{ margin: 0, color: c.textMuted, fontSize: 13 }}>
          All orders from normal and region customers, with clear status progression, print acknowledgment, and settlement tracking
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 10 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 10px",
              borderRadius: 999,
              background: socketConnected
                ? isDark ? "rgba(16,185,129,0.16)" : "#ecfdf5"
                : isDark ? "rgba(245,158,11,0.14)" : "#fffbeb",
              border: `1px solid ${
                socketConnected
                  ? isDark ? "rgba(16,185,129,0.28)" : "#bbf7d0"
                  : isDark ? "rgba(245,158,11,0.28)" : "#fde68a"
              }`,
              color: socketConnected ? "#16a34a" : "#b45309",
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: socketConnected ? "#22c55e" : "#f59e0b",
                boxShadow: socketConnected ? "0 0 0 4px rgba(34,197,94,0.16)" : "none",
              }}
            />
            {socketConnected ? "Live order feed" : "Reconnecting order feed"}
          </span>
          {lastLiveRefreshAt && (
            <span style={{ fontSize: 12, color: c.textMuted }}>
              Refreshed {lastLiveRefreshAt.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {err && (
        <div
          style={{
            background: isDark ? "rgba(220, 53, 69, 0.1)" : "#fee",
            color: isDark ? "#ff6b6b" : "#c33",
            padding: 12,
            borderRadius: 6,
            marginBottom: 20,
            border: `1px solid ${isDark ? "rgba(220, 53, 69, 0.3)" : "#fdd"}`,
          }}
        >
          ⚠️ {err}
        </div>
      )}

      {selectedCustomer && (
        <div
          style={{
            marginBottom: 18,
            padding: 12,
            borderRadius: 8,
            background: isDark ? "rgba(16,185,129,0.10)" : "#ecfdf5",
            border: `1px solid ${isDark ? "rgba(16,185,129,0.25)" : "#bbf7d0"}`,
            color: c.text,
            fontSize: 13,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span>
            Showing orders for customer: <strong>{selectedCustomer.name}</strong>
            {selectedCustomer.phone ? <> · <strong>{selectedCustomer.phone}</strong></> : null}
          </span>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={() => nav(`/customers/${selectedCustomer.id}`)}
              style={smallBtn("#667eea")}
            >
              Open Customer
            </button>

            <button
              onClick={clearCustomerFilter}
              style={smallBtn("#dc3545")}
            >
              Clear Filter
            </button>
          </div>
        </div>
      )}

      {salesRepFilter && (
        <div
          style={{
            marginBottom: 18,
            padding: 12,
            borderRadius: 8,
            background: isDark ? "rgba(14,165,233,0.10)" : "#eff6ff",
            border: `1px solid ${isDark ? "rgba(14,165,233,0.25)" : "#bfdbfe"}`,
            color: c.text,
            fontSize: 13,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span>
            Showing orders for sales rep:{" "}
            <strong>
              {activeSalesRep?.name || `Rep #${salesRepFilter}`}
            </strong>
          </span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={() => nav(`/sales-reps/${salesRepFilter}`)}
              style={smallBtn("#0ea5e9")}
            >
              Open Rep
            </button>
            <button
              onClick={() => updateSalesRepFilter("")}
              style={smallBtn("#dc3545")}
            >
              Clear Filter
            </button>
          </div>
        </div>
      )}

      {salesRepFilter && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            marginBottom: 20,
            padding: 14,
            borderRadius: 12,
            background: isDark ? "rgba(15,23,42,0.72)" : "#f8fafc",
            border: `1px solid ${c.border}`,
          }}
        >
          <SummaryCard
            title="Visible Rep Orders"
            value={salesRepRows.length}
            subtitle={activeSalesRep?.name || `Rep #${salesRepFilter}`}
            c={c}
          />
          <SummaryCard
            title="Route Sheets"
            value={salesRepRouteRows.length}
            subtitle="Region customer orders"
            c={c}
          />
          <SummaryCard
            title="Needs Print"
            value={salesRepPendingPrintRows.length}
            subtitle="Cashier queue"
            c={c}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 8,
              background: c.card,
              border: `1px solid ${c.border}`,
              borderRadius: 12,
              padding: 14,
            }}
          >
            <button
              type="button"
              onClick={() => handleBatchPrint({ routeOnly: true, pendingOnly: true })}
              disabled={batchPrinting || salesRepPendingPrintRows.length === 0}
              style={{
                ...wideBtn("#16a34a"),
                opacity: batchPrinting || salesRepPendingPrintRows.length === 0 ? 0.65 : 1,
                cursor: batchPrinting || salesRepPendingPrintRows.length === 0 ? "not-allowed" : "pointer",
              }}
            >
              {batchPrinting ? "Preparing..." : "Print New Route Sheets"}
            </button>
            <button
              type="button"
              onClick={() => handleBatchPrint({ routeOnly: true })}
              disabled={batchPrinting || salesRepRouteRows.length === 0}
              style={{
                ...wideBtn("#0ea5e9"),
                opacity: batchPrinting || salesRepRouteRows.length === 0 ? 0.65 : 1,
                cursor: batchPrinting || salesRepRouteRows.length === 0 ? "not-allowed" : "pointer",
              }}
            >
              Print Visible Route Orders
            </button>
          </div>
        </div>
      )}

      {stats && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 14,
            marginBottom: 20,
          }}
        >
          <SummaryCard title="Total Orders" value={stats.total_orders || 0} subtitle="All recorded orders" c={c} />
          <SummaryCard title="Printed / Acknowledged" value={stats.printed_orders || 0} subtitle="Already handled" c={c} />
          <SummaryCard title="Pending Print" value={stats.not_printed_orders || 0} subtitle="Still waiting" c={c} />
          <SummaryCard title="Open Region Credit" value={stats.route_credit_open || 0} subtitle="Credit orders not cleared" c={c} />
          <SummaryCard title="Outstanding Balance" value={money(stats.total_outstanding_balance || 0)} subtitle="Money still owed" c={c} />
          <SummaryCard title="Overdue Region Orders" value={stats.overdue_route_orders || 0} subtitle="Need follow-up" c={c} />
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
          gap: 15,
          marginBottom: 20,
        }}
      >
        <div>
          <label style={filterLabel(c)}>Search</label>
          <input
            type="text"
            placeholder="Order #, customer, region, rep..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={inputStyle(c)}
          />
        </div>

        <div>
          <label style={filterLabel(c)}>Type</label>
          <select value={orderType} onChange={(e) => setOrderType(e.target.value)} style={inputStyle(c)}>
            <option value="">All Types</option>
            <option value="route">🚗 Region Orders</option>
            <option value="normal">💰 Normal Orders</option>
          </select>
        </div>

        <div>
          <label style={filterLabel(c)}>Order Status</label>
          <select value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)} style={inputStyle(c)}>
            <option value="">All Statuses</option>
            <option value="pending">⏳ Pending (new)</option>
            <option value="processing">⚙️ Processing (picked)</option>
            <option value="dispatched">🚚 Dispatched (in transit)</option>
            <option value="completed">✅ Completed (delivered)</option>
            <option value="cancelled">❌ Cancelled</option>
          </select>
        </div>

        <div>
          <label style={filterLabel(c)}>Printed</label>
          <select value={printedStatus} onChange={(e) => setPrintedStatus(e.target.value)} style={inputStyle(c)}>
            <option value="">All</option>
            <option value="printed">Printed</option>
            <option value="not_printed">Not Printed</option>
          </select>
        </div>

        <div>
          <label style={filterLabel(c)}>Region Settlement</label>
          <select value={paymentState} onChange={(e) => setPaymentState(e.target.value)} style={inputStyle(c)}>
            <option value="">All</option>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        <div>
          <label style={filterLabel(c)}>Sales Rep</label>
          <select value={salesRepFilter} onChange={(e) => updateSalesRepFilter(e.target.value)} style={inputStyle(c)}>
            <option value="">All Reps</option>
            {salesReps.map((rep) => (
              <option key={rep.id} value={rep.id}>
                {rep.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {rows.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: 60,
            background: c.card,
            borderRadius: 8,
            color: c.textMuted,
            border: `1px solid ${c.border}`,
          }}
        >
          🔭 No orders found
        </div>
      )}

      {rows.length > 0 && (
        <div
          style={{
            background: c.card,
            borderRadius: 8,
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            border: `1px solid ${c.border}`,
            overflowX: "auto",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1920 }}>
            <thead>
              <tr style={{ background: c.headerBg, borderBottom: `1px solid ${c.border}` }}>
                <th style={thStyle(c)}>Order #</th>
                <th style={thStyle(c)}>Customer</th>
                <th style={thStyle(c)}>Sales Rep</th>
                <th style={thStyle(c)}>Location</th>
                <th style={thStyle(c)}>Region</th>
                <th style={{ ...thStyle(c), textAlign: "center" }}>Type</th>
                <th style={{ ...thStyle(c), textAlign: "center" }}>Date</th>
                <th style={{ ...thStyle(c), textAlign: "center" }}>Items</th>
                <th style={{ ...thStyle(c), textAlign: "right" }}>Total</th>
                <th style={{ ...thStyle(c), textAlign: "right" }}>Amount Paid</th>
                <th style={{ ...thStyle(c), textAlign: "right" }}>Balance</th>
                <th style={{ ...thStyle(c), textAlign: "center" }}>Due Date</th>
                <th style={{ ...thStyle(c), textAlign: "center" }}>Order State</th>
                <th style={{ ...thStyle(c), textAlign: "center" }}>Settlement</th>
                <th style={{ ...thStyle(c), textAlign: "center" }}>Print State</th>
                <th style={{ ...thStyle(c), textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((order, idx) => {
                const orderStatusStyle = getOrderStatusStyle(order.order_status, isDark);
                const orderStatusMeta = getOrderStatusMeta(order.order_status);
                const nextStatusMeta = getOrderStatusMeta(orderStatusMeta.nextStatus);
                const settlementStyle = getSettlementStyle(order, isDark);
                const printedStyle = getPrintedStyle(order, isDark);

                return (
                  <tr
                    key={order.id}
                    style={{
                      borderBottom: `1px solid ${c.borderLight || c.border}`,
                      background: idx % 2 === 0 ? c.rowBg1 : c.rowBg2,
                    }}
                  >
                    <td style={tdPrimary(c)}>{order.order_number}</td>

                    <td
                      onClick={() => order.customer_id && nav(`/customers/${order.customer_id}`)}
                      style={{
                        ...tdPrimary(c),
                        color: order.customer_id ? "#667eea" : c.text,
                        cursor: order.customer_id ? "pointer" : "default",
                        textDecoration: order.customer_id ? "underline" : "none",
                      }}
                    >
                      <div>{order.customer_name}</div>
                      <div style={{ fontSize: 11, color: c.textMuted, marginTop: 3 }}>
                        {String(order.customer_type || order.order_type || "")
                          .toLowerCase()
                          .includes("route")
                          ? "Route customer workflow"
                          : "Standard customer workflow"}
                      </div>
                    </td>

                    <td
                      onClick={() => order.sales_rep_id && nav(`/sales-reps/${order.sales_rep_id}`)}
                      style={{
                        ...tdMuted(c),
                        color: order.sales_rep_id ? "#667eea" : c.textMuted,
                        cursor: order.sales_rep_id ? "pointer" : "default",
                        textDecoration: order.sales_rep_id ? "underline" : "none",
                      }}
                    >
                      {order.sales_rep_name || "—"}
                    </td>
                    <td style={tdMuted(c)}>{order.location_name || "—"}</td>
                    <td style={tdMuted(c)}>{order.region_name || "—"}</td>

                    <td style={{ ...tdBase, textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 8px",
                          background:
                            isDark
                              ? "rgba(102, 126, 234, 0.2)"
                              : order.order_type === "route"
                              ? "#e3f2fd"
                              : "#f0f5ff",
                          color: "#667eea",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {order.order_type === "route" ? "🚗 Region" : "💰 Normal"}
                      </span>
                    </td>

                    <td style={{ ...tdMuted(c), textAlign: "center" }}>
                      {new Date(order.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>

                    <td style={{ ...tdMuted(c), textAlign: "center" }}>{order.item_count || 0}</td>

                    <td style={{ ...tdPrimary(c), textAlign: "right" }}>{money(order.total_amount)}</td>
                    <td style={{ ...tdMuted(c), textAlign: "right" }}>{money(order.amount_paid)}</td>
                    <td style={{ ...tdPrimary(c), textAlign: "right", color: order.balance_due > 0 ? "#fbbf24" : c.text }}>
                      {money(order.balance_due)}
                    </td>

                    <td style={{ ...tdMuted(c), textAlign: "center" }}>
                      {order.due_date || "—"}
                    </td>

                    <td style={{ ...tdBase, textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 8px",
                          background: orderStatusStyle.bg,
                          color: orderStatusStyle.color,
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                        >
                        {orderStatusMeta.icon} {orderStatusMeta.label}
                      </span>
                      <div style={{ marginTop: 4, fontSize: 11, color: c.textMuted }}>
                        {orderStatusMeta.nextStatus
                          ? `Next: ${nextStatusMeta.label}`
                          : "Flow complete"}
                      </div>
                    </td>

                    <td style={{ ...tdBase, textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 8px",
                          background: settlementStyle.bg,
                          color: settlementStyle.color,
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {settlementStyle.label}
                      </span>
                    </td>

                    <td style={{ ...tdBase, textAlign: "center" }}>
                      <div
                        style={{
                          display: "inline-flex",
                          flexDirection: "column",
                          gap: 4,
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 8px",
                            background: printedStyle.bg,
                            color: printedStyle.color,
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {printedStyle.label}
                        </span>
                        {order.printed_at ? (
                          <span style={{ fontSize: 11, color: c.textMuted }}>
                            {`Printed ${new Date(order.printed_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}`}
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: c.textMuted }}>
                            Pending acknowledgement
                          </span>
                        )}
                      </div>
                    </td>

                    <td style={{ ...tdBase, textAlign: "center" }}>
                      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                        <button onClick={() => nav(`/orders/${order.id}`)} style={smallBtn("#667eea")}>
                          View
                        </button>

                        <button
                          onClick={() => handlePrint(order.id)}
                          disabled={printingId === order.id}
                          style={{
                            ...smallBtn("#16a34a"),
                            cursor: printingId === order.id ? "not-allowed" : "pointer",
                            opacity: printingId === order.id ? 0.7 : 1,
                          }}
                        >
                          {printingId === order.id
                            ? "Printing..."
                            : order.is_printed
                            ? "Reprint"
                            : "Print Order"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const tdBase = {
  padding: 12,
  fontSize: 13,
};

function tdPrimary(c) {
  return {
    ...tdBase,
    color: c.text,
    fontWeight: 600,
  };
}

function tdMuted(c) {
  return {
    ...tdBase,
    color: c.textMuted,
  };
}

function thStyle(c) {
  return {
    padding: 12,
    textAlign: "left",
    fontSize: 12,
    fontWeight: 700,
    color: c.textMuted,
  };
}

function inputStyle(c) {
  return {
    width: "100%",
    padding: "10px 12px",
    border: `1px solid ${c.border}`,
    borderRadius: 6,
    fontSize: 13,
    background: c.inputBg,
    color: c.text,
    boxSizing: "border-box",
  };
}

function filterLabel(c) {
  return {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: c.textMuted,
    marginBottom: 6,
  };
}

function smallBtn(background) {
  return {
    padding: "6px 12px",
    background,
    color: "white",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 11,
    fontWeight: 600,
  };
}

function wideBtn(background) {
  return {
    width: "100%",
    padding: "10px 12px",
    background,
    color: "white",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 800,
  };
}
