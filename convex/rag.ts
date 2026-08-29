import { action, internalMutation, internalQuery } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { embed } from "ai";
import { embedding as embeddingModel } from "./model";

// Las dimensiones tienen que coincidir con el vectorIndex del schema.
export { EMBED_MODEL } from "./model";
import { EMBED_MODEL } from "./model";

export const save = internalMutation({
  args: {
    tag: v.string(),
    source: v.string(),
    text: v.string(),
    embedding: v.array(v.float64()),
  },
  handler: (ctx, args) => ctx.db.insert("chunks", args),
});

export const byIds = internalQuery({
  args: { ids: v.array(v.id("chunks")) },
  handler: async (ctx, { ids }) => {
    const docs = await Promise.all(ids.map((id) => ctx.db.get(id)));
    return docs.filter((d) => d !== null);
  },
});

// Carga un pedazo de conocimiento para un jurado. tag = profiles.retrievalTag
export const ingest = action({
  args: { tag: v.string(), source: v.string(), text: v.string() },
  handler: async (ctx, { tag, source, text }) => {
    const { embedding } = await embed({ model: await embeddingModel(EMBED_MODEL), value: text });
    await ctx.runMutation(internal.rag.save, { tag, source, text, embedding });
  },
});

// Lo usa jury.react. Cada jurado solo ve SU corpus: ahi esta la mitad de la personalidad.
export async function retrieve(
  ctx: ActionCtx,
  tag: string,
  queryText: string,
  limit = 4,
): Promise<string[]> {
  if (!queryText.trim()) return [];
  const { embedding } = await embed({ model: await embeddingModel(EMBED_MODEL), value: queryText });
  const hits = await ctx.vectorSearch("chunks", "by_embedding", {
    vector: embedding,
    filter: (q) => q.eq("tag", tag),
    limit,
  });
  if (hits.length === 0) return [];
  const docs = await ctx.runQuery(internal.rag.byIds, {
    ids: hits.map((h) => h._id),
  });
  return docs.map((d) => d.text);
}
