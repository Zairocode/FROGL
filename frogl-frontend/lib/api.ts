import { anyApi } from "convex/server";
import type { api as TipadaApi } from "@convex/_generated/api";

// Puente al backend, con tipos pero sin dependencia de runtime.
//
// Importar directo ../convex/_generated/api rompia el build en limpio: ese
// archivo vive en la raiz del repo, asi que al pedir "convex/server" buscaba
// en <raiz>/node_modules — que no existe, porque npm install corre adentro de
// frogl-frontend. En local no se notaba porque la raiz tenia node_modules de
// antes; en Vercel fallaba siempre.
//
// La clave: `import type` se borra al compilar. TypeScript igual resuelve los
// tipos de ../convex y el autocompletado sigue funcionando, pero en runtime lo
// unico que queda es anyApi, que sale del node_modules del propio front.
export const api = anyApi as unknown as typeof TipadaApi;
