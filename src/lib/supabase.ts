import { createClient } from "@supabase/supabase-js";
import type { FoodItem, MealPlan, ShoppingItem } from "../types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured =
  !!supabaseUrl &&
  !!supabaseAnonKey &&
  supabaseUrl !== "https://your-project.supabase.co";

// Create a real client if configured, otherwise a stub that will never be called
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : createClient("https://placeholder.supabase.co", "placeholder-key");

// ── Phone formatting ────────────────────────────────────────────
export function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("84")) return `+${digits}`;
  if (digits.startsWith("0")) return `+84${digits.slice(1)}`;
  return `+84${digits}`;
}

export function toLocalPhone(e164: string): string {
  if (e164.startsWith("+84")) return `0${e164.slice(3)}`;
  return e164;
}

// ── Auth ────────────────────────────────────────────────────────
export async function signUp(phone: string, password: string) {
  const e164 = toE164(phone);

  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    phone: e164,
    password,
  });
  if (authError) throw authError;
  const user = authData.user;
  if (!user) throw new Error("Không tạo được tài khoản");

  // 2. Create profile
  const { error: profileError } = await supabase.from("profiles").insert({
    id: user.id,
    phone: e164,
  });
  if (profileError) throw profileError;

  // 3. Generate share code & create default fridge
  const shareCode = generateCode();
  const { error: fridgeError } = await supabase.from("fridges").insert({
    name: "Tủ lạnh gia đình",
    owner_id: user.id,
    share_code: shareCode,
  });
  if (fridgeError) throw fridgeError;

  return authData;
}

export async function signIn(phone: string, password: string) {
  const e164 = toE164(phone);
  const { data, error } = await supabase.auth.signInWithPassword({
    phone: e164,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

// ── Profile ─────────────────────────────────────────────────────
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}

// ── Fridges ─────────────────────────────────────────────────────
export async function getMyFridges(userId: string) {
  // Owned fridges
  const { data: owned, error: ownedError } = await supabase
    .from("fridges")
    .select("*")
    .eq("owner_id", userId);
  if (ownedError) throw ownedError;

  // Joined fridges (via fridge_access)
  const { data: access, error: accessError } = await supabase
    .from("fridge_access")
    .select("fridge_id")
    .eq("user_id", userId);
  if (accessError) throw accessError;

  const joinedIds = access?.map((a: { fridge_id: string }) => a.fridge_id) ?? [];
  let joined: Array<Record<string, unknown>> = [];
  if (joinedIds.length > 0) {
    const { data: joinedData, error: joinedError } = await supabase
      .from("fridges")
      .select("*")
      .in("id", joinedIds);
    if (joinedError) throw joinedError;
    joined = joinedData ?? [];
  }

  return {
    owned: owned ?? [],
    joined,
  };
}

export async function createFridge(userId: string, name: string) {
  const shareCode = generateCode();
  const { data, error } = await supabase
    .from("fridges")
    .insert({ name, owner_id: userId, share_code: shareCode })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getFridgeByCode(code: string) {
  const { data, error } = await supabase
    .from("fridges")
    .select("*")
    .eq("share_code", code.toUpperCase())
    .single();
  if (error) throw error;
  return data;
}

export async function joinFridgeByCode(userId: string, code: string) {
  // Find fridge
  const fridge = await getFridgeByCode(code);

  // Don't join your own fridge
  if (fridge.owner_id === userId) {
    throw new Error("Đây là tủ lạnh của bạn");
  }

  // Insert access record (ignore if already joined)
  const { error } = await supabase
    .from("fridge_access")
    .upsert({ fridge_id: fridge.id, user_id: userId });
  if (error) throw error;

  return fridge;
}

export async function getFridgeMemberCount(fridgeId: string): Promise<number> {
  const { count, error } = await supabase
    .from("fridge_access")
    .select("*", { count: "exact", head: true })
    .eq("fridge_id", fridgeId);
  if (error) return 0;
  return (count ?? 0) + 1; // +1 for owner
}

// ── Food Items ──────────────────────────────────────────────────
export type DbFoodItem = {
  id: string;
  fridge_id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  expiry_date: string;
  notes?: string;
  added_by?: string;
  created_at: string;
};

export async function getFoodItems(fridgeId: string): Promise<DbFoodItem[]> {
  const { data, error } = await supabase
    .from("food_items")
    .select("*")
    .eq("fridge_id", fridgeId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addFoodItem(
  fridgeId: string,
  item: Omit<FoodItem, "id">,
  addedBy?: string
) {
  const { data, error } = await supabase
    .from("food_items")
    .insert({
      fridge_id: fridgeId,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      expiry_date: item.expiryDate,
      notes: item.notes,
      added_by: addedBy,
    })
    .select()
    .single();
  if (error) throw error;
  return data as DbFoodItem;
}

export async function updateFoodItem(id: string, item: Partial<FoodItem>) {
  const update: Record<string, unknown> = {};
  if (item.name !== undefined) update.name = item.name;
  if (item.category !== undefined) update.category = item.category;
  if (item.quantity !== undefined) update.quantity = item.quantity;
  if (item.unit !== undefined) update.unit = item.unit;
  if (item.expiryDate !== undefined) update.expiry_date = item.expiryDate;
  if (item.notes !== undefined) update.notes = item.notes;

  const { error } = await supabase.from("food_items").update(update).eq("id", id);
  if (error) throw error;
}

export async function deleteFoodItem(id: string) {
  const { error } = await supabase.from("food_items").delete().eq("id", id);
  if (error) throw error;
}

// ── Meal Plans ──────────────────────────────────────────────────
export type DbMealPlan = {
  id: string;
  fridge_id: string;
  date: string;
  type: string;
  name: string;
  notes?: string;
  created_at: string;
};

export async function getMealPlans(fridgeId: string): Promise<DbMealPlan[]> {
  const { data, error } = await supabase
    .from("meal_plans")
    .select("*")
    .eq("fridge_id", fridgeId)
    .order("date", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addMealPlan(fridgeId: string, meal: Omit<MealPlan, "id" | "ingredientIds">) {
  const { data, error } = await supabase
    .from("meal_plans")
    .insert({
      fridge_id: fridgeId,
      date: meal.date,
      type: meal.type,
      name: meal.mealName,
    })
    .select()
    .single();
  if (error) throw error;
  return data as DbMealPlan;
}

export async function deleteMealPlan(id: string) {
  const { error } = await supabase.from("meal_plans").delete().eq("id", id);
  if (error) throw error;
}

// ── Shopping Items ──────────────────────────────────────────────
export type DbShoppingItem = {
  id: string;
  fridge_id: string;
  name: string;
  category?: string;
  quantity?: number;
  unit?: string;
  checked: boolean;
  created_at: string;
};

export async function getShoppingItems(fridgeId: string): Promise<DbShoppingItem[]> {
  const { data, error } = await supabase
    .from("shopping_items")
    .select("*")
    .eq("fridge_id", fridgeId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addShoppingItem(fridgeId: string, item: Omit<ShoppingItem, "id">) {
  const { data, error } = await supabase
    .from("shopping_items")
    .insert({
      fridge_id: fridgeId,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      checked: item.checked,
    })
    .select()
    .single();
  if (error) throw error;
  return data as DbShoppingItem;
}

export async function toggleShoppingItem(id: string, checked: boolean) {
  const { error } = await supabase
    .from("shopping_items")
    .update({ checked })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteShoppingItem(id: string) {
  const { error } = await supabase.from("shopping_items").delete().eq("id", id);
  if (error) throw error;
}

export async function clearCheckedShoppingItems(fridgeId: string) {
  const { error } = await supabase
    .from("shopping_items")
    .delete()
    .eq("fridge_id", fridgeId)
    .eq("checked", true);
  if (error) throw error;
}

// ── Real-time subscriptions ─────────────────────────────────────
export function subscribeFoodItems(
  fridgeId: string,
  onInsert: (item: DbFoodItem) => void,
  onUpdate: (item: DbFoodItem) => void,
  onDelete: (id: string) => void
) {
  return supabase
    .channel(`food_items:${fridgeId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "food_items", filter: `fridge_id=eq.${fridgeId}` },
      (payload) => onInsert(payload.new as DbFoodItem)
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "food_items", filter: `fridge_id=eq.${fridgeId}` },
      (payload) => onUpdate(payload.new as DbFoodItem)
    )
    .on(
      "postgres_changes",
      { event: "DELETE", schema: "public", table: "food_items", filter: `fridge_id=eq.${fridgeId}` },
      (payload) => onDelete((payload.old as { id: string }).id)
    )
    .subscribe();
}

export function subscribeMealPlans(
  fridgeId: string,
  onInsert: (item: DbMealPlan) => void,
  onDelete: (id: string) => void
) {
  return supabase
    .channel(`meal_plans:${fridgeId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "meal_plans", filter: `fridge_id=eq.${fridgeId}` },
      (payload) => onInsert(payload.new as DbMealPlan)
    )
    .on(
      "postgres_changes",
      { event: "DELETE", schema: "public", table: "meal_plans", filter: `fridge_id=eq.${fridgeId}` },
      (payload) => onDelete((payload.old as { id: string }).id)
    )
    .subscribe();
}

export function subscribeShoppingItems(
  fridgeId: string,
  onInsert: (item: DbShoppingItem) => void,
  onUpdate: (item: DbShoppingItem) => void,
  onDelete: (id: string) => void
) {
  return supabase
    .channel(`shopping_items:${fridgeId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "shopping_items", filter: `fridge_id=eq.${fridgeId}` },
      (payload) => onInsert(payload.new as DbShoppingItem)
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "shopping_items", filter: `fridge_id=eq.${fridgeId}` },
      (payload) => onUpdate(payload.new as DbShoppingItem)
    )
    .on(
      "postgres_changes",
      { event: "DELETE", schema: "public", table: "shopping_items", filter: `fridge_id=eq.${fridgeId}` },
      (payload) => onDelete((payload.old as { id: string }).id)
    )
    .subscribe();
}

// ── Helpers ──────────────────────────────────────────────────────
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Convert DB food item → app FoodItem
export function dbFoodToApp(db: DbFoodItem): FoodItem {
  return {
    id: db.id,
    name: db.name,
    quantity: db.quantity,
    unit: db.unit,
    category: db.category as FoodItem["category"],
    purchaseDate: db.created_at.slice(0, 10),
    expiryDate: db.expiry_date,
    notes: db.notes,
  };
}

// Convert DB meal plan → app MealPlan
export function dbMealToApp(db: DbMealPlan): MealPlan {
  return {
    id: db.id,
    date: db.date,
    type: db.type as MealPlan["type"],
    mealName: db.name,
    ingredientIds: [],
  };
}

// Convert DB shopping item → app ShoppingItem
export function dbShoppingToApp(db: DbShoppingItem): ShoppingItem {
  return {
    id: db.id,
    name: db.name,
    quantity: db.quantity ?? 1,
    unit: db.unit ?? "cái",
    category: (db.category as ShoppingItem["category"]) ?? "khac",
    checked: db.checked,
  };
}
