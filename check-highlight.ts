// node check-highlight.ts
import assert from "node:assert";
import { partir } from "./frogl-frontend/lib/highlight.ts";

const unir = (t: ReturnType<typeof partir>) => t.map((x) => x.text).join("");
const marcados = (t: ReturnType<typeof partir>) =>
  t.filter((x) => x.marcaId).map((x) => x.text);

// nunca se pierde ni se duplica texto
const texto = "En Argentina hay 200 millones de personas y todas comen pan.";
const t1 = partir(texto, [{ id: "a", quote: "hay 200 millones de personas" }]);
assert.equal(unir(t1), texto, "el texto original se reconstruye exacto");
assert.deepEqual(marcados(t1), ["hay 200 millones de personas"]);

// tildes y mayusculas: el modelo cita distinto de como se dijo
const conTildes = "El mercado de panificación son 900 mil millones.";
const t2 = partir(conTildes, [{ id: "b", quote: "MERCADO DE PANIFICACION" }]);
assert.equal(unir(t2), conTildes);
assert.deepEqual(marcados(t2), ["mercado de panificación"], "matchea sin tildes y devuelve el original");

// espacios de mas en la cita
const t3 = partir("dijo   algo   raro aca", [{ id: "c", quote: "algo raro" }]);
assert.equal(unir(t3), "dijo   algo   raro aca");
assert.equal(marcados(t3).length, 1, "colapsa espacios para buscar");

// cita que no existe: no rompe, no marca nada
const t4 = partir(texto, [{ id: "d", quote: "esto nunca se dijo" }]);
assert.equal(unir(t4), texto);
assert.equal(marcados(t4).length, 0);

// dos marcas, y una tercera que se pisa con la primera
const t5 = partir("uno dos tres cuatro cinco", [
  { id: "x", quote: "dos tres" },
  { id: "y", quote: "cinco" },
  { id: "z", quote: "tres cuatro" },
]);
assert.equal(unir(t5), "uno dos tres cuatro cinco");
assert.deepEqual(marcados(t5), ["dos tres", "cinco"], "descarta la que se solapa");

// citas muy cortas se ignoran: marcarian cualquier cosa
assert.equal(partir(texto, [{ id: "e", quote: "de" }]).filter((x) => x.marcaId).length, 0);

// vacio
assert.deepEqual(partir("", [{ id: "f", quote: "algo" }]), []);

console.log("OK - resaltado correcto");
