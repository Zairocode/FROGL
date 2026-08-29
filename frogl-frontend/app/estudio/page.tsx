import { redirect } from "next/navigation";

// El estudio se fusiono con preparar: eran el mismo momento (lo que hacés
// antes de pararte a hablar) partido en dos pantallas. El link viejo sigue
// funcionando para no romper nada que ya este compartido.
export default function EstudioPage() {
  redirect("/preparar");
}
