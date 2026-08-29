/** Lexicon de muletillas / fillers en español (y variantes cortas). */
const FILLER_SET = new Set(
  [
    "eh",
    "ehh",
    "ehhh",
    "eeh",
    "eeeh",
    "eee",
    "ah",
    "ahh",
    "ahhh",
    "aah",
    "aaah",
    "aaa",
    "este",
    "esta",
    "esto",
    "pues",
    "bueno",
    "o sea",
    "osea",
    "tipo",
    "como",
    "mmm",
    "mm",
    "hm",
    "hmm",
    "uhm",
    "um",
    "uh",
    "er",
    "em",
  ].map((s) => s.toLowerCase()),
);

const FILLER_RE =
  /^(e+h+|a+h+|m+|h+m+|u+h+m?|este|esta|esto|pues|bueno|osea|o\s*sea|tipo)$/i;

export function normalizeToken(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:…"""'']/g, "");
}

export function isFillerToken(text: string): boolean {
  const n = normalizeToken(text);
  if (!n) return false;
  if (FILLER_SET.has(n)) return true;
  return FILLER_RE.test(n);
}

/** Si casi toda la frase son muletillas, el segmento es filler. */
export function isMostlyFillers(tokens: string[]): boolean {
  if (tokens.length === 0) return false;
  const fillers = tokens.filter(isFillerToken).length;
  return fillers / tokens.length >= 0.6;
}

export function tokenize(text: string): string[] {
  return text
    .trim()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
}
