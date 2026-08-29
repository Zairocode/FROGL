import { action, internalMutation } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

// ============================================================
//  BANCO DE PRUEBA DE RUBRICAS
//  Corre los 4 jurados sobre un pitch conocido y compara.
//  La prueba que importa NO es "que nota saca" sino
//  "SE DIFERENCIAN LOS JURADOS". Si Elena y Kevin puntuan igual,
//  los perfiles no discriminan y el producto no existe.
// ============================================================

type Line = { tMs: number; text: string };

// Pitch fuerte: concreto, con numeros, y REPITE el core despues del minuto 1:30
// (o sea, Marco que entra tarde deberia poder seguirlo igual).
const FUERTE: Line[] = [
  { tMs: 2_000, text: "Somos Kilo. Las panaderias tiran el 12% de lo que hornean porque deciden cuanto producir a ojo." },
  { tMs: 15_000, text: "Nosotros predecimos la demanda de manana por producto y por local, y les mandamos la orden de produccion a las seis de la tarde." },
  { tMs: 35_000, text: "Es un modelo de series temporales por SKU, entrenado con dos anios de ventas de cada local mas clima y calendario escolar. No es un LLM, no hace falta." },
  { tMs: 60_000, text: "Tenemos 14 locales pagando 89 dolares por local por mes. Retencion de 11 de 14 desde marzo." },
  { tMs: 95_000, text: "Repito por si alguien recien llega: Kilo le dice a una panaderia cuanto hornear manana de cada cosa. Hoy lo deciden a ojo y tiran el 12%." },
  { tMs: 120_000, text: "Nos cuesta 4 dolares por local por mes en computo, o sea el margen bruto es 95%." },
  { tMs: 150_000, text: "Lo dificil no es el modelo, es el dato: nos integramos con los cuatro sistemas de punto de venta que usa el 80% del sector." },
  { tMs: 172_000, text: "Buscamos 150 mil para llegar a 100 locales antes de fin de anio. Eso es lo que vinimos a pedir." },
];

// Pitch flojo: buzzwords, arranque lento, nunca repite que hace.
const FLOJO: Line[] = [
  { tMs: 3_000, text: "Hola, gracias por el espacio. Queria empezar contandoles algo que me paso a mi hace unos anios." },
  { tMs: 30_000, text: "Mi abuela tenia un negocio y siempre vi lo dificil que era, y eso me marco mucho." },
  { tMs: 55_000, text: "Entonces nosotros usamos inteligencia artificial para optimizar procesos en el retail." },
  { tMs: 80_000, text: "Es una plataforma integral que aprovecha machine learning para generar insights accionables." },
  { tMs: 110_000, text: "El mercado del retail en Latinoamerica son cuarenta mil millones de dolares. Si capturamos el 1% ya es un negocio enorme." },
  { tMs: 140_000, text: "Estamos en conversaciones con varios clientes potenciales muy interesados." },
  { tMs: 165_000, text: "Podriamos escalar esto a toda la region, la idea seria expandirnos el proximo anio." },
];

// Caradura: contenido flojo, entrega impecable. Testea que Rosa DIVERJA de Elena.
const CARADURA: Line[] = [
  { tMs: 2_000, text: "En los proximos tres minutos les voy a mostrar por que el 90% del software de logistica va a desaparecer." },
  { tMs: 20_000, text: "Se llama Nodo. Reemplaza al despachante humano. Punto." },
  { tMs: 45_000, text: "Como funciona por dentro? Es un motor propietario. No voy a dar detalles aca, pero funciona." },
  { tMs: 70_000, text: "No, no tengo el numero de precision a mano, pero les puedo decir que en las pruebas anduvo muy bien." },
  { tMs: 95_000, text: "Otra vez, para quien recien entra: Nodo reemplaza al despachante humano en una empresa de logistica." },
  { tMs: 125_000, text: "Clientes pagando todavia no tenemos. Se los digo de frente: estamos en cero y no me voy a inventar tracción." },
  { tMs: 155_000, text: "Lo que si tengo es el equipo que armo el ruteo de la empresa de correo mas grande del pais. Somos los que sabemos hacer esto." },
  { tMs: 175_000, text: "Necesito 200 mil y seis meses. Si en seis meses no tengo diez clientes, les devuelvo lo que quede." },
];

export const PITCHES: Record<string, Line[]> = {
  fuerte: FUERTE,
  flojo: FLOJO,
  caradura: CARADURA,
};

// Inserta un pitch con timestamps EXPLICITOS (transcript.append los calcula de Date.now(),
// aca los necesitamos controlados para probar lateJoin y window).
export const loadFixture = internalMutation({
  args: { pitch: v.string() },
  handler: async (ctx, { pitch }): Promise<Id<"sessions">> => {
    const lines = PITCHES[pitch];
    if (!lines) throw new Error(`No existe el pitch "${pitch}"`);
    const last = lines[lines.length - 1].tMs;

    const sessionId = await ctx.db.insert("sessions", {
      title: `[fixture] ${pitch}`,
      presenterName: "banco de prueba",
      status: "ended",
      startedAt: Date.now() - last,
      endedAt: Date.now(),
    });

    for (const profile of await ctx.db.query("profiles").collect()) {
      await ctx.db.insert("seats", {
        sessionId,
        kind: "agent",
        profileId: profile._id,
        displayName: profile.name,
        joinedAtMs: profile.defaultJoinAtMs ?? 0,
        active: true,
      });
    }
    for (const l of lines) {
      await ctx.db.insert("transcript", { sessionId, ...l, final: true });
    }
    return sessionId;
  },
});

export const seatsOf = internalMutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) =>
    ctx.db
      .query("seats")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect(),
});

// npx convex run tuning:dryRun '{"pitch":"fuerte"}'
export const dryRun = action({
  args: { pitch: v.string() },
  handler: async (
    ctx,
    { pitch },
  ): Promise<{ pitch: string; resultados: unknown[] }> => {
    const sessionId = await ctx.runMutation(internal.tuning.loadFixture, {
      pitch,
    });
    const seats = await ctx.runMutation(internal.tuning.seatsOf, { sessionId });

    const resultados = [];
    for (const seat of seats) {
      const r = await ctx.runAction(api.jury.score, { seatId: seat._id });
      resultados.push({
        jurado: seat.displayName,
        total: r?.total ?? null,
        veredicto: r?.verdict ?? null,
      });
    }
    return { pitch, resultados };
  },
});
