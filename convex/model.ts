import { getServiceToken } from "convex/server";
import { createGateway } from "ai";

// Dos caminos al AI Gateway, en orden:
//   1. Token que mintea Convex solo  -> requiere plan pago de Convex
//   2. AI_GATEWAY_API_KEY del deployment -> createGateway() la lee del env
// Con el fallback esto anda igual en free, y si algun dia se paga Convex
// pasa al token solo sin tocar una linea.
async function gateway() {
  try {
    return createGateway({ apiKey: await getServiceToken("ai-gateway") });
  } catch {
    return createGateway();
  }
}

export async function chat(id: string) {
  return (await gateway())(id);
}

export async function embedding(id: string) {
  return (await gateway()).embeddingModel(id);
}
