"use client";

/** Mic low-poly 2D cuando WebGL no está disponible. */
export function MicFallback({ className = "" }: { className?: string }) {
  return (
    <div
      className={`mic-scene-mask flex h-full w-full items-center justify-center ${className}`}
      aria-hidden
    >
      <svg
        viewBox="0 0 120 200"
        className="h-[70%] w-auto drop-shadow-[0_12px_40px_rgba(255,143,171,0.35)]"
        fill="none"
      >
        <defs>
          <radialGradient id="micGlow" cx="50%" cy="35%" r="55%">
            <stop offset="0%" stopColor="#ff8fab" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#212529" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="60" cy="100" rx="48" ry="70" fill="url(#micGlow)" />
        {/* cabeza */}
        <polygon
          points="60,18 82,38 74,58 46,58 38,38"
          fill="#4a515a"
          stroke="#6a737e"
          strokeWidth="1.2"
        />
        <polygon points="60,22 74,38 60,48 46,38" fill="#5c6570" />
        {/* cuello */}
        <rect x="52" y="56" width="16" height="14" rx="2" fill="#32383f" />
        {/* cuerpo */}
        <polygon
          points="38,70 82,70 88,150 32,150"
          fill="#2a2e33"
          stroke="#3d444c"
          strokeWidth="1.2"
        />
        <polygon points="44,78 76,78 78,140 42,140" fill="#32383f" />
        {/* LED */}
        <circle cx="60" cy="96" r="6" fill="#ff8fab">
          <animate
            attributeName="opacity"
            values="0.7;1;0.7"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
        {/* botón */}
        <rect x="50" y="112" width="20" height="28" rx="3" fill="#1e2228" />
        {/* base */}
        <polygon points="32,150 88,150 82,168 38,168" fill="#1e2228" />
        <ellipse cx="60" cy="178" rx="28" ry="6" fill="#000" opacity="0.35" />
      </svg>
    </div>
  );
}
