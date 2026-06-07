import { useState, useEffect } from "react";
import type { FoodItem, MealPlan, ShoppingItem, Recipe } from "./types";
import { DEFAULT_RECIPES } from "./data/defaultRecipes";
import { DEFAULT_FOODS } from "./data/defaultFoods";
import { DEFAULT_MEALS } from "./data/defaultMeals";
import { DEFAULT_SHOPPING } from "./data/defaultShopping";

const KEYS = {
  foods: "fridge_foods",
  meals: "fridge_meals",
  shopping: "fridge_shopping",
  recipes: "fridge_recipes",
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

export function useFridgeStore() {
  const [foods, setFoodsRaw] = useState<FoodItem[]>(() => load(KEYS.foods, null) ?? DEFAULT_FOODS);
  const [meals, setMealsRaw] = useState<MealPlan[]>(() => load(KEYS.meals, null) ?? DEFAULT_MEALS);
  const [shopping, setShoppingRaw] = useState<ShoppingItem[]>(() => load(KEYS.shopping, null) ?? DEFAULT_SHOPPING);
  const [recipes, setRecipesRaw] = useState<Recipe[]>(() => load(KEYS.recipes, null) ?? DEFAULT_RECIPES);

  const setFoods = (v: FoodItem[] | ((p: FoodItem[]) => FoodItem[])) => {
    setFoodsRaw((prev) => {
      const next = typeof v === "function" ? v(prev) : v;
      save(KEYS.foods, next);
      return next;
    });
  };

  const setMeals = (v: MealPlan[] | ((p: MealPlan[]) => MealPlan[])) => {
    setMealsRaw((prev) => {
      const next = typeof v === "function" ? v(prev) : v;
      save(KEYS.meals, next);
      return next;
    });
  };

  const setShopping = (v: ShoppingItem[] | ((p: ShoppingItem[]) => ShoppingItem[])) => {
    setShoppingRaw((prev) => {
      const next = typeof v === "function" ? v(prev) : v;
      save(KEYS.shopping, next);
      return next;
    });
  };

  const setRecipes = (v: Recipe[] | ((p: Recipe[]) => Recipe[])) => {
    setRecipesRaw((prev) => {
      const next = typeof v === "function" ? v(prev) : v;
      save(KEYS.recipes, next);
      return next;
    });
  };

  // Sync on mount from other tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === KEYS.foods && e.newValue) setFoodsRaw(JSON.parse(e.newValue));
      if (e.key === KEYS.meals && e.newValue) setMealsRaw(JSON.parse(e.newValue));
      if (e.key === KEYS.shopping && e.newValue) setShoppingRaw(JSON.parse(e.newValue));
      if (e.key === KEYS.recipes && e.newValue) setRecipesRaw(JSON.parse(e.newValue));
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return { foods, setFoods, meals, setMeals, shopping, setShopping, recipes, setRecipes };
}
