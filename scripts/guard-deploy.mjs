// Frena un deploy de Convex desde una rama que no sea main.
//
// Por que existe: hay UN solo deployment de Convex para todo el equipo, y
// Convex sincroniza el schema con el codigo que le mandas. Desplegar desde
// otra rama no "agrega" funciones: BORRA todas las que esa rama no tiene.
//
// Ya paso una vez. Se fueron el corrector entero, la interfaz del jurado y
// media docena de queries, y la app desplegada quedo rota sin que nadie se
// diera cuenta hasta que alguien la abrio. El aviso en el README no alcanzo,
// asi que ahora hay una traba.
//
// Si de verdad necesitas desplegar tu rama, avisale al equipo primero y corre:
//   FROGL_DEPLOY_ANYWAY=1 npm run deploy

import { execSync } from "node:child_process";

if (process.env.FROGL_DEPLOY_ANYWAY === "1") {
  console.log("[frogl] deploy forzado — avisale al equipo que les vas a pisar el backend");
  process.exit(0);
}

let rama;
try {
  rama = execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf8" }).trim();
} catch {
  // Sin git (CI, tarball). No es motivo para frenar.
  process.exit(0);
}

if (rama === "main" || rama === "HEAD") process.exit(0);

console.error(`
  ✋ Estas en la rama "${rama}", no en main.

  Hay un solo deployment de Convex para todo el equipo. Desplegar desde otra
  rama BORRA las funciones que esa rama no tiene: el corrector, la sala del
  jurado y las queries del front desaparecen del backend en vivo.

  Si igual tenes que hacerlo, avisale al equipo y corre:
    FROGL_DEPLOY_ANYWAY=1 npm run deploy
`);
process.exit(1);
