// Parte el transcript en tramos, marcando cuales corresponden a una
// anotacion del corrector. Puro y sin React adentro: se testea con node.
//
// El modelo devuelve el fragmento "literal", pero en la practica cambia
// tildes, mayusculas o espacios. Por eso la busqueda va sobre una version
// normalizada y el texto que se muestra sale SIEMPRE del original.

export type Marca = { id: string; quote: string };
export type Tramo = { text: string; marcaId: string | null };

function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // saca tildes
    .replace(/\s+/g, " ");
}

export function partir(texto: string, marcas: Marca[]): Tramo[] {
  if (!texto) return [];
  // La normalizacion colapsa espacios, asi que los indices dejarian de
  // coincidir con el original. Se construye un mapa posicion->posicion.
  const mapa: number[] = [];
  let norm = "";
  let espacioPrevio = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
    if (!c) continue; // era solo un diacritico
    if (/\s/.test(c)) {
      if (espacioPrevio) continue;
      espacioPrevio = true;
      norm += " ";
    } else {
      espacioPrevio = false;
      norm += c;
    }
    mapa.push(i);
  }

  type Hit = { desde: number; hasta: number; id: string };
  const hits: Hit[] = [];
  for (const m of marcas) {
    const q = normalizar(m.quote).trim();
    if (q.length < 4) continue; // muy corto: marcaria cualquier cosa
    const at = norm.indexOf(q);
    if (at < 0) continue; // el modelo no cito literal: se muestra igual como tarjeta
    const desde = mapa[at];
    const hasta = (mapa[at + q.length - 1] ?? texto.length - 1) + 1;
    hits.push({ desde, hasta, id: m.id });
  }

  hits.sort((a, b) => a.desde - b.desde);

  const tramos: Tramo[] = [];
  let cursor = 0;
  for (const h of hits) {
    if (h.desde < cursor) continue; // se pisa con una marca anterior
    if (h.desde > cursor) {
      tramos.push({ text: texto.slice(cursor, h.desde), marcaId: null });
    }
    tramos.push({ text: texto.slice(h.desde, h.hasta), marcaId: h.id });
    cursor = h.hasta;
  }
  if (cursor < texto.length) {
    tramos.push({ text: texto.slice(cursor), marcaId: null });
  }
  return tramos;
}
