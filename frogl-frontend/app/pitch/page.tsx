import { PitchRoom } from "@/components/PitchRoom";
import { RoleGate } from "@/components/RoleGate";

export const metadata = {
  title: "Sala de pitch — FROGL",
  description: "Presentá. El jurado te habla en globos.",
};

export default function PitchPage() {
  return (
    <RoleGate
      allow="pitcher"
      title="Esta es la sala del pitcher"
      body="Acá presentás. El chat del jurado no se ve: solo aparecen globos cuando el panel reacciona."
    >
      <PitchRoom />
    </RoleGate>
  );
}
