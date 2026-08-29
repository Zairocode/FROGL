import { initials } from "@/lib/accounts";

export function JurorAvatar({
  name,
  color,
  size = 72,
}: {
  name: string;
  color: string;
  size?: number;
}) {
  return (
    <div
      className="juror-avatar"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(180deg, color-mix(in srgb, ${color} 80%, #f8f9fa), ${color})`,
        boxShadow: `0 10px 0 -6px rgba(0,0,0,0.28), 0 0 0 3px color-mix(in srgb, ${color} 35%, transparent)`,
      }}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}
