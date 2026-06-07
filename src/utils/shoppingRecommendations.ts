import type { MealPlan, Recipe, FoodItem, FoodCategory, ShoppingItem } from "../types";
import { namesMatch, canonicalize } from "./ingredientMatcher";
import { getExpiryStatus } from "../utils";
import { suggestMeals } from "./mealScorer";

const TO_BASE: Record<string, number> = {
  kg: 1000, gram: 1, g: 1, gam: 1,
  lít: 1000, lit: 1000, ml: 1,
};

function toBase(qty: number, unit: string): number | null {
  const f = TO_BASE[unit.toLowerCase()];
  return f != null ? qty * f : null;
}

function fromBase(base: number, unit: string): number {
  const f = TO_BASE[unit.toLowerCase()];
  return f != null ? base / f : base;
}

function guessCategory(name: string): FoodCategory {
  const n = name.toLowerCase();
  if (/thịt|cá|tôm|gà|bò|heo|lợn/.test(n)) return "thit_ca";
  if (/rau|cải|bắp|bí|cà|giá|đậu|dứa|me|chanh|khổ|bông/.test(n)) return "rau_cu";
  if (/trứng|sữa/.test(n)) return "sua_trung";
  if (/tỏi|hành|gừng|sả|ớt|dầu|mắm|muối|đường/.test(n)) return "gia_vi";
  if (/nước|trà|cà phê|lon|chai/.test(n)) return "do_uong";
  return "khac";
}

export interface ShoppingNeed {
  name: string;
  quantityNeeded: number;  // shortage in original unit (after subtracting fridge)
  totalNeeded: number;     // total from plan (before fridge)
  inFridge: number;        // what fridge has, in same unit
  unit: string;
  forMeals: string[];
  category: FoodCategory;
  isFallback: boolean;     // true when computed from fallback (no meal plan)
}

export type QuantityWarning =
  | null
  | { type: "not_in_plan"; message: string }
  | { type: "excess"; needed: number; unit: string; message: string };

// Returns shopping needs for the next 7 days based on meal plans.
// Falls back to a top-combo × 3 dinners for 2 people when no upcoming meals exist.
export function getNextWeekShoppingNeeds(
  meals: MealPlan[],
  recipes: Recipe[],
  foods: FoodItem[],
): { needs: ShoppingNeed[]; isFallback: boolean; weekLabel: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cutoff = new Date(today);
  cutoff.setDate(today.getDate() + 7);

  const upcomingMeals = meals.filter((m) => {
    const d = new Date(m.date + "T00:00:00");
    return d >= today && d <= cutoff;
  });

  const isFallback = upcomingMeals.length === 0;

  // Format week label
  const nextMon = new Date(today);
  const dow = today.getDay();
  nextMon.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1) + 7);
  const nextSun = new Date(nextMon);
  nextSun.setDate(nextMon.getDate() + 6);
  const fmt = (d: Date) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
  const weekLabel = isFallback
    ? "3 bữa tối chuẩn (2 người)"
    : `${fmt(today)} – ${fmt(cutoff)}`;

  // Build ingredient list
  type RawIng = { name: string; quantity: number; unit: string; forMeal: string };
  const raw: RawIng[] = [];

  if (isFallback) {
    const combos = suggestMeals(recipes, foods)["com_gia_dinh"] ?? [];
    if (combos.length > 0) {
      const combo = combos[0];
      const dishes = [combo.canh, combo.rau, combo.chinh, combo.phu];
      for (const dish of dishes) {
        for (const m of dish.matches) {
          if (!m.ingredient.optional) {
            raw.push({
              name: m.ingredient.name,
              quantity: m.ingredient.quantity * 3, // × 3 dinners
              unit: m.ingredient.unit,
              forMeal: dish.recipe.name,
            });
          }
        }
      }
    }
  } else {
    const recipeMap = new Map(recipes.map((r) => [r.name.toLowerCase().trim(), r]));
    for (const meal of upcomingMeals) {
      const recipe = recipeMap.get(meal.mealName.toLowerCase().trim());
      if (!recipe) continue;
      for (const ing of recipe.ingredients) {
        if (!ing.optional) {
          raw.push({ name: ing.name, quantity: ing.quantity, unit: ing.unit, forMeal: meal.mealName });
        }
      }
    }
  }

  // Aggregate by canonical name
  const agg = new Map<string, { name: string; baseQty: number; unit: string; meals: Set<string> }>();
  for (const item of raw) {
    const key = canonicalize(item.name);
    const base = toBase(item.quantity, item.unit) ?? item.quantity;
    if (agg.has(key)) {
      const e = agg.get(key)!;
      e.baseQty += base;
      e.meals.add(item.forMeal);
    } else {
      agg.set(key, { name: item.name, baseQty: base, unit: item.unit, meals: new Set([item.forMeal]) });
    }
  }

  // Subtract valid fridge stock
  const validFridge = foods.filter((f) => getExpiryStatus(f.expiryDate) !== "expired");
  const needs: ShoppingNeed[] = [];

  for (const entry of agg.values()) {
    const fridgeItems = validFridge.filter((f) => {
      try { return namesMatch(entry.name, f.name); } catch { return false; }
    });
    const inFridgeBase = fridgeItems.reduce((s, f) => s + (toBase(f.quantity, f.unit) ?? 0), 0);
    const shortageBase = Math.max(0, entry.baseQty - inFridgeBase);
    if (shortageBase <= 0) continue;

    const totalInUnit = fromBase(entry.baseQty, entry.unit);
    const inFridgeInUnit = fromBase(inFridgeBase, entry.unit);
    const shortageInUnit = fromBase(shortageBase, entry.unit);

    needs.push({
      name: entry.name,
      quantityNeeded: Math.ceil(shortageInUnit * 10) / 10,
      totalNeeded: Math.ceil(totalInUnit * 10) / 10,
      inFridge: Math.round(inFridgeInUnit * 10) / 10,
      unit: entry.unit,
      forMeals: [...entry.meals],
      category: guessCategory(entry.name),
      isFallback,
    });
  }

  return { needs, isFallback, weekLabel };
}

// Check if a manually entered item/quantity is reasonable against the plan
export function checkQuantityAgainstPlan(
  name: string,
  quantity: number,
  unit: string,
  needs: ShoppingNeed[],
): QuantityWarning {
  if (!name.trim() || quantity <= 0) return null;

  const match = needs.find((n) => {
    try { return namesMatch(name, n.name) || namesMatch(n.name, name); } catch { return false; }
  });

  if (!match) {
    return { type: "not_in_plan", message: "Không có trong thực đơn tuần tới" };
  }

  const neededBase = toBase(match.quantityNeeded, match.unit);
  const inputBase = toBase(quantity, unit);

  if (neededBase != null && inputBase != null && inputBase > neededBase * 1.5) {
    return {
      type: "excess",
      needed: match.quantityNeeded,
      unit: match.unit,
      message: `Thực đơn chỉ còn thiếu ${match.quantityNeeded} ${match.unit}`,
    };
  }

  return null;
}

// Check if a need is already covered by shopping list items
export function isNeedCovered(need: ShoppingNeed, shoppingItems: ShoppingItem[]): boolean {
  return shoppingItems.some((s) => {
    try { return namesMatch(need.name, s.name) || namesMatch(s.name, need.name); } catch { return false; }
  });
}
