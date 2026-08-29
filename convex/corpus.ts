import { action, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";

// ============================================================
//  MOTOR DE ERRORES COMUNES = el corpus del RAG.
//  Sin esto los jurados son solo 4 prompts. Con esto, cada uno
//  reconoce el error concreto y lo nombra en vez de opinar en general.
//  El tag matchea profiles.retrievalTag: cada jurado ve SOLO lo suyo.
// ============================================================

export const ERRORES: { tag: string; text: string }[] = [
  // --- Dra. Elena Vargas (tecnico) ---
  { tag: "tecnico", text: "Dice 'usamos IA' sin especificar que modelo, con que datos, ni por que no lo resuelve una heuristica simple. Es la senal numero uno de que no construyeron nada." },
  { tag: "tecnico", text: "TAM top-down: 'el mercado son 50 mil millones y capturamos el 1%'. No hay bottom-up: cuantos clientes reales, pagando cuanto." },
  { tag: "tecnico", text: "Confunde demo con producto. Lo que mostro corre con datos preparados a mano y un happy path." },
  { tag: "tecnico", text: "No responde que pasa al escalar: latencia, costo por request, rate limits del proveedor, que se rompe primero." },
  { tag: "tecnico", text: "Es una feature, no una empresa. El incumbente lo copia en dos semanas y no hay respuesta a eso." },
  { tag: "tecnico", text: "No hay foso. Mismo modelo, mismos datos publicos y mismo prompt que puede escribir cualquiera en una tarde." },
  { tag: "tecnico", text: "Arquitectura sobredimensionada: microservicios, colas y kubernetes para 100 usuarios que no existen todavia." },
  { tag: "tecnico", text: "No sabe su costo unitario. Si no sabe cuanto le cuesta atender a un usuario, no sabe si el negocio cierra." },

  // --- Kevin (tiktok) ---
  { tag: "tiktok", text: "Tarda mas de 30 segundos en decir que hace el producto. Para entonces ya perdiste a medio jurado." },
  { tag: "tiktok", text: "Arranca con la historia personal en vez del gancho. A nadie le importa todavia por que te importa a vos." },
  { tag: "tiktok", text: "Jerga del rubro sin traducir. Si tengo que preguntar que significa una sigla, ya me fui." },
  { tag: "tiktok", text: "La demo es una slide con texto. Nada se mueve, nada se ve funcionando." },
  { tag: "tiktok", text: "No hay un momento memorable. Nada que puedas repetirle a otro despues de salir de la sala." },
  { tag: "tiktok", text: "Habla del problema mucho mas que de la solucion. Ya entendimos que el problema existe, mostra que hiciste." },

  // --- Marco Ibanez (generalista, entra tarde) ---
  { tag: "generalista", text: "Nunca repite que hace el producto. Lo dice una sola vez al principio y si te lo perdiste quedaste afuera para siempre." },
  { tag: "generalista", text: "Dice el problema pero nunca dice quien es el cliente. 'Las empresas' no es un cliente." },
  { tag: "generalista", text: "Usa el nombre del producto como si todos supieran que es, en vez de describirlo cada vez." },
  { tag: "generalista", text: "Asume contexto de una slide anterior: 'como decia', 'esto que vimos'. Si entraste tarde, no viste nada." },
  { tag: "generalista", text: "Un buen pitch se puede agarrar por la mitad y todavia se entiende. Deberia repetir el core cada minuto." },

  // --- Rosa Puentes (actitud) ---
  { tag: "actitud", text: "Se pone a la defensiva cuando lo cuestionan, en vez de reconocer el limite y seguir. La defensiva delata que sabe que el punto es valido." },
  { tag: "actitud", text: "Cuando no sabe la respuesta, responde otra cosa. Se nota siempre y cuesta mas caro que decir 'no lo se todavia'." },
  { tag: "actitud", text: "Habla en condicional: 'podriamos', 'seria', 'la idea es'. No hay compromiso con nada de lo que dice." },
  { tag: "actitud", text: "Lee el guion. La energia se cae en el momento exacto en que se sale del libreto, y ahi se ve quien es." },
  { tag: "actitud", text: "Se disculpa por el estado del producto antes de que nadie pregunte. Nadie te va a defender si vos mismo abris con una excusa." },
  { tag: "actitud", text: "Termina sin decir que necesita. Un pitch sin pedido concreto es una charla informativa." },
  { tag: "actitud", text: "Conviccion no es volumen. Alguien tranquilo que responde todo con datos gana a alguien que grita entusiasmo." },
  // --- Lucia Ferrer (comercial) ---
  { tag: "comercial", text: "Dice que monetiza mas adelante. Eso no es una etapa, es no haber pensado como se gana plata con esto." },
  { tag: "comercial", text: "No sabe su costo de adquisicion. Sin ese numero no sabe si crecer le conviene o lo funde mas rapido." },
  { tag: "comercial", text: "El precio esta elegido a ojo. Nunca le pregunto a nadie cuanto pagaria, y se nota en que es un numero redondo." },
  { tag: "comercial", text: "Confunde usuarios con clientes. Miles de usuarios gratis no validan que alguien pague." },
  { tag: "comercial", text: "El ciclo de venta de ese sector es de meses y el plan asume que cierran en semanas." },
  { tag: "comercial", text: "No dice quien firma el cheque adentro de la empresa cliente. Quien lo usa y quien lo aprueba casi nunca son la misma persona." },
  { tag: "comercial", text: "No hay razon para que el cliente cambie hoy. Sin urgencia, la venta se posterga para siempre." },

  // --- Sandra Rios (usuario final) ---
  { tag: "usuario", text: "Usa siglas y jerga sin traducir. Si el que escucha tiene que preguntar que significa, ya lo perdio." },
  { tag: "usuario", text: "Explica la tecnologia en vez de que gana la persona que lo usa." },
  { tag: "usuario", text: "No dice en que momento del dia se usaria. Sin eso nadie se imagina usandolo." },
  { tag: "usuario", text: "Pide cambiar como trabaja la gente hoy sin decir que gana a cambio." },
  { tag: "usuario", text: "Asume un problema que la persona no siente como problema." },
  { tag: "usuario", text: "La demo necesita que alguien la explique. Si hace falta un guia, en la vida real no lo van a usar." },
];

// Vacia el corpus para que load() sea idempotente. Sin esto, correr load
// dos veces duplicaba cada chunk y el vector search gastaba sus slots
// trayendo la misma frase repetida.
export const clear = internalMutation({
  args: {},
  handler: async (ctx) => {
    const todos = await ctx.db.query("chunks").collect();
    for (const c of todos) await ctx.db.delete(c._id);
    return todos.length;
  },
});

// Carga todo el corpus. Idempotente: borra y vuelve a sembrar.
export const load = action({
  args: {},
  handler: async (ctx): Promise<number> => {
    await ctx.runMutation(internal.corpus.clear, {});
    for (const e of ERRORES) {
      await ctx.runAction(api.rag.ingest, {
        tag: e.tag,
        source: "errores-comunes",
        text: e.text,
      });
    }
    return ERRORES.length;
  },
});
