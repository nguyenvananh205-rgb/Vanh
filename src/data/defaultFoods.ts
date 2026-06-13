import type { FoodItem } from "../types";

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number): string {
  return daysFromNow(-n);
}

export const DEFAULT_FOODS: FoodItem[] = [
  // ── Ngăn đá ──────────────────────────────────────────────────
  {
    id: "df-thit-ga",
    name: "Thịt gà",
    quantity: 500,
    unit: "gram",
    category: "thit_ca",
    location: "ngan_da",
    purchaseDate: daysAgo(2),
    expiryDate: daysFromNow(1),    // critical
  },
  {
    id: "df-tom",
    name: "Tôm",
    quantity: 300,
    unit: "gram",
    category: "thit_ca",
    location: "ngan_da",
    purchaseDate: daysAgo(0),
    expiryDate: daysFromNow(30),   // ok (frozen)
  },

  // ── Ngăn lạnh — Thịt / Cá ────────────────────────────────────
  {
    id: "df-ca-thu",
    name: "Cá thu",
    quantity: 400,
    unit: "gram",
    category: "thit_ca",
    location: "ngan_lanh",
    purchaseDate: daysAgo(1),
    expiryDate: daysFromNow(2),    // critical
  },
  {
    id: "df-thit-lon",
    name: "Thịt lợn",
    quantity: 400,
    unit: "gram",
    category: "thit_ca",
    location: "ngan_lanh",
    purchaseDate: daysAgo(1),
    expiryDate: daysFromNow(3),    // soon
  },

  // ── Ngăn lạnh — Rau củ ───────────────────────────────────────
  {
    id: "df-rau-muong",
    name: "Rau muống",
    quantity: 300,
    unit: "gram",
    category: "rau_cu",
    location: "ngan_lanh",
    purchaseDate: daysAgo(1),
    expiryDate: daysFromNow(2),    // critical
  },
  {
    id: "df-gia-do",
    name: "Giá đỗ",
    quantity: 200,
    unit: "gram",
    category: "rau_cu",
    location: "ngan_lanh",
    purchaseDate: daysAgo(1),
    expiryDate: daysFromNow(2),    // critical
  },
  {
    id: "df-ca-chua",
    name: "Cà chua",
    quantity: 4,
    unit: "quả",
    category: "rau_cu",
    location: "ngan_lanh",
    purchaseDate: daysAgo(2),
    expiryDate: daysFromNow(3),    // soon
  },
  {
    id: "df-bap-cai",
    name: "Bắp cải",
    quantity: 300,
    unit: "gram",
    category: "rau_cu",
    location: "ngan_lanh",
    purchaseDate: daysAgo(1),
    expiryDate: daysFromNow(4),    // soon
  },
  {
    id: "df-cai-ngot",
    name: "Cải ngọt",
    quantity: 300,
    unit: "gram",
    category: "rau_cu",
    location: "ngan_lanh",
    purchaseDate: daysAgo(0),
    expiryDate: daysFromNow(4),    // soon
  },
  {
    id: "df-dau-dua",
    name: "Đậu đũa",
    quantity: 250,
    unit: "gram",
    category: "rau_cu",
    location: "ngan_lanh",
    purchaseDate: daysAgo(0),
    expiryDate: daysFromNow(5),    // soon
  },
  {
    id: "df-dau-phu",
    name: "Đậu phụ",
    quantity: 3,
    unit: "miếng",
    category: "rau_cu",
    location: "ngan_lanh",
    purchaseDate: daysAgo(1),
    expiryDate: daysFromNow(4),    // soon
  },
  {
    id: "df-hanh-la",
    name: "Hành lá",
    quantity: 1,
    unit: "bó",
    category: "gia_vi",
    location: "ngan_lanh",
    purchaseDate: daysAgo(2),
    expiryDate: daysFromNow(3),    // soon
  },
  {
    id: "df-sa",
    name: "Sả",
    quantity: 3,
    unit: "cây",
    category: "gia_vi",
    location: "ngan_lanh",
    purchaseDate: daysAgo(1),
    expiryDate: daysFromNow(7),    // ok
  },

  // ── Ngăn lạnh — Sữa / Trứng ──────────────────────────────────
  {
    id: "df-trung",
    name: "Trứng gà",
    quantity: 8,
    unit: "quả",
    category: "sua_trung",
    location: "ngan_lanh",
    purchaseDate: daysAgo(3),
    expiryDate: daysFromNow(18),   // ok
  },

  // ── Tủ mát ───────────────────────────────────────────────────
  {
    id: "df-ca-rot",
    name: "Cà rốt",
    quantity: 3,
    unit: "củ",
    category: "rau_cu",
    location: "tu_mat",
    purchaseDate: daysAgo(3),
    expiryDate: daysFromNow(10),   // ok
  },
  {
    id: "df-bi-do",
    name: "Bí đỏ",
    quantity: 400,
    unit: "gram",
    category: "rau_cu",
    location: "tu_mat",
    purchaseDate: daysAgo(2),
    expiryDate: daysFromNow(12),   // ok
  },

  // ── Ngoài tủ — Gia vị khô ────────────────────────────────────
  {
    id: "df-toi",
    name: "Tỏi",
    quantity: 1,
    unit: "củ",
    category: "gia_vi",
    location: "ngoai_tu",
    purchaseDate: daysAgo(5),
    expiryDate: daysFromNow(20),   // ok
  },
  {
    id: "df-gung",
    name: "Gừng",
    quantity: 60,
    unit: "gram",
    category: "gia_vi",
    location: "ngoai_tu",
    purchaseDate: daysAgo(3),
    expiryDate: daysFromNow(15),   // ok
  },
  {
    id: "df-ot",
    name: "Ớt đỏ",
    quantity: 5,
    unit: "quả",
    category: "gia_vi",
    location: "ngoai_tu",
    purchaseDate: daysAgo(2),
    expiryDate: daysFromNow(8),    // ok
  },
];
