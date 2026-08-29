// node check-tavily.ts
// Prueba la busqueda que le disparamos a Dra. Elena (convex/tavily.ts) con un
// claim dudoso generico. Necesita TAVILY_API_KEY en .env.local o en el entorno.
// No usa Convex: llama directo a la API de Tavily, igual que el tool buscarEnWeb.
import { tavilySearch } from "./convex/tavily.ts";

process.loadEnvFile(".env.local");
if (!process.env.TAVILY_API_KEY) {
  console.error("Falta TAVILY_API_KEY en .env.local");
  process.exit(1);
}

// Claim dudosos y verificables: el tipo de afirmaciones que le suenan mal a la
// Dra. Elena y la llevan a llamar buscarEnWeb antes de reaccionar o puntuar.
// query = lo que ella le pasaria a Tavily (concisa, en espanol).
const CLAIMS = [
  {
    pitch:
      "En Latinoamérica no existe ninguna regulación de ciberseguridad, " +
      "así que podemos operar sin cumplir ninguna normativa.",
    query: "existe ley de ciberseguridad en Latinoamérica 2025",
  },
  {
    pitch:
      "El mercado de ciberseguridad en la región crece un 400% anual, " +
      "no hay nadie que nos pueda competir.",
    query: "crecimiento del mercado de ciberseguridad latinoamérica 2025",
  },
];

async function main() {
  for (const { pitch, query } of CLAIMS) {
    console.log("\n────────────────────────────────────────────");
    console.log(`Lo que escuchó Dra. Elena:\n  "${pitch}"`);
    console.log(`Búsqueda que le dispara (buscarEnWeb):\n  "${query}"`);
    const res = await tavilySearch(query, { maxResults: 4 });
    console.log("\nLo que Tavily devuelve a su contexto:\n");
    console.log(res);
    if (!res || res.length < 20) {
      console.error("\n✖ Tavily devolvió vacío: revisá la key o el formato.");
      process.exit(1);
    }
  }
  console.log("\n────────────────────────────────────────────");
  console.log("OK - tavilySearch responde con fuentes verificables");
}

main().catch((err) => {
  console.error("\n✖ Falló la búsqueda:", err?.message ?? err);
  process.exit(1);
});
