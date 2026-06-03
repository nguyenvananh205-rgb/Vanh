export type FoodCategory =
  | "thit_ca"
  | "rau_cu"
  | "do_nau_chin"
  | "sua_trung"
  | "do_uong"
  | "gia_vi"
  | "trang_miem"
  | "khac";

export type MealType = "bua_trua" | "bua_toi" | "trang_miem";

export interface FoodItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: FoodCategory;
  purchaseDate: string; // ISO date string
  expiryDate: string;   // ISO date string
  notes?: string;
}

export interface MealPlan {
  id: string;
  date: string; // ISO date string
  type: MealType;
  mealName: string;
  ingredientIds: string[];
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: FoodCategory;
  checked: boolean;
}

export type ExpiryStatus = "expired" | "critical" | "soon" | "ok";
