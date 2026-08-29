import { ContactShadow, SoftEye } from "./primitives";

export function JuryElena({
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
        <ellipse cx="36" cy="80" rx="7" ry="4.5" fill="#c5cdd4" />
        <ellipse cx="64" cy="80" rx="7" ry="4.5" fill="#c5cdd4" />
        <rect x="32" y="62" width="6" height="16" rx="3" fill="#e8eef2" />
        <rect x="62" y="62" width="6" height="16" rx="3" fill="#e8eef2" />
        <rect
          x="26"
          y="28"
          width="48"
          height="42"
          rx="22"
          fill="url(#elena-coat)"
        />
        <rect x="38" y="48" width="24" height="20" rx="4" fill="#f8f9fa" />
        <rect x="47" y="48" width="6" height="20" fill="#38bdf8" />
        <rect x="18" y="40" width="11" height="20" rx="5.5" fill="#d7dee4" />
        <rect x="71" y="40" width="11" height="20" rx="5.5" fill="#d7dee4" />
        <rect x="32" y="16" width="36" height="28" rx="16" fill="#f0d5c4" />
        <path d="M34 30 Q50 18 66 30 L66 22 Q50 10 34 22 Z" fill="#3d4349" />
        <SoftEye cx={42} cy={32} lid={0.55} lookY={1} />
        <SoftEye cx={58} cy={32} lid={0.55} lookY={1} />
        <path
          d="M44 42 L56 42"
          stroke="#8a6a5a"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="elena-coat" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f4f7f9" />
            <stop offset="100%" stopColor="#cfd8de" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
