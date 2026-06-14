import { useState, useEffect, useCallback, useRef } from "react";
import type { FoodItem, MealPlan, ShoppingItem } from "../types";
import {
  isSupabaseConfigured,
  getFoodItems,
  getMealPlans,
  getShoppingItems,
  addFoodItem,
  updateFoodItem,
  deleteFoodItem,
  addMealPlan,
  deleteMealPlan,
  addShoppingItem,
  toggleShoppingItem,
  deleteShoppingItem,
  clearCheckedShoppingItems,
  subscribeFoodItems,
  subscribeMealPlans,
  subscribeShoppingItems,
  dbFoodToApp,
  dbMealToApp,
  dbShoppingToApp,
  type DbFoodItem,
  type DbMealPlan,
  type DbShoppingItem,
} from "../lib/supabase";
import { DEFAULT_FOODS } from "../data/defaultFoods";
import { DEFAULT_MEALS } from "../data/defaultMeals";
import { DEFAULT_SHOPPING } from "../data/defaultShopping";

export interface FridgeDataState {
  foods: FoodItem[];
  meals: MealPlan[];
  shopping: ShoppingItem[];
  loading: boolean;
  // Mutations
  addFood: (item: Omit<FoodItem, "id">, addedBy?: string) => Promise<void>;
  updateFood: (item: FoodItem) => Promise<void>;
  deleteFood: (id: string) => Promise<void>;
  addMeal: (meal: Omit<MealPlan, "id" | "ingredientIds">) => Promise<void>;
  deleteMeal: (id: string) => Promise<void>;
  addShopping: (item: Omit<ShoppingItem, "id">) => Promise<void>;
  addManyShopping: (items: Omit<ShoppingItem, "id">[]) => Promise<void>;
  toggleShopping: (id: string, checked: boolean) => Promise<void>;
  deleteShopping: (id: string) => Promise<void>;
  clearCheckedShopping: () => Promise<void>;
  setFoods: (foods: FoodItem[]) => void;
  setMeals: (meals: MealPlan[]) => void;
  setShopping: (shopping: ShoppingItem[]) => void;
}

export function useFridgeData(fridgeId: string | null, addedByLabel?: string): FridgeDataState {
  const [foods, setFoodsState] = useState<FoodItem[]>([]);
  const [meals, setMealsState] = useState<MealPlan[]>([]);
  const [shopping, setShoppingState] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const subscriptionsRef = useRef<(() => void)[]>([]);

  // Load initial data from Supabase (or fall back to empty/defaults when no fridgeId)
  useEffect(() => {
    if (!fridgeId || !isSupabaseConfigured) {
      // No fridge yet — use empty arrays (not defaults, since defaults are for local-only mode)
      setFoodsState([]);
      setMealsState([]);
      setShoppingState([]);
      return;
    }

    setLoading(true);
    Promise.all([
      getFoodItems(fridgeId),
      getMealPlans(fridgeId),
      getShoppingItems(fridgeId),
    ])
      .then(([dbFoods, dbMeals, dbShopping]) => {
        setFoodsState(dbFoods.map(dbFoodToApp));
        setMealsState(dbMeals.map(dbMealToApp));
        setShoppingState(dbShopping.map(dbShoppingToApp));
      })
      .catch((err) => {
        console.error("Failed to load fridge data:", err);
        setFoodsState([]);
        setMealsState([]);
        setShoppingState([]);
      })
      .finally(() => setLoading(false));

    // Set up real-time subscriptions
    const foodSub = subscribeFoodItems(
      fridgeId,
      (item: DbFoodItem) => {
        setFoodsState((prev) => {
          if (prev.find((f) => f.id === item.id)) return prev;
          return [...prev, dbFoodToApp(item)];
        });
      },
      (item: DbFoodItem) => {
        setFoodsState((prev) => prev.map((f) => f.id === item.id ? dbFoodToApp(item) : f));
      },
      (id: string) => {
        setFoodsState((prev) => prev.filter((f) => f.id !== id));
      }
    );

    const mealSub = subscribeMealPlans(
      fridgeId,
      (item: DbMealPlan) => {
        setMealsState((prev) => {
          if (prev.find((m) => m.id === item.id)) return prev;
          return [...prev, dbMealToApp(item)];
        });
      },
      (id: string) => {
        setMealsState((prev) => prev.filter((m) => m.id !== id));
      }
    );

    const shoppingSub = subscribeShoppingItems(
      fridgeId,
      (item: DbShoppingItem) => {
        setShoppingState((prev) => {
          if (prev.find((s) => s.id === item.id)) return prev;
          return [...prev, dbShoppingToApp(item)];
        });
      },
      (item: DbShoppingItem) => {
        setShoppingState((prev) => prev.map((s) => s.id === item.id ? dbShoppingToApp(item) : s));
      },
      (id: string) => {
        setShoppingState((prev) => prev.filter((s) => s.id !== id));
      }
    );

    // Store cleanup functions
    subscriptionsRef.current = [
      () => foodSub.unsubscribe(),
      () => mealSub.unsubscribe(),
      () => shoppingSub.unsubscribe(),
    ];

    return () => {
      subscriptionsRef.current.forEach((unsub) => unsub());
      subscriptionsRef.current = [];
    };
  }, [fridgeId]);

  // ── Mutations ────────────────────────────────────────────────────

  const addFood = useCallback(async (item: Omit<FoodItem, "id">, addedBy?: string) => {
    if (!fridgeId || !isSupabaseConfigured) return;
    const db = await addFoodItem(fridgeId, item, addedBy ?? addedByLabel);
    setFoodsState((prev) => {
      if (prev.find((f) => f.id === db.id)) return prev;
      return [...prev, dbFoodToApp(db)];
    });
  }, [fridgeId, addedByLabel]);

  const updateFood = useCallback(async (item: FoodItem) => {
    if (!isSupabaseConfigured) {
      setFoodsState((prev) => prev.map((f) => f.id === item.id ? item : f));
      return;
    }
    await updateFoodItem(item.id, item);
    setFoodsState((prev) => prev.map((f) => f.id === item.id ? item : f));
  }, []);

  const deleteFood = useCallback(async (id: string) => {
    if (!isSupabaseConfigured) {
      setFoodsState((prev) => prev.filter((f) => f.id !== id));
      return;
    }
    await deleteFoodItem(id);
    setFoodsState((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const addMeal = useCallback(async (meal: Omit<MealPlan, "id" | "ingredientIds">) => {
    if (!fridgeId || !isSupabaseConfigured) return;
    const db = await addMealPlan(fridgeId, meal);
    setMealsState((prev) => {
      if (prev.find((m) => m.id === db.id)) return prev;
      return [...prev, dbMealToApp(db)];
    });
  }, [fridgeId]);

  const deleteMeal = useCallback(async (id: string) => {
    if (!isSupabaseConfigured) {
      setMealsState((prev) => prev.filter((m) => m.id !== id));
      return;
    }
    await deleteMealPlan(id);
    setMealsState((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const addShopping = useCallback(async (item: Omit<ShoppingItem, "id">) => {
    if (!fridgeId || !isSupabaseConfigured) return;
    const db = await addShoppingItem(fridgeId, item);
    setShoppingState((prev) => {
      if (prev.find((s) => s.id === db.id)) return prev;
      return [...prev, dbShoppingToApp(db)];
    });
  }, [fridgeId]);

  const addManyShopping = useCallback(async (items: Omit<ShoppingItem, "id">[]) => {
    if (!fridgeId || !isSupabaseConfigured) return;
    for (const item of items) {
      const db = await addShoppingItem(fridgeId, item);
      setShoppingState((prev) => {
        if (prev.find((s) => s.id === db.id)) return prev;
        return [...prev, dbShoppingToApp(db)];
      });
    }
  }, [fridgeId]);

  const toggleShopping = useCallback(async (id: string, checked: boolean) => {
    if (!isSupabaseConfigured) {
      setShoppingState((prev) => prev.map((s) => s.id === id ? { ...s, checked } : s));
      return;
    }
    await toggleShoppingItem(id, checked);
    setShoppingState((prev) => prev.map((s) => s.id === id ? { ...s, checked } : s));
  }, []);

  const deleteShopping = useCallback(async (id: string) => {
    if (!isSupabaseConfigured) {
      setShoppingState((prev) => prev.filter((s) => s.id !== id));
      return;
    }
    await deleteShoppingItem(id);
    setShoppingState((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const clearCheckedShopping = useCallback(async () => {
    if (!fridgeId || !isSupabaseConfigured) {
      setShoppingState((prev) => prev.filter((s) => !s.checked));
      return;
    }
    await clearCheckedShoppingItems(fridgeId);
    setShoppingState((prev) => prev.filter((s) => !s.checked));
  }, [fridgeId]);

  // Local-only setters (for import/export and recipe cooking)
  const setFoods = useCallback((newFoods: FoodItem[]) => setFoodsState(newFoods), []);
  const setMeals = useCallback((newMeals: MealPlan[]) => setMealsState(newMeals), []);
  const setShopping = useCallback((newShopping: ShoppingItem[]) => setShoppingState(newShopping), []);

  return {
    foods,
    meals,
    shopping,
    loading,
    addFood,
    updateFood,
    deleteFood,
    addMeal,
    deleteMeal,
    addShopping,
    addManyShopping,
    toggleShopping,
    deleteShopping,
    clearCheckedShopping,
    setFoods,
    setMeals,
    setShopping,
  };
}

// For local-only mode (no Supabase, no fridge), uses localStorage
export function useLocalFridgeStore() {
  const KEYS = {
    foods: "fridge_foods",
    meals: "fridge_meals",
    shopping: "fridge_shopping",
  };

  function load<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }
  function save<T>(key: string, value: T) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  const [foods, setFoodsRaw] = useState<FoodItem[]>(() => load(KEYS.foods, null) ?? DEFAULT_FOODS);
  const [meals, setMealsRaw] = useState<MealPlan[]>(() => load(KEYS.meals, null) ?? DEFAULT_MEALS);
  const [shopping, setShoppingRaw] = useState<ShoppingItem[]>(() => load(KEYS.shopping, null) ?? DEFAULT_SHOPPING);

  const setFoods = (v: FoodItem[] | ((p: FoodItem[]) => FoodItem[])) => {
    setFoodsRaw((prev) => { const next = typeof v === "function" ? v(prev) : v; save(KEYS.foods, next); return next; });
  };
  const setMeals = (v: MealPlan[] | ((p: MealPlan[]) => MealPlan[])) => {
    setMealsRaw((prev) => { const next = typeof v === "function" ? v(prev) : v; save(KEYS.meals, next); return next; });
  };
  const setShopping = (v: ShoppingItem[] | ((p: ShoppingItem[]) => ShoppingItem[])) => {
    setShoppingRaw((prev) => { const next = typeof v === "function" ? v(prev) : v; save(KEYS.shopping, next); return next; });
  };

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === KEYS.foods && e.newValue) setFoodsRaw(JSON.parse(e.newValue));
      if (e.key === KEYS.meals && e.newValue) setMealsRaw(JSON.parse(e.newValue));
      if (e.key === KEYS.shopping && e.newValue) setShoppingRaw(JSON.parse(e.newValue));
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return { foods, setFoods, meals, setMeals, shopping, setShopping };
}
