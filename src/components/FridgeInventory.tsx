import { useState, useMemo, useCallback } from "react";
import { Plus, Search, Pencil, Trash2, RefrigeratorIcon, Mic, Loader2, CheckSquare, Square, X, ChevronDown } from "lucide-react";
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
import { useVoiceInput } from "../hooks/useVoiceInput";
import FoodModal from "./FoodModal";

interface Props {
  foods: FoodItem[];
  onUpdate: (item: FoodItem) => void;
  onDelete: (id: string) => void;
  onOpenAdd: () => void;
}

const LOCATION_SECTION_STYLE: Record<FoodLocation, string> = {
  ngan_da:   "border-cyan-200 bg-cyan-50/40",
  ngan_lanh: "border-blue-200 bg-blue-50/40",
  tu_mat:    "border-teal-200 bg-teal-50/40",
  ngoai_tu:  "border-slate-200 bg-slate-50/30",
};

// ── Bulk quantity update modal ────────────────────────────────────────────────
function BulkUpdateModal({
  items,
  onUpdate,
  onDelete,
  onClose,
}: {
  items: FoodItem[];
  onUpdate: (item: FoodItem) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(items.map((f) => [f.id, f.quantity]))
  );

  const handleSave = () => {
    for (const item of items) {
      const qty = quantities[item.id] ?? item.quantity;
      if (qty <= 0) {
        onDelete(item.id);
      } else if (qty !== item.quantity) {
        onUpdate({ ...item, quantity: qty });
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100 shrink-0">
          <h3 className="text-base font-bold text-slate-800">Cập nhật số lượng</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl">
            <X size={18} className="text-slate-400" />
          </button>
        </div>
        <p className="text-xs text-slate-400 px-5 pt-3">Nhập 0 để xóa khỏi tủ lạnh</p>
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {items.map((item) => {
            const qty = quantities[item.id] ?? item.quantity;
            return (
              <div key={item.id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 text-sm truncate">{item.name}</p>
                  <p className="text-xs text-slate-400">{LOCATION_LABELS[item.location ?? "ngan_lanh"]}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="number"
                    value={qty}
                    onChange={(e) => setQuantities((prev) => ({ ...prev, [item.id]: parseFloat(e.target.value) || 0 }))}
                    min={0}
                    step={0.1}
                    className={`w-20 border rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 ${
                      qty <= 0 ? "border-red-300 bg-red-50 focus:ring-red-300 text-red-700" : "border-slate-200 focus:ring-emerald-300"
                    }`}
                  />
                  <span className="text-xs text-slate-500 w-10">{item.unit}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="px-5 py-4 border-t border-slate-100 flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">
            Hủy
          </button>
          <button onClick={handleSave} className="flex-[2] py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold">
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function FridgeInventory({ foods, onUpdate, onDelete, onOpenAdd }: Props) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editing, setEditing] = useState<FoodItem | null>(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<FoodCategory | "all">("all");
  const [filterLoc, setFilterLoc] = useState<FoodLocation | "all">("all");

  // Multi-select state
  const [editMode, setEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Per-section collapse & category filter
  const [collapsedLocs, setCollapsedLocs] = useState<Set<FoodLocation>>(new Set());
  const [locCatFilter, setLocCatFilter] = useState<Partial<Record<FoodLocation, FoodCategory | "all">>>({});

  const toggleCollapse = (loc: FoodLocation) =>
    setCollapsedLocs((prev) => {
      const next = new Set(prev);
      if (next.has(loc)) next.delete(loc); else next.add(loc);
      return next;
    });

  const getLocCat = (loc: FoodLocation): FoodCategory | "all" => locCatFilter[loc] ?? "all";
  const setLocCat = (loc: FoodLocation, cat: FoodCategory | "all") =>
    setLocCatFilter((prev) => ({ ...prev, [loc]: cat }));

  // Voice search
  const handleVoiceResult = useCallback((text: string) => setSearch(text.trim()), []);
  const { state: voiceState, start: startVoice, isSupported: voiceSupported } = useVoiceInput({
    onResult: handleVoiceResult,
    onError: () => {},
  });

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

  const grouped = useMemo(() => {
    const map = new Map<FoodLocation, FoodItem[]>();
    for (const loc of LOCATION_ORDER) map.set(loc, []);
    for (const f of filtered) map.get(f.location ?? "ngan_lanh")!.push(f);
    return map;
  }, [filtered]);

  const counts = useMemo(() => ({
    expired:  foods.filter((f) => getExpiryStatus(f.expiryDate) === "expired").length,
    critical: foods.filter((f) => getExpiryStatus(f.expiryDate) === "critical").length,
    soon:     foods.filter((f) => getExpiryStatus(f.expiryDate) === "soon").length,
  }), [foods]);

  const locationCounts = useMemo(() => {
    const m: Partial<Record<FoodLocation, number>> = {};
    for (const f of foods) { const loc = f.location ?? "ngan_lanh"; m[loc] = (m[loc] ?? 0) + 1; }
    return m;
  }, [foods]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(filtered.map((f) => f.id)));
  const clearSelection = () => setSelectedIds(new Set());

  const exitEditMode = () => { setEditMode(false); setSelectedIds(new Set()); };

  const handleBulkDelete = () => {
    if (confirm(`Xóa ${selectedIds.size} thực phẩm khỏi tủ lạnh?`)) {
      for (const id of selectedIds) onDelete(id);
      exitEditMode();
    }
  };

  const selectedFoods = filtered.filter((f) => selectedIds.has(f.id));

  const handleEditSave = (item: FoodItem) => {
    onUpdate(item);
    setShowEditModal(false);
    setEditing(null);
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Alert bar */}
      {(counts.expired > 0 || counts.critical > 0 || counts.soon > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-4 flex-wrap">
          {counts.expired > 0 && <span className="text-red-700 font-medium text-sm">⚠️ {counts.expired} đã hết hạn</span>}
          {counts.critical > 0 && <span className="text-orange-600 font-medium text-sm">🔔 {counts.critical} hết hạn hôm nay/ngày mai</span>}
          {counts.soon > 0 && <span className="text-yellow-600 font-medium text-sm">📅 {counts.soon} sắp hết hạn</span>}
        </div>
      )}

      {/* Location quick-filter chips */}
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
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${LOCATION_COLORS[loc]}`}>{locationCounts[loc]}</span>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex gap-2 flex-wrap items-center">
        {/* Voice + text search */}
        <div className="relative flex-1 min-w-40">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={voiceState === "listening" ? "🎙️ Đang nghe..." : "Tìm thực phẩm..."}
            className="w-full pl-9 pr-10 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          {voiceSupported && (
            <button
              onClick={voiceState === "listening" ? undefined : startVoice}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors ${
                voiceState === "listening"
                  ? "text-red-500 animate-pulse"
                  : "text-slate-400 hover:text-emerald-600 hover:bg-slate-100"
              }`}
            >
              {voiceState === "listening" || voiceState === "processing"
                ? <Loader2 size={15} className="animate-spin" />
                : <Mic size={15} />}
            </button>
          )}
        </div>

        {/* Category filter */}
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value as FoodCategory | "all")}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
        >
          <option value="all">Tất cả</option>
          {(Object.entries(CATEGORY_LABELS) as [FoodCategory, string][]).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        {!editMode ? (
          <>
            <button
              onClick={() => setEditMode(true)}
              className="flex items-center gap-1.5 border border-slate-200 text-slate-600 px-3 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors"
            >
              <CheckSquare size={15} /> Chọn
            </button>
            <button
              onClick={onOpenAdd}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={16} /> Thêm
            </button>
          </>
        ) : (
          <>
            <button onClick={selectAll} className="text-xs text-blue-600 border border-blue-200 px-2.5 py-2 rounded-lg hover:bg-blue-50">
              Tất cả
            </button>
            <button onClick={clearSelection} className="text-xs text-slate-500 border border-slate-200 px-2.5 py-2 rounded-lg hover:bg-slate-50">
              Bỏ chọn
            </button>
            <button onClick={exitEditMode} className="flex items-center gap-1 text-sm text-slate-600 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50">
              <X size={14} /> Xong
            </button>
          </>
        )}
      </div>

      {/* Item list grouped by location */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <RefrigeratorIcon size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">{search ? "Không tìm thấy" : "Tủ lạnh trống"}</p>
          <p className="text-sm mt-1">{search ? `Không có "${search}" trong tủ` : "Thêm thực phẩm để bắt đầu"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {LOCATION_ORDER.map((loc) => {
            const allItems = grouped.get(loc) ?? [];
            if (allItems.length === 0) return null;

            const isCollapsed = collapsedLocs.has(loc);
            const catFilter = getLocCat(loc);
            const catsInSection = [...new Set(allItems.map((f) => f.category))];
            const visibleItems = catFilter === "all"
              ? allItems
              : allItems.filter((f) => f.category === catFilter);

            return (
              <div key={loc} className={`rounded-2xl border-2 overflow-hidden ${LOCATION_SECTION_STYLE[loc]}`}>
                {/* Section header — tap to collapse/expand */}
                <button
                  className="w-full flex items-center gap-2 px-4 py-3 text-left"
                  onClick={() => toggleCollapse(loc)}
                >
                  <span className="text-sm font-semibold text-slate-700">{LOCATION_LABELS[loc]}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${LOCATION_COLORS[loc]}`}>
                    {allItems.length}
                  </span>
                  {catFilter !== "all" && (
                    <span className="text-xs text-slate-400 italic">· {CATEGORY_LABELS[catFilter as FoodCategory]}</span>
                  )}
                  {editMode && !isCollapsed && allItems.some((f) => !selectedIds.has(f.id)) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedIds((prev) => new Set([...prev, ...allItems.map((f) => f.id)]));
                      }}
                      className="ml-auto text-xs text-blue-600 hover:underline"
                    >
                      Chọn nhóm này
                    </button>
                  )}
                  <ChevronDown
                    size={16}
                    className={`${editMode ? "" : "ml-auto"} text-slate-400 transition-transform duration-200 shrink-0 ${isCollapsed ? "" : "rotate-180"}`}
                  />
                </button>

                {/* Expanded: category chips + items */}
                {!isCollapsed && (
                  <div className="shelf-expand">
                    {/* Per-section category filter chips */}
                    {catsInSection.length > 1 && (
                      <div className="flex gap-1.5 px-3 pb-2 flex-wrap">
                        <button
                          onClick={() => setLocCat(loc, "all")}
                          className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                            catFilter === "all"
                              ? "bg-slate-700 text-white border-slate-700"
                              : "border-slate-200 text-slate-500 hover:border-slate-400 bg-white"
                          }`}
                        >
                          Tất cả ({allItems.length})
                        </button>
                        {catsInSection.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setLocCat(loc, cat === catFilter ? "all" : cat)}
                            className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                              catFilter === cat
                                ? `${CATEGORY_COLORS[cat]} border-current`
                                : "border-slate-200 text-slate-500 hover:border-slate-400 bg-white"
                            }`}
                          >
                            {CATEGORY_LABELS[cat]} ({allItems.filter((f) => f.category === cat).length})
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Food rows */}
                    <div className="space-y-1 px-3 pb-3">
                      {visibleItems.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-3 italic">
                          Không có {CATEGORY_LABELS[catFilter as FoodCategory]} trong ngăn này
                        </p>
                      ) : (
                        visibleItems.map((food) => (
                          <FoodRow
                            key={food.id}
                            food={food}
                            editMode={editMode}
                            selected={selectedIds.has(food.id)}
                            onToggleSelect={() => toggleSelect(food.id)}
                            onEdit={() => { setEditing(food); setShowEditModal(true); }}
                            onDelete={() => onDelete(food.id)}
                          />
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Sticky bottom action bar (edit mode) */}
      {editMode && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 z-40 shadow-lg">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700 flex-1">
              {selectedIds.size > 0 ? `Đã chọn ${selectedIds.size} món` : "Chưa chọn món nào"}
            </span>
            <button
              onClick={handleBulkDelete}
              disabled={selectedIds.size === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <Trash2 size={14} />
              Đã dùng / Bỏ đi
            </button>
            <button
              onClick={() => setShowBulkModal(true)}
              disabled={selectedIds.size === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <Pencil size={14} />
              Cập nhật SL
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showEditModal && editing && (
        <FoodModal item={editing} onSave={handleEditSave} onClose={() => { setShowEditModal(false); setEditing(null); }} />
      )}
      {showBulkModal && selectedFoods.length > 0 && (
        <BulkUpdateModal
          items={selectedFoods}
          onUpdate={(item) => { onUpdate(item); }}
          onDelete={(id) => { onDelete(id); setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; }); }}
          onClose={() => { setShowBulkModal(false); if (selectedIds.size === 0) exitEditMode(); }}
        />
      )}
    </div>
  );
}

function FoodRow({
  food, editMode, selected, onToggleSelect, onEdit, onDelete,
}: {
  food: FoodItem;
  editMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const status = getExpiryStatus(food.expiryDate);
  const days = getDaysUntilExpiry(food.expiryDate);
  const style = EXPIRY_STYLES[status];
  return (
    <div
      className={`rounded-xl p-3 bg-white border flex items-center gap-3 transition-colors cursor-pointer select-none ${
        selected ? "border-emerald-400 bg-emerald-50/50" : `border-slate-100 ${style.row}`
      }`}
      onClick={editMode ? onToggleSelect : undefined}
    >
      {editMode && (
        <div className="shrink-0 text-emerald-500">
          {selected ? <CheckSquare size={18} /> : <Square size={18} className="text-slate-300" />}
        </div>
      )}
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
              {status === "expired" ? `Hỏng ${Math.abs(days)}n trước` : days === 0 ? "Hết hạn hôm nay!" : `Còn ${days} ngày`}
            </span>
            {" "}hạn {formatDate(food.expiryDate)}
          </span>
        </div>
        {food.notes && <p className="text-xs text-slate-400 mt-1 italic">{food.notes}</p>}
      </div>
      {!editMode && (
        <div className="flex gap-1 shrink-0">
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
            <Pencil size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
