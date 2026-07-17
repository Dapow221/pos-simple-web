export const OUTLET = "Senopati";
export const ORDER_NUMBER = "#A-0421";

const SKU_CATEGORIES: Record<string, string> = {
  BVG: "Drinks",
  FD: "Food",
};

export function skuCategory(sku: string): string {
  const prefix = sku.split("-")[0];
  return SKU_CATEGORIES[prefix] ?? "Other";
}
