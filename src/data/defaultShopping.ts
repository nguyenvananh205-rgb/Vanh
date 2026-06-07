import type { ShoppingItem } from "../types";

export const DEFAULT_SHOPPING: ShoppingItem[] = [
  // ── Thịt / Cá cần mua thêm ──────────────────────────────────
  { id: "ds-bo", name: "Thịt bò", quantity: 300, unit: "gram", category: "thit_ca", checked: false },
  { id: "ds-ga-them", name: "Thịt gà (mua thêm)", quantity: 500, unit: "gram", category: "thit_ca", checked: false },

  // ── Rau củ ───────────────────────────────────────────────────
  { id: "ds-bong-cai", name: "Bông cải xanh", quantity: 300, unit: "gram", category: "rau_cu", checked: false },
  { id: "ds-kho-qua", name: "Khổ qua", quantity: 2, unit: "quả", category: "rau_cu", checked: false },
  { id: "ds-dua", name: "Dứa (thơm)", quantity: 1, unit: "quả", category: "rau_cu", checked: false },
  { id: "ds-me", name: "Me chua", quantity: 50, unit: "gram", category: "rau_cu", checked: false },
  { id: "ds-hanh-tay", name: "Hành tây", quantity: 2, unit: "củ", category: "rau_cu", checked: false },
  { id: "ds-rau-ngot", name: "Rau ngót", quantity: 200, unit: "gram", category: "rau_cu", checked: false },
  { id: "ds-chanh", name: "Chanh", quantity: 5, unit: "quả", category: "rau_cu", checked: false },

  // ── Sữa / Trứng ──────────────────────────────────────────────
  { id: "ds-trung-them", name: "Trứng gà (mua thêm)", quantity: 10, unit: "quả", category: "sua_trung", checked: false },
  { id: "ds-sua-tuoi", name: "Sữa tươi", quantity: 1, unit: "lít", category: "sua_trung", checked: false },

  // ── Gia vị / Khô ────────────────────────────────────────────
  { id: "ds-mien", name: "Miến dong", quantity: 100, unit: "gram", category: "khac", checked: false },
  { id: "ds-banh-trang", name: "Bánh tráng", quantity: 1, unit: "gói", category: "khac", checked: false },
  { id: "ds-dau-an", name: "Dầu ăn", quantity: 1, unit: "chai", category: "gia_vi", checked: false },
  { id: "ds-nuoc-mam", name: "Nước mắm", quantity: 1, unit: "chai", category: "gia_vi", checked: false },
  { id: "ds-nuoc-dua", name: "Nước dừa", quantity: 2, unit: "lon", category: "do_uong", checked: false },

  // ── Đã mua / tick sẵn ────────────────────────────────────────
  { id: "ds-toi-mua", name: "Tỏi", quantity: 2, unit: "củ", category: "gia_vi", checked: true },
  { id: "ds-gung-mua", name: "Gừng", quantity: 100, unit: "gram", category: "gia_vi", checked: true },
  { id: "ds-muoi", name: "Muối hạt", quantity: 1, unit: "gói", category: "gia_vi", checked: true },
];
