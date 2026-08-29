export type Word = {
  text: string;
  startMs: number;
  endMs: number;
};

export type SegmentKind = "speech" | "filler" | "silence";

export type Segment = {
  id: string;
  kind: SegmentKind;
  startMs: number;
  endMs: number;
  text: string;
  words: Word[];
  final: boolean;
};

export type TranscriptExport = {
  startedAt: number;
  endedAt: number | null;
  durationMs: number;
  segments: Segment[];
};

export type JuryExpression =
  | "idle"
  | "hooked"
  | "confused"
  | "bored"
  | "skeptical"
  | "convinced";

export type JurySlug =
  | "tecnico"
  | "tiktok"
  | "recien-llegado"
  | "actitud";

export type SeatView = {
  slug: JurySlug;
  kind: "agent" | "human";
  displayName: string;
  expression: JuryExpression;
  lastNote?: string;
  lastQuestion?: string;
};

export type FeedItem = {
  id: string;
  tMs: number;
  seatSlug: JurySlug;
  displayName: string;
  type: "reaction" | "question";
  expression?: JuryExpression;
  text: string;
};
