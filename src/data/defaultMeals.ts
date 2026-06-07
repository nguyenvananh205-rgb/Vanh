import type { MealPlan } from "../types";

function weekDay(offsetFromMonday: number): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Find Monday of current week
  const dow = today.getDay(); // 0=Sun, 1=Mon, ...
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  const d = new Date(monday);
  d.setDate(monday.getDate() + offsetFromMonday);
  return d.toISOString().slice(0, 10);
}

function nextWeekDay(offsetFromMonday: number): string {
  const base = weekDay(offsetFromMonday);
  const d = new Date(base);
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

export const DEFAULT_MEALS: MealPlan[] = [
  // ── Tuần này ─────────────────────────────────────────────────

  // Thứ 2
  { id: "dm-t2-trua", date: weekDay(0), type: "bua_trua", mealName: "Bún gà", ingredientIds: ["df-thit-ga", "df-hanh-la", "df-gung"] },
  { id: "dm-t2-toi-1", date: weekDay(0), type: "bua_toi", mealName: "Thịt kho trứng", ingredientIds: ["df-thit-lon", "df-trung", "df-hanh-la"] },
  { id: "dm-t2-toi-2", date: weekDay(0), type: "bua_toi", mealName: "Canh rau muống", ingredientIds: ["df-rau-muong", "df-hanh-la"] },
  { id: "dm-t2-toi-3", date: weekDay(0), type: "bua_toi", mealName: "Đậu phụ chiên giòn", ingredientIds: ["df-dau-phu"] },

  // Thứ 3
  { id: "dm-t3-toi-1", date: weekDay(1), type: "bua_toi", mealName: "Cá hấp gừng hành", ingredientIds: ["df-ca-thu", "df-gung", "df-hanh-la", "df-sa"] },
  { id: "dm-t3-toi-2", date: weekDay(1), type: "bua_toi", mealName: "Cải xanh xào tỏi", ingredientIds: ["df-cai-ngot", "df-toi"] },
  { id: "dm-t3-toi-3", date: weekDay(1), type: "bua_toi", mealName: "Canh bí đỏ tôm", ingredientIds: ["df-bi-do", "df-tom", "df-hanh-la"] },

  // Thứ 4
  { id: "dm-t4-toi-1", date: weekDay(2), type: "bua_toi", mealName: "Gà xào sả ớt", ingredientIds: ["df-thit-ga", "df-sa", "df-ot", "df-toi"] },
  { id: "dm-t4-toi-2", date: weekDay(2), type: "bua_toi", mealName: "Bắp cải xào", ingredientIds: ["df-bap-cai", "df-ca-rot", "df-toi"] },
  { id: "dm-t4-toi-3", date: weekDay(2), type: "bua_toi", mealName: "Canh chua cá", ingredientIds: ["df-ca-thu", "df-ca-chua", "df-gia-do", "df-hanh-la"] },

  // Thứ 5
  { id: "dm-t5-trua", date: weekDay(3), type: "bua_trua", mealName: "Cơm tấm sườn nướng", ingredientIds: ["df-thit-lon"] },
  { id: "dm-t5-toi-1", date: weekDay(3), type: "bua_toi", mealName: "Thịt heo luộc chấm mắm", ingredientIds: ["df-thit-lon", "df-gung", "df-hanh-la"] },
  { id: "dm-t5-toi-2", date: weekDay(3), type: "bua_toi", mealName: "Giá đỗ xào hành", ingredientIds: ["df-gia-do", "df-hanh-la", "df-toi"] },
  { id: "dm-t5-toi-3", date: weekDay(3), type: "bua_toi", mealName: "Trứng chiên hành", ingredientIds: ["df-trung", "df-hanh-la"] },

  // Thứ 6
  { id: "dm-t6-toi-1", date: weekDay(4), type: "bua_toi", mealName: "Cá kho tộ", ingredientIds: ["df-ca-thu", "df-gung", "df-ot", "df-hanh-la"] },
  { id: "dm-t6-toi-2", date: weekDay(4), type: "bua_toi", mealName: "Đậu đũa xào thịt", ingredientIds: ["df-dau-dua", "df-thit-lon", "df-toi"] },
  { id: "dm-t6-toi-3", date: weekDay(4), type: "bua_toi", mealName: "Canh rau ngót thịt bằm", ingredientIds: ["df-thit-lon", "df-hanh-la"] },

  // Thứ 7
  { id: "dm-t7-toi-1", date: weekDay(5), type: "bua_toi", mealName: "Tôm rang muối", ingredientIds: ["df-tom", "df-toi", "df-ot"] },
  { id: "dm-t7-toi-2", date: weekDay(5), type: "bua_toi", mealName: "Rau muống xào tỏi", ingredientIds: ["df-rau-muong", "df-toi"] },
  { id: "dm-t7-toi-3", date: weekDay(5), type: "bua_toi", mealName: "Canh bắp cải thịt", ingredientIds: ["df-bap-cai", "df-thit-lon", "df-ca-rot"] },
  { id: "dm-t7-tmi", date: weekDay(5), type: "trang_miem", mealName: "Chè đậu đỏ", ingredientIds: [] },

  // Chủ nhật
  { id: "dm-cn-trua", date: weekDay(6), type: "bua_trua", mealName: "Phở bò", ingredientIds: ["df-gung", "df-hanh-la"] },
  { id: "dm-cn-toi-1", date: weekDay(6), type: "bua_toi", mealName: "Đậu phụ sốt cà chua", ingredientIds: ["df-dau-phu", "df-ca-chua", "df-hanh-la", "df-toi"] },
  { id: "dm-cn-toi-2", date: weekDay(6), type: "bua_toi", mealName: "Canh bí đỏ tôm", ingredientIds: ["df-bi-do", "df-tom"] },
  { id: "dm-cn-tmi", date: weekDay(6), type: "trang_miem", mealName: "Hoa quả dầm", ingredientIds: [] },

  // ── Tuần sau ─────────────────────────────────────────────────

  // Thứ 2 tuần sau
  { id: "dm-n-t2-toi-1", date: nextWeekDay(0), type: "bua_toi", mealName: "Gà luộc chấm muối chanh", ingredientIds: [] },
  { id: "dm-n-t2-toi-2", date: nextWeekDay(0), type: "bua_toi", mealName: "Cải ngọt xào tỏi", ingredientIds: [] },
  { id: "dm-n-t2-toi-3", date: nextWeekDay(0), type: "bua_toi", mealName: "Canh khổ qua nhồi thịt", ingredientIds: [] },

  // Thứ 3 tuần sau
  { id: "dm-n-t3-trua", date: nextWeekDay(1), type: "bua_trua", mealName: "Bún thịt nướng", ingredientIds: [] },
  { id: "dm-n-t3-toi-1", date: nextWeekDay(1), type: "bua_toi", mealName: "Bò xào bông cải", ingredientIds: [] },
  { id: "dm-n-t3-toi-2", date: nextWeekDay(1), type: "bua_toi", mealName: "Canh chua cá", ingredientIds: [] },
  { id: "dm-n-t3-toi-3", date: nextWeekDay(1), type: "bua_toi", mealName: "Trứng ốp la", ingredientIds: [] },

  // Thứ 4 tuần sau
  { id: "dm-n-t4-toi-1", date: nextWeekDay(2), type: "bua_toi", mealName: "Thịt kho trứng", ingredientIds: [] },
  { id: "dm-n-t4-toi-2", date: nextWeekDay(2), type: "bua_toi", mealName: "Rau muống xào tỏi", ingredientIds: [] },
  { id: "dm-n-t4-tmi", date: nextWeekDay(2), type: "trang_miem", mealName: "Bánh flan", ingredientIds: [] },
];
