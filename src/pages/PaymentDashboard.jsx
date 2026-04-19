import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import {
  getSummaryCards,
  getStatusBreakdown,
  getPaymentTransactions,
  getPaymentDetail,
  getAlerts,
  getReconciliation,
} from "../api/payments";

export default function PaymentDashboard() {
  const [summary, setSummary] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [transactions, setTransactions] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [reconciliation, setReconciliation] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef(null);

  // Filters
  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    status: "",
    method: "",
    search: "",
  });

  async function loadDashboard() {
    setError("");
    setLoading(true);
    try {
      const [summaryData, breakdownData, transData, alertsData, reconcData] = await Promise.all([
        getSummaryCards(),
        getStatusBreakdown(),
        getPaymentTransactions(filters),
        getAlerts(),
        getReconciliation(),
      ]);

      setSummary(summaryData);
      setBreakdown(breakdownData);
      setTransactions(transData);
      setAlerts(alertsData);
      setReconciliation(reconcData);
    } catch (e) {
      setError(e?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  // Initialize WebSocket connection
  useEffect(() => {
    const socket = io(window.location.origin, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      console.log("✅ Connected to WebSocket server");
      socket.emit("subscribe:payments");
      socket.emit("subscribe:alerts");
    });

    socket.on("subscription:confirmed", (data) => {
      console.log(`📊 Subscribed to: ${data.type}`);
    });

    // Listen for real-time payment updates
    socket.on("payment:completed", (data) => {
      console.log("🎉 Payment completed:", data);
      addNotification(`✅ Payment #${data.data.id} completed! KES ${data.data.amount}`, "success");
      loadDashboard(); // Reload dashboard
    });

    socket.on("payment:failed", (data) => {
      console.log("❌ Payment failed:", data);
      addNotification(`❌ Payment #${data.data.id} failed: ${data.data.result_desc}`, "error");
      loadDashboard(); // Reload dashboard
    });

    socket.on("payment:pending", (data) => {
      console.log("⏳ Payment pending:", data);
      addNotification(`⏳ Payment #${data.data.id} pending`, "warning");
    });

    socket.on("alert:new", (data) => {
      console.log("🚨 New alert:", data);
      addNotification(`🚨 ${data.data.title}`, "alert");
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected from WebSocket server");
    });

    socket.on("error", (error) => {
      console.error("❌ WebSocket error:", error);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  // Load dashboard on mount and when filters change
  useEffect(() => {
    loadDashboard();
  }, [filters]);

  const addNotification = (message, type) => {
    const id = Date.now();
    const notification = { id, message, type };
    setNotifications((prev) => [...prev, notification]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: "#10b981",
      pending: "#f59e0b",
      failed: "#ef4444",
      cancelled: "#6b7280",
      reversed: "#8b5cf6",
    };
    return colors[status] || "#999";
  };

  const getStatusBg = (status) => {
    const bgs = {
      completed: "#ecfdf5",
      pending: "#fffbeb",
      failed: "#fef2f2",
      cancelled: "#f3f4f6",
      reversed: "#faf5ff",
    };
    return bgs[status] || "#f9fafb";
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: "#666" }}>Loading dashboard...</div>;
  }

  return (
    <div style={{ padding: "0 0 40px 0" }}>
      {/* NOTIFICATIONS */}
      <div style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 2000,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}>
        {notifications.map((notif) => (
          <div
            key={notif.id}
            style={{
              padding: 16,
              borderRadius: 8,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              animation: "slideIn 0.3s ease-out",
              background:
                notif.type === "success"
                  ? "#ecfdf5"
                  : notif.type === "error"
                  ? "#fef2f2"
                  : notif.type === "warning"
                  ? "#fffbeb"
                  : "#f0f0f0",
              color:
                notif.type === "success"
                  ? "#10b981"
                  : notif.type === "error"
                  ? "#ef4444"
                  : notif.type === "warning"
                  ? "#f59e0b"
                  : "#333",
              border:
                notif.type === "success"
                  ? "1px solid #a7f3d0"
                  : notif.type === "error"
                  ? "1px solid #fecaca"
                  : notif.type === "warning"
                  ? "1px solid #fcd34d"
                  : "1px solid #ddd",
              fontSize: 14,
              fontWeight: 600,
              maxWidth: 400,
            }}
          >
            {notif.message}
          </div>
        ))}
      </div>

      {/* HEADER */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ margin: "0 0 5px 0", fontSize: 32, fontWeight: 700, color: "#1a1a1a" }}>
          💳 Payment Dashboard
        </h1>
        <p style={{ margin: 0, color: "#666", fontSize: 14 }}>
          Real-time payment analytics and monitoring
        </p>
      </div>

      {/* ERROR */}
      {error && (
        <div style={{
          background: "#fef2f2",
          border: "1px solid #fecaca",
          color: "#dc2626",
          padding: 16,
          borderRadius: 8,
          marginBottom: 24,
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* SUMMARY CARDS */}
      {summary && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}>
          <SummaryCard
            title="Today's Collections"
            value={`KES ${summary.today.total_collected}`}
            subtitle={`${summary.today.completed_payments} completed`}
            color="#10b981"
          />
          <SummaryCard
            title="Success Rate"
            value={`${summary.today.success_rate}%`}
            subtitle={`${summary.today.total_attempts} attempts`}
            color="#3b82f6"
          />
          <SummaryCard
            title="Pending Payments"
            value={summary.today.pending_payments}
            subtitle={`KES ${summary.today.amount_pending}`}
            color="#f59e0b"
          />
          <SummaryCard
            title="Failed Payments"
            value={summary.today.failed_payments}
            subtitle="Needs attention"
            color="#ef4444"
          />
          <SummaryCard
            title="This Week"
            value={`KES ${summary.this_week.total_collected}`}
            subtitle="7 days collected"
            color="#8b5cf6"
          />
          <SummaryCard
            title="This Month"
            value={`KES ${summary.this_month.total_collected}`}
            subtitle="Monthly total"
            color="#ec4899"
          />
        </div>
      )}

      {/* STATUS BREAKDOWN */}
      {breakdown && (
        <div style={{
          background: "white",
          borderRadius: 8,
          padding: 24,
          marginBottom: 32,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}>
          <h2 style={{ margin: "0 0 20px 0", fontSize: 18, fontWeight: 600, color: "#1a1a1a" }}>
            Payment Status Breakdown
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16 }}>
            {breakdown.statuses.map((status) => (
              <div
                key={status.status}
                style={{
                  background: getStatusBg(status.status),
                  border: `2px solid ${getStatusColor(status.status)}`,
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: "#666", textTransform: "uppercase", marginBottom: 8 }}>
                  {status.status}
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: getStatusColor(status.status), marginBottom: 4 }}>
                  {status.count}
                </div>
                <div style={{ fontSize: 12, color: "#999" }}>KES {status.total_amount}</div>
                <div style={{ fontSize: 11, color: "#999", marginTop: 8 }}>{status.percentage}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ALERTS */}
      {alerts && alerts.alerts && alerts.alerts.length > 0 && (
        <div style={{
          background: "white",
          borderRadius: 8,
          padding: 24,
          marginBottom: 32,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          border: "2px solid #fecaca",
        }}>
          <h2 style={{ margin: "0 0 20px 0", fontSize: 18, fontWeight: 600, color: "#dc2626" }}>
            🚨 Active Alerts ({alerts.alerts.length})
          </h2>
          {alerts.alerts.map((alert, idx) => (
            <div
              key={idx}
              style={{
                background: alert.severity === "critical" ? "#fef2f2" : "#fffbeb",
                border: `1px solid ${alert.severity === "critical" ? "#fecaca" : "#fcd34d"}`,
                borderRadius: 6,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  color: alert.severity === "critical" ? "#dc2626" : "#d97706",
                  marginBottom: 8,
                }}
              >
                {alert.title}
              </div>
              {alert.items &&
                alert.items.slice(0, 3).map((item, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                    💰 Order #{item.order_id} • {item.phone} • KES {item.amount}
                  </div>
                ))}
              {alert.items && alert.items.length > 3 && (
                <div style={{ fontSize: 11, color: "#999", marginTop: 8 }}>
                  +{alert.items.length - 3} more...
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* FILTERS */}
      <div
        style={{
          background: "white",
          borderRadius: 8,
          padding: 20,
          marginBottom: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <h3 style={{ margin: "0 0 16px 0", fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>
          Filters
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
          <input
            type="text"
            placeholder="Search by phone, receipt..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            style={{
              padding: "8px 12px",
              border: "1px solid #ddd",
              borderRadius: 4,
              fontSize: 13,
              fontFamily: "inherit",
            }}
          />
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            style={{
              padding: "8px 12px",
              border: "1px solid #ddd",
              borderRadius: 4,
              fontSize: 13,
              fontFamily: "inherit",
            }}
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={filters.method}
            onChange={(e) => handleFilterChange("method", e.target.value)}
            style={{
              padding: "8px 12px",
              border: "1px solid #ddd",
              borderRadius: 4,
              fontSize: 13,
              fontFamily: "inherit",
            }}
          >
            <option value="">All Methods</option>
            <option value="mpesa">M-Pesa</option>
            <option value="bank">Bank</option>
            <option value="card">Card</option>
            <option value="cash">Cash</option>
          </select>
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      {transactions && (
        <div
          style={{
            background: "white",
            borderRadius: 8,
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ padding: 20, borderBottom: "1px solid #eee" }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#1a1a1a" }}>
              Recent Transactions ({transactions.pagination.total})
            </h2>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #eee" }}>
                <th style={{ padding: 12, textAlign: "left", fontSize: 12, fontWeight: 600, color: "#666" }}>
                  Payment ID
                </th>
                <th style={{ padding: 12, textAlign: "left", fontSize: 12, fontWeight: 600, color: "#666" }}>
                  Customer
                </th>
                <th style={{ padding: 12, textAlign: "left", fontSize: 12, fontWeight: 600, color: "#666" }}>
                  Phone
                </th>
                <th style={{ padding: 12, textAlign: "right", fontSize: 12, fontWeight: 600, color: "#666" }}>
                  Amount
                </th>
                <th style={{ padding: 12, textAlign: "left", fontSize: 12, fontWeight: 600, color: "#666" }}>
                  Method
                </th>
                <th style={{ padding: 12, textAlign: "left", fontSize: 12, fontWeight: 600, color: "#666" }}>
                  Status
                </th>
                <th style={{ padding: 12, textAlign: "left", fontSize: 12, fontWeight: 600, color: "#666" }}>
                  Receipt
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.data.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => setSelectedPayment(row)}
                  style={{
                    borderBottom: "1px solid #eee",
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                >
                  <td style={{ padding: 12, fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>
                    #{row.id}
                  </td>
                  <td style={{ padding: 12, fontSize: 13, color: "#666" }}>
                    {row.customer_name || "N/A"}
                  </td>
                  <td style={{ padding: 12, fontSize: 13, color: "#666" }}>
                    {row.customer_phone || "N/A"}
                  </td>
                  <td style={{ padding: 12, textAlign: "right", fontSize: 13, fontWeight: 600, color: "#667eea" }}>
                    KES {row.amount}
                  </td>
                  <td style={{ padding: 12, fontSize: 13, color: "#666" }}>
                    {row.method || "N/A"}
                  </td>
                  <td style={{ padding: 12 }}>
                    <span
                      style={{
                        display: "inline-block",
                        background: getStatusBg(row.status),
                        color: getStatusColor(row.status),
                        padding: "4px 8px",
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td style={{ padding: 12, fontSize: 12, color: "#999" }}>
                    {row.mpesa_receipt ? row.mpesa_receipt.substring(0, 10) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* PAGINATION */}
          {transactions.pagination && (
            <div
              style={{
                padding: 16,
                background: "#f9fafb",
                borderTop: "1px solid #eee",
                display: "flex",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {Array.from({ length: transactions.pagination.pages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handleFilterChange("page", page)}
                  style={{
                    padding: "6px 10px",
                    border: filters.page === page ? "none" : "1px solid #ddd",
                    background: filters.page === page ? "#667eea" : "white",
                    color: filters.page === page ? "white" : "#666",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedPayment && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: 8,
              padding: 24,
              maxWidth: 600,
              width: "90%",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "#1a1a1a" }}>
                Payment Details
              </h2>
              <button
                onClick={() => setSelectedPayment(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 24,
                  cursor: "pointer",
                  color: "#999",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: "#f9fafb", borderRadius: 8, padding: 16, marginBottom: 20 }}>
              <DetailRow label="Payment ID" value={selectedPayment.id} />
              <DetailRow label="Order ID" value={selectedPayment.order_id} />
              <DetailRow label="Customer" value={selectedPayment.customer_name || "N/A"} />
              <DetailRow label="Phone" value={selectedPayment.customer_phone} />
              <DetailRow label="Amount" value={`KES ${selectedPayment.amount}`} />
              <DetailRow label="Method" value={selectedPayment.method} />
              <DetailRow
                label="Status"
                value={selectedPayment.status}
                color={getStatusColor(selectedPayment.status)}
              />
              <DetailRow label="Receipt" value={selectedPayment.mpesa_receipt || "N/A"} />
              <DetailRow label="Merchant Request ID" value={selectedPayment.merchant_request_id || "N/A"} />
              <DetailRow label="Checkout Request ID" value={selectedPayment.checkout_request_id || "N/A"} />
              <DetailRow label="Result Code" value={selectedPayment.result_code || "N/A"} />
              <DetailRow label="Result Description" value={selectedPayment.result_desc || "N/A"} />
              <DetailRow label="Created" value={new Date(selectedPayment.created_at).toLocaleString()} />
              <DetailRow label="Updated" value={new Date(selectedPayment.updated_at).toLocaleString()} />
            </div>

            <button
              onClick={() => setSelectedPayment(null)}
              style={{
                width: "100%",
                padding: 10,
                background: "#667eea",
                color: "white",
                border: "none",
                borderRadius: 4,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

function SummaryCard({ title, value, subtitle, color }) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: 8,
        padding: 20,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        borderLeft: `4px solid ${color}`,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, color: "#999", marginBottom: 8, textTransform: "uppercase" }}>
        {title}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: color, marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "#666" }}>{subtitle}</div>
    </div>
  );
}

function DetailRow({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 13 }}>
      <span style={{ color: "#666", fontWeight: 500 }}>{label}:</span>
      <span
        style={{
          color: color || "#1a1a1a",
          fontWeight: 600,
          wordBreak: "break-word",
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}

