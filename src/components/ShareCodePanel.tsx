import { useState, useEffect } from "react";
import { X, Copy, Check, Users } from "lucide-react";
import { getFridgeMemberCount } from "../lib/supabase";
import type { Fridge } from "../types";

interface ShareCodePanelProps {
  fridge: Fridge;
  onClose: () => void;
}

export default function ShareCodePanel({ fridge, onClose }: ShareCodePanelProps) {
  const [copied, setCopied] = useState(false);
  const [memberCount, setMemberCount] = useState<number | null>(null);

  useEffect(() => {
    getFridgeMemberCount(fridge.id)
      .then(setMemberCount)
      .catch(() => setMemberCount(null));
  }, [fridge.id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(fridge.share_code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Format code as groups for readability
  const formattedCode = fridge.share_code.slice(0, 3) + " " + fridge.share_code.slice(3);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center sm:items-center" onClick={onClose}>
      <div
        className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800">Mã chia sẻ tủ lạnh</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Fridge name */}
          <p className="text-sm text-slate-500 text-center">{fridge.name}</p>

          {/* Share code display */}
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl py-6 text-center">
            <p className="text-4xl font-bold font-mono tracking-[0.3em] text-emerald-700 select-all">
              {formattedCode}
            </p>
          </div>

          {/* Member count */}
          {memberCount !== null && (
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <Users size={15} className="text-slate-400" />
              <span>Đã có <strong className="text-slate-700">{memberCount}</strong> thành viên</span>
            </div>
          )}

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] ${
              copied
                ? "bg-green-500 text-white"
                : "bg-emerald-500 hover:bg-emerald-600 text-white"
            }`}
          >
            {copied ? (
              <><Check size={16} /> Đã sao chép!</>
            ) : (
              <><Copy size={16} /> Sao chép mã</>
            )}
          </button>

          {/* Instructions */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Hướng dẫn chia sẻ</p>
            <ul className="space-y-1.5 text-sm text-slate-500">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold mt-0.5">1.</span>
                Sao chép mã và gửi cho thành viên gia đình
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold mt-0.5">2.</span>
                Thành viên mở ứng dụng, chọn "Đăng ký" hoặc "Vãng lai"
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold mt-0.5">3.</span>
                Nhập mã chia sẻ để truy cập tủ lạnh chung
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
