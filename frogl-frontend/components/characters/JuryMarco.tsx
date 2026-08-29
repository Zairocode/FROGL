import { ContactShadow, SoftEye } from "./primitives";

export function JuryMarco({
  size = 140,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`inline-block ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
        <ContactShadow />
        <ellipse cx="30" cy="80" rx="7" ry="4.5" fill="#6b7280" />
        <ellipse cx="78" cy="86" rx="7" ry="4.5" fill="#fbbf24" opacity="0.85" />
        <rect x="26" y="62" width="6" height="16" rx="3" fill="#4b5563" />
        <rect
          x="74"
          y="68"
          width="6"
          height="16"
          rx="3"
          fill="#4b5563"
          transform="rotate(18 77 76)"
        />
        <rect
          x="28"
          y="30"
          width="44"
          height="40"
          rx="20"
          fill="url(#marco-body)"
        />
        <rect x="20" y="42" width="11" height="18" rx="5.5" fill="#9ca3af" />
        <rect x="68" y="46" width="11" height="18" rx="5.5" fill="#9ca3af" />
        <rect x="34" y="16" width="32" height="26" rx="14" fill="#e8c4a8" />
        <path d="M36 26 Q50 14 64 28 L62 20 Q50 10 36 20 Z" fill="#2c3034" />
        <SoftEye cx={44} cy={31} lookX={2} />
        <SoftEye cx={56} cy={31} lookX={2} />
        <path
          d="M46 41 Q50 43 54 40"
          stroke="#8a6a5a"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
        <rect x="46" y="48" width="10" height="3" rx="1.5" fill="#fbbf24" />
        <defs>
          <linearGradient id="marco-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6b7280" />
            <stop offset="100%" stopColor="#4b5563" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
