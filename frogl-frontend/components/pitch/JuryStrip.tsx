"use client";

import { JurySeat } from "@/components/pitch/JurySeat";
import type { SeatView } from "@/lib/transcript-types";

type Props = {
  seats: SeatView[];
};

export function JuryStrip({ seats }: Props) {
  return (
    <div className="flex w-full shrink-0 items-start justify-between gap-1 border-t border-border/60 px-2 py-2 sm:gap-2 sm:px-4 sm:py-3">
      {seats.map((seat) => (
        <JurySeat key={seat.slug} seat={seat} />
      ))}
    </div>
  );
}
