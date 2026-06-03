import { useState } from "react";
import { Download, Upload, Copy, Check, RefreshCw } from "lucide-react";
import type { FoodItem, MealPlan, ShoppingItem } from "../types";

interface Props {
  foods: FoodItem[];
  meals: MealPlan[];
  shopping: ShoppingItem[];
  onImport: (data: { foods: FoodItem[]; meals: MealPlan[]; shopping: ShoppingItem[] }) => void;
}

export default function SyncData({ foods, meals, shopping, onImport }: Props) {
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState("");
  const [error, setError] = useState("");
  const [importMode, setImportMode] = useState(false);

  const exportData = JSON.stringify({ foods, meals, shopping, exportedAt: new Date().toISOString() }, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select textarea
    }
  };

  const handleDownload = () => {
    const blob = new Blob([exportData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tu-lanh-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    setError("");
    try {
      const data = JSON.parse(importText);
      if (!Array.isArray(data.foods) || !Array.isArray(data.meals) || !Array.isArray(data.shopping)) {
        throw new Error("Dữ liệu không hợp lệ");
      }
      onImport({ foods: data.foods, meals: data.meals, shopping: data.shopping });
      setImportText("");
      setImportMode(false);
    } catch {
      setError("Dữ liệu không hợp lệ. Hãy dán đúng nội dung đã xuất.");
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImportText(ev.target?.result as string ?? "");
      setImportMode(true);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-semibold text-blue-800 mb-1">👫 Dùng chung với người thân</h3>
        <p className="text-sm text-blue-700">
          Cả hai vợ chồng có thể dùng app trên điện thoại riêng. Để đồng bộ dữ liệu, một người
          <strong> xuất dữ liệu</strong> và gửi file/text cho người kia qua Zalo/Messenger, người kia
          <strong> nhập lại</strong> là xong.
        </p>
      </div>

      {/* Export section */}
      <div className="bg-white border border-slate-100 rounded-xl p-5">
        <h3 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
          <Download size={18} className="text-emerald-500" /> Xuất dữ liệu
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          Xuất toàn bộ dữ liệu tủ lạnh ({foods.length} thực phẩm, {meals.length} bữa ăn, {shopping.length} món cần mua)
        </p>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Download size={15} /> Tải file JSON
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {copied ? <><Check size={15} className="text-emerald-500" /> Đã sao chép!</> : <><Copy size={15} /> Sao chép text</>}
          </button>
        </div>
      </div>

      {/* Import section */}
      <div className="bg-white border border-slate-100 rounded-xl p-5">
        <h3 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
          <Upload size={18} className="text-blue-500" /> Nhập dữ liệu
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          Nhập dữ liệu từ thiết bị khác. <span className="text-orange-600 font-medium">Lưu ý: sẽ ghi đè dữ liệu hiện tại.</span>
        </p>

        <div className="flex gap-3 flex-wrap mb-3">
          <label className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors">
            <Upload size={15} /> Chọn file JSON
            <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
          </label>
          <button
            onClick={() => setImportMode(!importMode)}
            className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw size={15} /> Dán text
          </button>
        </div>

        {importMode && (
          <div className="space-y-3">
            <textarea
              value={importText}
              onChange={(e) => { setImportText(e.target.value); setError(""); }}
              placeholder="Dán nội dung dữ liệu vào đây..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono h-32 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => { setImportMode(false); setImportText(""); setError(""); }}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={handleImport}
                disabled={!importText.trim()}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Upload size={14} /> Nhập dữ liệu
              </button>
            </div>
          </div>
        )}
      </div>

      {/* How to share tip */}
      <div className="bg-slate-50 rounded-xl p-4 text-sm">
        <p className="font-medium text-slate-700 mb-2">📱 Cách dùng chung nhanh nhất</p>
        <ol className="space-y-1 text-slate-500 text-xs list-decimal list-inside">
          <li>Mở app trên điện thoại của bạn → Xuất dữ liệu → Tải file JSON</li>
          <li>Gửi file JSON đó cho chồng qua Zalo/Messenger</li>
          <li>Chồng mở app → Đồng bộ → Chọn file JSON → Nhập dữ liệu</li>
          <li>Hai điện thoại cùng có dữ liệu mới nhất</li>
        </ol>
        <p className="text-xs text-slate-400 mt-2">💡 Quy ước: ai thêm đồ vào tủ thì xuất và gửi cho người kia</p>
      </div>
    </div>
  );
}
