// Instala las dependencias de la raiz del repo despues de instalar las del front.
//
// Por que hace falta: el front usa los tipos de ../convex/_generated. Ese codigo
// vive fuera de frogl-frontend, asi que TypeScript lo resuelve contra
// <raiz>/node_modules. Si esa carpeta no existe, los tipos de Convex no cargan,
// todo cae a `any` y el build falla con TS7006 por todos lados.
//
// En local nunca se veia porque la raiz ya tenia node_modules de antes. En
// Vercel, que clona limpio, fallaba siempre.

import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = join(aqui, "..", "..");

if (!existsSync(join(raiz, "package.json"))) {
  // Alguien copio solo el front a otro lado. No es un error: no hay backend
  // que instalar, y romper el install por esto seria peor.
  console.log("[frogl] sin package.json en la raiz, no hay backend que instalar");
  process.exit(0);
}

console.log("[frogl] instalando dependencias del backend en la raiz…");
// shell: true es necesario en Windows, donde npm es un .cmd y spawn directo
// falla sin decir nada. En Linux (Vercel) es inocuo.
const r = spawnSync(
  "npm install --no-audit --no-fund --ignore-scripts",
  { cwd: raiz, stdio: "inherit", shell: true },
);

if (r.status !== 0) {
  console.error("[frogl] fallo el install de la raiz: el build va a romper por tipos");
  process.exit(r.status ?? 1);
}
