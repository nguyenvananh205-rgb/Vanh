import { useState } from "react";
import { X, Key, Eye, EyeOff, Trash2, CheckCircle2 } from "lucide-react";
import { getApiKey, saveApiKey, clearApiKey } from "../utils/visionParser";

interface Props {
  onClose: () => void;
}

export default function ApiKeySettings({ onClose }: Props) {
  const [key, setKey] = useState(getApiKey());
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    saveApiKey(key);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    clearApiKey();
    setKey("");
  };

  const hasKey = !!getApiKey();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Key size={18} className="text-slate-500" />
            <h2 className="text-base font-semibold text-slate-800">Cài đặt AI Vision</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg">
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
            <p className="font-medium mb-1">Nhận diện ảnh thực phẩm bằng AI</p>
            <p className="text-xs text-blue-600">
              Cần Anthropic API key để dùng tính năng chụp ảnh tự động nhận diện.
              Không có key vẫn dùng được giọng nói và nhập tay.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">
              Anthropic API Key
              {hasKey && <span className="ml-2 text-xs text-emerald-600">● Đã cài đặt</span>}
            </label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Key được lưu trong bộ nhớ thiết bị, không gửi đi đâu ngoài api.anthropic.com
            </p>
          </div>

          <div className="flex gap-2">
            {hasKey && (
              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-500 hover:bg-slate-50"
              >
                <Trash2 size={14} /> Xóa key
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!key.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {saved ? <><CheckCircle2 size={15} /> Đã lưu!</> : "Lưu API Key"}
            </button>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <p className="text-xs text-slate-400">
              Lấy API key miễn phí tại{" "}
              <span className="text-emerald-600 font-medium">console.anthropic.com</span>
              {" "}→ API Keys → Create Key
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
