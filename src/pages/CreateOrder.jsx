import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listCustomers } from "../api/customers";
import { listProducts } from "../api/products";
import { listSalesReps } from "../api/salesReps";
import { createOrder } from "../api/orders";
import { useTheme } from "../context/ThemeContext";
import { getThemeColors } from "../utils/themeColors";

function displayCustomerType(type) {
  if (type === "route") return "Region Customer";
  if (type === "normal") return "Normal Customer";
  return type || "Unknown";
}

export default function CreateOrder() {
  const nav = useNavigate();
  const { isDark } = useTheme();
  const c = getThemeColors(isDark);

  // Form state
  const [orderType, setOrderType] = useState("normal");
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [salesRepId, setSalesRepId] = useState("");
  const [notes, setNotes] = useState("");

  // Data state
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [salesReps, setSalesReps] = useState([]);
  const [items, setItems] = useState([]);

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    setErr("");
    setLoading(true);

    try {
      const [custData, prodData, repData] = await Promise.all([
        listCustomers(),
        listProducts(),
        listSalesReps(),
      ]);

      setCustomers(Array.isArray(custData.data) ? custData.data : []);
      setProducts(Array.isArray(prodData.data) ? prodData.data : []);
      setSalesReps(Array.isArray(repData.data) ? repData.data : []);
    } catch (e) {
      setErr(e?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  function onSelectCustomer(id) {
    const parsedId = parseInt(id, 10);
    const cust = customers.find((c) => c.id === parsedId);

    if (!cust) {
      setCustomerId("");
      return;
    }

    setCustomerId(String(cust.id));
    setCustomerName(cust.name || "");
    setCustomerPhone(cust.phone || "");
    setOrderType(cust.customer_type || "normal");
    setSalesRepId(cust.sales_rep_id ? String(cust.sales_rep_id) : "");
  }

  function addItem(productId) {
    const parsedProductId = parseInt(productId, 10);
    const product = products.find((p) => p.id === parsedProductId);
    if (!product) return;

    const productPrice = parseFloat(
      product.price ?? product.retail_price ?? product.selling_price ?? 0
    );

    const existingItem = items.find((i) => i.product_id === parsedProductId);

    if (existingItem) {
      setItems(
        items.map((i) =>
          i.product_id === parsedProductId
            ? {
                ...i,
                quantity: i.quantity + 1,
                total_price: (i.quantity + 1) * i.unit_price,
              }
            : i
        )
      );
    } else {
      setItems([
        ...items,
        {
          product_id: parsedProductId,
          product_name: product.name,
          sku: product.sku,
          quantity: 1,
          unit_price: productPrice,
          total_price: productPrice,
        },
      ]);
    }
  }

  function removeItem(productId) {
    setItems(items.filter((i) => i.product_id !== productId));
  }

  function updateQuantity(productId, newQty) {
    if (newQty <= 0) {
      removeItem(productId);
      return;
    }

    setItems(
      items.map((i) =>
        i.product_id === productId
          ? {
              ...i,
              quantity: newQty,
              total_price: newQty * i.unit_price,
            }
          : i
      )
    );
  }

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + item.total_price, 0),
    [items]
  );

  const selectedCustomer = useMemo(() => {
    if (!customerId) return null;
    return customers.find((c) => c.id === parseInt(customerId, 10)) || null;
  }, [customerId, customers]);

  const selectedSalesRep = useMemo(() => {
    if (!salesRepId) return null;
    return salesReps.find((rep) => rep.id === parseInt(salesRepId, 10)) || null;
  }, [salesRepId, salesReps]);

  async function onSubmit() {
    setErr("");

    if (!customerName.trim() || !customerPhone.trim()) {
      return setErr("Please fill in customer details");
    }

    if (items.length === 0) {
      return setErr("Please add at least one item");
    }

    setSubmitting(true);

    try {
      const orderData = {
        order_type: orderType,
        customer_id: customerId ? parseInt(customerId, 10) : null,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        sales_rep_id: salesRepId ? parseInt(salesRepId, 10) : null,
        total_amount: totalAmount,
        notes: notes.trim(),
        items: items,
      };

      const result = await createOrder(orderData);
      const newOrderId = result?.data?.id;

      if (!newOrderId) {
        throw new Error("Order was created but no order ID was returned");
      }

      nav(`/orders/${newOrderId}`);
    } catch (e) {
      setErr(e?.message || "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

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
    <div style={{ background: c.bg, minHeight: "100vh", padding: 20 }}>
      {/* HEADER */}
      <div
        style={{
          marginBottom: 30,
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
              color: c.text,
            }}
          >
            ➕ Create New Order
          </h1>
          <p style={{ margin: 0, color: c.textMuted, fontSize: 13 }}>
            Add items, assign a sales rep, and create a new order
          </p>
        </div>

        <button
          onClick={() => nav("/orders")}
          style={{
            padding: "10px 20px",
            background: c.buttonBg || c.card,
            color: c.text,
            border: `1px solid ${c.border}`,
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          ← Back
        </button>
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

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        {/* LEFT SIDE */}
        <div>
          {/* CUSTOMER DETAILS */}
          <div
            style={{
              background: c.card,
              padding: 20,
              borderRadius: 8,
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              marginBottom: 20,
              border: `1px solid ${c.border}`,
            }}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: 16,
                fontSize: 16,
                fontWeight: 700,
                color: c.text,
              }}
            >
              👤 Customer & Assignment
            </h3>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: c.textMuted,
                  marginBottom: 6,
                }}
              >
                Select Customer
              </label>
              <select
                value={customerId}
                onChange={(e) => onSelectCustomer(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: `1px solid ${c.border}`,
                  borderRadius: 6,
                  fontSize: 13,
                  boxSizing: "border-box",
                  cursor: "pointer",
                  background: c.inputBg,
                  color: c.text,
                }}
              >
                <option value="">-- Select a customer --</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} ({displayCustomerType(customer.customer_type)})
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    color: c.textMuted,
                    marginBottom: 6,
                  }}
                >
                  Customer Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer name"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: `1px solid ${c.border}`,
                    borderRadius: 6,
                    fontSize: 13,
                    boxSizing: "border-box",
                    background: c.inputBg,
                    color: c.text,
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    color: c.textMuted,
                    marginBottom: 6,
                  }}
                >
                  Phone
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Phone number"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: `1px solid ${c.border}`,
                    borderRadius: 6,
                    fontSize: 13,
                    boxSizing: "border-box",
                    background: c.inputBg,
                    color: c.text,
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    color: c.textMuted,
                    marginBottom: 6,
                  }}
                >
                  Order Type
                </label>
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: `1px solid ${c.border}`,
                    borderRadius: 6,
                    fontSize: 13,
                    boxSizing: "border-box",
                    cursor: "pointer",
                    background: c.inputBg,
                    color: c.text,
                  }}
                >
                  <option value="normal">💰 Normal Order</option>
                  <option value="route">🚗 Region Order</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    color: c.textMuted,
                    marginBottom: 6,
                  }}
                >
                  Sales Rep
                </label>
                <select
                  value={salesRepId}
                  onChange={(e) => setSalesRepId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: `1px solid ${c.border}`,
                    borderRadius: 6,
                    fontSize: 13,
                    boxSizing: "border-box",
                    cursor: "pointer",
                    background: c.inputBg,
                    color: c.text,
                  }}
                >
                  <option value="">-- Unassigned --</option>
                  {salesReps.map((rep) => (
                    <option key={rep.id} value={rep.id}>
                      {rep.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 8 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: c.textMuted,
                  marginBottom: 6,
                }}
              >
                Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any notes..."
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: `1px solid ${c.border}`,
                  borderRadius: 6,
                  fontSize: 13,
                  boxSizing: "border-box",
                  background: c.inputBg,
                  color: c.text,
                }}
              />
            </div>

            {(selectedCustomer || selectedSalesRep) && (
              <div
                style={{
                  marginTop: 14,
                  padding: 12,
                  borderRadius: 8,
                  background: isDark ? "rgba(102,126,234,0.12)" : "#eef2ff",
                  border: `1px solid ${isDark ? "rgba(102,126,234,0.25)" : "#dbeafe"}`,
                }}
              >
                <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 6 }}>
                  Order Context
                </div>
                {selectedCustomer && (
                  <div style={{ fontSize: 13, color: c.text, marginBottom: 4 }}>
                    Customer Type: <strong>{displayCustomerType(selectedCustomer.customer_type)}</strong>
                  </div>
                )}
                {selectedSalesRep && (
                  <div style={{ fontSize: 13, color: c.text }}>
                    Assigned Sales Rep: <strong>{selectedSalesRep.name}</strong>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ADD ITEMS */}
          <div
            style={{
              background: c.card,
              padding: 20,
              borderRadius: 8,
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              marginBottom: 20,
              border: `1px solid ${c.border}`,
            }}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: 16,
                fontSize: 16,
                fontWeight: 700,
                color: c.text,
              }}
            >
              📦 Add Items
            </h3>

            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: c.textMuted,
                marginBottom: 6,
              }}
            >
              Select Product
            </label>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  addItem(e.target.value);
                  e.target.value = "";
                }
              }}
              defaultValue=""
              style={{
                width: "100%",
                padding: "10px 12px",
                border: `1px solid ${c.border}`,
                borderRadius: 6,
                fontSize: 13,
                boxSizing: "border-box",
                cursor: "pointer",
                marginBottom: 12,
                background: c.inputBg,
                color: c.text,
              }}
            >
              <option value="">-- Select a product --</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} - KES{" "}
                  {parseFloat(
                    product.price ?? product.retail_price ?? product.selling_price ?? 0
                  ).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </option>
              ))}
            </select>

            {items.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h4
                  style={{
                    marginTop: 0,
                    marginBottom: 12,
                    fontSize: 14,
                    fontWeight: 700,
                    color: c.text,
                  }}
                >
                  Order Items
                </h4>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: c.headerBg, borderBottom: `1px solid ${c.border}` }}>
                        <th
                          style={{
                            padding: 10,
                            textAlign: "left",
                            fontSize: 12,
                            fontWeight: 700,
                            color: c.textMuted,
                          }}
                        >
                          Product
                        </th>
                        <th
                          style={{
                            padding: 10,
                            textAlign: "right",
                            fontSize: 12,
                            fontWeight: 700,
                            color: c.textMuted,
                          }}
                        >
                          Price
                        </th>
                        <th
                          style={{
                            padding: 10,
                            textAlign: "center",
                            fontSize: 12,
                            fontWeight: 700,
                            color: c.textMuted,
                          }}
                        >
                          Qty
                        </th>
                        <th
                          style={{
                            padding: 10,
                            textAlign: "right",
                            fontSize: 12,
                            fontWeight: 700,
                            color: c.textMuted,
                          }}
                        >
                          Total
                        </th>
                        <th
                          style={{
                            padding: 10,
                            textAlign: "center",
                            fontSize: 12,
                            fontWeight: 700,
                            color: c.textMuted,
                          }}
                        >
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr
                          key={idx}
                          style={{
                            borderBottom: `1px solid ${c.borderLight}`,
                            background: idx % 2 === 0 ? c.rowBg1 : c.rowBg2,
                          }}
                        >
                          <td style={{ padding: 10, fontSize: 12, color: c.text, fontWeight: 600 }}>
                            {item.product_name}
                          </td>
                          <td
                            style={{
                              padding: 10,
                              textAlign: "right",
                              fontSize: 12,
                              color: "#667eea",
                              fontWeight: 600,
                            }}
                          >
                            KES{" "}
                            {parseFloat(item.unit_price).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td style={{ padding: 10, textAlign: "center" }}>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                updateQuantity(item.product_id, parseInt(e.target.value, 10) || 1)
                              }
                              min="1"
                              style={{
                                width: 56,
                                padding: "6px 8px",
                                border: `1px solid ${c.border}`,
                                borderRadius: 4,
                                fontSize: 12,
                                textAlign: "center",
                                background: c.inputBg,
                                color: c.text,
                              }}
                            />
                          </td>
                          <td
                            style={{
                              padding: 10,
                              textAlign: "right",
                              fontSize: 12,
                              color: c.text,
                              fontWeight: 600,
                            }}
                          >
                            KES{" "}
                            {parseFloat(item.total_price).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td style={{ padding: 10, textAlign: "center" }}>
                            <button
                              onClick={() => removeItem(item.product_id)}
                              style={{
                                padding: "4px 8px",
                                background: "#dc3545",
                                color: "white",
                                border: "none",
                                borderRadius: 4,
                                cursor: "pointer",
                                fontSize: 11,
                                fontWeight: 600,
                              }}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div>
          <div
            style={{
              background: c.card,
              padding: 20,
              borderRadius: 8,
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              position: "sticky",
              top: 20,
              border: `1px solid ${c.border}`,
            }}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: 16,
                fontSize: 16,
                fontWeight: 700,
                color: c.text,
              }}
            >
              📊 Order Summary
            </h3>

            <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${c.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: c.textMuted, fontSize: 12 }}>Items Count:</span>
                <span style={{ fontWeight: 600, fontSize: 12, color: c.text }}>{items.length}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: c.textMuted, fontSize: 12 }}>Total Items:</span>
                <span style={{ fontWeight: 600, fontSize: 12, color: c.text }}>
                  {items.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: c.textMuted, fontSize: 12 }}>Customer:</span>
                <span style={{ fontWeight: 600, fontSize: 12, color: c.text }}>
                  {customerName || "—"}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: c.textMuted, fontSize: 12 }}>Sales Rep:</span>
                <span style={{ fontWeight: 600, fontSize: 12, color: c.text }}>
                  {selectedSalesRep?.name || "Unassigned"}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: c.textMuted, fontSize: 12 }}>Subtotal:</span>
                <span style={{ fontWeight: 600, fontSize: 12, color: c.text }}>
                  KES {(totalAmount * 0.9).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "2px solid #667eea" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: c.text }}>Total:</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: "#667eea" }}>
                  KES {totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <button
              onClick={onSubmit}
              disabled={submitting || items.length === 0}
              style={{
                width: "100%",
                padding: "12px 16px",
                background: items.length === 0 ? "#ccc" : "#28a745",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: items.length === 0 ? "not-allowed" : "pointer",
                fontSize: 14,
                fontWeight: 600,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (items.length > 0) e.currentTarget.style.background = "#218838";
              }}
              onMouseLeave={(e) => {
                if (items.length > 0) e.currentTarget.style.background = "#28a745";
              }}
            >
              {submitting ? "Creating..." : "✅ Create Order"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

