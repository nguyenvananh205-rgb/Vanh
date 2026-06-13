import { useState, useRef } from "react";
import { X, Mic, MicOff, Camera, PenLine, Loader2, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import type { FoodItem, FoodCategory, FoodLocation } from "../types";
import { CATEGORY_LABELS, LOCATION_LABELS, LOCATION_ORDER, generateId, todayISO } from "../utils";
import { useVoiceInput } from "../hooks/useVoiceInput";
import { parseVoiceInput } from "../utils/voiceParser";
import { analyzeImage, getApiKey } from "../utils/visionParser";
import type { ParsedFood } from "../utils/voiceParser";

type Mode = "pick" | "voice" | "camera" | "manual";
type Step = "input" | "confirm";

const UNITS = ["gram", "kg", "ml", "lít", "hộp", "cái", "bó", "ổ", "quả", "túi", "lon", "chai", "miếng", "con", "phần"];

const EXPIRY_SHORTCUTS = [
  { label: "1 ngày", days: 1 },
  { label: "2 ngày", days: 2 },
  { label: "3 ngày", days: 3 },
  { label: "5 ngày", days: 5 },
  { label: "1 tuần", days: 7 },
  { label: "2 tuần", days: 14 },
  { label: "1 tháng", days: 30 },
];

function addDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDateVN(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

interface ConfirmFormProps {
  initial: ParsedFood;
  onSave: (item: FoodItem) => void;
  onBack: () => void;
  imagePreview?: string | null;
}

function ConfirmForm({ initial, onSave, onBack, imagePreview }: ConfirmFormProps) {
  const [name, setName] = useState(initial.name ?? "");
  const [quantity, setQuantity] = useState(initial.quantity ?? 1);
  const [unit, setUnit] = useState(initial.unit ?? "gram");
  const [category, setCategory] = useState<FoodCategory>(initial.category ?? "khac");
  const [location, setLocation] = useState<FoodLocation>("ngan_lanh");
  const [expiryDate, setExpiryDate] = useState(initial.expiryDate ?? "");
  const [showMore, setShowMore] = useState(false);
  const [purchaseDate] = useState(todayISO());

  const canSave = name.trim() && expiryDate;

  return (
    <div className="space-y-4">
      {imagePreview && (
        <img src={imagePreview} alt="" className="w-full h-32 object-cover rounded-xl" />
      )}

      {/* Name */}
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tên thực phẩm *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên thực phẩm..."
          autoFocus
          className="mt-1 w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base font-medium focus:outline-none focus:border-emerald-400 transition-colors"
        />
      </div>

      {/* Qty + Unit */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Số lượng</label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={quantity}
            onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
            className="mt-1 w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base font-medium focus:outline-none focus:border-emerald-400"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Đơn vị</label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="mt-1 w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base font-medium focus:outline-none focus:border-emerald-400 bg-white"
          >
            {UNITS.map((u) => <option key={u}>{u}</option>)}
          </select>
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Danh mục</label>
        <div className="mt-1 grid grid-cols-4 gap-1.5">
          {(Object.entries(CATEGORY_LABELS) as [FoodCategory, string][]).map(([k, v]) => (
            <button
              key={k}
              type="button"
              onClick={() => setCategory(k)}
              className={`py-2 px-1 rounded-xl text-xs font-medium border-2 transition-colors text-center leading-tight ${
                category === k
                  ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                  : "border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-300"
              }`}
            >
              {v.split(" ").map((w, i) => <span key={i} className="block">{w}</span>)}
            </button>
          ))}
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Vị trí lưu trữ</label>
        <div className="mt-1 grid grid-cols-2 gap-1.5">
          {LOCATION_ORDER.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => setLocation(loc)}
              className={`py-2 px-3 rounded-xl text-xs font-medium border-2 transition-colors text-left ${
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

      {/* Expiry date */}
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Hạn sử dụng *</label>
        {/* Shortcut chips */}
        <div className="mt-1 flex flex-wrap gap-1.5 mb-2">
          {EXPIRY_SHORTCUTS.map(({ label, days }) => {
            const iso = addDaysISO(days);
            return (
              <button
                key={label}
                type="button"
                onClick={() => setExpiryDate(iso)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  expiryDate === iso
                    ? "bg-emerald-500 text-white border-emerald-500"
                    : "border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-emerald-400"
          />
          {expiryDate && (
            <span className="text-sm text-slate-500 shrink-0">{formatDateVN(expiryDate)}</span>
          )}
        </div>
      </div>

      {/* More options toggle */}
      <button
        type="button"
        onClick={() => setShowMore((v) => !v)}
        className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
      >
        {showMore ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {showMore ? "Ẩn bớt" : "Thêm tùy chọn (ngày mua, ghi chú)"}
      </button>

      {showMore && (
        <div className="space-y-3 pt-1 border-t border-slate-100">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Ngày mua/nấu</label>
            <input
              type="date"
              defaultValue={purchaseDate}
              className="mt-1 w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400"
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 border-2 border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          ← Thử lại
        </button>
        <button
          type="button"
          disabled={!canSave}
          onClick={() =>
            onSave({
              id: generateId(),
              name: name.trim(),
              quantity,
              unit,
              category,
              location,
              purchaseDate,
              expiryDate,
            })
          }
          className="flex-2 flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          Thêm vào tủ ✓
        </button>
      </div>
    </div>
  );
}

interface Props {
  onSave: (item: FoodItem) => void;
  onClose: () => void;
}

export default function SmartAddModal({ onSave, onClose }: Props) {
  const [mode, setMode] = useState<Mode>("pick");
  const [step, setStep] = useState<Step>("input");
  const [parsed, setParsed] = useState<ParsedFood>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // --- Voice ---
  const { state: voiceState, transcript, start: startVoice, reset: resetVoice } = useVoiceInput({
    onResult: (text) => {
      const result = parseVoiceInput(text);
      setParsed(result);
      setStep("confirm");
    },
    onError: (msg) => setError(msg),
  });

  // --- Camera / photo ---
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setImagePreview(preview);

    const apiKey = getApiKey();
    if (!apiKey) {
      // No API key: just show preview and jump to manual confirm
      setParsed({});
      setStep("confirm");
      return;
    }

    setAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeImage(file);
      setParsed(result);
      setStep("confirm");
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "NO_API_KEY") {
        setParsed({});
        setStep("confirm");
      } else {
        setError(err instanceof Error ? err.message : "Không thể phân tích ảnh.");
        setParsed({});
        setStep("confirm");
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = (item: FoodItem) => {
    onSave(item);
    onClose();
  };

  const goBack = () => {
    setStep("input");
    setParsed({});
    setImagePreview(null);
    setError(null);
    resetVoice();
  };

  // ---- Render ----
  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">
            {step === "confirm" ? "Xác nhận thông tin" : "Thêm thực phẩm"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="p-5">
          {/* ─── MODE PICKER ─── */}
          {mode === "pick" && (
            <div className="space-y-3">
              <p className="text-sm text-slate-500 text-center mb-4">Chọn cách nhập thực phẩm</p>
              <button
                onClick={() => { setMode("voice"); resetVoice(); }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors"
              >
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                  <Mic size={24} className="text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-800">Nói giọng nói</p>
                  <p className="text-xs text-slate-500 mt-0.5">Nói tên, số lượng, hạn dùng — tự động điền form</p>
                </div>
              </button>

              <button
                onClick={() => { setMode("camera"); fileRef.current?.click(); }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shrink-0">
                  <Camera size={24} className="text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-800">Chụp ảnh / Thư viện</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {getApiKey() ? "AI tự nhận diện tên, số lượng, hạn dùng" : "Chụp để tham khảo khi điền form"}
                  </p>
                </div>
              </button>

              <button
                onClick={() => { setMode("manual"); setStep("confirm"); setParsed({}); }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="w-12 h-12 bg-slate-400 rounded-xl flex items-center justify-center shrink-0">
                  <PenLine size={24} className="text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-800">Nhập tay</p>
                  <p className="text-xs text-slate-500 mt-0.5">Điền form thủ công với phím tắt hạn dùng</p>
                </div>
              </button>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          )}

          {/* ─── VOICE INPUT ─── */}
          {mode === "voice" && step === "input" && (
            <div className="flex flex-col items-center gap-6 py-4">
              <div className="text-center">
                <p className="text-sm text-slate-600 font-medium mb-1">Ví dụ:</p>
                <p className="text-sm text-emerald-700 bg-emerald-50 rounded-xl px-4 py-2.5 italic">
                  "Thịt gà 500 gram hết hạn 3 ngày nữa"
                </p>
                <p className="text-xs text-slate-400 mt-1.5">
                  Nói rõ: tên món · số lượng · đơn vị · hạn dùng
                </p>
              </div>

              {/* Mic button */}
              <button
                onClick={voiceState === "listening" ? undefined : startVoice}
                className={`w-28 h-28 rounded-full flex items-center justify-center shadow-lg transition-all ${
                  voiceState === "listening"
                    ? "bg-red-500 scale-110 animate-pulse shadow-red-300 shadow-2xl"
                    : voiceState === "processing"
                    ? "bg-yellow-400"
                    : "bg-emerald-500 hover:bg-emerald-600 hover:scale-105"
                }`}
              >
                {voiceState === "listening" ? (
                  <MicOff size={40} className="text-white" />
                ) : voiceState === "processing" ? (
                  <Loader2 size={40} className="text-white animate-spin" />
                ) : (
                  <Mic size={40} className="text-white" />
                )}
              </button>

              <p className="text-sm font-medium text-slate-600">
                {voiceState === "idle" && "Nhấn để bắt đầu nói"}
                {voiceState === "listening" && "🔴 Đang nghe..."}
                {voiceState === "processing" && "Đang xử lý..."}
                {voiceState === "error" && "Thử lại"}
              </p>

              {transcript && (
                <div className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-700 italic border border-slate-100">
                  "{transcript}"
                </div>
              )}

              {error && (
                <div className="w-full bg-red-50 rounded-xl px-4 py-3 text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  {error}
                </div>
              )}

              <button onClick={() => setMode("pick")} className="text-sm text-slate-400 hover:text-slate-600">
                ← Quay lại
              </button>
            </div>
          )}

          {/* ─── CAMERA ANALYZING ─── */}
          {mode === "camera" && step === "input" && analyzing && (
            <div className="flex flex-col items-center gap-4 py-8">
              {imagePreview && (
                <img src={imagePreview} alt="" className="w-full h-48 object-cover rounded-xl" />
              )}
              <Loader2 size={32} className="text-emerald-500 animate-spin" />
              <p className="text-sm text-slate-600 font-medium">AI đang phân tích ảnh...</p>
            </div>
          )}

          {/* ─── CONFIRM FORM ─── */}
          {step === "confirm" && (
            <ConfirmForm
              initial={parsed}
              onSave={handleSave}
              onBack={mode === "manual" ? () => { setMode("pick"); setStep("input"); } : goBack}
              imagePreview={imagePreview}
            />
          )}

          {/* Error banner in confirm step */}
          {step === "confirm" && error && (
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-700 flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              {error} — Vui lòng nhập thủ công.
            </div>
          )}

          {/* Success hint */}
          {step === "confirm" && !error && (parsed.name || parsed.expiryDate) && (
            <div className="mt-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5 text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 size={14} className="shrink-0" />
              Đã tự điền thông tin — kiểm tra lại và nhấn "Thêm vào tủ"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
