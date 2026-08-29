export function ContactShadow({ className = "" }: { className?: string }) {
  return (
    <ellipse
      className={className}
      cx="50"
      cy="96"
      rx="28"
      ry="4.5"
      fill="rgba(0,0,0,0.35)"
    />
  );
}

export function SoftEye({
  cx,
  cy,
  lid = 0,
  lookX = 0,
  lookY = 0,
}: {
  cx: number;
  cy: number;
  lid?: number;
  lookX?: number;
  lookY?: number;
}) {
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx="7.2" ry="8.2" fill="#f8f9fa" />
      <circle cx={cx + lookX} cy={cy + 1.2 + lookY} r="3.1" fill="#1a1d21" />
      <circle cx={cx + 1.6 + lookX} cy={cy - 0.6 + lookY} r="1.1" fill="#f8f9fa" />
      {lid > 0 ? (
        <path
          d={`M ${cx - 7.4} ${cy - 6} Q ${cx} ${cy - 8 + lid * 10} ${cx + 7.4} ${cy - 6} L ${cx + 7.4} ${cy - 8} L ${cx - 7.4} ${cy - 8} Z`}
          fill="#1a1d21"
        />
      ) : null}
    </g>
  );
}
