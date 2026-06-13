import { useState } from "react";
import { X, UtensilsCrossed } from "lucide-react";
import type { FoodItem, FoodLocation } from "../types";
import { LOCATION_LABELS, LOCATION_ORDER, generateId, todayISO } from "../utils";

interface Props {
  onAdd: (item: FoodItem) => void;
  onClose: () => void;
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const EXPIRY_CHIPS = [
  { label: "Hôm nay", days: 0 },
  { label: "1 ngày", days: 1 },
  { label: "2 ngày", days: 2 },
  { label: "3 ngày", days: 3 },
];

export default function ReadyFoodModal({ onAdd, onClose }: Props) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("phần");
  const [location, setLocation] = useState<FoodLocation>("ngan_lanh");
  const [expiryDate, setExpiryDate] = useState(addDays(2));
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) return;
    onAdd({
      id: generateId(),
      name: name.trim(),
      quantity: parseFloat(quantity) || 1,
      unit,
      category: "do_nau_chin",
      location,
      expiryDate,
      purchaseDate: todayISO(),
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <UtensilsCrossed size={20} className="text-amber-500" />
            <h2 className="text-base font-bold text-slate-800">Thêm đồ ăn sẵn</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl">
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <p className="text-xs text-slate-500">Thức ăn đã nấu chín còn dư, hoặc mua sẵn chưa dùng.</p>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Tên món ăn *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Vd: Thịt kho trứng còn dư, Cơm tấm mua sẵn..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Số lượng</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="0.1"
                step="0.1"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Đơn vị</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white"
              >
                <option value="phần">phần</option>
                <option value="hộp">hộp</option>
                <option value="tô">tô</option>
                <option value="đĩa">đĩa</option>
                <option value="gram">gram</option>
                <option value="kg">kg</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Vị trí lưu trữ</label>
            <div className="grid grid-cols-2 gap-1.5">
              {LOCATION_ORDER.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setLocation(loc)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border-2 transition-colors text-left ${
                    location === loc
                      ? "border-amber-400 bg-amber-50 text-amber-700"
                      : "border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {LOCATION_LABELS[loc]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Hết hạn dùng</label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {EXPIRY_CHIPS.map((c) => {
                const val = addDays(c.days);
                return (
                  <button
                    key={c.label}
                    onClick={() => setExpiryDate(val)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                      expiryDate === val
                        ? "bg-amber-500 text-white border-amber-500"
                        : "border-slate-200 text-slate-600 hover:border-amber-300"
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Ghi chú (tùy chọn)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Vd: Để ngăn trên, chưa mở nắp..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>
        </div>

        <div className="px-5 pb-5 pt-1">
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <UtensilsCrossed size={16} />
            Thêm vào tủ lạnh
          </button>
        </div>
      </div>
    </div>
  );
}
