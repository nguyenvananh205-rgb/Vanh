import type { FoodItem } from "../types";

// Ngày hôm nay khi chạy: được tính tương đối so với ngày cài app lần đầu
function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number): string {
  return daysFromNow(-n);
}

export const DEFAULT_FOODS: FoodItem[] = [
  // ── Thịt / Cá (critical & soon) ─────────────────────────────
  {
    id: "df-thit-ga",
    name: "Thịt gà",
    quantity: 500,
    unit: "gram",
    category: "thit_ca",
    purchaseDate: daysAgo(2),
    expiryDate: daysFromNow(1),   // critical
  },
  {
    id: "df-ca-thu",
    name: "Cá thu",
    quantity: 400,
    unit: "gram",
    category: "thit_ca",
    purchaseDate: daysAgo(1),
    expiryDate: daysFromNow(2),   // critical
  },
  {
    id: "df-thit-lon",
    name: "Thịt lợn",
    quantity: 400,
    unit: "gram",
    category: "thit_ca",
    purchaseDate: daysAgo(1),
    expiryDate: daysFromNow(3),   // soon
  },
  {
    id: "df-tom",
    name: "Tôm",
    quantity: 300,
    unit: "gram",
    category: "thit_ca",
    purchaseDate: daysAgo(0),
    expiryDate: daysFromNow(4),   // soon
  },

  // ── Rau củ ───────────────────────────────────────────────────
  {
    id: "df-rau-muong",
    name: "Rau muống",
    quantity: 300,
    unit: "gram",
    category: "rau_cu",
    purchaseDate: daysAgo(1),
    expiryDate: daysFromNow(2),   // critical
  },
  {
    id: "df-gia-do",
    name: "Giá đỗ",
    quantity: 200,
    unit: "gram",
    category: "rau_cu",
    purchaseDate: daysAgo(1),
    expiryDate: daysFromNow(2),   // critical
  },
  {
    id: "df-ca-chua",
    name: "Cà chua",
    quantity: 4,
    unit: "quả",
    category: "rau_cu",
    purchaseDate: daysAgo(2),
    expiryDate: daysFromNow(3),   // soon
  },
  {
    id: "df-bap-cai",
    name: "Bắp cải",
    quantity: 300,
    unit: "gram",
    category: "rau_cu",
    purchaseDate: daysAgo(1),
    expiryDate: daysFromNow(4),   // soon
  },
  {
    id: "df-cai-ngot",
    name: "Cải ngọt",
    quantity: 300,
    unit: "gram",
    category: "rau_cu",
    purchaseDate: daysAgo(0),
    expiryDate: daysFromNow(4),   // soon
  },
  {
    id: "df-dau-dua",
    name: "Đậu đũa",
    quantity: 250,
    unit: "gram",
    category: "rau_cu",
    purchaseDate: daysAgo(0),
    expiryDate: daysFromNow(5),   // soon
  },
  {
    id: "df-ca-rot",
    name: "Cà rốt",
    quantity: 3,
    unit: "củ",
    category: "rau_cu",
    purchaseDate: daysAgo(3),
    expiryDate: daysFromNow(10),  // ok
  },
  {
    id: "df-bi-do",
    name: "Bí đỏ",
    quantity: 400,
    unit: "gram",
    category: "rau_cu",
    purchaseDate: daysAgo(2),
    expiryDate: daysFromNow(12),  // ok
  },
  {
    id: "df-dau-phu",
    name: "Đậu phụ",
    quantity: 3,
    unit: "miếng",
    category: "rau_cu",
    purchaseDate: daysAgo(1),
    expiryDate: daysFromNow(4),   // soon
  },

  // ── Sữa / Trứng ──────────────────────────────────────────────
  {
    id: "df-trung",
    name: "Trứng gà",
    quantity: 8,
    unit: "quả",
    category: "sua_trung",
    purchaseDate: daysAgo(3),
    expiryDate: daysFromNow(18),  // ok
  },

  // ── Gia vị tươi ──────────────────────────────────────────────
  {
    id: "df-hanh-la",
    name: "Hành lá",
    quantity: 1,
    unit: "bó",
    category: "gia_vi",
    purchaseDate: daysAgo(2),
    expiryDate: daysFromNow(3),   // soon
  },
  {
    id: "df-toi",
    name: "Tỏi",
    quantity: 1,
    unit: "củ",
    category: "gia_vi",
    purchaseDate: daysAgo(5),
    expiryDate: daysFromNow(20),  // ok
  },
  {
    id: "df-gung",
    name: "Gừng",
    quantity: 60,
    unit: "gram",
    category: "gia_vi",
    purchaseDate: daysAgo(3),
    expiryDate: daysFromNow(15),  // ok
  },
  {
    id: "df-sa",
    name: "Sả",
    quantity: 3,
    unit: "cây",
    category: "gia_vi",
    purchaseDate: daysAgo(1),
    expiryDate: daysFromNow(7),   // ok
  },
  {
    id: "df-ot",
    name: "Ớt đỏ",
    quantity: 5,
    unit: "quả",
    category: "gia_vi",
    purchaseDate: daysAgo(2),
    expiryDate: daysFromNow(8),   // ok
  },
];
