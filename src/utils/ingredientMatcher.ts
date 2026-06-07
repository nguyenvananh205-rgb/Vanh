import type { FoodItem, RecipeIngredient, IngredientMatch } from "../types";
import { getExpiryStatus } from "../utils";

// Synonym groups — bất kỳ từ nào trong cùng group đều tương đương
const SYNONYM_GROUPS: string[][] = [
  ["thịt lợn", "thịt heo", "heo", "lợn", "ba chỉ", "ba rọi", "nạc vai", "thịt băm"],
  ["thịt gà", "gà", "đùi gà", "ức gà", "cánh gà"],
  ["thịt bò", "bò", "thăn bò", "bắp bò"],
  ["cá", "cá thu", "cá hồi", "cá basa", "cá lóc", "cá điêu hồng", "cá chép", "cá trắm"],
  ["tôm", "tôm sú", "tôm thẻ", "tôm tươi"],
  ["trứng", "trứng gà", "trứng vịt"],
  ["đậu phụ", "đậu hũ", "tofu"],
  ["rau muống", "muống"],
  ["bắp cải", "cải bắp"],
  ["cải ngọt", "cải xanh", "cải thìa"],
  ["khổ qua", "mướp đắng", "khổ qua xanh"],
  ["bí đỏ", "bí ngô", "bí đỏ"],
  ["cà chua", "tomato"],
  ["cà rốt", "carrot"],
  ["hành lá", "hành", "hành xanh", "hành tươi"],
  ["hành tây", "hành tây tím"],
  ["tỏi", "garlic"],
  ["gừng", "ginger"],
  ["sả", "sả tươi"],
  ["ớt", "ớt đỏ", "ớt xanh", "ớt hiểm"],
  ["giá đỗ", "giá", "bean sprout"],
  ["đậu đũa", "đậu que"],
  ["dầu ăn", "dầu thực vật"],
  ["nước dừa", "dừa"],
  ["chanh", "chanh tươi"],
  ["rau ngót", "ngót"],
  ["bông cải xanh", "bông cải", "broccoli"],
  ["miến", "miến dong"],
  ["bánh tráng", "bánh đa"],
  ["me", "me chua"],
  ["dứa", "thơm", "khóm"],
];

const synonymMap = new Map<string, string>();
for (const group of SYNONYM_GROUPS) {
  const canonical = group[0];
  for (const word of group) {
    synonymMap.set(normalize(word), canonical);
  }
}

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

export function canonicalize(name: string): string {
  const n = normalize(name);
  // Try exact match first
  if (synonymMap.has(n)) return synonymMap.get(n)!;
  // Try token-by-token
  const tokens = n.split(/\s+/);
  for (const [key, val] of synonymMap) {
    const keyTokens = key.split(/\s+/);
    if (keyTokens.every((t) => tokens.includes(t))) return val;
  }
  return n;
}

// Kiểm tra xem tên nguyên liệu có match với tên thực phẩm trong tủ không
export function namesMatch(ingredientName: string, fridgeName: string): boolean {
  const ci = canonicalize(ingredientName);
  const cf = canonicalize(fridgeName);

  // Exact canonical match
  if (ci === cf) return true;

  // Bidirectional substring after canonicalize
  if (cf.includes(ci) || ci.includes(cf)) return true;

  // Token overlap ≥ 1 significant token (len ≥ 2)
  const ti = ci.split(/\s+/).filter((t) => t.length >= 2);
  const tf = cf.split(/\s+/).filter((t) => t.length >= 2);
  return ti.some((t) => tf.includes(t));
}

// Unit conversion: trả về số lượng quy đổi về cùng đơn vị cơ bản
const TO_BASE: Record<string, number> = {
  kg: 1000, gram: 1, g: 1, gam: 1,
  lít: 1000, lit: 1000, ml: 1,
};

function toBaseUnit(qty: number, unit: string): number | null {
  const factor = TO_BASE[unit.toLowerCase()];
  return factor != null ? qty * factor : null;
}

// Match một nguyên liệu với danh sách thực phẩm trong tủ
export function matchIngredient(
  ingredient: RecipeIngredient,
  fridgeItems: FoodItem[],
): IngredientMatch {
  const available = fridgeItems.filter(
    (f) => getExpiryStatus(f.expiryDate) !== "expired" && namesMatch(ingredient.name, f.name),
  );

  if (available.length === 0) {
    return { ingredient, fridgeItem: null, isPartial: false };
  }

  // Dùng item có nhiều nhất
  const best = available.reduce((a, b) => (a.quantity > b.quantity ? a : b));

  // Kiểm tra đủ số lượng không (nếu cùng đơn vị hoặc convert được)
  const neededBase = toBaseUnit(ingredient.quantity, ingredient.unit);
  const haveBase = toBaseUnit(best.quantity, best.unit);
  let isPartial = false;
  if (neededBase != null && haveBase != null) {
    isPartial = haveBase < neededBase;
  }

  return { ingredient, fridgeItem: best, isPartial };
}

// Score một công thức dựa trên tủ lạnh hiện tại
export function scoreRecipeAgainstFridge(
  recipe: { ingredients: RecipeIngredient[] },
  fridgeItems: FoodItem[],
) {
  const matches = recipe.ingredients.map((ing) => matchIngredient(ing, fridgeItems));
  const required = matches.filter((m) => !m.ingredient.optional);
  const available = required.filter((m) => m.fridgeItem !== null);

  // Expiry bonus: ưu tiên dùng đồ sắp hết hạn
  let expiryBonus = 0;
  for (const m of matches) {
    if (!m.fridgeItem) continue;
    const st = getExpiryStatus(m.fridgeItem.expiryDate);
    if (st === "critical") expiryBonus += 10;
    else if (st === "soon") expiryBonus += 5;
    else if (st === "ok") expiryBonus += 1;
  }

  const score = required.length > 0 ? (available.length / required.length) * 100 : 0;
  return { matches, availableCount: available.length, totalRequired: required.length, score, expiryBonus };
}
