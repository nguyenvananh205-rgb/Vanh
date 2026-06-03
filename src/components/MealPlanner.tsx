import { useState, useMemo } from "react";
import { Plus, Trash2, CalendarDays } from "lucide-react";
import { format, startOfWeek, addDays, parseISO } from "date-fns";
import type { FoodItem, MealPlan, MealType } from "../types";
import { generateId } from "../utils";

interface Props {
  foods: FoodItem[];
  meals: MealPlan[];
  onAdd: (meal: MealPlan) => void;
  onDelete: (id: string) => void;
}

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  bua_trua: "🍱 Bữa trưa",
  bua_toi: "🍽️ Bữa tối",
  trang_miem: "🍮 Tráng miệng",
};

const MEAL_TYPE_COLORS: Record<MealType, string> = {
  bua_trua: "bg-blue-50 border-blue-200 text-blue-700",
  bua_toi: "bg-emerald-50 border-emerald-200 text-emerald-700",
  trang_miem: "bg-pink-50 border-pink-200 text-pink-700",
};

const MEAL_SUGGESTIONS = [
  "Cơm rang", "Phở bò", "Bún bò", "Canh chua", "Thịt kho trứng",
  "Cá hấp gừng", "Rau muống xào tỏi", "Đậu phụ sốt cà chua",
  "Gà nướng mật ong", "Bò xào bông cải", "Súp bí đỏ",
  "Bánh flan", "Chè đậu xanh", "Hoa quả dầm",
];

export default function MealPlanner({ foods, meals, onAdd, onDelete }: Props) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [form, setForm] = useState<{ date: string; type: MealType; name: string; ingredientIds: string[] }>({
    date: format(new Date(), "yyyy-MM-dd"),
    type: "bua_toi",
    name: "",
    ingredientIds: [],
  });
  const [showForm, setShowForm] = useState(false);

  const weekStart = startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const mealsByDate = useMemo(() => {
    const map: Record<string, MealPlan[]> = {};
    meals.forEach((m) => {
      if (!map[m.date]) map[m.date] = [];
      map[m.date].push(m);
    });
    return map;
  }, [meals]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onAdd({
      id: generateId(),
      date: form.date,
      type: form.type,
      mealName: form.name.trim(),
      ingredientIds: form.ingredientIds,
    });
    setForm((f) => ({ ...f, name: "", ingredientIds: [] }));
    setShowForm(false);
  };

  const weekMealCount = meals.filter((m) => {
    const d = parseISO(m.date);
    return d >= weekStart && d < addDays(weekStart, 7);
  });
  const dinners = weekMealCount.filter((m) => m.type === "bua_toi").length;
  const lunches = weekMealCount.filter((m) => m.type === "bua_trua").length;
  const desserts = weekMealCount.filter((m) => m.type === "trang_miem").length;

  return (
    <div className="space-y-4">
      {/* Week nav */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset((o) => o - 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">←</button>
          <span className="font-medium text-slate-700 text-sm">
            {format(weekStart, "dd/MM")} – {format(addDays(weekStart, 6), "dd/MM/yyyy")}
          </span>
          <button onClick={() => setWeekOffset((o) => o + 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">→</button>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} className="text-xs text-emerald-600 hover:underline ml-1">Tuần này</button>
          )}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={15} /> Thêm bữa ăn
        </button>
      </div>

      {/* Week summary */}
      <div className="flex gap-3 flex-wrap text-sm">
        <div className="bg-emerald-50 px-3 py-1.5 rounded-lg">
          <span className="text-emerald-700 font-medium">🍽️ Bữa tối: {dinners}/4</span>
        </div>
        <div className="bg-blue-50 px-3 py-1.5 rounded-lg">
          <span className="text-blue-700 font-medium">🍱 Bữa trưa: {lunches}/2</span>
        </div>
        <div className="bg-pink-50 px-3 py-1.5 rounded-lg">
          <span className="text-pink-700 font-medium">🍮 Tráng miệng: {desserts}</span>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const dayMeals = mealsByDate[dateStr] ?? [];
          const isToday = format(new Date(), "yyyy-MM-dd") === dateStr;
          return (
            <div key={dateStr} className={`rounded-xl border p-3 min-h-24 ${isToday ? "border-emerald-300 bg-emerald-50/50" : "border-slate-100 bg-white"}`}>
              <div className={`text-xs font-semibold mb-2 ${isToday ? "text-emerald-600" : "text-slate-500"}`}>
                {format(day, "EEE dd/MM").replace("Mon", "T2").replace("Tue", "T3").replace("Wed", "T4").replace("Thu", "T5").replace("Fri", "T6").replace("Sat", "T7").replace("Sun", "CN")}
              </div>
              <div className="space-y-1">
                {dayMeals.map((m) => (
                  <div key={m.id} className={`flex items-center justify-between rounded-lg border px-2 py-1 text-xs ${MEAL_TYPE_COLORS[m.type]}`}>
                    <span className="truncate">{m.mealName}</span>
                    <button onClick={() => onDelete(m.id)} className="ml-1 opacity-50 hover:opacity-100 shrink-0">
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Thêm bữa ăn</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700">Ngày</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Loại bữa</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as MealType }))}
                    className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    {(Object.entries(MEAL_TYPE_LABELS) as [MealType, string][]).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Tên món ăn</label>
                <input
                  list="meal-suggestions"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Nhập hoặc chọn món..."
                  className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  required
                />
                <datalist id="meal-suggestions">
                  {MEAL_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
                </datalist>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Nguyên liệu sử dụng (tùy chọn)</label>
                <div className="mt-1 grid grid-cols-2 gap-1 max-h-32 overflow-y-auto border border-slate-100 rounded-lg p-2">
                  {foods.map((f) => (
                    <label key={f.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-slate-50 px-1 py-0.5 rounded">
                      <input
                        type="checkbox"
                        checked={form.ingredientIds.includes(f.id)}
                        onChange={(e) => setForm((ff) => ({
                          ...ff,
                          ingredientIds: e.target.checked
                            ? [...ff.ingredientIds, f.id]
                            : ff.ingredientIds.filter((id) => id !== f.id),
                        }))}
                      />
                      <span className="truncate">{f.name}</span>
                    </label>
                  ))}
                  {foods.length === 0 && <span className="text-slate-400 text-xs">Chưa có thực phẩm</span>}
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Hủy</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium">Thêm</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {meals.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <CalendarDays size={40} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Chưa có kế hoạch bữa ăn nào</p>
        </div>
      )}
    </div>
  );
}
