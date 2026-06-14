import { useMemo } from "react";
import { RefrigeratorIcon, AlertTriangle, CalendarCheck, ShoppingCart, TrendingDown } from "lucide-react";
import type { FoodItem, MealPlan } from "../types";
import { getExpiryStatus, getDaysUntilExpiry, CATEGORY_LABELS, EXPIRY_STYLES } from "../utils";
import { startOfWeek, endOfWeek, parseISO } from "date-fns";

interface Props {
  foods: FoodItem[];
  meals: MealPlan[];
  shoppingCount: number;
  onTabChange: (tab: string) => void;
  onAddFood: () => void;
}

export default function Dashboard({ foods, meals, shoppingCount, onTabChange, onAddFood }: Props) {
  const stats = useMemo(() => {
    const total = foods.length;
    const expired = foods.filter((f) => getExpiryStatus(f.expiryDate) === "expired").length;
    const critical = foods.filter((f) => getExpiryStatus(f.expiryDate) === "critical").length;
    const soon = foods.filter((f) => getExpiryStatus(f.expiryDate) === "soon").length;

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
    const thisWeekMeals = meals.filter((m) => {
      const d = parseISO(m.date);
      return d >= weekStart && d <= weekEnd;
    });
    const dinners = thisWeekMeals.filter((m) => m.type === "bua_toi").length;
    const lunches = thisWeekMeals.filter((m) => m.type === "bua_trua").length;

    return { total, expired, critical, soon, dinners, lunches };
  }, [foods, meals]);

  const urgentFoods = useMemo(() =>
    foods
      .filter((f) => {
        const s = getExpiryStatus(f.expiryDate);
        return s === "expired" || s === "critical" || s === "soon";
      })
      .sort((a, b) => getDaysUntilExpiry(a.expiryDate) - getDaysUntilExpiry(b.expiryDate))
      .slice(0, 5),
    [foods]
  );

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          index={0}
          icon={<RefrigeratorIcon size={20} className="text-emerald-600" />}
          bg="bg-emerald-50"
          value={stats.total}
          label="Thực phẩm"
          sub="trong tủ"
          onClick={() => onTabChange("fridge")}
        />
        <StatCard
          index={1}
          icon={<AlertTriangle size={20} className="text-orange-500" />}
          bg="bg-orange-50"
          value={stats.expired + stats.critical + stats.soon}
          label="Cần chú ý"
          sub={`${stats.expired} hỏng · ${stats.critical + stats.soon} sắp hết`}
          onClick={() => onTabChange("fridge")}
          alert={stats.expired > 0 || stats.critical > 0}
        />
        <StatCard
          index={2}
          icon={<CalendarCheck size={20} className="text-blue-600" />}
          bg="bg-blue-50"
          value={`${stats.dinners}/4`}
          label="Bữa tối"
          sub={`${stats.lunches}/2 bữa trưa tuần này`}
          onClick={() => onTabChange("planner")}
        />
        <StatCard
          index={3}
          icon={<ShoppingCart size={20} className="text-purple-600" />}
          bg="bg-purple-50"
          value={shoppingCount}
          label="Cần mua"
          sub="trong danh sách"
          onClick={() => onTabChange("shopping")}
        />
      </div>

      {/* Urgent items */}
      {urgentFoods.length > 0 && (
        <div className="section-fade-in" style={{ animationDelay: "0.32s" }}>
          <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-orange-500" />
            Cần xử lý sớm
          </h3>
          <div className="space-y-2">
            {urgentFoods.map((food, i) => {
              const status = getExpiryStatus(food.expiryDate);
              const days = getDaysUntilExpiry(food.expiryDate);
              const style = EXPIRY_STYLES[status];
              return (
                <div
                  key={food.id}
                  className={`urgent-item-animate flex items-center justify-between rounded-xl p-3 bg-white border ${status === "expired" ? "border-red-200" : status === "critical" ? "border-orange-200" : "border-yellow-200"}`}
                  style={{ animationDelay: `${0.38 + i * 0.07}s` }}
                >
                  <div>
                    <span className="font-medium text-slate-700 text-sm">{food.name}</span>
                    <span className="text-xs text-slate-400 ml-2">{food.quantity} {food.unit} · {CATEGORY_LABELS[food.category]}</span>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${style.badge}`}>
                    {days < 0 ? `Hỏng ${Math.abs(days)} ngày trước` : days === 0 ? "Hôm nay!" : `Còn ${days} ngày`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category breakdown */}
      {foods.length > 0 && (
        <div className="section-fade-in" style={{ animationDelay: "0.48s" }}>
          <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <TrendingDown size={16} className="text-slate-400" />
            Phân loại thực phẩm
          </h3>
          <CategoryBreakdown foods={foods} />
        </div>
      )}

      {foods.length === 0 && (
        <div className="empty-bounce-in text-center py-16 text-slate-400">
          <RefrigeratorIcon size={56} className="mx-auto mb-3 opacity-20" />
          <p className="font-semibold text-lg text-slate-500">Chào mừng đến với Quản lý Tủ lạnh!</p>
          <p className="text-sm mt-1">Bắt đầu bằng cách thêm thực phẩm vào tủ lạnh của bạn</p>
          <button
            onClick={onAddFood}
            className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            Thêm thực phẩm đầu tiên
          </button>
        </div>
      )}
    </div>
  );
}

function StatCard({
  index, icon, bg, value, label, sub, onClick, alert,
}: {
  index: number;
  icon: React.ReactNode;
  bg: string;
  value: string | number;
  label: string;
  sub: string;
  onClick: () => void;
  alert?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`stat-card-animate ${bg} rounded-xl p-4 text-left hover:scale-[1.03] active:scale-95 transition-transform relative`}
      style={{ animationDelay: `${index * 0.09}s` }}
    >
      {alert && (
        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      )}
      <div className="mb-2">{icon}</div>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      <div className="text-sm font-medium text-slate-600">{label}</div>
      <div className="text-xs text-slate-400 mt-0.5">{sub}</div>
    </button>
  );
}

function CategoryBreakdown({ foods }: { foods: FoodItem[] }) {
  const counts: Record<string, number> = {};
  foods.forEach((f) => {
    counts[f.category] = (counts[f.category] ?? 0) + 1;
  });

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {sorted.map(([cat, count]) => (
        <div key={cat} className="bg-white border border-slate-100 rounded-xl px-3 py-2.5 flex items-center justify-between">
          <span className="text-sm text-slate-600">{CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]}</span>
          <span className="text-sm font-semibold text-slate-800 ml-2">{count}</span>
        </div>
      ))}
    </div>
  );
}
