import { useState } from "react";
import { Plus, Trash2, ShoppingCart, Check, RotateCcw } from "lucide-react";
import type { ShoppingItem, FoodCategory } from "../types";
import { CATEGORY_LABELS, CATEGORY_COLORS, generateId } from "../utils";

interface Props {
  items: ShoppingItem[];
  onAdd: (item: ShoppingItem) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onClearChecked: () => void;
}

const UNITS = ["gram", "kg", "ml", "lít", "hộp", "cái", "bó", "ổ", "quả", "túi", "lon", "chai"];

export default function ShoppingList({ items, onAdd, onToggle, onDelete, onClearChecked }: Props) {
  const [form, setForm] = useState({ name: "", quantity: 1, unit: "gram", category: "khac" as FoodCategory });
  const [showForm, setShowForm] = useState(false);

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-100 text-emerald-700 rounded-full px-3 py-1 text-sm font-medium">
            {unchecked.length} món cần mua
          </div>
          {checked.length > 0 && (
            <div className="bg-slate-100 text-slate-500 rounded-full px-3 py-1 text-sm">
              {checked.length} đã có / đã mua
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

      {items.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <ShoppingCart size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Danh sách trống</p>
          <p className="text-sm mt-1">Thêm nguyên liệu cần mua ở siêu thị</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Unchecked */}
          {unchecked.length > 0 && (
            <div className="space-y-2">
              {unchecked.map((item) => (
                <ShoppingRow key={item.id} item={item} onToggle={onToggle} onDelete={onDelete} />
              ))}
            </div>
          )}

          {/* Checked */}
          {checked.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1">
                <Check size={12} /> Đã mua / đã có
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

      {/* Add form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Thêm vào danh sách mua</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700">Tên thực phẩm</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ví dụ: Thịt gà, Rau cải..."
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
                    className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    {UNITS.map((u) => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Danh mục</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as FoodCategory }))}
                  className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  {(Object.entries(CATEGORY_LABELS) as [FoodCategory, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Hủy</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium">Thêm</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ShoppingRow({ item, onToggle, onDelete }: { item: ShoppingItem; onToggle: (id: string) => void; onDelete: (id: string) => void }) {
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
