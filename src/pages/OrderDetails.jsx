import React, { useEffect, useState } from "react";
import { getOrderById, updateOrderStatus, getOrderForPrint } from "../api/orders";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { getThemeColors } from "../utils/themeColors";

function money(value) {
  return `KES ${parseFloat(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
  })}`;
}

export default function OrderDetails() {
  const { id } = useParams();
  const nav = useNavigate();
  const { isDark } = useTheme();
  const c = getThemeColors(isDark);

  const [order, setOrder] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [savingSettlement, setSavingSettlement] = useState(false);
  const [savingOrderStatus, setSavingOrderStatus] = useState(false);

  const [orderStatus, setOrderStatus] = useState("pending");
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [amountPaid, setAmountPaid] = useState("0");
  const [dueDate, setDueDate] = useState("");

  async function load() {
    setErr("");
    setLoading(true);

    try {
      const data = await getOrderById(id);
      const o = data?.data || data;

      setOrder(o);
      setOrderStatus(o?.order_status || "pending");
      setPaymentStatus(o?.payment_status || "pending");
      setAmountPaid(String(o?.amount_paid ?? 0));
      setDueDate(o?.due_date || "");
    } catch (e) {
      setErr(e?.message || "Failed to load order");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function onSaveOrderStatus() {
    try {
      setSavingOrderStatus(true);
      const res = await updateOrderStatus(id, { order_status: orderStatus });
      const updated = res?.data || res;
      setOrder(updated);
      setErr("");
    } catch (e) {
      setErr(e?.message || "Failed to update order status");
    } finally {
      setSavingOrderStatus(false);
    }
  }

  async function onSaveSettlement() {
    const parsedAmountPaid = Number(amountPaid);

    if (!Number.isFinite(parsedAmountPaid) || parsedAmountPaid < 0) {
      setErr("Amount paid must be a valid non-negative number");
      return;
    }

    try {
      setSavingSettlement(true);

      const payload = {
        amount_paid: parsedAmountPaid,
        due_date: order?.order_type === "route" ? dueDate : null,
      };

      if (order?.order_type === "normal") {
        payload.payment_status = paymentStatus;
      }

      const res = await updateOrderStatus(id, payload);
      const updated = res?.data || res;

      setOrder(updated);
      setPaymentStatus(updated?.payment_status || "pending");
      setAmountPaid(String(updated?.amount_paid ?? 0));
      setDueDate(updated?.due_date || "");
      setErr("");
    } catch (e) {
      setErr(e?.message || "Failed to update settlement");
    } finally {
      setSavingSettlement(false);
    }
  }

  async function onPrint() {
    try {
      setPrinting(true);
      const data = await getOrderForPrint(id);
      const html = data?.data?.html;

      if (!html) {
        throw new Error("Failed to generate printable order sheet");
      }

      const printWindow = window.open("", "", "width=900,height=700");
      if (!printWindow) {
        throw new Error("Popup blocked. Allow popups and try again.");
      }

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();

      await load();
    } catch (e) {
      setErr(e?.message || "Failed to generate receipt");
    } finally {
      setPrinting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: c.textMuted }}>
        Loading...
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: c.textMuted }}>
        Order not found
      </div>
    );
  }

  const card = {
    background: c.card,
    padding: 20,
    borderRadius: 10,
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    border: `1px solid ${c.border}`,
  };

  const label = {
    fontSize: 11,
    color: c.textMuted,
    fontWeight: 700,
    marginBottom: 4,
  };

  const value = {
    fontSize: 13,
    color: c.text,
    fontWeight: 600,
  };

  const settlementBadge =
    order.order_type === "route"
      ? order.payment_state || "unpaid"
      : order.payment_status || "pending";

  return (
    <div style={{ background: c.bg, minHeight: "100vh", padding: 20 }}>
      <div
        style={{
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ marginTop: 0, marginBottom: 5, fontSize: 28, fontWeight: 700, color: c.text }}>
            🛒 {order.order_number}
          </h1>
          <p style={{ margin: 0, color: c.textMuted, fontSize: 13 }}>
            Order details, printing, and real settlement tracking
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onPrint}
            disabled={printing}
            style={{
              padding: "10px 20px",
              background: "#28a745",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: printing ? "not-allowed" : "pointer",
              fontSize: 13,
              fontWeight: 600,
              opacity: printing ? 0.7 : 1,
            }}
          >
            {printing ? "Printing..." : order.is_printed ? "🖨️ Reprint" : "🖨️ Print Order"}
          </button>

          <button
            onClick={() => nav("/orders")}
            style={{
              padding: "10px 20px",
              background: c.buttonBg || "#e0e0e0",
              color: c.text,
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            ← Back
          </button>
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          gap: 20,
          marginBottom: 20,
        }}
      >
        <div style={card}>
          <h3 style={{ marginTop: 0, fontSize: 14, fontWeight: 700, marginBottom: 16, color: c.text }}>
            📋 Order Information
          </h3>

          <div style={{ marginBottom: 12 }}>
            <div style={label}>Customer</div>
            <div style={value}>{order.customer_name || "N/A"}</div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={label}>Phone</div>
            <div style={value}>{order.customer_phone || "N/A"}</div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={label}>Sales Rep</div>
            <div style={value}>{order.sales_rep_name || "—"}</div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={label}>Location</div>
            <div style={value}>{order.location_name || "—"}</div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={label}>Region</div>
            <div style={value}>{order.region_name || "—"}</div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={label}>Order Type</div>
            <div style={value}>{order.order_type === "route" ? "🚗 Region Order" : "💰 Normal Order"}</div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={label}>Printed</div>
            <div style={value}>
              {order.is_printed ? "✅ Printed" : "🕓 Not Printed"}
              {order.printed_at ? ` · ${new Date(order.printed_at).toLocaleString()}` : ""}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={label}>Created</div>
            <div style={value}>{new Date(order.created_at).toLocaleString()}</div>
          </div>

          <div>
            <div style={label}>Total Amount</div>
            <div style={{ fontSize: 20, color: "#667eea", fontWeight: 800 }}>
              {money(order.total_amount)}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gap: 20 }}>
          <div style={card}>
            <h3 style={{ marginTop: 0, fontSize: 14, fontWeight: 700, marginBottom: 14, color: c.text }}>
              📦 Order Status
            </h3>

            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: c.textMuted, marginBottom: 6 }}>
              Order Status
            </label>
            <select
              value={orderStatus}
              onChange={(e) => setOrderStatus(e.target.value)}
              style={inputStyle(c)}
            >
              <option value="pending">⏳ Pending</option>
              <option value="processing">⚙️ Processing</option>
              <option value="dispatched">🚚 Dispatched</option>
              <option value="completed">✔️ Completed</option>
              <option value="cancelled">❌ Cancelled</option>
            </select>

            <button
              onClick={onSaveOrderStatus}
              disabled={savingOrderStatus}
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "#667eea",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: savingOrderStatus ? "not-allowed" : "pointer",
                fontSize: 12,
                fontWeight: 700,
                marginTop: 10,
                opacity: savingOrderStatus ? 0.7 : 1,
              }}
            >
              {savingOrderStatus ? "Saving..." : "Update Order Status"}
            </button>
          </div>

          <div style={card}>
            <h3 style={{ marginTop: 0, fontSize: 14, fontWeight: 700, marginBottom: 10, color: c.text }}>
              💳 Settlement Tracking
            </h3>

            <div style={{ marginBottom: 12 }}>
              <div style={label}>Current Settlement State</div>
              <div style={value}>{settlementBadge}</div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={label}>Amount Paid</div>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                style={inputStyle(c)}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={label}>Balance Due</div>
              <div style={{ ...value, color: parseFloat(order.balance_due || 0) > 0 ? "#f59e0b" : c.text }}>
                {money(order.balance_due)}
              </div>
            </div>

            {order.order_type === "route" ? (
              <>
                <div style={{ marginBottom: 12 }}>
                  <div style={label}>Due Date</div>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    style={inputStyle(c)}
                  />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={label}>Last Payment Date</div>
                  <div style={value}>
                    {order.last_payment_date
                      ? new Date(order.last_payment_date).toLocaleString()
                      : "—"}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ marginBottom: 12 }}>
                <div style={label}>Payment Status</div>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  style={inputStyle(c)}
                >
                  <option value="pending">⏳ Pending</option>
                  <option value="completed">✅ Completed</option>
                  <option value="failed">❌ Failed</option>
                  <option value="cancelled">⛔ Cancelled</option>
                </select>
              </div>
            )}

            <button
              onClick={onSaveSettlement}
              disabled={savingSettlement}
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "#16a34a",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: savingSettlement ? "not-allowed" : "pointer",
                fontSize: 12,
                fontWeight: 700,
                opacity: savingSettlement ? 0.7 : 1,
              }}
            >
              {savingSettlement ? "Saving..." : "Update Settlement"}
            </button>
          </div>
        </div>
      </div>

      {order.items && order.items.length > 0 && (
        <div
          style={{
            ...card,
          }}
        >
          <h3 style={{ marginTop: 0, fontSize: 14, fontWeight: 700, marginBottom: 16, color: c.text }}>
            📦 Order Items ({order.items.length})
          </h3>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: c.headerBg, borderBottom: `1px solid ${c.border}` }}>
                  <th style={th(c)}>Product</th>
                  <th style={{ ...th(c), textAlign: "center" }}>SKU</th>
                  <th style={{ ...th(c), textAlign: "right" }}>Unit Price</th>
                  <th style={{ ...th(c), textAlign: "center" }}>Qty</th>
                  <th style={{ ...th(c), textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: `1px solid ${c.borderLight || c.border}`,
                      background: idx % 2 === 0 ? c.rowBg1 : c.rowBg2,
                    }}
                  >
                    <td style={{ ...td(c), fontWeight: 600 }}>{item.product_name}</td>
                    <td style={{ ...tdMuted(c), textAlign: "center" }}>{item.sku}</td>
                    <td style={{ ...td(c), textAlign: "right", color: "#667eea" }}>
                      {money(item.unit_price)}
                    </td>
                    <td style={{ ...tdMuted(c), textAlign: "center" }}>{item.quantity}</td>
                    <td style={{ ...td(c), textAlign: "right", fontWeight: 600 }}>
                      {money(item.total_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function inputStyle(c) {
  return {
    width: "100%",
    padding: "10px 12px",
    border: `1px solid ${c.border}`,
    borderRadius: 6,
    fontSize: 13,
    boxSizing: "border-box",
    background: c.inputBg,
    color: c.text,
  };
}

function th(c) {
  return {
    padding: 12,
    textAlign: "left",
    fontSize: 12,
    fontWeight: 700,
    color: c.textMuted,
  };
}

function td(c) {
  return {
    padding: 12,
    fontSize: 12,
    color: c.text,
  };
}

function tdMuted(c) {
  return {
    padding: 12,
    fontSize: 12,
    color: c.textMuted,
  };
}
