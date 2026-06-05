import type {
  Recipe, FoodItem, RecipePurpose, ScoredCombo, ScoredRecipe, MissingIngredient,
} from "../types";
import { scoreRecipeAgainstFridge } from "./ingredientMatcher";
import { generateId } from "../utils";

function scoreRecipe(recipe: Recipe, foods: FoodItem[]): ScoredRecipe {
  const { matches, availableCount, totalRequired, score, expiryBonus } =
    scoreRecipeAgainstFridge(recipe, foods);
  return { recipe, matches, availableCount, totalRequired, score, expiryBonus };
}

function collectMissing(scored: ScoredRecipe): MissingIngredient[] {
  return scored.matches
    .filter((m) => !m.fridgeItem && !m.ingredient.optional)
    .map((m) => ({
      name: m.ingredient.name,
      quantity: m.ingredient.quantity,
      unit: m.ingredient.unit,
      forRecipe: scored.recipe.name,
      optional: false,
    }));
}

function comboScore(c: ScoredCombo): number {
  return (
    (c.canh.score + c.rau.score + c.chinh.score + c.phu.score) / 4 +
    (c.canh.expiryBonus + c.rau.expiryBonus + c.chinh.expiryBonus + c.phu.expiryBonus)
  );
}

export function suggestMeals(
  recipes: Recipe[],
  foods: FoodItem[],
): Record<RecipePurpose, ScoredCombo[]> {
  const purposes: RecipePurpose[] = ["com_gia_dinh", "healthy", "dac_biet"];
  const result = {} as Record<RecipePurpose, ScoredCombo[]>;

  for (const purpose of purposes) {
    const byRole = {
      canh: recipes.filter((r) => r.role === "canh" && r.purpose === purpose),
      rau:  recipes.filter((r) => r.role === "rau"  && r.purpose === purpose),
      chinh: recipes.filter((r) => r.role === "chinh" && r.purpose === purpose),
      phu:  recipes.filter((r) => r.role === "phu"  && r.purpose === purpose),
    };

    // Fallback: nếu không có đủ cho purpose này, bổ sung từ com_gia_dinh
    if (purpose !== "com_gia_dinh") {
      const fallback = "com_gia_dinh" as RecipePurpose;
      if (byRole.canh.length === 0)  byRole.canh  = recipes.filter((r) => r.role === "canh"  && r.purpose === fallback);
      if (byRole.rau.length === 0)   byRole.rau   = recipes.filter((r) => r.role === "rau"   && r.purpose === fallback);
      if (byRole.chinh.length === 0) byRole.chinh = recipes.filter((r) => r.role === "chinh" && r.purpose === fallback);
      if (byRole.phu.length === 0)   byRole.phu   = recipes.filter((r) => r.role === "phu"   && r.purpose === fallback);
    }

    // Score tất cả recipe trong từng role
    const scored = {
      canh:  byRole.canh.map((r) => scoreRecipe(r, foods)).sort((a, b) => (b.score + b.expiryBonus) - (a.score + a.expiryBonus)),
      rau:   byRole.rau.map((r)  => scoreRecipe(r, foods)).sort((a, b) => (b.score + b.expiryBonus) - (a.score + a.expiryBonus)),
      chinh: byRole.chinh.map((r) => scoreRecipe(r, foods)).sort((a, b) => (b.score + b.expiryBonus) - (a.score + a.expiryBonus)),
      phu:   byRole.phu.map((r)  => scoreRecipe(r, foods)).sort((a, b) => (b.score + b.expiryBonus) - (a.score + a.expiryBonus)),
    };

    if (!scored.canh.length || !scored.rau.length || !scored.chinh.length || !scored.phu.length) {
      result[purpose] = [];
      continue;
    }

    // Tạo tối đa 3 combo đa dạng (tránh trùng món chính)
    const combos: ScoredCombo[] = [];
    const usedChinh = new Set<string>();
    const usedCanh = new Set<string>();

    for (let i = 0; combos.length < 3; i++) {
      const canh  = scored.canh.find((r)  => !usedCanh.has(r.recipe.id))  ?? scored.canh[0];
      const chinh = scored.chinh.find((r) => !usedChinh.has(r.recipe.id)) ?? scored.chinh[i % scored.chinh.length];
      const rau   = scored.rau[i % scored.rau.length];
      const phu   = scored.phu[i % scored.phu.length];

      if (i >= Math.max(scored.canh.length, scored.chinh.length, scored.rau.length, scored.phu.length, 3)) break;

      usedChinh.add(chinh.recipe.id);
      usedCanh.add(canh.recipe.id);

      const missing: MissingIngredient[] = [
        ...collectMissing(canh),
        ...collectMissing(rau),
        ...collectMissing(chinh),
        ...collectMissing(phu),
      ];

      const combo: ScoredCombo = {
        id: generateId(),
        purpose,
        canh, rau, chinh, phu,
        totalScore: 0,
        missingIngredients: missing,
      };
      combo.totalScore = comboScore(combo);
      combos.push(combo);
    }

    result[purpose] = combos.sort((a, b) => b.totalScore - a.totalScore);
  }

  return result;
}
