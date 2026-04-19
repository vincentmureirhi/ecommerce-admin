import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

function money(value) {
  return `KSh ${Number(value || 0).toLocaleString()}`;
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

function getStockStatus(stock, reorderLevel) {
  const qty = Number(stock || 0);
  const reorder = Number(reorderLevel || 0);

  if (qty <= 0) {
    return {
      label: "Out of stock",
      color: "#b91c1c",
      background: "#fef2f2",
    };
  }

  if (qty <= reorder) {
    return {
      label: "Low stock",
      color: "#b45309",
      background: "#fffbeb",
    };
  }

  return {
    label: "Healthy stock",
    color: "#047857",
    background: "#ecfdf5",
  };
}

function SummaryCard({ title, value, subtitle, accent, c }) {
  return (
    <div
      style={{
        background: c.card,
        border: `1px solid ${c.border}`,
        borderRadius: 18,
        padding: 16,
        boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: c.muted,
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 26,
          fontWeight: 900,
          color: accent || c.text,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 13,
          color: c.muted,
          lineHeight: 1.5,
        }}
      >
        {subtitle}
      </div>
    </div>
  );
}

function Field({ label, children, c }) {
  return (
    <div>
      <label
        style={{
          display: "block",
          marginBottom: 6,
          fontSize: 12,
          fontWeight: 800,
          color: c.muted,
          textTransform: "uppercase",
          letterSpacing: 0.4,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function selectStyle(c, isDark) {
  return {
    width: "100%",
    padding: "11px 12px",
    borderRadius: 12,
    border: `1px solid ${c.border}`,
    background: isDark ? "#0f172a" : "#f8fafc",
    color: c.text,
    fontSize: 13,
    boxSizing: "border-box",
  };
}

function buttonStyle(bg, color = "#fff") {
  return {
    padding: "10px 14px",
    background: bg,
    color,
    border: "none",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 13,
  };
}

export default function Products() {
  const { isDark } = useTheme();
  const { token } = useAuth();
  const navigate = useNavigate();

  const colors = {
    light: {
      bg: "#f8fafc",
      card: "#ffffff",
      text: "#0f172a",
      border: "#e2e8f0",
      muted: "#64748b",
      soft: "#f8fafc",
      input: "#f8fafc",
    },
    dark: {
      bg: "#020617",
      card: "#111827",
      text: "#f8fafc",
      border: "#334155",
      muted: "#94a3b8",
      soft: "#0f172a",
      input: "#0f172a",
    },
  };

  const c = isDark ? colors.dark : colors.light;

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  const [detailDrawer, setDetailDrawer] = useState(null);
  const [adjustStockModal, setAdjustStockModal] = useState(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(null);
  const [salesModal, setSalesModal] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  async function loadProducts() {
    const response = await fetch("/api/products", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();

    if (!response.ok || data?.success === false) {
      throw new Error(data?.message || data?.error || "Failed to load products.");
    }

    setProducts(data?.data || []);
  }

  async function loadCategories() {
    const response = await fetch("/api/categories", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();

    if (!response.ok || data?.success === false) {
      throw new Error(data?.message || data?.error || "Failed to load categories.");
    }

    setCategories(data?.data || []);
  }

  async function loadSuppliers() {
    const response = await fetch("/api/suppliers", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();

    if (!response.ok || data?.success === false) {
      throw new Error(data?.message || data?.error || "Failed to load suppliers.");
    }

    setSuppliers(data?.data || []);
  }

  async function refreshAll() {
    try {
      setLoading(true);
      setError("");
      await Promise.all([loadProducts(), loadCategories(), loadSuppliers()]);
    } catch (err) {
      setError(err?.message || "Failed to load product catalogue.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      refreshAll();
    }
  }, [token]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) => {
        return (
          String(p.name || "").toLowerCase().includes(q) ||
          String(p.sku || "").toLowerCase().includes(q) ||
          String(p.barcode || "").toLowerCase().includes(q)
        );
      });
    }

    if (categoryFilter !== "all") {
      result = result.filter((p) => String(p.category_id) === String(categoryFilter));
    }

    if (supplierFilter !== "all") {
      result = result.filter((p) => String(p.department_id) === String(supplierFilter));
    }

    if (stockFilter !== "all") {
      result = result.filter((p) => {
        const stock = Number(p.current_stock || 0);
        const reorder = Number(p.reorder_level || 0);

        if (stockFilter === "healthy") return stock > reorder;
        if (stockFilter === "low") return stock > 0 && stock <= reorder;
        if (stockFilter === "out") return stock <= 0;
        return true;
      });
    }

    if (activeFilter !== "all") {
      result = result.filter((p) => Boolean(p.is_active) === (activeFilter === "active"));
    }

    result.sort((a, b) => {
      if (sortBy === "name") {
        return String(a.name || "").localeCompare(String(b.name || ""));
      }

      if (sortBy === "price-high") {
        return Number(b.retail_price || 0) - Number(a.retail_price || 0);
      }

      if (sortBy === "price-low") {
        return Number(a.retail_price || 0) - Number(b.retail_price || 0);
      }

      if (sortBy === "stock-high") {
        return Number(b.current_stock || 0) - Number(a.current_stock || 0);
      }

      if (sortBy === "stock-low") {
        return Number(a.current_stock || 0) - Number(b.current_stock || 0);
      }

      if (sortBy === "updated") {
        return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
      }

      return 0;
    });

    return result;
  }, [products, search, categoryFilter, supplierFilter, stockFilter, activeFilter, sortBy]);

  const metrics = useMemo(() => {
    const totalProducts = products.length;
    const activeProducts = products.filter((p) => p.is_active).length;
    const lowStockCount = products.filter((p) => {
      const stock = Number(p.current_stock || 0);
      const reorder = Number(p.reorder_level || 0);
      return stock > 0 && stock <= reorder;
    }).length;
    const outOfStockCount = products.filter((p) => Number(p.current_stock || 0) <= 0).length;
    const inventoryValue = products.reduce(
      (sum, p) => sum + Number(p.current_stock || 0) * Number(p.cost_price || 0),
      0
    );

    return {
      totalProducts,
      activeProducts,
      lowStockCount,
      outOfStockCount,
      inventoryValue,
    };
  }, [products]);

  function getCategoryName(id) {
    return categories.find((item) => String(item.id) === String(id))?.name || "—";
  }

  function getSupplierName(id) {
    return suppliers.find((item) => String(item.id) === String(id))?.name || "—";
  }

  async function duplicateProduct(product) {
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...product,
          id: undefined,
          name: `${product.name} (Copy)`,
          sku: `${product.sku}-copy`,
          barcode: null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to duplicate product.");
      }

      await refreshAll();
      alert("Product duplicated successfully.");
    } catch (err) {
      alert(err?.message || "Failed to duplicate product.");
    }
  }

  async function archiveProduct(product) {
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...product,
          is_active: false,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to archive product.");
      }

      await refreshAll();
      alert("Product archived successfully.");
    } catch (err) {
      alert(err?.message || "Failed to archive product.");
    }
  }

  async function deleteProduct(product) {
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete product.");
      }

      setDeleteConfirmModal(null);
      await refreshAll();
      alert("Product deleted successfully.");
    } catch (err) {
      alert(err?.message || "Failed to delete product.");
    }
  }

  async function updateStock(product, newStock) {
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...product,
          current_stock: newStock,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update stock.");
      }

      setAdjustStockModal(null);
      await refreshAll();
      alert("Stock updated successfully.");
    } catch (err) {
      alert(err?.message || "Failed to update stock.");
    }
  }

  async function getSalesData(product) {
    try {
      const response = await fetch("/api/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok || data?.success === false) {
        throw new Error("Failed to load sales data.");
      }

      const orders = data?.data || [];
      const productOrders = orders.filter((o) => Number(o.product_id) === Number(product.id));

      return {
        unitsSold: productOrders.length,
        totalRevenue: productOrders.reduce(
          (sum, o) => sum + Number(o.total_amount || 0),
          0
        ),
        lastSold:
          productOrders.length > 0
            ? productOrders[productOrders.length - 1].created_at
            : null,
        averageOrderValue:
          productOrders.length > 0
            ? productOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) /
              productOrders.length
            : 0,
      };
    } catch (err) {
      return {
        unitsSold: 0,
        totalRevenue: 0,
        lastSold: null,
        averageOrderValue: 0,
      };
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: c.bg,
        padding: 16,
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gap: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1
              style={{
                margin: "0 0 6px 0",
                fontSize: 28,
                fontWeight: 900,
                color: c.text,
              }}
            >
              Products
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                color: c.muted,
                lineHeight: 1.6,
              }}
            >
              Manage your product catalogue, stock position and pricing without wrecking the phone display.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={refreshAll}
              style={buttonStyle(isDark ? "#334155" : "#e2e8f0", c.text)}
            >
              Refresh
            </button>

            <button
              type="button"
              onClick={() => navigate("/products/new")}
              style={buttonStyle("#2563eb")}
            >
              + New Product
            </button>
          </div>
        </div>

        {error ? (
          <div
            style={{
              background: isDark ? "rgba(127,29,29,0.22)" : "#fef2f2",
              border: `1px solid ${isDark ? "rgba(239,68,68,0.35)" : "#fecaca"}`,
              color: isDark ? "#fca5a5" : "#b91c1c",
              padding: 14,
              borderRadius: 16,
              fontWeight: 700,
            }}
          >
            {error}
          </div>
        ) : null}

        <div
          style={{
            display: "grid",
            gap: 14,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          <SummaryCard
            title="Total products"
            value={metrics.totalProducts}
            subtitle="All products in the catalogue"
            accent="#2563eb"
            c={c}
          />
          <SummaryCard
            title="Active products"
            value={metrics.activeProducts}
            subtitle="Products currently available for use"
            accent="#047857"
            c={c}
          />
          <SummaryCard
            title="Low stock items"
            value={metrics.lowStockCount}
            subtitle="Need restocking attention soon"
            accent="#b45309"
            c={c}
          />
          <SummaryCard
            title="Out of stock"
            value={metrics.outOfStockCount}
            subtitle="Unavailable right now"
            accent="#b91c1c"
            c={c}
          />
          <SummaryCard
            title="Inventory value"
            value={money(metrics.inventoryValue)}
            subtitle="Approximate cost-value on hand"
            accent="#7c3aed"
            c={c}
          />
        </div>

        <div
          style={{
            background: c.card,
            border: `1px solid ${c.border}`,
            borderRadius: 20,
            padding: 16,
            display: "grid",
            gap: 14,
          }}
        >
          <Field label="Search products" c={c}>
            <input
              type="text"
              placeholder="Search by product name, SKU or barcode"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 14,
                border: `1px solid ${c.border}`,
                background: c.input,
                color: c.text,
                fontSize: 14,
                boxSizing: "border-box",
              }}
            />
          </Field>

          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            }}
          >
            <Field label="Category" c={c}>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={selectStyle(c, isDark)}
              >
                <option value="all">All categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Supplier" c={c}>
              <select
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                style={selectStyle(c, isDark)}
              >
                <option value="all">All suppliers</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Stock" c={c}>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                style={selectStyle(c, isDark)}
              >
                <option value="all">All stock states</option>
                <option value="healthy">Healthy stock</option>
                <option value="low">Low stock</option>
                <option value="out">Out of stock</option>
              </select>
            </Field>

            <Field label="Status" c={c}>
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                style={selectStyle(c, isDark)}
              >
                <option value="all">All statuses</option>
                <option value="active">Active only</option>
                <option value="inactive">Inactive only</option>
              </select>
            </Field>

            <Field label="Sort by" c={c}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={selectStyle(c, isDark)}
              >
                <option value="name">Name A–Z</option>
                <option value="price-high">Retail price high to low</option>
                <option value="price-low">Retail price low to high</option>
                <option value="stock-high">Stock high to low</option>
                <option value="stock-low">Stock low to high</option>
                <option value="updated">Most recently updated</option>
              </select>
            </Field>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div
              style={{
                fontSize: 13,
                color: c.muted,
                lineHeight: 1.6,
              }}
            >
              Showing <strong>{filteredProducts.length}</strong> matched product
              {filteredProducts.length === 1 ? "" : "s"} out of <strong>{products.length}</strong>.
            </div>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategoryFilter("all");
                setSupplierFilter("all");
                setStockFilter("all");
                setActiveFilter("all");
                setSortBy("name");
              }}
              style={buttonStyle(isDark ? "#334155" : "#e2e8f0", c.text)}
            >
              Reset filters
            </button>
          </div>
        </div>

        {loading ? (
          <div
            style={{
              background: c.card,
              border: `1px solid ${c.border}`,
              borderRadius: 20,
              padding: 20,
              color: c.muted,
            }}
          >
            Loading products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div
            style={{
              background: c.card,
              border: `1px solid ${c.border}`,
              borderRadius: 20,
              padding: 24,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 900, color: c.text, marginBottom: 6 }}>
              No products found
            </div>
            <div style={{ color: c.muted, marginBottom: 14 }}>
              Adjust the filters or add a new product.
            </div>
            <button
              type="button"
              onClick={() => navigate("/products/new")}
              style={buttonStyle("#2563eb")}
            >
              + Add product
            </button>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gap: 14,
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              }}
            >
              {filteredProducts.map((product) => {
                const stock = getStockStatus(product.current_stock, product.reorder_level);
                const retail = Number(product.retail_price || 0);
                const cost = Number(product.cost_price || 0);
                const margin =
                  retail > 0 ? (((retail - cost) / retail) * 100).toFixed(1) : "0.0";

                return (
                  <div
                    key={product.id}
                    style={{
                      background: c.card,
                      border: `1px solid ${c.border}`,
                      borderRadius: 20,
                      padding: 16,
                      display: "grid",
                      gap: 14,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "flex-start",
                      }}
                    >
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          onClick={() => setImagePreview(product.image_url)}
                          style={{
                            width: 78,
                            height: 78,
                            borderRadius: 16,
                            objectFit: "cover",
                            cursor: "pointer",
                            border: `1px solid ${c.border}`,
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 78,
                            height: 78,
                            borderRadius: 16,
                            background: c.soft,
                            border: `1px solid ${c.border}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: c.muted,
                            fontSize: 12,
                            fontWeight: 800,
                            textAlign: "center",
                            flexShrink: 0,
                            padding: 8,
                          }}
                        >
                          No image
                        </div>
                      )}

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: 900,
                            color: c.text,
                            lineHeight: 1.3,
                            marginBottom: 4,
                            wordBreak: "break-word",
                          }}
                        >
                          {product.name}
                        </div>

                        <div style={{ fontSize: 13, color: c.muted, marginBottom: 4 }}>
                          SKU: {product.sku || "—"}
                        </div>

                        <div style={{ fontSize: 13, color: c.muted }}>
                          Category: {getCategoryName(product.category_id)}
                        </div>

                        <div style={{ fontSize: 13, color: c.muted, marginTop: 2 }}>
                          Supplier: {getSupplierName(product.department_id)}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gap: 12,
                        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                      }}
                    >
                      <InfoBlock label="Retail price" value={money(product.retail_price)} c={c} />
                      <InfoBlock label="Cost price" value={money(product.cost_price)} c={c} />
                      <InfoBlock label="Margin" value={`${margin}%`} c={c} />
                      <InfoBlock label="Stock on hand" value={String(product.current_stock || 0)} c={c} />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          padding: "7px 10px",
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 800,
                          color: stock.color,
                          background: stock.background,
                        }}
                      >
                        {stock.label}
                      </span>

                      <span
                        style={{
                          display: "inline-block",
                          padding: "7px 10px",
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 800,
                          color: product.is_active ? "#047857" : "#b91c1c",
                          background: product.is_active ? "#ecfdf5" : "#fef2f2",
                        }}
                      >
                        {product.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        color: c.muted,
                      }}
                    >
                      Updated: {formatDate(product.updated_at)}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => navigate(`/products/${product.id}/edit`)}
                        style={buttonStyle("#2563eb")}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => setDetailDrawer(product)}
                        style={buttonStyle(isDark ? "#334155" : "#e2e8f0", c.text)}
                      >
                        View
                      </button>

                      <button
                        type="button"
                        onClick={() => setAdjustStockModal(product)}
                        style={buttonStyle("#0f766e")}
                      >
                        Stock
                      </button>

                      <button
                        type="button"
                        onClick={() => setSalesModal(product)}
                        style={buttonStyle("#7c3aed")}
                      >
                        Sales
                      </button>

                      <button
                        type="button"
                        onClick={() => duplicateProduct(product)}
                        style={buttonStyle("#475569")}
                      >
                        Duplicate
                      </button>

                      <button
                        type="button"
                        onClick={() => archiveProduct(product)}
                        style={buttonStyle("#b45309")}
                      >
                        Archive
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteConfirmModal(product)}
                        style={buttonStyle("#b91c1c")}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                background: c.card,
                border: `1px solid ${c.border}`,
                borderRadius: 20,
                overflowX: "auto",
              }}
            >
              <table
                className="allow-cell-wrap"
                style={{
                  width: "100%",
                  minWidth: 940,
                  borderCollapse: "collapse",
                  fontSize: 13,
                }}
              >
                <thead>
                  <tr style={{ borderBottom: `1px solid ${c.border}` }}>
                    <th style={thStyle(c)}>Product</th>
                    <th style={thStyle(c)}>SKU</th>
                    <th style={thStyle(c)}>Category</th>
                    <th style={thStyle(c)}>Supplier</th>
                    <th style={{ ...thStyle(c), textAlign: "right" }}>Retail</th>
                    <th style={{ ...thStyle(c), textAlign: "right" }}>Cost</th>
                    <th style={{ ...thStyle(c), textAlign: "right" }}>Stock</th>
                    <th style={thStyle(c)}>Status</th>
                    <th style={thStyle(c)}>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product, idx) => {
                    const stock = getStockStatus(product.current_stock, product.reorder_level);

                    return (
                      <tr
                        key={`table-${product.id}`}
                        style={{
                          borderBottom: `1px solid ${c.border}`,
                          background:
                            idx % 2 === 0
                              ? "transparent"
                              : isDark
                              ? "rgba(255,255,255,0.01)"
                              : "#fafafa",
                        }}
                      >
                        <td style={tdPrimary(c)}>{product.name || "—"}</td>
                        <td style={tdMuted(c)}>{product.sku || "—"}</td>
                        <td style={tdMuted(c)}>{getCategoryName(product.category_id)}</td>
                        <td style={tdMuted(c)}>{getSupplierName(product.department_id)}</td>
                        <td style={{ ...tdPrimary(c), textAlign: "right" }}>{money(product.retail_price)}</td>
                        <td style={{ ...tdMuted(c), textAlign: "right" }}>{money(product.cost_price)}</td>
                        <td style={{ ...tdPrimary(c), textAlign: "right" }}>{product.current_stock || 0}</td>
                        <td style={tdBase}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "6px 9px",
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 800,
                              color: stock.color,
                              background: stock.background,
                            }}
                          >
                            {stock.label}
                          </span>
                        </td>
                        <td style={tdMuted(c)}>{formatDate(product.updated_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {imagePreview ? (
          <ImagePreviewModal src={imagePreview} onClose={() => setImagePreview(null)} />
        ) : null}

        {detailDrawer ? (
          <ProductDetailDrawer
            product={detailDrawer}
            categories={categories}
            suppliers={suppliers}
            onClose={() => setDetailDrawer(null)}
            c={c}
            isDark={isDark}
            navigate={navigate}
          />
        ) : null}

        {adjustStockModal ? (
          <AdjustStockModal
            product={adjustStockModal}
            onClose={() => setAdjustStockModal(null)}
            onSave={updateStock}
            c={c}
            isDark={isDark}
          />
        ) : null}

        {deleteConfirmModal ? (
          <DeleteConfirmModal
            product={deleteConfirmModal}
            onClose={() => setDeleteConfirmModal(null)}
            onConfirm={deleteProduct}
            c={c}
            isDark={isDark}
          />
        ) : null}

        {salesModal ? (
          <SalesDataModal
            product={salesModal}
            onClose={() => setSalesModal(null)}
            getSalesData={getSalesData}
            c={c}
            isDark={isDark}
          />
        ) : null}
      </div>
    </div>
  );
}

function InfoBlock({ label, value, c }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 800, color: c.muted, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 800, color: c.text, wordBreak: "break-word" }}>
        {value}
      </div>
    </div>
  );
}

const tdBase = {
  padding: 12,
  fontSize: 13,
  verticalAlign: "top",
};

function tdPrimary(c) {
  return {
    ...tdBase,
    color: c.text,
    fontWeight: 700,
  };
}

function tdMuted(c) {
  return {
    ...tdBase,
    color: c.muted,
  };
}

function thStyle(c) {
  return {
    padding: 12,
    textAlign: "left",
    fontSize: 12,
    fontWeight: 800,
    color: c.muted,
  };
}

function ModalShell({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(2,6,23,0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
        zIndex: 3000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 560,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function ImagePreviewModal({ src, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.84)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
        zIndex: 4000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          maxWidth: "96vw",
          maxHeight: "92vh",
        }}
      >
        <img
          src={src}
          alt="Preview"
          style={{
            display: "block",
            maxWidth: "100%",
            maxHeight: "92vh",
            borderRadius: 18,
          }}
        />

        <button
          type="button"
          onClick={onClose}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "none",
            background: "rgba(0,0,0,0.7)",
            color: "#fff",
            fontWeight: 900,
            fontSize: 22,
            cursor: "pointer",
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

function ProductDetailDrawer({ product, categories, suppliers, onClose, c, isDark, navigate }) {
  const categoryName =
    categories.find((cat) => String(cat.id) === String(product.category_id))?.name || "—";
  const supplierName =
    suppliers.find((supplier) => String(supplier.id) === String(product.department_id))?.name || "—";
  const stock = getStockStatus(product.current_stock, product.reorder_level);

  return (
    <ModalShell onClose={onClose}>
      <div
        style={{
          background: c.card,
          border: `1px solid ${c.border}`,
          borderRadius: 22,
          padding: 18,
          display: "grid",
          gap: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "flex-start",
          }}
        >
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: c.text, marginBottom: 4 }}>
              {product.name}
            </div>
            <div style={{ color: c.muted, fontSize: 13 }}>SKU: {product.sku || "—"}</div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={buttonStyle(isDark ? "#334155" : "#e2e8f0", c.text)}
          >
            Close
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gap: 14,
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          }}
        >
          <InfoBlock label="Category" value={categoryName} c={c} />
          <InfoBlock label="Supplier" value={supplierName} c={c} />
          <InfoBlock label="Retail price" value={money(product.retail_price)} c={c} />
          <InfoBlock label="Wholesale price" value={money(product.wholesale_price)} c={c} />
          <InfoBlock label="Cost price" value={money(product.cost_price)} c={c} />
          <InfoBlock label="Current stock" value={String(product.current_stock || 0)} c={c} />
          <InfoBlock label="Reorder level" value={String(product.reorder_level || 0)} c={c} />
          <InfoBlock label="Stock status" value={stock.label} c={c} />
          <InfoBlock label="Barcode" value={product.barcode || "—"} c={c} />
          <InfoBlock label="Updated" value={formatDate(product.updated_at)} c={c} />
        </div>

        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: c.muted, marginBottom: 6 }}>
            Description
          </div>
          <div
            style={{
              padding: 14,
              borderRadius: 14,
              border: `1px solid ${c.border}`,
              background: isDark ? "#0f172a" : "#f8fafc",
              color: c.text,
              lineHeight: 1.7,
            }}
          >
            {product.description || "No description provided."}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => navigate(`/products/${product.id}/edit`)}
            style={buttonStyle("#2563eb")}
          >
            Edit product
          </button>
          <button
            type="button"
            onClick={onClose}
            style={buttonStyle(isDark ? "#334155" : "#e2e8f0", c.text)}
          >
            Done
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function AdjustStockModal({ product, onClose, onSave, c, isDark }) {
  const [quantity, setQuantity] = useState(Number(product.current_stock || 0));

  return (
    <ModalShell onClose={onClose}>
      <div
        style={{
          background: c.card,
          border: `1px solid ${c.border}`,
          borderRadius: 22,
          padding: 18,
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 900, color: c.text, marginBottom: 8 }}>
          Adjust stock
        </div>
        <div style={{ color: c.muted, marginBottom: 14, lineHeight: 1.6 }}>
          Product: <strong style={{ color: c.text }}>{product.name}</strong>
        </div>

        <Field label="New stock quantity" c={c}>
          <input
            type="number"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value || 0))}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 14,
              border: `1px solid ${c.border}`,
              background: isDark ? "#0f172a" : "#f8fafc",
              color: c.text,
              fontSize: 14,
              boxSizing: "border-box",
            }}
          />
        </Field>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
          <button
            type="button"
            onClick={() => onSave(product, quantity)}
            style={buttonStyle("#0f766e")}
          >
            Save stock
          </button>
          <button
            type="button"
            onClick={onClose}
            style={buttonStyle(isDark ? "#334155" : "#e2e8f0", c.text)}
          >
            Cancel
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function DeleteConfirmModal({ product, onClose, onConfirm, c, isDark }) {
  return (
    <ModalShell onClose={onClose}>
      <div
        style={{
          background: c.card,
          border: `1px solid ${c.border}`,
          borderRadius: 22,
          padding: 18,
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 900, color: c.text, marginBottom: 8 }}>
          Delete product
        </div>
        <div style={{ color: c.muted, lineHeight: 1.7, marginBottom: 16 }}>
          You are about to delete <strong style={{ color: c.text }}>{product.name}</strong>. This action should only be used if you are sure.
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => onConfirm(product)}
            style={buttonStyle("#b91c1c")}
          >
            Confirm delete
          </button>
          <button
            type="button"
            onClick={onClose}
            style={buttonStyle(isDark ? "#334155" : "#e2e8f0", c.text)}
          >
            Cancel
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function SalesDataModal({ product, onClose, getSalesData, c, isDark }) {
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState({
    unitsSold: 0,
    totalRevenue: 0,
    lastSold: null,
    averageOrderValue: 0,
  });

  useEffect(() => {
    let mounted = true;

    async function loadSales() {
      setLoading(true);
      const result = await getSalesData(product);
      if (mounted) {
        setSales(result);
        setLoading(false);
      }
    }

    loadSales();
    return () => {
      mounted = false;
    };
  }, [product, getSalesData]);

  return (
    <ModalShell onClose={onClose}>
      <div
        style={{
          background: c.card,
          border: `1px solid ${c.border}`,
          borderRadius: 22,
          padding: 18,
          display: "grid",
          gap: 16,
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 900, color: c.text }}>
          Product sales snapshot
        </div>
        <div style={{ color: c.muted }}>
          Product: <strong style={{ color: c.text }}>{product.name}</strong>
        </div>

        {loading ? (
          <div style={{ color: c.muted }}>Loading sales data...</div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: 14,
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            }}
          >
            <SummaryCard
              title="Units sold"
              value={sales.unitsSold}
              subtitle="Orders linked to this product"
              accent="#2563eb"
              c={c}
            />
            <SummaryCard
              title="Total revenue"
              value={money(sales.totalRevenue)}
              subtitle="Revenue generated"
              accent="#047857"
              c={c}
            />
            <SummaryCard
              title="Average order value"
              value={money(sales.averageOrderValue)}
              subtitle="Average per matching order"
              accent="#7c3aed"
              c={c}
            />
            <SummaryCard
              title="Last sold"
              value={sales.lastSold ? formatDate(sales.lastSold) : "—"}
              subtitle="Most recent matching order"
              accent="#b45309"
              c={c}
            />
          </div>
        )}

        <div>
          <button
            type="button"
            onClick={onClose}
            style={buttonStyle(isDark ? "#334155" : "#e2e8f0", c.text)}
          >
            Close
          </button>
        </div>
      </div>
    </ModalShell>
  );
}