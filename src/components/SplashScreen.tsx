import { useEffect, useState } from "react";
import { RefrigeratorIcon } from "lucide-react";

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

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setExiting(true), 2000);
    const t2 = setTimeout(() => onDone(), 2420);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div className={`splash-screen${exiting ? " splash-exit" : ""}`} aria-hidden="true">
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

      {/* Glass circle glow behind logo */}
      <div className="splash-glow" />

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center gap-5 text-white text-center px-8">
        <div className="splash-logo w-28 h-28 bg-white/15 backdrop-blur-md rounded-[28px] flex items-center justify-center ring-1 ring-white/25 shadow-2xl">
          <RefrigeratorIcon size={58} className="text-white" strokeWidth={1.4} />
        </div>

        <div className="splash-title space-y-1.5">
          <h1 className="text-[28px] font-bold tracking-tight drop-shadow">Tủ lạnh gia đình</h1>
          <p className="text-emerald-100/85 text-sm font-medium tracking-wide">Quản lý thực phẩm thông minh</p>
        </div>

        {/* Progress bar */}
        <div className="splash-bar w-32 h-[3px] bg-white/20 rounded-full overflow-hidden">
          <div className="splash-bar-fill h-full rounded-full bg-white/80" />
        </div>
      </div>
    </div>
  );
}
