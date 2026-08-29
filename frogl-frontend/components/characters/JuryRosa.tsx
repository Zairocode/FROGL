import { ContactShadow, SoftEye } from "./primitives";

export function JuryRosa({
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
        <ellipse cx="34" cy="80" rx="7.5" ry="4.5" fill="#1f9d78" />
        <ellipse cx="66" cy="80" rx="7.5" ry="4.5" fill="#1f9d78" />
        <rect x="30" y="62" width="6.5" height="16" rx="3.2" fill="#2dd4a8" />
        <rect x="63.5" y="62" width="6.5" height="16" rx="3.2" fill="#2dd4a8" />
        <rect
          x="24"
          y="30"
          width="52"
          height="40"
          rx="22"
          fill="url(#rosa-body)"
        />
        <rect
          x="14"
          y="42"
          width="14"
          height="20"
          rx="7"
          fill="#5ee9c0"
          transform="rotate(-12 21 52)"
        />
        <rect
          x="72"
          y="42"
          width="14"
          height="20"
          rx="7"
          fill="#5ee9c0"
          transform="rotate(12 79 52)"
        />
        <rect x="34" y="16" width="32" height="26" rx="15" fill="#f0d5c4" />
        <path
          d="M32 30 Q36 12 50 14 Q64 12 68 30 Q50 24 32 30 Z"
          fill="#7a3e2b"
        />
        <SoftEye cx={44} cy={31} lookY={-0.4} />
        <SoftEye cx={56} cy={31} lookY={-0.4} />
        <path
          d="M44 40 Q50 45 56 40"
          stroke="#8a6a5a"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="rosa-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5ee9c0" />
            <stop offset="100%" stopColor="#2dd4a8" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
