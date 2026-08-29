import { v } from "convex/values";

// ============================================================
//  TIPO DE PITCH = la cuarta perilla.
//  Los jurados no cambian de persona. Cambia el lente:
//  que vinieron a exigir en ESTA sala.
// ============================================================

export const PITCH_TYPES = [
  "tecnico",
  "innovacion",
  "educacion",
  "capital",
] as const;

export type PitchType = (typeof PITCH_TYPES)[number];

export const pitchTypeValidator = v.union(
  v.literal("tecnico"),
  v.literal("innovacion"),
  v.literal("educacion"),
  v.literal("capital"),
);

export function isPitchType(value: unknown): value is PitchType {
  return (
    value === "tecnico" ||
    value === "innovacion" ||
    value === "educacion" ||
    value === "capital"
  );
}

type PitchTypeMeta = {
  slug: PitchType;
  label: string;
  blurb: string;
  accent: "cyan" | "pink" | "teal" | "amber";
  /** Briefing compartido: que es este pitch, para todos los jurados. */
  lens: string;
  /** Que mira CADA jurado cuando el pitch es de este tipo. Clave = profile.slug */
  jurorFocus: Record<string, string>;
};

export const PITCH_TYPE_META: Record<PitchType, PitchTypeMeta> = {
  tecnico: {
    slug: "tecnico",
    label: "Técnico",
    blurb: "Cómo funciona, no qué promete.",
    accent: "cyan",
    lens:
      "Este pitch es TECNICO. El expositor tiene que explicar COMO funciona: " +
      "arquitectura, datos, limites, costo, y por que no se resuelve con una heuristica. " +
      "La vision no alcanza. Si no hay mecanismo, no hay pitch.",
    jurorFocus: {
      tecnico:
        "Aprieta en modelo, datos, latencia, costo unitario y que se rompe al escalar. " +
        "Si dice 'IA' sin el como, es hand-waving. Las demos no te mueven.",
      tiktok:
        "Traduci el tecnicismo. Si en 15 segundos no entendes QUE hace el sistema, te perdiste. " +
        "El stack te da igual; el resultado visible no.",
      "recien-llegado":
        "Si entras tarde, necesitas que te digan que construyeron y para quien, " +
        "sin asumir que viste el diagrama. 'El modelo' no es una explicacion.",
      actitud:
        "Mira si defiende las decisiones tecnicas o se esconde atras de la jerga. " +
        "Conviccion tecnica no es volumen: es sostener un numero cuando lo aprietan.",
    },
  },
  innovacion: {
    slug: "innovacion",
    label: "Innovación",
    blurb: "Qué es nuevo y por qué ahora.",
    accent: "pink",
    lens:
      "Este pitch es de INNOVACION. El expositor tiene que dejar claro que es nuevo, " +
      "contra que se compara, y por que ahora. Incremental disfrazado de revolucion se detecta. " +
      "Si no hay un antes y un despues, no hay novedad.",
    jurorFocus: {
      tecnico:
        "Diferencia novedad real de wrapping. Hay dato propio, IP o un mecanismo que no se copia " +
        "en dos semanas? 'Nadie lo hizo asi' no es evidencia.",
      tiktok:
        "Hay un wow? Un momento que se puede contar despues. Si es 'otra app de X' te aburris " +
        "y lo decís. El gancho es la diferencia, no el manifiesto.",
      "recien-llegado":
        "Que cambia para alguien si esto existe? Si no lo podes decir en una frase sin haber " +
        "visto el arranque, el pitch no se sostiene solo.",
      actitud:
        "Creen de verdad que esto cambia el juego, o estan recitando un manifiesto? " +
        "La vision sin compromiso (fechas, numeros, un primer cliente) es teatro.",
    },
  },
  educacion: {
    slug: "educacion",
    label: "Educación",
    blurb: "Si se entiende, se retiene y se puede usar.",
    accent: "teal",
    lens:
      "Este pitch es EDUCATIVO. El expositor ensena: un concepto, un metodo, una practica. " +
      "Se juzga si se entiende, si hay estructura, y si alguien se lleva algo usable. " +
      "Motivacion sin contenido es una charla, no una clase.",
    jurorFocus: {
      tecnico:
        "Hay rigor? Fuentes, limites de lo que ensenan, o es charla motivacional con slides? " +
        "Si el metodo no se puede repetir, no ensenaron nada.",
      tiktok:
        "Se te pega? Si a los 15 segundos no sabes que vas a aprender, ya te fuiste. " +
        "La jerga pedagogica tambien aburre. Queres un ejemplo, no un marco.",
      "recien-llegado":
        "Podes entrar a la mitad y seguir la leccion? Si depende de la slide 2, fallo. " +
        "Un buen docente repite el core.",
      actitud:
        "Ensenan o recitan? Hay presencia, escucha, o van corriendo el libreto. " +
        "Quien ensena de verdad admite lo que no cubre.",
    },
  },
  capital: {
    slug: "capital",
    label: "Levantar capital",
    blurb: "Negocio, pedido y por qué ahora.",
    accent: "amber",
    lens:
      "Este pitch es para LEVANTAR CAPITAL. El expositor pide plata. Tiene que haber negocio, " +
      "traccion o un plan creible, y un pedido concreto. Sin el ask, es una charla informativa.",
    jurorFocus: {
      tecnico:
        "Unit economics, foso, y por que el capital desbloquea algo que el ingreso no. " +
        "TAM top-down es ruido. Si no sabe cuanto le cuesta un usuario, el negocio no cierra.",
      tiktok:
        "El gancho del inversor: que problema, que tan grande, por que ellos. " +
        "Si tardan en decir cuanto piden, te perdes. El ask tambien es gancho.",
      "recien-llegado":
        "Quien paga, cuanto, y que estan pidiendo. Si no lo repetis, el que entro tarde " +
        "no sabe si es una charla o un raise.",
      actitud:
        "Founder conviction. Pedido claro al final. Hablar en condicional " +
        "('podriamos levantar') es cobardia. Quien pide de verdad nombra la cifra.",
    },
  },
};

export function pitchTypeLabel(type: PitchType | undefined): string | null {
  if (!type || !isPitchType(type)) return null;
  return PITCH_TYPE_META[type].label;
}

/** Texto que entra al system prompt de react() y score(). Vacio si no hay tipo. */
export function pitchBriefing(
  type: PitchType | undefined,
  jurorSlug: string,
): string {
  if (!type || !isPitchType(type)) return "";
  const meta = PITCH_TYPE_META[type];
  const focus = meta.jurorFocus[jurorSlug] ?? "";
  return [meta.lens, focus].filter(Boolean).join("\n\n");
}
