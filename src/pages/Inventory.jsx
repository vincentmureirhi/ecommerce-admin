import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { getThemeColors } from "../utils/themeColors";
import {
  getInventoryAnalytics,
  updateInventoryReorderLevel,
} from "../api/inventory";

function SummaryCard({ title, value, subtitle, c }) {
  return (
    <div
      style={{
        background: c.card,
        border: `1px solid ${c.border}`,
        borderRadius: 14,
        padding: 18,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        minHeight: 118,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: c.textMuted, marginBottom: 10 }}>
        {title}
      </div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 800,
          color: c.text,
          lineHeight: 1.15,
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 12,
          color: c.textMuted,
          marginTop: 10,
          lineHeight: 1.4,
        }}
      >
        {subtitle}
      </div>
    </div>
  );
}

function SectionCard({ title, rightAction, children, c }) {
  return (
    <div
      style={{
        background: c.card,
        borderRadius: 14,
        border: `1px solid ${c.border}`,
        padding: 18,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        <h3
          style={{
            margin: 0,
            color: c.text,
            fontSize: 17,
            fontWeight: 800,
          }}
        >
          {title}
        </h3>
        {rightAction}
      </div>
      {children}
    </div>
  );
}

function Badge({ badge }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "5px 9px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        background: badge.bg,
        color: badge.color,
        lineHeight: 1.2,
        whiteSpace: "nowrap",
      }}
    >
      {badge.label}
    </span>
  );
}

function DrawerStat({ label, value, c }) {
  return (
    <div
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: 12,
        padding: 14,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: c.textMuted, marginBottom: 8 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 800,
          color: c.text,
          lineHeight: 1.2,
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function DetailRow({ label, value, c }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "140px 1fr",
        gap: 12,
        padding: "10px 0",
        borderBottom: `1px solid ${c.borderLight || c.border}`,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: c.textMuted }}>{label}</div>
      <div
        style={{
          fontSize: 13,
          color: c.text,
          lineHeight: 1.45,
          wordBreak: "break-word",
        }}
      >
        {value || "—"}
      </div>
    </div>
  );
}

function MiniListRow({ leftTop, leftBottom, rightTop, rightBottom, c }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 14,
        paddingBottom: 12,
        borderBottom: `1px solid ${c.borderLight || c.border}`,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontWeight: 700,
            color: c.text,
            fontSize: 13,
            lineHeight: 1.35,
            wordBreak: "break-word",
          }}
        >
          {leftTop}
        </div>
        <div style={{ fontSize: 12, color: c.textMuted, marginTop: 4 }}>{leftBottom}</div>
      </div>

      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontWeight: 700, color: c.text, fontSize: 13 }}>{rightTop}</div>
        <div style={{ fontSize: 12, color: c.textMuted, marginTop: 4 }}>{rightBottom}</div>
      </div>
    </div>
  );
}

function formatCurrency(value) {
  return `KES ${Number(value || 0).toLocaleString()}`;
}

function formatDate(value) {
  if (!value) return "Never sold";
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getDaysSinceBadge(days, isDark) {
  if (days === null || days === undefined) {
    return {
      label: "Never sold",
      bg: isDark ? "rgba(220, 53, 69, 0.2)" : "#f8d7da",
      color: isDark ? "#ff6b6b" : "#721c24",
    };
  }

  if (days >= 60) {
    return {
      label: `${days} days`,
      bg: isDark ? "rgba(220, 53, 69, 0.2)" : "#f8d7da",
      color: isDark ? "#ff6b6b" : "#721c24",
    };
  }

  if (days >= 30) {
    return {
      label: `${days} days`,
      bg: isDark ? "rgba(245, 158, 11, 0.2)" : "#fff3cd",
      color: isDark ? "#fbbf24" : "#856404",
    };
  }

  return {
    label: `${days} days`,
    bg: isDark ? "rgba(16, 185, 129, 0.2)" : "#d4edda",
    color: isDark ? "#4ade80" : "#155724",
  };
}

function getProfitTextStyle(value, isDark) {
  const n = Number(value || 0);

  if (n < 0) {
    return {
      color: isDark ? "#ff6b6b" : "#b42318",
      fontWeight: 800,
    };
  }

  if (n === 0) {
    return {
      color: isDark ? "#cbd5e1" : "#64748b",
      fontWeight: 700,
    };
  }

  return {
    color: isDark ? "#4ade80" : "#166534",
    fontWeight: 800,
  };
}

function getStockBadge(status, isDark) {
  switch (status) {
    case "out_of_stock":
      return {
        label: "Out of Stock",
        bg: isDark ? "rgba(220, 53, 69, 0.2)" : "#f8d7da",
        color: isDark ? "#ff6b6b" : "#721c24",
      };
    case "reorder_now":
      return {
        label: "Reorder Now",
        bg: isDark ? "rgba(245, 158, 11, 0.2)" : "#fff3cd",
        color: isDark ? "#fbbf24" : "#856404",
      };
    case "low_stock":
      return {
        label: "Low Stock",
        bg: isDark ? "rgba(245, 158, 11, 0.2)" : "#fff8e1",
        color: isDark ? "#fbbf24" : "#d97706",
      };
    default:
      return {
        label: "Healthy",
        bg: isDark ? "rgba(16, 185, 129, 0.2)" : "#d4edda",
        color: isDark ? "#4ade80" : "#155724",
      };
  }
}

function getMovementBadge(status, isDark) {
  switch (status) {
    case "fast_moving":
      return {
        label: "Fast Moving",
        bg: isDark ? "rgba(59, 130, 246, 0.2)" : "#e3f2fd",
        color: isDark ? "#93c5fd" : "#1d4ed8",
      };
    case "slow_moving":
      return {
        label: "Slow Moving",
        bg: isDark ? "rgba(245, 158, 11, 0.2)" : "#fff3cd",
        color: isDark ? "#fbbf24" : "#856404",
      };
    case "dead_stock":
      return {
        label: "Dead Stock",
        bg: isDark ? "rgba(220, 53, 69, 0.2)" : "#f8d7da",
        color: isDark ? "#ff6b6b" : "#721c24",
      };
    default:
      return {
        label: "Steady",
        bg: isDark ? "rgba(16, 185, 129, 0.2)" : "#e8f5e9",
        color: isDark ? "#4ade80" : "#166534",
      };
  }
}

function getChannelBadge(channel, isDark) {
  if (channel === "region_customer") {
    return {
      label: "Region Customer",
      bg: isDark ? "rgba(102, 126, 234, 0.2)" : "#eef2ff",
      color: "#667eea",
    };
  }

  if (channel === "normal_customer") {
    return {
      label: "Normal Customer",
      bg: isDark ? "rgba(16, 185, 129, 0.2)" : "#ecfdf5",
      color: isDark ? "#4ade80" : "#16a34a",
    };
  }

  return {
    label: "Unknown",
    bg: isDark ? "rgba(148, 163, 184, 0.2)" : "#f1f5f9",
    color: isDark ? "#cbd5e1" : "#475569",
  };
}

export default function Inventory() {
  const { isDark } = useTheme();
  const c = getThemeColors(isDark);

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [bestSellers, setBestSellers] = useState([]);
  const [slowMoving, setSlowMoving] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [movementFilter, setMovementFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [reorderDraft, setReorderDraft] = useState("");
  const [savingReorder, setSavingReorder] = useState(false);
  const [saveErr, setSaveErr] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  async function load() {
    setErr("");
    setLoading(true);

    try {
      const res = await getInventoryAnalytics({ profit_type: "retail" });
      const data = res?.data || {};

      setRows(Array.isArray(data.products) ? data.products : []);
      setSummary(data.summary || {});
      setBestSellers(Array.isArray(data.best_sellers) ? data.best_sellers : []);
      setSlowMoving(Array.isArray(data.slow_moving) ? data.slow_moving : []);
      setCategories(Array.isArray(data.categories) ? data.categories : []);
      setSuppliers(Array.isArray(data.suppliers) ? data.suppliers : []);
    } catch (e) {
      setErr(e?.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      setReorderDraft(String(selectedProduct.reorder_level ?? 0));
      setSaveErr("");
      setSaveSuccess("");
    }
  }, [selectedProduct]);

  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();

    return rows.filter((p) => {
      const matchesSearch =
        !s ||
        p.product_name?.toLowerCase().includes(s) ||
        p.sku?.toLowerCase().includes(s);

      const matchesStock = !stockFilter || p.stock_status === stockFilter;
      const matchesMovement = !movementFilter || p.movement_status === movementFilter;
      const matchesCategory = !categoryFilter || String(p.category_id) === categoryFilter;
      const matchesSupplier = !supplierFilter || String(p.supplier_id) === supplierFilter;
      const matchesChannel = !channelFilter || (p.last_sale_channel || "unknown") === channelFilter;

      return (
        matchesSearch &&
        matchesStock &&
        matchesMovement &&
        matchesCategory &&
        matchesSupplier &&
        matchesChannel
      );
    });
  }, [rows, search, stockFilter, movementFilter, categoryFilter, supplierFilter, channelFilter]);

  const clearFilters = () => {
    setSearch("");
    setStockFilter("");
    setMovementFilter("");
    setCategoryFilter("");
    setSupplierFilter("");
    setChannelFilter("");
  };

  async function handleSaveReorderLevel() {
    if (!selectedProduct) return;

    setSaveErr("");
    setSaveSuccess("");

    const parsed = Number(reorderDraft);

    if (!Number.isInteger(parsed) || parsed < 0) {
      setSaveErr("Reorder level must be a non-negative whole number");
      return;
    }

    try {
      setSavingReorder(true);

      await updateInventoryReorderLevel(selectedProduct.id, parsed);

      await load();

      setSelectedProduct((prev) =>
        prev
          ? {
              ...prev,
              reorder_level: parsed,
              stock_status:
                prev.current_stock <= 0
                  ? "out_of_stock"
                  : parsed > 0 && prev.current_stock <= parsed
                  ? "reorder_now"
                  : prev.current_stock <= 10
                  ? "low_stock"
                  : "healthy",
            }
          : prev
      );

      setSaveSuccess("Reorder level updated");
    } catch (e) {
      setSaveErr(e?.message || "Failed to update reorder level");
    } finally {
      setSavingReorder(false);
    }
  }

  if (loading) {
    return (
      <div
        style={{
          background: c.bg,
          minHeight: "100vh",
          padding: "20px",
          textAlign: "center",
          color: c.textMuted,
        }}
      >
        Loading inventory...
      </div>
    );
  }

  return (
    <>
      <div style={{ background: c.bg, minHeight: "100vh", padding: "20px" }}>
        <div
          style={{
            marginBottom: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ maxWidth: 780 }}>
            <h1
              style={{
                marginTop: 0,
                marginBottom: 6,
                fontSize: 30,
                fontWeight: 800,
                color: c.text,
                lineHeight: 1.15,
              }}
            >
              📦 Inventory Command Center
            </h1>
            <p
              style={{
                margin: 0,
                color: c.textMuted,
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              Serious stock intelligence, product movement, last-sale visibility, and business-grade inventory control.
            </p>
          </div>

          <button
            onClick={load}
            style={{
              padding: "10px 16px",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              background: "#0ea5e9",
              color: "white",
              fontWeight: 700,
              fontSize: 13,
              flexShrink: 0,
            }}
          >
            Refresh
          </button>
        </div>

        {err && (
          <div
            style={{
              background: isDark ? "rgba(220, 53, 69, 0.1)" : "#fee",
              color: isDark ? "#ff6b6b" : "#c33",
              padding: 12,
              borderRadius: 8,
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
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 14,
            marginBottom: 20,
          }}
        >
          <SummaryCard title="Products" value={summary.total_skus || 0} subtitle="Tracked SKUs" c={c} />
          <SummaryCard title="Units in Stock" value={summary.total_units_in_stock || 0} subtitle="All current stock" c={c} />
          <SummaryCard title="Stock Value" value={formatCurrency(summary.stock_value || 0)} subtitle="At cost price" c={c} />
          <SummaryCard title="Sold 7d" value={summary.total_units_sold_7d || 0} subtitle="Recent movement" c={c} />
          <SummaryCard title="Sold 30d" value={summary.total_units_sold_30d || 0} subtitle="Monthly movement" c={c} />
          <SummaryCard title="Low Stock" value={summary.low_stock_count || 0} subtitle="Needs attention" c={c} />
          <SummaryCard title="Out of Stock" value={summary.out_of_stock_count || 0} subtitle="Immediate action" c={c} />
          <SummaryCard title="Dead Stock" value={summary.dead_stock_count || 0} subtitle="Sleeping cash" c={c} />
        </div>

        <SectionCard
          title="Filters"
          rightAction={
            <button
              type="button"
              onClick={clearFilters}
              style={{
                padding: "8px 12px",
                border: `1px solid ${c.border}`,
                borderRadius: 8,
                cursor: "pointer",
                background: c.card,
                color: c.text,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              Clear filters
            </button>
          }
          c={c}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
            }}
          >
            <input
              type="text"
              placeholder="Search by product name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: `1px solid ${c.border}`,
                borderRadius: 8,
                fontSize: 13,
                boxSizing: "border-box",
                background: c.inputBg,
                color: c.text,
                minWidth: 0,
              }}
            />

            <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} style={filterStyle(c)}>
              <option value="">All Stock Status</option>
              <option value="healthy">Healthy</option>
              <option value="low_stock">Low Stock</option>
              <option value="reorder_now">Reorder Now</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>

            <select value={movementFilter} onChange={(e) => setMovementFilter(e.target.value)} style={filterStyle(c)}>
              <option value="">All Movement</option>
              <option value="fast_moving">Fast Moving</option>
              <option value="steady">Steady</option>
              <option value="slow_moving">Slow Moving</option>
              <option value="dead_stock">Dead Stock</option>
            </select>

            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={filterStyle(c)}>
              <option value="">All Categories</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>

            <select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)} style={filterStyle(c)}>
              <option value="">All Suppliers</option>
              {suppliers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>

            <select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)} style={filterStyle(c)}>
              <option value="">All Channels</option>
              <option value="region_customer">Region Customer</option>
              <option value="normal_customer">Normal Customer</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
        </SectionCard>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <SectionCard title="🔥 Best Sellers (30 days)" c={c}>
            {bestSellers.length === 0 ? (
              <div style={{ color: c.textMuted, fontSize: 13 }}>No selling data yet.</div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {bestSellers.map((item) => (
                  <MiniListRow
                    key={item.id}
                    leftTop={item.product_name}
                    leftBottom={item.sku}
                    rightTop={`${item.units_sold_30d} units`}
                    rightBottom={`7d: ${item.units_sold_7d}`}
                    c={c}
                  />
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="🐢 Slow / Dead Stock" c={c}>
            {slowMoving.length === 0 ? (
              <div style={{ color: c.textMuted, fontSize: 13 }}>No slow-moving stock right now.</div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {slowMoving.map((item) => (
                  <MiniListRow
                    key={item.id}
                    leftTop={item.product_name}
                    leftBottom={item.sku}
                    rightTop={
                      item.days_since_last_sale === null
                        ? "Never sold"
                        : `${item.days_since_last_sale} days`
                    }
                    rightBottom={`30d: ${item.units_sold_30d}`}
                    c={c}
                  />
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {filtered.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 60,
              background: c.card,
              borderRadius: 12,
              color: c.textMuted,
              border: `1px solid ${c.border}`,
            }}
          >
            📦 No products found for these filters
          </div>
        ) : (
          <div
            style={{
              background: c.card,
              borderRadius: 14,
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              border: `1px solid ${c.border}`,
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: 2140,
                  tableLayout: "fixed",
                }}
              >
                <thead>
                  <tr style={{ background: c.headerBg, borderBottom: `1px solid ${c.border}` }}>
                    <th style={{ ...thStyle(c), width: 210 }}>Product</th>
                    <th style={{ ...thStyle(c), width: 120 }}>SKU</th>
                    <th style={{ ...thStyle(c), width: 140 }}>Category</th>
                    <th style={{ ...thStyle(c), width: 150 }}>Supplier</th>
                    <th style={{ ...thStyle(c), width: 90, textAlign: "right" }}>Stock</th>
                    <th style={{ ...thStyle(c), width: 90, textAlign: "right" }}>Reorder</th>
                    <th style={{ ...thStyle(c), width: 130 }}>Stock Status</th>
                    <th style={{ ...thStyle(c), width: 130 }}>Movement</th>
                    <th style={{ ...thStyle(c), width: 130, textAlign: "right" }}>Stock Value</th>
                    <th style={{ ...thStyle(c), width: 130, textAlign: "right" }}>Potential Profit</th>
                    <th style={{ ...thStyle(c), width: 90, textAlign: "right" }}>Sold 7d</th>
                    <th style={{ ...thStyle(c), width: 90, textAlign: "right" }}>Sold 30d</th>
                    <th style={{ ...thStyle(c), width: 130 }}>Last Sold</th>
                    <th style={{ ...thStyle(c), width: 130 }}>Days Since Sale</th>
                    <th style={{ ...thStyle(c), width: 180 }}>Last Sold By</th>
                    <th style={{ ...thStyle(c), width: 150 }}>Channel</th>
                    <th style={{ ...thStyle(c), width: 170 }}>Location / Region</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, idx) => {
                    const stockBadge = getStockBadge(row.stock_status, isDark);
                    const movementBadge = getMovementBadge(row.movement_status, isDark);
                    const channelBadge = getChannelBadge(row.last_sale_channel, isDark);
                    const isSelected = selectedProduct?.id === row.id;

                    return (
                      <tr
                        key={row.id}
                        onClick={() => setSelectedProduct(row)}
                        style={{
                          borderBottom: `1px solid ${c.borderLight || c.border}`,
                          background: isSelected
                            ? isDark
                              ? "rgba(14, 165, 233, 0.08)"
                              : "#e0f2fe"
                            : idx % 2 === 0
                            ? c.rowBg1
                            : c.rowBg2,
                          cursor: "pointer",
                        }}
                        title="Click to inspect product"
                      >
                        <td style={{ ...tdStyle, width: 210 }}>
                          <div style={{ ...strongCell(c), wordBreak: "break-word" }}>{row.product_name}</div>
                        </td>

                        <td style={{ ...tdStyle, width: 120 }}>
                          <div style={mutedCell(c)}>{row.sku}</div>
                        </td>

                        <td style={{ ...tdStyle, width: 140 }}>
                          <div style={mutedCell(c)}>{row.category_name}</div>
                        </td>

                        <td style={{ ...tdStyle, width: 150 }}>
                          <div style={mutedCell(c)}>{row.supplier_name}</div>
                        </td>

                        <td style={{ ...tdStyle, width: 90, textAlign: "right" }}>
                          <div style={{ ...strongCell(c), textAlign: "right" }}>{row.current_stock}</div>
                        </td>

                        <td style={{ ...tdStyle, width: 90, textAlign: "right" }}>
                          <div style={{ ...mutedCell(c), textAlign: "right" }}>{row.reorder_level}</div>
                        </td>

                        <td style={{ ...tdStyle, width: 130 }}>
                          <Badge badge={stockBadge} />
                        </td>

                        <td style={{ ...tdStyle, width: 130 }}>
                          <Badge badge={movementBadge} />
                        </td>

                        <td style={{ ...tdStyle, width: 130, textAlign: "right" }}>
                          <div style={{ ...strongCell(c), textAlign: "right" }}>{formatCurrency(row.stock_value)}</div>
                        </td>

                        <td style={{ ...tdStyle, width: 130, textAlign: "right" }}>
                          <div
                            style={{
                              ...getProfitTextStyle(row.potential_profit, isDark),
                              textAlign: "right",
                              lineHeight: 1.35,
                              wordBreak: "break-word",
                            }}
                          >
                            {formatCurrency(row.potential_profit)}
                          </div>
                        </td>

                        <td style={{ ...tdStyle, width: 90, textAlign: "right" }}>
                          <div style={{ ...mutedCell(c), textAlign: "right" }}>{row.units_sold_7d}</div>
                        </td>

                        <td style={{ ...tdStyle, width: 90, textAlign: "right" }}>
                          <div style={{ ...mutedCell(c), textAlign: "right" }}>{row.units_sold_30d}</div>
                        </td>

                        <td style={{ ...tdStyle, width: 130 }}>
                          <div style={mutedCell(c)}>{formatDate(row.last_sale_date)}</div>
                          <div style={{ fontSize: 12, color: c.textMuted, marginTop: 4 }}>
                            {row.last_sale_qty ? `Qty ${row.last_sale_qty}` : ""}
                          </div>
                        </td>

                        <td style={{ ...tdStyle, width: 130 }}>
                          <Badge badge={getDaysSinceBadge(row.days_since_last_sale, isDark)} />
                        </td>

                        <td style={{ ...tdStyle, width: 180 }}>
                          <div style={mutedCell(c)}>{row.last_sold_by_name || "Unknown Rep"}</div>
                          {row.last_customer_name ? (
                            <div style={{ fontSize: 12, marginTop: 4, color: c.textMuted, lineHeight: 1.35 }}>
                              Customer: {row.last_customer_name}
                            </div>
                          ) : null}
                        </td>

                        <td style={{ ...tdStyle, width: 150 }}>
                          <Badge badge={channelBadge} />
                        </td>

                        <td style={{ ...tdStyle, width: 170 }}>
                          <div style={mutedCell(c)}>{row.last_sale_location || "—"}</div>
                          <div style={{ fontSize: 12, marginTop: 4, color: c.textMuted, lineHeight: 1.35 }}>
                            {row.last_sale_region || ""}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div
              style={{
                padding: "12px 16px",
                borderTop: `1px solid ${c.border}`,
                color: c.textMuted,
                fontSize: 12,
              }}
            >
              Click any product row to open its drilldown panel.
            </div>
          </div>
        )}
      </div>

      {selectedProduct && (
        <>
          <div
            onClick={() => setSelectedProduct(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              zIndex: 1200,
            }}
          />

          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              width: "min(620px, 100vw)",
              height: "100vh",
              background: c.card,
              borderLeft: `1px solid ${c.border}`,
              boxShadow: "-8px 0 30px rgba(0,0,0,0.25)",
              zIndex: 1201,
              overflowY: "auto",
            }}
          >
            <div
              style={{
                padding: 20,
                borderBottom: `1px solid ${c.border}`,
                position: "sticky",
                top: 0,
                background: c.card,
                zIndex: 2,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 800,
                      color: c.text,
                      lineHeight: 1.2,
                      wordBreak: "break-word",
                    }}
                  >
                    {selectedProduct.product_name}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 13, color: c.textMuted }}>
                    SKU: {selectedProduct.sku}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedProduct(null)}
                  style={{
                    border: `1px solid ${c.border}`,
                    background: c.bg,
                    color: c.text,
                    borderRadius: 10,
                    padding: "8px 12px",
                    cursor: "pointer",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  Close
                </button>
              </div>

              <div
                style={{
                  marginTop: 14,
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <Badge badge={getStockBadge(selectedProduct.stock_status, isDark)} />
                <Badge badge={getMovementBadge(selectedProduct.movement_status, isDark)} />
                <Badge badge={getChannelBadge(selectedProduct.last_sale_channel, isDark)} />
              </div>
            </div>

            <div style={{ padding: 20, display: "grid", gap: 18 }}>
              <SectionCard title="Inventory Snapshot" c={c}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: 12,
                  }}
                >
                  <DrawerStat label="Current Stock" value={selectedProduct.current_stock} c={c} />
                  <DrawerStat label="Reorder Level" value={selectedProduct.reorder_level} c={c} />
                  <DrawerStat label="Stock Value" value={formatCurrency(selectedProduct.stock_value)} c={c} />
                  <DrawerStat label="Potential Profit" value={formatCurrency(selectedProduct.potential_profit)} c={c} />
                  <DrawerStat label="Sold 7 Days" value={selectedProduct.units_sold_7d} c={c} />
                  <DrawerStat label="Sold 30 Days" value={selectedProduct.units_sold_30d} c={c} />
                  <DrawerStat
                    label="Days Since Last Sale"
                    value={
                      selectedProduct.days_since_last_sale === null
                        ? "Never sold"
                        : selectedProduct.days_since_last_sale
                    }
                    c={c}
                  />
                  <DrawerStat label="Last Sale Qty" value={selectedProduct.last_sale_qty || "—"} c={c} />
                </div>
              </SectionCard>

              <SectionCard title="Reorder Control" c={c}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 10,
                    alignItems: "end",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 700,
                        color: c.textMuted,
                        marginBottom: 6,
                      }}
                    >
                      Reorder Level
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={reorderDraft}
                      onChange={(e) => setReorderDraft(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: `1px solid ${c.border}`,
                        borderRadius: 10,
                        fontSize: 14,
                        background: c.inputBg,
                        color: c.text,
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveReorderLevel}
                    disabled={savingReorder}
                    style={{
                      padding: "10px 16px",
                      border: "none",
                      borderRadius: 10,
                      cursor: savingReorder ? "not-allowed" : "pointer",
                      background: savingReorder ? "#94a3b8" : "#16a34a",
                      color: "white",
                      fontWeight: 700,
                      fontSize: 13,
                      opacity: savingReorder ? 0.8 : 1,
                    }}
                  >
                    {savingReorder ? "Saving..." : "Save"}
                  </button>
                </div>

                {saveErr && (
                  <div
                    style={{
                      marginTop: 10,
                      fontSize: 12,
                      fontWeight: 700,
                      color: isDark ? "#ff6b6b" : "#c33",
                    }}
                  >
                    {saveErr}
                  </div>
                )}

                {saveSuccess && !saveErr && (
                  <div
                    style={{
                      marginTop: 10,
                      fontSize: 12,
                      fontWeight: 700,
                      color: isDark ? "#4ade80" : "#166534",
                    }}
                  >
                    {saveSuccess}
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Product Information" c={c}>
                <DetailRow label="Product" value={selectedProduct.product_name} c={c} />
                <DetailRow label="SKU" value={selectedProduct.sku} c={c} />
                <DetailRow label="Category" value={selectedProduct.category_name} c={c} />
                <DetailRow label="Supplier" value={selectedProduct.supplier_name} c={c} />
                <DetailRow label="Cost Price" value={formatCurrency(selectedProduct.cost_price)} c={c} />
                <DetailRow label="Retail Price" value={formatCurrency(selectedProduct.retail_price)} c={c} />
                <DetailRow label="Wholesale Price" value={formatCurrency(selectedProduct.wholesale_price)} c={c} />
              </SectionCard>

              <SectionCard title="Last Sale Intelligence" c={c}>
                <DetailRow label="Last Sold Date" value={formatDate(selectedProduct.last_sale_date)} c={c} />
                <DetailRow label="Sold By" value={selectedProduct.last_sold_by_name || "Unknown Rep"} c={c} />
                <DetailRow label="Customer" value={selectedProduct.last_customer_name || "—"} c={c} />
                <DetailRow label="Channel" value={selectedProduct.last_sale_channel || "unknown"} c={c} />
                <DetailRow label="Location" value={selectedProduct.last_sale_location || "—"} c={c} />
                <DetailRow label="Region" value={selectedProduct.last_sale_region || "—"} c={c} />
              </SectionCard>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function filterStyle(c) {
  return {
    width: "100%",
    padding: "10px 12px",
    border: `1px solid ${c.border}`,
    borderRadius: 8,
    fontSize: 13,
    background: c.inputBg,
    color: c.text,
    cursor: "pointer",
    minWidth: 0,
  };
}

function thStyle(c) {
  return {
    padding: 12,
    textAlign: "left",
    fontSize: 12,
    fontWeight: 700,
    color: c.textMuted,
    lineHeight: 1.35,
    whiteSpace: "normal",
    verticalAlign: "middle",
  };
}

const tdStyle = {
  padding: 12,
  fontSize: 13,
  verticalAlign: "top",
};

function mutedCell(c) {
  return {
    color: c.textMuted,
    lineHeight: 1.4,
    wordBreak: "break-word",
  };
}

function strongCell(c) {
  return {
    color: c.text,
    fontWeight: 700,
    lineHeight: 1.35,
    wordBreak: "break-word",
  };
}
