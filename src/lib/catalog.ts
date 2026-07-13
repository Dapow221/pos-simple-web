export interface StaffMember {
  id: string;
  name: string;
  shortName: string;
  initials: string;
  role: string;
  email: string;
}

export const OUTLET = "Senopati";
export const ORDER_NUMBER = "#A-0421";

export const STAFF: StaffMember[] = [
  { id: "anya", name: "Anya P.", shortName: "Anya", initials: "AP", role: "Barista", email: "anya@pos.test" },
  { id: "bima", name: "Bima S.", shortName: "Bima", initials: "BS", role: "Head bar", email: "bima@pos.test" },
  { id: "rama", name: "Rama D.", shortName: "Rama", initials: "RD", role: "Cashier", email: "rama@pos.test" },
];

// Demo accounts are seeded via /v1/auth/register with this exact scheme,
// so the PIN is verified by the API itself (wrong PIN -> 401).
export function pinPassword(staff: StaffMember, pin: string): string {
  return `Ratio-${pin}-${staff.shortName}!`;
}

const SKU_CATEGORIES: Record<string, string> = {
  BVG: "Drinks",
  FD: "Food",
};

export function skuCategory(sku: string): string {
  const prefix = sku.split("-")[0];
  return SKU_CATEGORIES[prefix] ?? "Other";
}
