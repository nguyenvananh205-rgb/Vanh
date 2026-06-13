import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { FoodItem, FoodCategory, FoodLocation } from "../types";
import { CATEGORY_LABELS, LOCATION_LABELS, LOCATION_ORDER, generateId, todayISO, getSmartUnit } from "../utils";

interface Props {
  item?: FoodItem | null;
  onSave: (item: FoodItem) => void;
  onClose: () => void;
}

const UNITS = ["lạng", "gram", "kg", "ml", "lít", "hộp", "cái", "bó", "ổ", "quả", "túi", "lon", "chai", "tép", "củ", "miếng", "cây"];

export default function FoodModal({ item, onSave, onClose }: Props) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState("gram");
  const [category, setCategory] = useState<FoodCategory>("khac");
  const [location, setLocation] = useState<FoodLocation>("ngan_lanh");
  const [purchaseDate, setPurchaseDate] = useState(todayISO());
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (item) {
      setName(item.name);
      setQuantity(item.quantity);
      setUnit(item.unit);
      setCategory(item.category);
      setLocation(item.location ?? "ngan_lanh");
      setPurchaseDate(item.purchaseDate);
      setExpiryDate(item.expiryDate);
      setNotes(item.notes ?? "");
    }
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !expiryDate) return;
    onSave({
      id: item?.id ?? generateId(),
      name: name.trim(),
      quantity,
      unit,
      category,
      location,
      purchaseDate,
      expiryDate,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-slate-800">
            {item ? "Chỉnh sửa thực phẩm" : "Thêm thực phẩm"}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tên thực phẩm *</label>
            <input
              value={name}
              onChange={(e) => {
                const val = e.target.value;
                setName(val);
                if (!item) { // only auto-fill on new items
                  const smart = getSmartUnit(val);
                  setUnit(smart.unit);
                  setQuantity(smart.quantity);
                }
              }}
              placeholder="Ví dụ: Thịt gà, Cà chua..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Số lượng</label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Đơn vị</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
              >
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Vị trí lưu trữ</label>
            <div className="grid grid-cols-2 gap-2">
              {LOCATION_ORDER.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setLocation(loc)}
                  className={`py-2 px-3 rounded-xl text-sm font-medium border-2 transition-colors text-left ${
                    location === loc
                      ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                      : "border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {LOCATION_LABELS[loc]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Danh mục</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as FoodCategory)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
            >
              {(Object.entries(CATEGORY_LABELS) as [FoodCategory, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ngày mua/nấu</label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hạn sử dụng *</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ví dụ: Đã mở gói, ngăn trên..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {item ? "Cập nhật" : "Thêm vào tủ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
