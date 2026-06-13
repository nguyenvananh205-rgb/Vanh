import { useState, useMemo } from "react";
import { Plus, Search, Pencil, Trash2, RefrigeratorIcon } from "lucide-react";
import type { FoodItem, FoodCategory, FoodLocation } from "../types";
import {
  getExpiryStatus,
  getDaysUntilExpiry,
  formatDate,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  LOCATION_LABELS,
  LOCATION_COLORS,
  LOCATION_ORDER,
  EXPIRY_STYLES,
} from "../utils";
import FoodModal from "./FoodModal";
import SmartAddModal from "./SmartAddModal";

interface Props {
  foods: FoodItem[];
  onAdd: (item: FoodItem) => void;
  onUpdate: (item: FoodItem) => void;
  onDelete: (id: string) => void;
}

const LOCATION_SECTION_STYLE: Record<FoodLocation, string> = {
  ngan_da:   "border-cyan-200 bg-cyan-50/40",
  ngan_lanh: "border-blue-200 bg-blue-50/40",
  tu_mat:    "border-teal-200 bg-teal-50/40",
  ngoai_tu:  "border-slate-200 bg-slate-50/30",
};

export default function FridgeInventory({ foods, onAdd, onUpdate, onDelete }: Props) {
  const [showSmartAdd, setShowSmartAdd] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editing, setEditing] = useState<FoodItem | null>(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<FoodCategory | "all">("all");
  const [filterLoc, setFilterLoc] = useState<FoodLocation | "all">("all");

  const filtered = useMemo(() => {
    return foods
      .filter((f) => {
        const matchSearch = f.name.toLowerCase().includes(search.toLowerCase());
        const matchCat = filterCat === "all" || f.category === filterCat;
        const matchLoc = filterLoc === "all" || (f.location ?? "ngan_lanh") === filterLoc;
        return matchSearch && matchCat && matchLoc;
      })
      .sort((a, b) => {
        const order = { expired: 0, critical: 1, soon: 2, ok: 3 };
        return order[getExpiryStatus(a.expiryDate)] - order[getExpiryStatus(b.expiryDate)];
      });
  }, [foods, search, filterCat, filterLoc]);

  // Group by location
  const grouped = useMemo(() => {
    const map = new Map<FoodLocation, FoodItem[]>();
    for (const loc of LOCATION_ORDER) map.set(loc, []);
    for (const f of filtered) {
      const loc = f.location ?? "ngan_lanh";
      map.get(loc)!.push(f);
    }
    return map;
  }, [filtered]);

  const counts = useMemo(() => ({
    expired:  foods.filter((f) => getExpiryStatus(f.expiryDate) === "expired").length,
    critical: foods.filter((f) => getExpiryStatus(f.expiryDate) === "critical").length,
    soon:     foods.filter((f) => getExpiryStatus(f.expiryDate) === "soon").length,
  }), [foods]);

  const locationCounts = useMemo(() => {
    const m: Partial<Record<FoodLocation, number>> = {};
    for (const f of foods) {
      const loc = f.location ?? "ngan_lanh";
      m[loc] = (m[loc] ?? 0) + 1;
    }
    return m;
  }, [foods]);

  const handleEditSave = (item: FoodItem) => {
    onUpdate(item);
    setShowEditModal(false);
    setEditing(null);
  };

  return (
    <div className="space-y-4">
      {/* Alert bar */}
      {(counts.expired > 0 || counts.critical > 0 || counts.soon > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-4 flex-wrap">
          {counts.expired > 0 && (
            <span className="text-red-700 font-medium text-sm">⚠️ {counts.expired} đã hết hạn</span>
          )}
          {counts.critical > 0 && (
            <span className="text-orange-600 font-medium text-sm">🔔 {counts.critical} hết hạn hôm nay/ngày mai</span>
          )}
          {counts.soon > 0 && (
            <span className="text-yellow-600 font-medium text-sm">📅 {counts.soon} sắp hết hạn (≤5 ngày)</span>
          )}
        </div>
      )}

      {/* Location quick-stats */}
      <div className="flex gap-2 flex-wrap">
        {LOCATION_ORDER.filter((loc) => locationCounts[loc]).map((loc) => (
          <button
            key={loc}
            onClick={() => setFilterLoc(filterLoc === loc ? "all" : loc)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
              filterLoc === loc
                ? LOCATION_COLORS[loc] + " border-current"
                : "border-slate-200 text-slate-500 hover:border-slate-300 bg-white"
            }`}
          >
            {LOCATION_LABELS[loc]}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${LOCATION_COLORS[loc]}`}>
              {locationCounts[loc]}
            </span>
          </button>
        ))}
      </div>

      {/* Search + category filter + add */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-40">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm thực phẩm..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value as FoodCategory | "all")}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
        >
          <option value="all">Tất cả danh mục</option>
          {(Object.entries(CATEGORY_LABELS) as [FoodCategory, string][]).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <button
          onClick={() => setShowSmartAdd(true)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Thêm thực phẩm
        </button>
      </div>

      {/* List grouped by location */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <RefrigeratorIcon size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Tủ lạnh trống</p>
          <p className="text-sm mt-1">Thêm thực phẩm để bắt đầu quản lý</p>
        </div>
      ) : (
        <div className="space-y-4">
          {LOCATION_ORDER.map((loc) => {
            const items = grouped.get(loc) ?? [];
            if (items.length === 0) return null;
            return (
              <div key={loc} className={`rounded-2xl border-2 overflow-hidden ${LOCATION_SECTION_STYLE[loc]}`}>
                <div className="flex items-center gap-2 px-4 py-2.5">
                  <span className={`text-sm font-semibold ${LOCATION_COLORS[loc].replace("bg-", "text-").split(" ")[1]}`}>
                    {LOCATION_LABELS[loc]}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${LOCATION_COLORS[loc]}`}>
                    {items.length} món
                  </span>
                </div>
                <div className="space-y-1 px-3 pb-3">
                  {items.map((food) => (
                    <FoodRow
                      key={food.id}
                      food={food}
                      onEdit={() => { setEditing(food); setShowEditModal(true); }}
                      onDelete={() => onDelete(food.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showSmartAdd && (
        <SmartAddModal onSave={onAdd} onClose={() => setShowSmartAdd(false)} />
      )}
      {showEditModal && editing && (
        <FoodModal
          item={editing}
          onSave={handleEditSave}
          onClose={() => { setShowEditModal(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

function FoodRow({ food, onEdit, onDelete }: {
  food: FoodItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const status = getExpiryStatus(food.expiryDate);
  const days = getDaysUntilExpiry(food.expiryDate);
  const style = EXPIRY_STYLES[status];
  return (
    <div className={`rounded-xl p-3 bg-white border border-slate-100 flex items-center gap-3 ${style.row}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-slate-800 text-sm">{food.name}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[food.category]}`}>
            {CATEGORY_LABELS[food.category]}
          </span>
        </div>
        <div className="flex gap-3 mt-1 text-xs text-slate-500 flex-wrap">
          <span>📦 {food.quantity} {food.unit}</span>
          <span>🛒 {formatDate(food.purchaseDate)}</span>
          <span>
            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${style.badge}`}>
              {status === "expired"
                ? `Hỏng ${Math.abs(days)}n trước`
                : days === 0 ? "Hết hạn hôm nay!"
                : `Còn ${days} ngày`}
            </span>
            {" "}hạn {formatDate(food.expiryDate)}
          </span>
        </div>
        {food.notes && <p className="text-xs text-slate-400 mt-1 italic">{food.notes}</p>}
      </div>
      <div className="flex gap-1 shrink-0">
        <button onClick={onEdit} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
          <Pencil size={14} />
        </button>
        <button onClick={onDelete} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
