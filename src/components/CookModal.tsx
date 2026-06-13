import { useState } from "react";
import { X, Check, ShoppingCart, ChefHat } from "lucide-react";
import type { ScoredCombo, FoodItem, ShoppingItem, ScoredRecipe } from "../types";
import { generateId } from "../utils";
import { getExpiryStatus } from "../utils";

interface Props {
  combo: ScoredCombo;
  foods: FoodItem[];
  onCook: (updatedFoods: FoodItem[]) => void;
  onAddShopping: (items: ShoppingItem[]) => void;
  onClose: () => void;
}

const ROLE_LABELS = { canh: "🍲 Canh", rau: "🥦 Rau", chinh: "🥩 Chính", phu: "🍳 Phụ" };

const TO_BASE: Record<string, number> = { kg: 1000, gram: 1, g: 1, gam: 1, lạng: 100, lít: 1000, lit: 1000, ml: 1 };
function toBase(qty: number, unit: string) { return (TO_BASE[unit.toLowerCase()] ?? 1) * qty; }

export default function CookModal({ combo, foods, onCook, onAddShopping, onClose }: Props) {
  const dishes: [string, ScoredRecipe][] = [
    ["canh", combo.canh], ["rau", combo.rau], ["chinh", combo.chinh], ["phu", combo.phu],
  ];

  const [servingMultiplier, setServingMultiplier] = useState(1);
  const [confirmed, setConfirmed] = useState(false);

  const handleCook = () => {
    // Deduct ingredients from fridge
    let updatedFoods = [...foods];

    for (const [, scored] of dishes) {
      for (const match of scored.matches) {
        if (!match.fridgeItem) continue;
        const needed = match.ingredient.quantity * servingMultiplier;
        const item = updatedFoods.find((f) => f.id === match.fridgeItem!.id);
        if (!item) continue;

        const neededBase = toBase(needed, match.ingredient.unit);
        const haveBase = toBase(item.quantity, item.unit);
        const remaining = haveBase - neededBase;

        // Convert back to original unit
        const unitFactor = TO_BASE[item.unit.toLowerCase()] ?? 1;
        const newQty = remaining / unitFactor;

        if (newQty <= 0.01) {
          updatedFoods = updatedFoods.filter((f) => f.id !== item.id);
        } else {
          updatedFoods = updatedFoods.map((f) =>
            f.id === item.id ? { ...f, quantity: Math.round(newQty * 10) / 10 } : f
          );
        }
      }
    }

    onCook(updatedFoods);
    setConfirmed(true);
  };

  const handleAddMissingToShopping = () => {
    const items: ShoppingItem[] = combo.missingIngredients.map((mi) => ({
      id: generateId(),
      name: mi.name,
      quantity: mi.quantity * servingMultiplier,
      unit: mi.unit,
      category: "khac",
      checked: false,
    }));
    onAddShopping(items);
    onClose();
  };

  if (confirmed) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Chúc ngon miệng! 🍽️</h3>
          <p className="text-sm text-slate-500 mb-6">Nguyên liệu đã được trừ khỏi tủ lạnh</p>
          <button onClick={onClose} className="w-full py-3 bg-emerald-500 text-white rounded-xl font-medium">
            Đóng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <ChefHat size={20} className="text-emerald-500" />
            <h2 className="text-base font-bold text-slate-800">Chuẩn bị nấu</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl">
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        {/* Dish names */}
        <div className="px-5 py-3 bg-emerald-50 shrink-0">
          <div className="flex flex-wrap gap-2">
            {dishes.map(([role, scored]) => (
              <span key={role} className="text-xs bg-white border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded-full font-medium">
                {ROLE_LABELS[role as keyof typeof ROLE_LABELS]} {scored.recipe.name}
              </span>
            ))}
          </div>
        </div>

        {/* Serving selector */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3 shrink-0">
          <span className="text-sm text-slate-600 font-medium">Khẩu phần:</span>
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              onClick={() => setServingMultiplier(n)}
              className={`px-3 py-1 rounded-lg text-sm font-medium border transition-colors ${
                servingMultiplier === n
                  ? "bg-emerald-500 text-white border-emerald-500"
                  : "border-slate-200 text-slate-600 hover:border-emerald-300"
              }`}
            >
              {n}x
            </button>
          ))}
          <span className="text-xs text-slate-400">({combo.canh.recipe.servings * servingMultiplier} người)</span>
        </div>

        {/* Ingredient list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {dishes.map(([role, scored]) => (
            <div key={role}>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                {ROLE_LABELS[role as keyof typeof ROLE_LABELS]} — {scored.recipe.name}
              </h4>
              <div className="space-y-1.5">
                {scored.matches.map((m, i) => {
                  const needed = m.ingredient.quantity * servingMultiplier;
                  const inFridge = !!m.fridgeItem;
                  const expiring = inFridge && (getExpiryStatus(m.fridgeItem!.expiryDate) === "critical" || getExpiryStatus(m.fridgeItem!.expiryDate) === "soon");
                  return (
                    <div key={i} className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                      m.ingredient.optional ? "opacity-60" : ""
                    } ${inFridge ? (expiring ? "bg-yellow-50 border border-yellow-200" : "bg-emerald-50 border border-emerald-100") : "bg-red-50 border border-red-100"}`}>
                      <div className="flex items-center gap-2">
                        <span className={inFridge ? "text-emerald-600" : "text-red-500"}>
                          {inFridge ? "✓" : "✗"}
                        </span>
                        <span className={inFridge ? "text-slate-700" : "text-red-700"}>
                          {m.ingredient.name}
                          {m.ingredient.optional && <span className="text-slate-400 ml-1">(tùy chọn)</span>}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-medium ${inFridge ? "text-slate-600" : "text-red-500"}`}>
                          {needed} {m.ingredient.unit}
                        </span>
                        {inFridge && (
                          <div className="text-xs text-slate-400">
                            Có: {m.fridgeItem!.quantity} {m.fridgeItem!.unit}
                            {expiring && " ⚡"}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-4 border-t border-slate-100 space-y-2 shrink-0">
          {combo.missingIngredients.length > 0 && (
            <button
              onClick={handleAddMissingToShopping}
              className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <ShoppingCart size={15} />
              Thêm {combo.missingIngredients.filter(m => !m.optional).length} nguyên liệu thiếu vào giỏ mua
            </button>
          )}
          <button
            onClick={handleCook}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <ChefHat size={16} />
            Xác nhận nấu — trừ nguyên liệu tủ lạnh
          </button>
        </div>
      </div>
    </div>
  );
}
