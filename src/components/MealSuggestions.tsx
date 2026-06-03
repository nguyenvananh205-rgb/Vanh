import { useMemo } from "react";
import { Lightbulb, Clock } from "lucide-react";
import type { FoodItem } from "../types";
import { getExpiryStatus, getDaysUntilExpiry } from "../utils";

interface Props {
  foods: FoodItem[];
}

interface SuggestedMeal {
  name: string;
  tags: string[];
  usesItems: FoodItem[];
  priority: number; // higher = more urgent (uses expiring items)
  cookTime: string;
}

// Simple matching rules: keyword → food name patterns
const MEAL_RECIPES: { name: string; tags: string[]; keywords: string[]; cookTime: string }[] = [
  { name: "Thịt kho trứng", tags: ["bữa tối", "cơm"], keywords: ["thịt", "trứng", "thịt lợn", "thịt heo"], cookTime: "40 phút" },
  { name: "Cá hấp gừng hành", tags: ["bữa tối", "healthy"], keywords: ["cá", "gừng"], cookTime: "25 phút" },
  { name: "Canh rau củ", tags: ["bữa trưa", "healthy"], keywords: ["cà rốt", "bắp cải", "khoai", "bí", "rau"], cookTime: "20 phút" },
  { name: "Gà xào sả ớt", tags: ["bữa tối"], keywords: ["gà", "thịt gà"], cookTime: "30 phút" },
  { name: "Bò xào bông cải", tags: ["bữa tối"], keywords: ["thịt bò", "bò", "bông cải", "súp lơ"], cookTime: "20 phút" },
  { name: "Đậu phụ sốt cà chua", tags: ["bữa trưa", "chay"], keywords: ["đậu phụ", "đậu hũ", "cà chua"], cookTime: "15 phút" },
  { name: "Trứng chiên rau củ", tags: ["bữa trưa", "nhanh"], keywords: ["trứng", "hành", "cà rốt"], cookTime: "10 phút" },
  { name: "Cơm rang dưa bò", tags: ["bữa trưa", "cơm", "nhanh"], keywords: ["cơm", "trứng"], cookTime: "15 phút" },
  { name: "Canh chua cá", tags: ["bữa tối"], keywords: ["cá", "cà chua", "giá"], cookTime: "25 phút" },
  { name: "Rau muống xào tỏi", tags: ["bữa tối", "rau"], keywords: ["rau muống", "rau"], cookTime: "10 phút" },
  { name: "Súp bí đỏ", tags: ["tráng miệng", "bữa trưa"], keywords: ["bí đỏ", "bí"], cookTime: "30 phút" },
  { name: "Gà luộc chấm muối chanh", tags: ["bữa tối"], keywords: ["gà", "chanh"], cookTime: "40 phút" },
  { name: "Bún thịt nướng", tags: ["bữa trưa"], keywords: ["thịt lợn", "thịt heo", "bún"], cookTime: "45 phút" },
  { name: "Bánh flan", tags: ["tráng miệng"], keywords: ["trứng", "sữa"], cookTime: "60 phút" },
  { name: "Hoa quả dầm", tags: ["tráng miệng"], keywords: ["dưa hấu", "xoài", "chuối", "dâu"], cookTime: "10 phút" },
  { name: "Chè đậu xanh", tags: ["tráng miệng"], keywords: ["đậu xanh", "đường"], cookTime: "45 phút" },
  { name: "Thịt heo luộc chấm mắm", tags: ["bữa tối"], keywords: ["thịt lợn", "thịt heo"], cookTime: "30 phút" },
  { name: "Canh khổ qua nhồi thịt", tags: ["bữa tối"], keywords: ["khổ qua", "mướp đắng", "thịt"], cookTime: "35 phút" },
];

export default function MealSuggestions({ foods }: Props) {
  const suggestions = useMemo<SuggestedMeal[]>(() => {
    if (foods.length === 0) return [];

    const availableFoods = foods.filter((f) => getExpiryStatus(f.expiryDate) !== "expired");

    return MEAL_RECIPES.map((recipe) => {
      const usesItems: FoodItem[] = [];

      availableFoods.forEach((food) => {
        const matches = recipe.keywords.some((kw) =>
          food.name.toLowerCase().includes(kw.toLowerCase())
        );
        if (matches) usesItems.push(food);
      });

      if (usesItems.length === 0) return null;

      // Priority: more expiring items used = higher priority
      const priority = usesItems.reduce((sum, f) => {
        const status = getExpiryStatus(f.expiryDate);
        if (status === "critical") return sum + 10;
        if (status === "soon") return sum + 5;
        return sum + 1;
      }, 0);

      return { name: recipe.name, tags: recipe.tags, usesItems, priority, cookTime: recipe.cookTime };
    })
      .filter(Boolean)
      .sort((a, b) => b!.priority - a!.priority)
      .slice(0, 8) as SuggestedMeal[];
  }, [foods]);

  const urgentFoods = foods.filter((f) => {
    const s = getExpiryStatus(f.expiryDate);
    return s === "critical" || s === "soon";
  }).sort((a, b) => getDaysUntilExpiry(a.expiryDate) - getDaysUntilExpiry(b.expiryDate));

  return (
    <div className="space-y-6">
      {/* Urgent use */}
      {urgentFoods.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
            <span>⚡</span> Cần dùng sớm
          </h3>
          <div className="flex flex-wrap gap-2">
            {urgentFoods.map((f) => {
              const days = getDaysUntilExpiry(f.expiryDate);
              return (
                <span key={f.id} className="bg-white border border-amber-200 rounded-lg px-3 py-1.5 text-sm">
                  <span className="font-medium text-slate-700">{f.name}</span>
                  <span className="text-amber-600 ml-1">
                    {days <= 0 ? "(hôm nay!)" : `(còn ${days}n)`}
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Suggestions */}
      <div>
        <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Lightbulb size={18} className="text-emerald-500" />
          Gợi ý món ăn từ tủ lạnh của bạn
        </h3>

        {suggestions.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Lightbulb size={40} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Thêm thực phẩm vào tủ để nhận gợi ý món ăn</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {suggestions.map((s, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-800">{s.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock size={12} className="text-slate-400" />
                      <span className="text-xs text-slate-500">{s.cookTime}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {s.tags.map((tag) => (
                      <span key={tag} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                </div>

                {s.usesItems.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-50">
                    <p className="text-xs text-slate-500 mb-1.5">Nguyên liệu trong tủ:</p>
                    <div className="flex flex-wrap gap-1">
                      {s.usesItems.map((item) => {
                        const status = getExpiryStatus(item.expiryDate);
                        return (
                          <span
                            key={item.id}
                            className={`text-xs px-2 py-0.5 rounded border ${
                              status === "critical" ? "border-orange-300 bg-orange-50 text-orange-700" :
                              status === "soon" ? "border-yellow-300 bg-yellow-50 text-yellow-700" :
                              "border-slate-200 bg-slate-50 text-slate-600"
                            }`}
                          >
                            {item.name}
                            {(status === "critical" || status === "soon") && " ⚡"}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600">
        <p className="font-medium mb-1">💡 Mẹo lên thực đơn tuần</p>
        <ul className="space-y-1 text-xs text-slate-500">
          <li>• Ưu tiên nấu các món dùng nguyên liệu sắp hết hạn (⚡)</li>
          <li>• Đồ nấu chín còn dư có thể dùng cho bữa trưa hôm sau</li>
          <li>• Đặt kế hoạch 4 bữa tối + 2 bữa trưa mỗi tuần</li>
          <li>• Mua sắm 1-2 lần/tuần dựa trên danh sách thiếu</li>
        </ul>
      </div>
    </div>
  );
}
