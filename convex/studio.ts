import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { generateText, Output } from "ai";
import { z } from "zod";
import { chat, CHAT_MODEL } from "./model";

export const save = internalMutation({
  args: {
    text: v.string(),
    score: v.number(),
    why: v.string(),
    durationMs: v.optional(v.number()),
  },
  handler: (ctx, args) =>
    ctx.db.insert("studioGrades", { ...args, createdAt: Date.now() }),
});

export const grade = action({
  args: {
    text: v.string(),
    durationMs: v.optional(v.number()),
  },
  handler: async (
    ctx,
    { text, durationMs },
  ): Promise<{ score: number; why: string }> => {
    const clean = text.trim().replace(/\s+/g, " ");
    if (clean.length < 8) {
      throw new Error("El texto es demasiado corto para calificar.");
    }

    const { output } = await generateText({
      model: await chat(CHAT_MODEL),
      temperature: 0,
      system: [
        "Sos jurado de pitches de startups.",
        "Calificás SOLO el texto transcrito, en una escala de 0 a 10.",
        "0 = ininteligible o vacío. 5 = tibio, genérico. 8 = convincente. 10 = listo para pedir plata.",
        "Penalizá muletillas, vaguedad, falta de problema, solución o pedido concreto.",
        "Respondé en español, directo, dos o tres frases.",
      ].join(" "),
      prompt: [
        `Pitch transcrito:\n\n"${clean}"`,
        durationMs
          ? `Duración aproximada: ${Math.round(durationMs / 1000)} segundos.`
          : "",
        "Devolvé un score de 0 a 10 (un decimal permitido) y el porqué.",
      ]
        .filter(Boolean)
        .join("\n\n"),
      output: Output.object({
        schema: z.object({
          score: z.number().min(0).max(10),
          why: z.string(),
        }),
      }),
    });

    const score = Math.round(output.score * 10) / 10;
    await ctx.runMutation(internal.studio.save, {
      text: clean,
      score,
      why: output.why,
      durationMs,
    });
    return { score, why: output.why };
  },
});
