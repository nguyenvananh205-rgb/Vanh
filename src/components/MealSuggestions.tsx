import { useMemo, useState } from "react";
import { Lightbulb, ChefHat, ShoppingCart, UtensilsCrossed, BookOpen, Clock, Users, AlertCircle } from "lucide-react";
import type { FoodItem, Recipe, RecipePurpose, ScoredCombo, ShoppingItem } from "../types";
import { suggestMeals } from "../utils/mealScorer";
import { getDaysUntilExpiry, getExpiryStatus } from "../utils";
import CookModal from "./CookModal";
import ReadyFoodModal from "./ReadyFoodModal";
import RecipeManager from "./RecipeManager";

interface Props {
  foods: FoodItem[];
  recipes: Recipe[];
  onCook: (updatedFoods: FoodItem[]) => void;
  onAddShopping: (items: ShoppingItem[]) => void;
  onAddFood: (item: FoodItem) => void;
  onSaveRecipes: (recipes: Recipe[]) => void;
}

const PURPOSE_LABELS: Record<RecipePurpose, string> = {
  com_gia_dinh: "🏠 Cơm gia đình",
  healthy: "🥗 Healthy",
  dac_biet: "✨ Đặc biệt",
};

const PURPOSES: RecipePurpose[] = ["com_gia_dinh", "healthy", "dac_biet"];

const ROLE_COLORS = {
  canh: "bg-blue-50 text-blue-700 border-blue-200",
  rau: "bg-green-50 text-green-700 border-green-200",
  chinh: "bg-orange-50 text-orange-700 border-orange-200",
  phu: "bg-purple-50 text-purple-700 border-purple-200",
};

const ROLE_LABELS = { canh: "Canh", rau: "Rau", chinh: "Chính", phu: "Phụ" };

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.round(score));
  const color = pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-slate-600 w-8 text-right">{pct}%</span>
    </div>
  );
}

function ComboCard({
  combo,
  onCook,
  onAddShopping,
}: {
  combo: ScoredCombo;
  onCook: (combo: ScoredCombo) => void;
  onAddShopping: (combo: ScoredCombo) => void;
}) {
  const dishes = [
    { role: "canh" as const, scored: combo.canh },
    { role: "rau" as const, scored: combo.rau },
    { role: "chinh" as const, scored: combo.chinh },
    { role: "phu" as const, scored: combo.phu },
  ];

  const totalCookTime = dishes.reduce((s, d) => s + d.scored.recipe.cookTime, 0);
  const missingRequired = combo.missingIngredients.filter((m) => !m.optional);
  const canCookNow = missingRequired.length === 0;

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
      {/* Score header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock size={12} />
            <span>~{totalCookTime} phút</span>
            <Users size={12} className="ml-1" />
            <span>{combo.canh.recipe.servings} người</span>
          </div>
          <div className={`text-xs font-semibold px-2 py-0.5 rounded-full ${canCookNow ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
            {canCookNow ? "✓ Đủ nguyên liệu" : `Thiếu ${missingRequired.length} món`}
          </div>
        </div>
        <ScoreBar score={combo.totalScore} />
      </div>

      {/* Dish grid */}
      <div className="px-4 pb-3 grid grid-cols-2 gap-2">
        {dishes.map(({ role, scored }) => {
          const missing = scored.matches.filter((m) => !m.fridgeItem && !m.ingredient.optional).length;
          return (
            <div key={role} className={`border rounded-xl px-3 py-2.5 ${ROLE_COLORS[role]}`}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{ROLE_LABELS[role]}</span>
                {missing > 0 && <span className="text-[10px] opacity-70">−{missing}</span>}
              </div>
              <p className="text-xs font-semibold leading-tight">{scored.recipe.name}</p>
              <p className="text-[10px] opacity-60 mt-0.5">{scored.availableCount}/{scored.totalRequired} nguyên liệu</p>
            </div>
          );
        })}
      </div>

      {/* Missing ingredients */}
      {missingRequired.length > 0 && (
        <div className="mx-4 mb-3 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          <p className="text-xs font-medium text-red-700 mb-1.5 flex items-center gap-1">
            <AlertCircle size={11} /> Cần mua thêm:
          </p>
          <div className="flex flex-wrap gap-1">
            {missingRequired.map((m, i) => (
              <span key={i} className="text-xs bg-white border border-red-200 text-red-700 px-2 py-0.5 rounded-full">
                {m.name} ({m.quantity} {m.unit})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2">
        {missingRequired.length > 0 && (
          <button
            onClick={() => onAddShopping(combo)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 border-2 border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ShoppingCart size={13} />
            Thêm vào giỏ
          </button>
        )}
        <button
          onClick={() => onCook(combo)}
          className="flex-[2] flex items-center justify-center gap-1.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold transition-colors"
        >
          <ChefHat size={13} />
          Nấu bữa này
        </button>
      </div>
    </div>
  );
}

export default function MealSuggestions({ foods, recipes, onCook, onAddShopping, onAddFood, onSaveRecipes }: Props) {
  const [activePurpose, setActivePurpose] = useState<RecipePurpose>("com_gia_dinh");
  const [cookingCombo, setCookingCombo] = useState<ScoredCombo | null>(null);
  const [showReadyFood, setShowReadyFood] = useState(false);
  const [showRecipeManager, setShowRecipeManager] = useState(false);

  const suggestionsByPurpose = useMemo(() => suggestMeals(recipes, foods), [recipes, foods]);

  const urgentFoods = foods
    .filter((f) => {
      const s = getExpiryStatus(f.expiryDate);
      return s === "critical" || s === "soon";
    })
    .sort((a, b) => getDaysUntilExpiry(a.expiryDate) - getDaysUntilExpiry(b.expiryDate));

  const combos = suggestionsByPurpose[activePurpose] ?? [];

  const handleAddShoppingFromCombo = (combo: ScoredCombo) => {
    const items: ShoppingItem[] = combo.missingIngredients
      .filter((m) => !m.optional)
      .map((m) => ({
        id: Math.random().toString(36).slice(2),
        name: m.name,
        quantity: m.quantity,
        unit: m.unit,
        category: "khac" as const,
        checked: false,
      }));
    onAddShopping(items);
  };

  return (
    <div className="space-y-5">
      {/* Urgent alert */}
      {urgentFoods.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="font-semibold text-amber-800 mb-2 flex items-center gap-2 text-sm">
            <span>⚡</span> Cần dùng sớm
          </h3>
          <div className="flex flex-wrap gap-2">
            {urgentFoods.map((f) => {
              const days = getDaysUntilExpiry(f.expiryDate);
              return (
                <span key={f.id} className="bg-white border border-amber-200 rounded-lg px-2.5 py-1 text-sm">
                  <span className="font-medium text-slate-700">{f.name}</span>
                  <span className="text-amber-600 ml-1 text-xs">
                    {days <= 0 ? "(hôm nay!)" : `(còn ${days}n)`}
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="font-semibold text-slate-700 flex items-center gap-1.5 text-sm">
          <Lightbulb size={16} className="text-emerald-500" />
          Gợi ý bữa ăn hôm nay
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowReadyFood(true)}
            className="flex items-center gap-1 text-xs border border-slate-200 px-2.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <UtensilsCrossed size={13} />
            Đồ ăn sẵn
          </button>
          <button
            onClick={() => setShowRecipeManager(true)}
            className="flex items-center gap-1 text-xs border border-slate-200 px-2.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <BookOpen size={13} />
            Công thức ({recipes.length})
          </button>
        </div>
      </div>

      {/* Purpose tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
        {PURPOSES.map((p) => (
          <button
            key={p}
            onClick={() => setActivePurpose(p)}
            className={`flex-1 text-xs py-2 px-1 rounded-lg font-medium transition-colors ${
              activePurpose === p ? "bg-white shadow-sm text-emerald-700" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {PURPOSE_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Combo cards */}
      {combos.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <ChefHat size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Chưa đủ công thức</p>
          <p className="text-xs mt-1">Cần ít nhất 1 công thức cho mỗi loại: Canh, Rau, Chính, Phụ</p>
          <button
            onClick={() => setShowRecipeManager(true)}
            className="mt-4 text-xs text-emerald-600 border border-emerald-200 px-4 py-2 rounded-lg hover:bg-emerald-50 transition-colors"
          >
            Quản lý công thức
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {combos.map((combo) => (
            <ComboCard
              key={combo.id}
              combo={combo}
              onCook={setCookingCombo}
              onAddShopping={handleAddShoppingFromCombo}
            />
          ))}
        </div>
      )}

      {/* Footer tips */}
      <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600">
        <p className="font-medium mb-1.5 text-xs">💡 Cách đọc điểm gợi ý</p>
        <ul className="space-y-1 text-xs text-slate-500">
          <li>• Điểm cao = nhiều nguyên liệu có sẵn trong tủ</li>
          <li>• Ưu tiên dùng đồ sắp hết hạn (⚡)</li>
          <li>• Nhấn "Nấu bữa này" để trừ nguyên liệu khỏi tủ</li>
          <li>• Có đồ ăn dư? Nhấn "Đồ ăn sẵn" để thêm vào tủ</li>
        </ul>
      </div>

      {/* Modals */}
      {cookingCombo && (
        <CookModal
          combo={cookingCombo}
          foods={foods}
          onCook={onCook}
          onAddShopping={onAddShopping}
          onClose={() => setCookingCombo(null)}
        />
      )}
      {showReadyFood && (
        <ReadyFoodModal
          onAdd={onAddFood}
          onClose={() => setShowReadyFood(false)}
        />
      )}
      {showRecipeManager && (
        <RecipeManager
          recipes={recipes}
          onSave={onSaveRecipes}
          onClose={() => setShowRecipeManager(false)}
        />
      )}
    </div>
  );
}
