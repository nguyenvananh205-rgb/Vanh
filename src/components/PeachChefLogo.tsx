export default function PeachChefLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 158"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ overflow: "visible" }}
      aria-label="Princess Peach chef"
    >
      {/* ══ Chef's toque ══════════════════════════════ */}
      {/* Puffed top */}
      <ellipse cx="60" cy="30" rx="33" ry="27" fill="white" />
      {/* Cylinder fill (covers gap) */}
      <rect x="27" y="30" width="66" height="36" fill="white" />
      {/* Hat band */}
      <rect x="21" y="64" width="78" height="13" rx="5"
        fill="#f0f0f0" stroke="#d8d8d8" strokeWidth="0.8" />
      {/* Soft shadow under puff */}
      <ellipse cx="60" cy="56" rx="33" ry="4" fill="#e8e8e8" opacity="0.6" />

      {/* ══ Princess tiara on band ════════════════════ */}
      <rect x="26" y="74" width="68" height="4" rx="2" fill="#FFD700" />
      {/* Left spike */}
      <polygon points="36,74 40,62 44,74" fill="#FFD700" />
      {/* Centre spike (tallest) */}
      <polygon points="52,74 60,54 68,74" fill="#FFD700" />
      {/* Right spike */}
      <polygon points="76,74 80,62 84,74" fill="#FFD700" />
      {/* Gem stones */}
      <circle cx="40" cy="63" r="2.8" fill="#FF69B4" />
      <circle cx="60" cy="56" r="3.2" fill="#FF1493" />
      <circle cx="80" cy="63" r="2.8" fill="#FF69B4" />
      {/* Gem highlights */}
      <circle cx="59.2" cy="55" r="1.1" fill="white" opacity="0.85" />
      <circle cx="39.2" cy="62" r="0.9" fill="white" opacity="0.75" />

      {/* ══ Blonde hair ═══════════════════════════════ */}
      {/* Left curl */}
      <ellipse cx="17" cy="113" rx="14" ry="25" fill="#F5C518"
        transform="rotate(-11 17 113)" />
      <ellipse cx="14" cy="104" rx="5.5" ry="10" fill="#FFD940"
        transform="rotate(-11 14 104)" />
      {/* Right curl */}
      <ellipse cx="103" cy="113" rx="14" ry="25" fill="#F5C518"
        transform="rotate(11 103 113)" />
      <ellipse cx="106" cy="104" rx="5.5" ry="10" fill="#FFD940"
        transform="rotate(11 106 104)" />

      {/* ══ Face ══════════════════════════════════════ */}
      <ellipse cx="60" cy="111" rx="37" ry="35" fill="#FFCBA4" />
      {/* Jaw shading */}
      <ellipse cx="60" cy="128" rx="28" ry="16" fill="#F5B48A" opacity="0.16" />

      {/* ══ Left eye (blink via CSS) ═══════════════════ */}
      <g
        className="peach-eye-left"
        style={{ transformBox: "fill-box" as "fill-box", transformOrigin: "center" }}
      >
        <ellipse cx="45" cy="105" rx="7.8" ry="8.8" fill="white" stroke="#EDE0D4" strokeWidth="0.5" />
        <ellipse cx="45" cy="106.5" rx="5.8" ry="6.3" fill="#5AAFFF" />
        <ellipse cx="45.5" cy="107.5" rx="3.2" ry="3.8" fill="#1a2a4a" />
        <ellipse cx="43" cy="104" rx="2.2" ry="2.6" fill="white" />
        <circle cx="49" cy="108" r="1.1" fill="white" opacity="0.55" />
      </g>
      {/* Left lash stays on top always */}
      <path d="M 37 98 Q 45 93 53 98"
        stroke="#6B4226" strokeWidth="2.3" fill="none" strokeLinecap="round" />

      {/* ══ Right eye (blink via CSS) ══════════════════ */}
      <g
        className="peach-eye-right"
        style={{ transformBox: "fill-box" as "fill-box", transformOrigin: "center" }}
      >
        <ellipse cx="75" cy="105" rx="7.8" ry="8.8" fill="white" stroke="#EDE0D4" strokeWidth="0.5" />
        <ellipse cx="75" cy="106.5" rx="5.8" ry="6.3" fill="#5AAFFF" />
        <ellipse cx="75.5" cy="107.5" rx="3.2" ry="3.8" fill="#1a2a4a" />
        <ellipse cx="73" cy="104" rx="2.2" ry="2.6" fill="white" />
        <circle cx="79" cy="108" r="1.1" fill="white" opacity="0.55" />
      </g>
      {/* Right lash */}
      <path d="M 67 98 Q 75 93 83 98"
        stroke="#6B4226" strokeWidth="2.3" fill="none" strokeLinecap="round" />

      {/* ══ Nose ══════════════════════════════════════ */}
      <ellipse cx="56" cy="117" rx="2.6" ry="1.9" fill="#F09878" />
      <ellipse cx="64" cy="117" rx="2.6" ry="1.9" fill="#F09878" />

      {/* ══ Smile ══════════════════════════════════════ */}
      <path d="M 49 126 Q 60 138 71 126"
        stroke="#D06060" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M 51 126.5 Q 60 133.5 69 126.5"
        fill="#E8809A" opacity="0.28" />

      {/* ══ Rosy cheeks ════════════════════════════════ */}
      <ellipse cx="30" cy="119" rx="11" ry="7.5" fill="#FF9AAB" opacity="0.42" />
      <ellipse cx="90" cy="119" rx="11" ry="7.5" fill="#FF9AAB" opacity="0.42" />
    </svg>
  );
}
