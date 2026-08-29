"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";

// Este valor NO es un secreto: toda variable NEXT_PUBLIC_ termina embebida en
// el bundle del cliente, asi que ponerla acá no expone nada nuevo.
// Va como fallback porque .env* esta en .gitignore: sin esto, el que clona el
// repo se queda sin backend y ve todo vacio sin entender por que.
const FALLBACK = "https://colorful-mole-701.convex.cloud";

const url = process.env.NEXT_PUBLIC_CONVEX_URL || FALLBACK;

// Un cliente por proceso. Si la URL fuera invalida no queremos que la app
// entera reviente: se sigue renderizando y los hooks devuelven vacio.
let client: ConvexReactClient | null = null;
try {
  client = new ConvexReactClient(url);
} catch (err) {
  console.warn("[FROGL] Convex no pudo inicializar, la app corre offline:", err);
}

export function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!client) return <>{children}</>;
  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}

/** Para que los hooks sepan si tiene sentido consultar. */
export const convexActivo = () => client !== null;
