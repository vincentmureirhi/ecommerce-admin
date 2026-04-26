export const RULE_TYPE_LABELS = {
  CONSTANT: "Fixed Price",
  SKU_THRESHOLD: "Bulk Discount",
  GROUP_THRESHOLD: "Group Wholesale",
  TIERED: "Volume Pricing",
};

export const RULE_TYPE_HINTS = {
  CONSTANT: "This product is always sold at a fixed price. No quantity-based switch applies.",
  SKU_THRESHOLD: "Wholesale price unlocks when this SKU's quantity meets the rule threshold.",
  GROUP_THRESHOLD:
    "Wholesale price unlocks when total quantity across all products sharing this rule meets the threshold.",
  TIERED:
    "Pricing is controlled by quantity tiers. Use the Price Tiers page to manage the tiers for this product.",
};

export const RULE_TYPE_DESCRIPTIONS = {
  CONSTANT: "Product is always sold at a fixed price regardless of quantity.",
  SKU_THRESHOLD:
    "Wholesale price applies only when this SKU's quantity meets the threshold.",
  GROUP_THRESHOLD:
    "Wholesale price applies when total quantity across all products sharing this rule meets the threshold.",
  TIERED:
    "Pricing is determined by tiered quantity bands. Manage tiers on the Price Tiers page.",
};

export const RULE_TYPES = Object.keys(RULE_TYPE_LABELS);

export function ruleNeedsThreshold(ruleType) {
  return ruleType === "SKU_THRESHOLD" || ruleType === "GROUP_THRESHOLD";
}
