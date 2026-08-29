import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { embedText } from "./models";

// ============================================================
//  SEED DEL CORPUS RAG
//  Un corpus minimo por retrievalTag para que los jurados tengan
//  que "saber". Reemplazalo por tu contenido real. Idempotente:
//  si un chunk ya existe por source, lo salta.
//
//  Jurado          -> retrievalTag   -> corpus
//  tecnico         -> "tecnico"
//  tiktok          -> "tiktok"
//  recien-llegado  -> "generalista"
//  actitud         -> "actitud"
// ============================================================

const CORPUS: Record<string, Array<{ source: string; text: string }>> = {
  tecnico: [
    {
      source: "tec/arquitectura",
      text:
        "En arquitectura de software, la deuda tecnica se paga en mantenimiento: cada decision " +
        "que acelera el MVP (monolito, sin tests, hardcodeo) se paga con intereses cuando el " +
        "producto crece. Escalar x100 no es correr mas maquinas: es que el cuello de botella " +
        "aparezca en la capa que no se diseno para eso (DB, cola, embebidos).",
    },
    {
      source: "tec/modelos",
      text:
        "Cuando alguien dice 'usamos IA', preguntar SIEMPRE: que modelo, con que datos se " +
        "entreno, como se evaluo y por que no lo resuelve un if o una tabla. Un modelo sin " +
        "metrica de calidad y sin plan de drift es un costo fijo, no una feature.",
    },
  ],
  tiktok: [
    {
      source: "ttk/gancho",
      text:
        "Los primeros 3 segundos deciden todo. Si el primer frame no dice que es el producto, " +
        "para quien es y por que importa ahora, el scroll sigue. El gancho no es un slogan: es " +
        "una promesa concreta que se paga en los primeros segundos.",
    },
    {
      source: "ttk/ritmo",
      text:
        "Ritmo = cortar lo que sobra. Una demo de 60 segundos se edita a 15. Cada segundo que " +
        "el usuario piensa 'y esto que tiene que ver', perdiste. Menos palabras, mas energia, " +
        "cero jerga.",
    },
  ],
  generalista: [
    {
      source: "gen/que-es",
      text:
        "Un pitch autocontenido responde en los primeros 30 segundos: que hacen, para quien, " +
        "y que problema resuelve. Si alguien entro a mitad de camino y no sabe que vendes, " +
        "es culpa del pitch, no del oyente.",
    },
    {
      source: "gen/mercado",
      text:
        "El tamano de mercado se dice en terminos que el otro pueda chequear: TAM (cuanto vale " +
        "el problema para todos), SAM (lo que tu producto puede capturar), SOM (lo que es " +
        "realista en 3 anos). No se trata de inflar el TAM: se trata de mostrar que entendes " +
        "a quien le vendes.",
    },
  ],
  actitud: [
    {
      source: "act/presencia",
      text:
        "La presencia en un pitch se lee en el cuerpo y la voz: si el presentador responde " +
        "directo o esquiva, si sostiene la mirada, si la energia baja cuando lo aprietan. Una " +
        "persona que se la banca transmite mas que un pitch perfecto leido.",
    },
    {
      source: "act/presion",
      text:
        "Como se maneja la presion: una pregunta dura no se esquiva. Se acepta, se repite " +
        "para confirmar que se entendio y se responde con lo que se sabe sin inventar. " +
        "Admitir 'no lo se, pero lo averiguo' vale mas que una respuesta inventada.",
    },
  ],
};

export const seedRag = action({
  args: {},
  handler: async (ctx) => {
    let created = 0;
    let skipped = 0;

    for (const [tag, chunks] of Object.entries(CORPUS)) {
      for (const chunk of chunks) {
        // Idempotencia por source: si ya se sembro, no lo re-embebe.
        const existing = await ctx.runQuery(internal.rag.bySource, {
          source: chunk.source,
        });
        if (existing) {
          skipped++;
          continue;
        }

        const embedding = await embedText(chunk.text, "RETRIEVAL_DOCUMENT");
        await ctx.runMutation(internal.rag.save, {
          tag,
          source: chunk.source,
          text: chunk.text,
          embedding,
        });
        created++;
      }
    }

    return { created, skipped };
  },
});
