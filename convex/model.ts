import { createGoogleGenerativeAI } from "@ai-sdk/google";

// UNICO lugar donde vive el proveedor. jury.ts y rag.ts no saben cual es:
// para cambiar de Google a Anthropic o al gateway de Vercel se toca solo aca.
// La key sale de GOOGLE_GENERATIVE_AI_API_KEY del deployment de Convex.
const google = createGoogleGenerativeAI();

export const CHAT_MODEL = "gemini-3.5-flash";
export const EMBED_MODEL = "gemini-embedding-001";

export async function chat(id: string) {
  return google(id);
}

export async function embedding(id: string) {
  return google.embeddingModel(id);
}
