const ORDER_STATUS_DEFINITIONS = [
  {
    value: "pending",
    icon: "⏳",
    label: "Pending",
    trackingLabel: "Order received",
    nextStatus: "processing",
    nextAction: "Confirm and start processing",
  },
  {
    value: "processing",
    icon: "⚙️",
    label: "Processing",
    trackingLabel: "Preparing order",
    nextStatus: "dispatched",
    nextAction: "Dispatch order to customer",
  },
  {
    value: "dispatched",
    icon: "🚚",
    label: "Dispatched",
    trackingLabel: "On the way",
    nextStatus: "completed",
    nextAction: "Mark as completed after delivery",
  },
  {
    value: "completed",
    icon: "✅",
    label: "Completed",
    trackingLabel: "Delivered",
    nextStatus: null,
    nextAction: "No further action required",
  },
  {
    value: "cancelled",
    icon: "❌",
    label: "Cancelled",
    trackingLabel: "Cancelled",
    nextStatus: null,
    nextAction: "No further action required",
  },
];

const ORDER_STATUS_LOOKUP = ORDER_STATUS_DEFINITIONS.reduce((acc, item) => {
  acc[item.value] = item;
  return acc;
}, {});

export const ORDER_STATUS_FLOW = ORDER_STATUS_DEFINITIONS;

function formatStatusLabel(status) {
  return String(status || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getOrderStatusMeta(status) {
  const normalized = String(status || "").trim().toLowerCase();
  const fallbackLabel = formatStatusLabel(normalized) || "Pending";

  return (
    ORDER_STATUS_LOOKUP[normalized] || {
      value: normalized || "pending",
      icon: "📦",
      label: fallbackLabel,
      trackingLabel: "Order update",
      nextStatus: null,
      nextAction: "Review order details",
    }
  );
}
