import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { embed } from "ai";

// Directo a Google. Sin Vercel AI Gateway.
// GEMINI_API_KEY vive en Convex → Settings → Environment Variables.
const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const chatModel = google("gemini-3.1-flash-lite");

// gemini-3.1-flash-lite no embebe. Este modelo sí, y 3072 calza el vectorIndex
// del schema (el deployment ya tiene chunks a 3072).
const embedModel = google.textEmbedding("gemini-embedding-001");
const EMBED_DIMS = 3072;

type EmbedTask = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

export async function embedText(value: string, taskType: EmbedTask) {
  const { embedding } = await embed({
    model: embedModel,
    value,
    providerOptions: {
      google: {
        outputDimensionality: EMBED_DIMS,
        taskType,
      },
    },
  });
  return embedding;
}
