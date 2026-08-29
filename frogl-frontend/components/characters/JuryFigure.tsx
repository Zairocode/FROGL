import type { JurySlug } from "@/lib/jury";
import { JuryElena } from "./JuryElena";
import { JuryKevin } from "./JuryKevin";
import { JuryMarco } from "./JuryMarco";
import { JuryRosa } from "./JuryRosa";

export function JuryFigure({
  slug,
  size = 140,
  className = "",
}: {
  slug: JurySlug;
  size?: number;
  className?: string;
}) {
  if (slug === "tecnico") return <JuryElena size={size} className={className} />;
  if (slug === "tiktok") return <JuryKevin size={size} className={className} />;
  if (slug === "recien-llegado")
    return <JuryMarco size={size} className={className} />;
  return <JuryRosa size={size} className={className} />;
}
