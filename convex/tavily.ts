import { tool, isLoopFinished } from "ai";
import type { ToolSet } from "ai";
import { z } from "zod";
import type { Doc } from "./_generated/dataModel";

// ============================================================
//  FACT-CHECKING CON TAVILY
//  Un jurado con profiles.verifiesFacts = true puede verificar
//  afirmaciones factuales del pitch en internet antes de
//  reaccionar o puntuar. Hoy solo Dra. Elena (slug "tecnico").
//  Se activa desde profiles.ts, el panel de control.
// ============================================================

const TAVILY_ENDPOINT = "https://api.tavily.com/search";

// Devuelve un string compacto y legible para el modelo: la respuesta
// sintetizada por Tavily + top resultados. Se ejecuta dentro de una
// action, donde el runtime de Convex expone `fetch` global.
export async function tavilySearch(
  query: string,
  opts: { maxResults?: number } = {},
): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("TAVILY_API_KEY no configurada en Convex");
  const res = await fetch(TAVILY_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "basic",
      max_results: opts.maxResults ?? 5,
      include_answer: true,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Tavily ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    answer?: string;
    results?: Array<{ title?: string; url?: string; content?: string }>;
  };
  const parts: string[] = [];
  if (data.answer) parts.push(`Respuesta: ${data.answer}`);
  for (const r of data.results ?? []) {
    parts.push(
      `- ${r.title ?? ""}\n  ${r.url ?? ""}\n  ${(r.content ?? "").slice(0, 500)}`,
    );
  }
  return parts.join("\n\n") || "Sin resultados.";
}

const REACT_INSTRUCTION =
  "Sos la unica del panel con acceso a verificar datos en internet (tool buscarEnWeb). " +
  "Si escuchaste una afirmacion verificable — leyes, cifras, cuotas de mercado, hechos — que te suene " +
  "dudosa, ambigua o desactualizada, verificala con UNA busqueda y apoyate en la fuente. " +
  "Si es opinion o no te genera duda, NO llames la tool: cada busqueda cuesta y agrega latencia. " +
  "Maximo 2 busquedas por reaccion.";

const SCORE_INSTRUCTION =
  "Tenés acceso a buscarEnWeb para verificar afirmaciones factuales del pitch (leyes, cifras, datos de mercado, hechos). " +
  "Verificá lo que te parezca dudoso y cita la fuente en el why del criterio que corresponda. " +
  "No inventes datos: si la busqueda no respalda el claim, decilo. Maximo 2 busquedas.";

export type WebSearchBundle = {
  instruction?: string;
  tools?: ToolSet;
  stopWhen?: ReturnType<typeof isLoopFinished>;
};

// Devuelve el bundle de la tool solo si el perfil tiene verifiesFacts.
// jury.ts lo esparce en generateText (tools + stopWhen) y agrega la
// instruccion al system prompt.
export function webSearch(
  profile: Doc<"profiles">,
  mode: "react" | "score",
): WebSearchBundle {
  if (!profile.verifiesFacts) return {};
  return {
    instruction: mode === "react" ? REACT_INSTRUCTION : SCORE_INSTRUCTION,
    tools: {
      buscarEnWeb: tool({
        description:
          "Busca en internet (Tavily) para verificar una afirmacion factual del pitch: leyes, regulaciones, cifras, datos publicos, estadisticas.",
        inputSchema: z.object({
          query: z.string().describe(
            "Consulta de busqueda, en espanol, lo mas especifica posible. Ej: 'existe ley de ciberseguridad en Chile 2025'",
          ),
        }),
        execute: async ({ query }) => {
          try {
            return await tavilySearch(query);
          } catch (err) {
            // Si falla, seguimos: el modelo reacciona con lo que sabe.
            return `No pude verificar en la web: ${err instanceof Error ? err.message : "error desconocido"}`;
          }
        },
      }),
    },
    // AI SDK v7: sin esto el loop corta en la primera llamada
    // (default stopWhen: isStepCount(1)) y la tool nunca se ejecuta.
    stopWhen: isLoopFinished(),
  };
}
