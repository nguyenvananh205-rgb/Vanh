import { useState, useMemo } from "react";
import { Plus, Trash2, ShoppingCart, Check, RotateCcw, ChevronDown, ChevronUp, Sparkles, AlertTriangle, Info } from "lucide-react";
import type { ShoppingItem, FoodCategory, FoodItem, MealPlan, Recipe } from "../types";
import { CATEGORY_LABELS, CATEGORY_COLORS, generateId } from "../utils";
import {
  getNextWeekShoppingNeeds,
  checkQuantityAgainstPlan,
  isNeedCovered,
  type ShoppingNeed,
} from "../utils/shoppingRecommendations";

interface Props {
  items: ShoppingItem[];
  foods: FoodItem[];
  meals: MealPlan[];
  recipes: Recipe[];
  onAdd: (item: ShoppingItem) => void;
  onAddMany: (items: ShoppingItem[]) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onClearChecked: () => void;
}

const UNITS = ["gram", "kg", "ml", "lít", "hộp", "cái", "bó", "ổ", "quả", "túi", "lon", "chai", "tép", "củ", "miếng", "cây"];

function needToShoppingItem(need: ShoppingNeed): ShoppingItem {
  return {
    id: generateId(),
    name: need.name,
    quantity: need.quantityNeeded,
    unit: need.unit,
    category: need.category,
    checked: false,
  };
}

export default function ShoppingList({ items, foods, meals, recipes, onAdd, onAddMany, onToggle, onDelete, onClearChecked }: Props) {
  const [form, setForm] = useState({ name: "", quantity: 1, unit: "gram", category: "khac" as FoodCategory });
  const [showForm, setShowForm] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const { needs, isFallback, weekLabel } = useMemo(
    () => getNextWeekShoppingNeeds(meals, recipes, foods),
    [meals, recipes, foods],
  );

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  const uncoveredNeeds = needs.filter((n) => !isNeedCovered(n, items));
  const coveredNeeds = needs.filter((n) => isNeedCovered(n, items));

  const warning = useMemo(
    () => checkQuantityAgainstPlan(form.name, form.quantity, form.unit, needs),
    [form.name, form.quantity, form.unit, needs],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onAdd({
      id: generateId(),
      name: form.name.trim(),
      quantity: form.quantity,
      unit: form.unit,
      category: form.category,
      checked: false,
    });
    setForm({ name: "", quantity: 1, unit: "gram", category: "khac" });
    setShowForm(false);
  };

  const handleAddNeed = (need: ShoppingNeed) => {
    onAdd(needToShoppingItem(need));
  };

  const handleAddAllNeeds = () => {
    onAddMany(uncoveredNeeds.map(needToShoppingItem));
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-100 text-emerald-700 rounded-full px-3 py-1 text-sm font-medium">
            {unchecked.length} món cần mua
          </div>
          {checked.length > 0 && (
            <div className="bg-slate-100 text-slate-500 rounded-full px-3 py-1 text-sm">
              {checked.length} đã mua
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {checked.length > 0 && (
            <button
              onClick={onClearChecked}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50"
            >
              <RotateCcw size={14} /> Xóa đã mua
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} /> Thêm món
          </button>
        </div>
      </div>

      {/* Suggestions panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowSuggestions((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-blue-100/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-blue-600" />
            <span className="text-sm font-semibold text-blue-800">
              Gợi ý mua sắm theo thực đơn
            </span>
            <span className="text-xs bg-blue-200 text-blue-700 px-2 py-0.5 rounded-full">
              {weekLabel}
            </span>
            {isFallback && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">mặc định</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {uncoveredNeeds.length > 0 && (
              <span className="text-xs font-medium text-blue-700">{uncoveredNeeds.length} món còn thiếu</span>
            )}
            {showSuggestions ? <ChevronUp size={16} className="text-blue-500" /> : <ChevronDown size={16} className="text-blue-500" />}
          </div>
        </button>

        {showSuggestions && (
          <div className="px-4 pb-4">
            {isFallback && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                Chưa có thực đơn trong 7 ngày tới — hiển thị nguyên liệu đủ cho <strong>3 bữa tối 2 người</strong> theo gợi ý của app.
              </p>
            )}

            {needs.length === 0 && (
              <p className="text-sm text-blue-600 py-2">✓ Tủ lạnh đã đủ nguyên liệu cho thực đơn tuần tới!</p>
            )}

            {uncoveredNeeds.length > 0 && (
              <>
                <div className="space-y-1.5 mb-3">
                  {uncoveredNeeds.map((need) => (
                    <div key={need.name} className="flex items-center justify-between bg-white rounded-xl border border-blue-100 px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-slate-800 text-sm">{need.name}</span>
                        <span className="text-blue-700 text-xs font-semibold ml-2">
                          {need.quantityNeeded} {need.unit}
                        </span>
                        {need.inFridge > 0 && (
                          <span className="text-slate-400 text-xs ml-1">(có {need.inFridge} {need.unit})</span>
                        )}
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {need.forMeals.slice(0, 2).join(", ")}{need.forMeals.length > 2 ? ` +${need.forMeals.length - 2}` : ""}
                        </p>
                      </div>
                      <button
                        onClick={() => handleAddNeed(need)}
                        className="ml-3 shrink-0 w-7 h-7 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleAddAllNeeds}
                  className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={14} />
                  Thêm tất cả {uncoveredNeeds.length} món vào giỏ
                </button>
              </>
            )}

            {coveredNeeds.length > 0 && (
              <div className="mt-2 pt-2 border-t border-blue-100">
                <p className="text-xs text-blue-600 mb-1.5 flex items-center gap-1">
                  <Check size={11} /> Đã có trong danh sách ({coveredNeeds.length} món):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {coveredNeeds.map((n) => (
                    <span key={n.name} className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full line-through opacity-70">
                      {n.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Shopping list */}
      {items.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <ShoppingCart size={40} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nhấn gợi ý bên trên hoặc thêm thủ công</p>
        </div>
      ) : (
        <div className="space-y-4">
          {unchecked.length > 0 && (
            <div className="space-y-2">
              {unchecked.map((item) => (
                <ShoppingRow key={item.id} item={item} onToggle={onToggle} onDelete={onDelete} />
              ))}
            </div>
          )}
          {checked.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1">
                <Check size={12} /> Đã mua
              </p>
              <div className="space-y-2 opacity-60">
                {checked.map((item) => (
                  <ShoppingRow key={item.id} item={item} onToggle={onToggle} onDelete={onDelete} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-md p-5">
            <h3 className="text-base font-semibold text-slate-800 mb-4">Thêm vào danh sách mua</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700">Tên thực phẩm</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Vd: Thịt gà, Rau cải..."
                  className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700">Số lượng</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={form.quantity}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: parseFloat(e.target.value) || 1 }))}
                    className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Đơn vị</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                    className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                  >
                    {UNITS.map((u) => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              {/* Quantity warning */}
              {form.name.trim() && warning && (
                <div className={`flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs ${
                  warning.type === "excess"
                    ? "bg-amber-50 border border-amber-200 text-amber-800"
                    : "bg-slate-50 border border-slate-200 text-slate-600"
                }`}>
                  {warning.type === "excess"
                    ? <AlertTriangle size={13} className="text-amber-600 shrink-0 mt-0.5" />
                    : <Info size={13} className="text-slate-400 shrink-0 mt-0.5" />
                  }
                  <div>
                    <p className="font-medium">{warning.message}</p>
                    {warning.type === "excess" && (
                      <p className="text-amber-700 mt-0.5">Bạn vẫn có thể thêm số lượng theo ý muốn.</p>
                    )}
                    {warning.type === "not_in_plan" && (
                      <p className="text-slate-500 mt-0.5">Vẫn có thể thêm vào giỏ bình thường.</p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-slate-700">Danh mục</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as FoodCategory }))}
                  className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                >
                  {(Object.entries(CATEGORY_LABELS) as [FoodCategory, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">
                  Hủy
                </button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium">
                  Thêm vào giỏ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ShoppingRow({ item, onToggle, onDelete }: {
  item: ShoppingItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className={`flex items-center gap-3 bg-white border border-slate-100 rounded-xl px-4 py-3 ${item.checked ? "line-through" : ""}`}>
      <button
        onClick={() => onToggle(item.id)}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
          item.checked ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 hover:border-emerald-400"
        }`}
      >
        {item.checked && <Check size={12} />}
      </button>
      <div className="flex-1 min-w-0">
        <span className="font-medium text-slate-700 text-sm">{item.name}</span>
        <span className="text-slate-400 text-xs ml-2">{item.quantity} {item.unit}</span>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[item.category]}`}>
        {CATEGORY_LABELS[item.category]}
      </span>
      <button
        onClick={() => onDelete(item.id)}
        className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
