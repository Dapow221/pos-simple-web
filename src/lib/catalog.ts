export type CategoryId =
  | "all"
  | "espresso"
  | "manual-brew"
  | "signature"
  | "tea-other"
  | "bites";

export interface MenuItem {
  id: string;
  name: string;
  note: string;
  price: number;
  category: Exclude<CategoryId, "all">;
  badge?: "BAR" | "SO" | "★";
}

export interface StaffMember {
  id: string;
  name: string;
  shortName: string;
  initials: string;
  role: string;
  pin: string;
}

export const OUTLET = "Senopati";
export const ORDER_NUMBER = "#A-0421";

export const STAFF: StaffMember[] = [
  { id: "anya", name: "Anya P.", shortName: "Anya", initials: "AP", role: "Barista", pin: "1234" },
  { id: "bima", name: "Bima S.", shortName: "Bima", initials: "BS", role: "Head bar", pin: "2580" },
  { id: "rama", name: "Rama D.", shortName: "Rama", initials: "RD", role: "Cashier", pin: "0000" },
];

export const MENU: MenuItem[] = [
  { id: "espresso", name: "Espresso", note: "Double ristretto", price: 22000, category: "espresso" },
  { id: "americano", name: "Americano", note: "Long black", price: 25000, category: "espresso" },
  { id: "piccolo", name: "Piccolo", note: "Ristretto + milk", price: 28000, category: "espresso" },
  { id: "cortado", name: "Cortado", note: "4oz, flat", price: 30000, category: "espresso" },
  { id: "cappuccino", name: "Cappuccino", note: "Dry foam", price: 32000, category: "espresso" },
  { id: "caffe-latte", name: "Caffè Latte", note: "House blend", price: 32000, category: "espresso" },
  { id: "flat-white", name: "Flat White", note: "Velvet milk", price: 33000, category: "espresso", badge: "BAR" },
  { id: "mocha", name: "Mocha", note: "66% dark", price: 36000, category: "espresso" },
  { id: "v60", name: "V60", note: "Single origin · 250ml", price: 35000, category: "manual-brew", badge: "SO" },
  { id: "aeropress", name: "Aeropress", note: "Clean, bright", price: 38000, category: "manual-brew" },
  { id: "kalita-wave", name: "Kalita Wave", note: "Balanced body", price: 38000, category: "manual-brew" },
  { id: "cold-brew", name: "Cold Brew", note: "18h steep", price: 34000, category: "manual-brew" },
  { id: "batch-brew", name: "Batch Brew", note: "Cup of the day", price: 24000, category: "manual-brew" },
  { id: "es-kopi-susu", name: "Es Kopi Susu", note: "Palm sugar, milk", price: 25000, category: "signature", badge: "★" },
  { id: "pandan-latte", name: "Pandan Latte", note: "House pandan", price: 35000, category: "signature", badge: "★" },
  { id: "sea-salt-latte", name: "Sea Salt Latte", note: "Cream top", price: 36000, category: "signature" },
  { id: "affogato", name: "Affogato", note: "Vanilla gelato", price: 38000, category: "signature" },
  { id: "earl-grey", name: "Earl Grey", note: "Loose leaf", price: 25000, category: "tea-other" },
  { id: "matcha-latte", name: "Matcha Latte", note: "Ceremonial grade", price: 38000, category: "tea-other" },
  { id: "hot-chocolate", name: "Hot Chocolate", note: "66% dark", price: 35000, category: "tea-other" },
  { id: "sparkling-yuzu", name: "Sparkling Yuzu", note: "Soda, citrus", price: 32000, category: "tea-other" },
  { id: "butter-croissant", name: "Butter Croissant", note: "Baked at 6am", price: 28000, category: "bites" },
  { id: "pain-au-chocolat", name: "Pain au Chocolat", note: "Flaky, dark", price: 30000, category: "bites" },
  { id: "banana-bread", name: "Banana Bread", note: "Walnut crumb", price: 26000, category: "bites" },
  { id: "cheese-toastie", name: "Cheese Toastie", note: "Sourdough", price: 34000, category: "bites" },
];

export const MENU_BY_ID = new Map(MENU.map((item) => [item.id, item]));

export const CATEGORIES: { id: CategoryId; label: string; heading: string }[] = [
  { id: "all", label: "All", heading: "All drinks" },
  { id: "espresso", label: "Espresso", heading: "Espresso" },
  { id: "manual-brew", label: "Manual brew", heading: "Manual brew" },
  { id: "signature", label: "Signature", heading: "Signature" },
  { id: "tea-other", label: "Tea & other", heading: "Tea & other" },
  { id: "bites", label: "Bites", heading: "Bites" },
];

export function categoryCount(category: CategoryId): number {
  if (category === "all") return MENU.length;
  return MENU.filter((item) => item.category === category).length;
}
