import { differenceInDays, parseISO, format, isValid } from "date-fns";
import type { ExpiryStatus, FoodCategory, FoodLocation } from "./types";

export function getExpiryStatus(expiryDate: string): ExpiryStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = parseISO(expiryDate);
  const days = differenceInDays(expiry, today);
  if (days < 0) return "expired";
  if (days === 0) return "critical";
  if (days <= 2) return "critical";
  if (days <= 5) return "soon";
  return "ok";
}

export function getDaysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return differenceInDays(parseISO(expiryDate), today);
}

export function formatDate(dateStr: string): string {
  const d = parseISO(dateStr);
  if (!isValid(d)) return dateStr;
  return format(d, "dd/MM/yyyy");
}

export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export const CATEGORY_LABELS: Record<FoodCategory, string> = {
  thit_ca: "🥩 Thịt/Cá",
  rau_cu: "🥦 Rau/Củ",
  do_nau_chin: "🍲 Đồ nấu chín",
  sua_trung: "🥚 Sữa/Trứng",
  do_uong: "🧃 Đồ uống",
  gia_vi: "🧂 Gia vị",
  trang_miem: "🍮 Tráng miệng",
  khac: "📦 Khác",
};

export const CATEGORY_COLORS: Record<FoodCategory, string> = {
  thit_ca: "bg-red-100 text-red-700",
  rau_cu: "bg-green-100 text-green-700",
  do_nau_chin: "bg-orange-100 text-orange-700",
  sua_trung: "bg-yellow-100 text-yellow-700",
  do_uong: "bg-blue-100 text-blue-700",
  gia_vi: "bg-purple-100 text-purple-700",
  trang_miem: "bg-pink-100 text-pink-700",
  khac: "bg-slate-100 text-slate-700",
};

export const LOCATION_LABELS: Record<FoodLocation, string> = {
  ngan_da:   "❄️ Ngăn đá",
  ngan_lanh: "🧊 Ngăn lạnh",
  tu_mat:    "🌡️ Tủ mát",
  ngoai_tu:  "📦 Ngoài tủ",
};

export const LOCATION_COLORS: Record<FoodLocation, string> = {
  ngan_da:   "bg-cyan-100 text-cyan-700",
  ngan_lanh: "bg-blue-100 text-blue-700",
  tu_mat:    "bg-teal-100 text-teal-700",
  ngoai_tu:  "bg-slate-100 text-slate-600",
};

export const LOCATION_ORDER: FoodLocation[] = ["ngan_da", "ngan_lanh", "tu_mat", "ngoai_tu"];

export const EXPIRY_STYLES: Record<ExpiryStatus, { row: string; badge: string; label: string }> = {
  expired: {
    row: "bg-red-50 border-l-4 border-red-500",
    badge: "bg-red-500 text-white",
    label: "Đã hỏng",
  },
  critical: {
    row: "bg-orange-50 border-l-4 border-orange-400",
    badge: "bg-orange-400 text-white",
    label: "Hết hôm nay/ngày mai",
  },
  soon: {
    row: "bg-yellow-50 border-l-4 border-yellow-400",
    badge: "bg-yellow-400 text-white",
    label: "Sắp hết hạn",
  },
  ok: {
    row: "",
    badge: "bg-green-100 text-green-700",
    label: "Còn tươi",
  },
};

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
