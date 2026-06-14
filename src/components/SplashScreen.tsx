import { useEffect, useState } from "react";
import { RefrigeratorIcon, ArrowRight, Compass } from "lucide-react";

const FOOD_EMOJIS = ["🥦", "🥕", "🍎", "🥩", "🧀", "🥚", "🌽", "🍅", "🧅", "🫐", "🥑", "🍋", "🫛", "🍇"];

interface Particle {
  id: number;
  emoji: string;
  left: number;
  delay: number;
  duration: number;
  size: number;
}

const PARTICLES: Particle[] = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  emoji: FOOD_EMOJIS[i % FOOD_EMOJIS.length],
  left: 3 + (i * 6.8) % 92,
  delay: (i * 0.21) % 1.6,
  duration: 2.6 + (i * 0.15) % 1.4,
  size: 20 + (i * 5) % 24,
}));

interface Props {
  onDone: () => void;
  onExplore: () => void;
}

export default function SplashScreen({ onDone, onExplore }: Props) {
  const [showButtons, setShowButtons] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowButtons(true), 1800);
    return () => clearTimeout(t);
  }, []);

  const exit = (callback: () => void) => {
    setExiting(true);
    setTimeout(callback, 520);
  };

  return (
    <div className={`splash-screen${exiting ? " splash-exit" : ""}`}>
      {/* Floating food particles */}
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

      {/* Glass glow orb */}
      <div className="splash-glow" />

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center gap-6 text-white text-center px-8">
        <div className="splash-logo w-28 h-28 bg-white/15 backdrop-blur-md rounded-[28px] flex items-center justify-center ring-1 ring-white/25 shadow-2xl">
          <RefrigeratorIcon size={58} className="text-white" strokeWidth={1.4} />
        </div>

        <div className="splash-title space-y-1.5">
          <h1 className="text-[28px] font-bold tracking-tight drop-shadow">Tủ lạnh gia đình</h1>
          <p className="text-emerald-100/85 text-sm font-medium tracking-wide">Quản lý thực phẩm thông minh</p>
        </div>

        {/* Buttons — fade in after 1.8s */}
        <div className={`flex flex-col items-center gap-3 splash-cta${showButtons ? " splash-cta-visible" : ""}`}>
          {/* Primary: enter app */}
          <button
            onClick={() => exit(onDone)}
            className="group flex items-center gap-2.5 bg-white text-emerald-700 font-semibold px-7 py-3.5 rounded-2xl shadow-xl hover:bg-emerald-50 active:scale-95 transition-all text-[15px] tracking-wide"
          >
            Open &amp; Explore
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </button>

          {/* Secondary: enter app + start guided tour */}
          <button
            onClick={() => exit(onExplore)}
            className="group flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium px-5 py-2 rounded-xl border border-white/25 hover:border-white/50 hover:bg-white/10 active:scale-95 transition-all tracking-wide"
          >
            <Compass size={15} className="transition-transform group-hover:rotate-12" />
            Explore My Fridge
          </button>

          <p className="text-white/40 text-xs mt-1 tracking-wide">Discover what's inside</p>
        </div>
      </div>
    </div>
  );
}
