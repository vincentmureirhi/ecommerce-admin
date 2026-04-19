import React from "react";
import {
  Package,
  CheckCircle2,
  AlertCircle,
  XCircle,
  DollarSign,
} from "lucide-react";

function formatMoney(value) {
  return `KSh ${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
  })}`;
}

export default function ProductSummaryCards({ stats, c }) {
  const cards = [
    {
      key: "total",
      title: "Total Products",
      value: stats?.total_products ?? stats?.total ?? 0,
      subtitle: "Catalog items",
      icon: Package,
      accent: "#6366f1",
    },
    {
      key: "active",
      title: "Active",
      value: stats?.active_products ?? stats?.active ?? 0,
      subtitle: "Currently sellable",
      icon: CheckCircle2,
      accent: "#10b981",
    },
    {
      key: "low",
      title: "Low Stock",
      value: stats?.low_stock_count ?? stats?.low_stock ?? 0,
      subtitle: "Needs attention",
      icon: AlertCircle,
      accent: "#f59e0b",
    },
    {
      key: "out",
      title: "Out of Stock",
      value: stats?.out_of_stock_count ?? stats?.out_of_stock ?? 0,
      subtitle: "Immediate restock",
      icon: XCircle,
      accent: "#ef4444",
    },
    {
      key: "value",
      title: "Inventory Value",
      value: formatMoney(stats?.inventory_value ?? 0),
      subtitle: "At cost price",
      icon: DollarSign,
      accent: "#8b5cf6",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 16,
        marginBottom: 20,
      }}
    >
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.key}
            style={{
              background: c.card,
              border: `1px solid ${c.border}`,
              borderLeft: `4px solid ${card.accent}`,
              borderRadius: 14,
              padding: 18,
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 14,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: c.textMuted,
                    marginBottom: 8,
                  }}
                >
                  {card.title}
                </div>

                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: c.text,
                    lineHeight: 1.2,
                  }}
                >
                  {card.value}
                </div>
              </div>

              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: `${card.accent}22`,
                  color: card.accent,
                  flexShrink: 0,
                }}
              >
                <Icon size={22} />
              </div>
            </div>

            <div
              style={{
                fontSize: 12,
                color: c.textMuted,
              }}
            >
              {card.subtitle}
            </div>
          </div>
        );
      })}
    </div>
  );
}
