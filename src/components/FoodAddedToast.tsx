import { useEffect, useState } from "react";
import type { FoodCategory } from "../types";

interface Props {
  name: string;
  category: FoodCategory;
  onDone: () => void;
}

const CATEGORY_EMOJI: Record<FoodCategory, string> = {
  thit_ca:    "🥩",
  rau_cu:     "🥦",
  do_nau_chin:"🍲",
  sua_trung:  "🥚",
  do_uong:    "🧃",
  gia_vi:     "🧄",
  trang_miem: "🍰",
  khac:       "🥫",
};

function CartoonFridge() {
  return (
    <svg width="42" height="54" viewBox="0 0 42 54" fill="none" className="fridge-wobble">
      {/* Body */}
      <rect x="1.5" y="1.5" width="39" height="51" rx="9" fill="#dbeafe" stroke="#93c5fd" strokeWidth="3"/>
      {/* Freezer section */}
      <rect x="1.5" y="1.5" width="39" height="19" rx="9" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="3"/>
      <rect x="1.5" y="15" width="39" height="6" fill="#bfdbfe"/>
      {/* Divider */}
      <line x1="1.5" y1="20.5" x2="40.5" y2="20.5" stroke="#93c5fd" strokeWidth="2"/>
      {/* Freezer handle */}
      <rect x="15" y="8" width="12" height="3" rx="1.5" fill="#3b82f6"/>
      {/* Main handle */}
      <rect x="15" y="29" width="12" height="3" rx="1.5" fill="#3b82f6"/>
      {/* Eyes */}
      <circle cx="15" cy="39" r="2.8" fill="#1e40af"/>
      <circle cx="27" cy="39" r="2.8" fill="#1e40af"/>
      {/* Eye shine */}
      <circle cx="16" cy="38" r="1" fill="white"/>
      <circle cx="28" cy="38" r="1" fill="white"/>
      {/* Smile */}
      <path d="M13 45.5 Q21 51 29 45.5" stroke="#1e40af" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* Snowflake */}
      <line x1="21" y1="5" x2="21" y2="16" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="15" y1="7.8" x2="27" y2="13.2" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="27" y1="7.8" x2="15" y2="13.2" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="21" cy="5" r="1.2" fill="#60a5fa"/>
      <circle cx="21" cy="16" r="1.2" fill="#60a5fa"/>
    </svg>
  );
}

export default function FoodAddedToast({ name, category, onDone }: Props) {
  const [exiting, setExiting] = useState(false);
  const emoji = CATEGORY_EMOJI[category] ?? "🥫";

  useEffect(() => {
    const t1 = setTimeout(() => setExiting(true), 2600);
    const t2 = setTimeout(onDone, 2850);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div
      className={`fixed top-4 left-1/2 z-[70] flex items-center gap-3 bg-white rounded-2xl shadow-2xl border border-blue-100 px-4 py-3 min-w-[260px] max-w-[340px] ${
        exiting ? "toast-exit" : "toast-enter"
      }`}
    >
      {/* Food emoji flying in */}
      <span className="text-3xl food-fly shrink-0">{emoji}</span>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wide leading-none mb-0.5">
          Đã thêm vào tủ lạnh ✓
        </p>
        <p className="text-sm font-bold text-slate-800 truncate">{name}</p>
      </div>

      {/* Cute fridge cartoon */}
      <div className="shrink-0">
        <CartoonFridge />
      </div>
    </div>
  );
}
