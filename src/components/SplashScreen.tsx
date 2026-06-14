import { useEffect, useState } from "react";
import { ArrowRight, Compass } from "lucide-react";
import PeachChefLogo from "./PeachChefLogo";

const FOOD_EMOJIS = ["🥦", "🥕", "🍎", "🥩", "🧀", "🥚", "🌽", "🍅", "🧅", "🫐", "🥑", "🍋", "🫛", "🍇", "🍊", "🫒", "🥬", "🍓"];

interface Particle {
  id: number;
  emoji: string;
  left: number;
  delay: number;
  duration: number;
  size: number;
}

const PARTICLES: Particle[] = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  emoji: FOOD_EMOJIS[i % FOOD_EMOJIS.length],
  left: 2 + (i * 4.8) % 94,
  delay: (i * 0.28) % 2.8,
  duration: 3.0 + (i * 0.18) % 1.8,
  size: 18 + (i * 4) % 26,
}));

interface Props {
  onDone: () => void;
  onExplore: () => void;
}

export default function SplashScreen({ onDone, onExplore }: Props) {
  const [showButtons, setShowButtons] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowButtons(true), 1600);
    return () => clearTimeout(t);
  }, []);

  const exit = (callback: () => void) => {
    setExiting(true);
    setTimeout(callback, 520);
  };

  return (
    <div className={`splash-screen${exiting ? " splash-exit" : ""}`}>
      {/* Continuously looping food particles */}
      {PARTICLES.map((p) => (
        <span
          key={p.id}
          className="float-particle"
          style={{
            left: `${p.left}%`,
            fontSize: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        >
          {p.emoji}
        </span>
      ))}

      {/* Background glow orb */}
      <div className="splash-glow" />

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center gap-5 text-white text-center px-8">
        {/* Princess Peach chef logo */}
        <div className="peach-idle">
          <PeachChefLogo className="peach-entrance w-36 h-auto drop-shadow-2xl" />
        </div>

        {/* App title */}
        <div className="splash-title space-y-1.5">
          <h1 className="text-[28px] font-bold tracking-tight drop-shadow">Tủ lạnh gia đình</h1>
          <p className="text-emerald-100/85 text-sm font-medium tracking-wide">Quản lý thực phẩm thông minh</p>
        </div>

        {/* Buttons — appear after 1.6s */}
        <div className={`flex flex-col items-center gap-3 splash-cta${showButtons ? " splash-cta-visible" : ""}`}>
          <button
            onClick={() => exit(onDone)}
            className="group flex items-center gap-2.5 bg-white text-emerald-700 font-semibold px-7 py-3.5 rounded-2xl shadow-xl hover:bg-emerald-50 active:scale-95 transition-all text-[15px] tracking-wide"
          >
            Open &amp; Explore
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </button>

          <button
            onClick={() => exit(onExplore)}
            className="group flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium px-5 py-2 rounded-xl border border-white/25 hover:border-white/50 hover:bg-white/10 active:scale-95 transition-all tracking-wide"
          >
            <Compass size={15} className="transition-transform group-hover:rotate-12" />
            Explore My Fridge
          </button>

          <p className="text-white/40 text-xs mt-0.5 tracking-wide">Discover what's inside</p>
        </div>
      </div>
    </div>
  );
}
