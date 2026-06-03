import { useState, useMemo } from "react";
import { Plus, Search, Pencil, Trash2, RefrigeratorIcon } from "lucide-react";
import type { FoodItem, FoodCategory } from "../types";
import {
  getExpiryStatus,
  getDaysUntilExpiry,
  formatDate,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  EXPIRY_STYLES,
} from "../utils";
import FoodModal from "./FoodModal";

interface Props {
  foods: FoodItem[];
  onAdd: (item: FoodItem) => void;
  onUpdate: (item: FoodItem) => void;
  onDelete: (id: string) => void;
}

export default function FridgeInventory({ foods, onAdd, onUpdate, onDelete }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<FoodItem | null>(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<FoodCategory | "all">("all");

  const filtered = useMemo(() => {
    return foods
      .filter((f) => {
        const matchSearch = f.name.toLowerCase().includes(search.toLowerCase());
        const matchCat = filterCat === "all" || f.category === filterCat;
        return matchSearch && matchCat;
      })
      .sort((a, b) => {
        const sa = getExpiryStatus(a.expiryDate);
        const sb = getExpiryStatus(b.expiryDate);
        const order = { expired: 0, critical: 1, soon: 2, ok: 3 };
        return order[sa] - order[sb];
      });
  }, [foods, search, filterCat]);

  const counts = useMemo(() => ({
    expired: foods.filter((f) => getExpiryStatus(f.expiryDate) === "expired").length,
    critical: foods.filter((f) => getExpiryStatus(f.expiryDate) === "critical").length,
    soon: foods.filter((f) => getExpiryStatus(f.expiryDate) === "soon").length,
  }), [foods]);

  const handleSave = (item: FoodItem) => {
    if (editing) {
      onUpdate(item);
    } else {
      onAdd(item);
    }
    setShowModal(false);
    setEditing(null);
  };

  return (
    <div className="space-y-4">
      {/* Alert bar */}
      {(counts.expired > 0 || counts.critical > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-4 flex-wrap">
          {counts.expired > 0 && (
            <span className="text-red-700 font-medium text-sm">
              ⚠️ {counts.expired} thực phẩm đã hết hạn
            </span>
          )}
          {counts.critical > 0 && (
            <span className="text-orange-600 font-medium text-sm">
              🔔 {counts.critical} thực phẩm hết hạn hôm nay/ngày mai
            </span>
          )}
          {counts.soon > 0 && (
            <span className="text-yellow-600 font-medium text-sm">
              📅 {counts.soon} thực phẩm sắp hết hạn (≤5 ngày)
            </span>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
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
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
          <option value="all">Tất cả danh mục</option>
          {(Object.entries(CATEGORY_LABELS) as [FoodCategory, string][]).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Thêm thực phẩm
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <RefrigeratorIcon size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Tủ lạnh trống</p>
          <p className="text-sm mt-1">Thêm thực phẩm để bắt đầu quản lý</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((food) => {
            const status = getExpiryStatus(food.expiryDate);
            const days = getDaysUntilExpiry(food.expiryDate);
            const style = EXPIRY_STYLES[status];
            return (
              <div
                key={food.id}
                className={`rounded-xl p-4 bg-white border border-slate-100 flex items-center gap-3 ${style.row}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-slate-800">{food.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[food.category]}`}>
                      {CATEGORY_LABELS[food.category]}
                    </span>
                  </div>
                  <div className="flex gap-4 mt-1 text-xs text-slate-500 flex-wrap">
                    <span>📦 {food.quantity} {food.unit}</span>
                    <span>🛒 {formatDate(food.purchaseDate)}</span>
                    <span>
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${style.badge}`}>
                        {status === "expired"
                          ? `Hỏng ${Math.abs(days)} ngày trước`
                          : status === "ok"
                          ? `Còn ${days} ngày`
                          : days === 0
                          ? "Hết hạn hôm nay!"
                          : `Còn ${days} ngày`}
                      </span>
                      {" "}hạn {formatDate(food.expiryDate)}
                    </span>
                  </div>
                  {food.notes && (
                    <p className="text-xs text-slate-400 mt-1 italic">{food.notes}</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => { setEditing(food); setShowModal(true); }}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-700"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => onDelete(food.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors text-slate-400 hover:text-red-500"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <FoodModal
          item={editing}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditing(null); }}
        />
      )}
    </div>
  );
}
