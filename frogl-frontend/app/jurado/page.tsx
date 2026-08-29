import { JuryRoom } from "@/components/JuryRoom";
import { RoleGate } from "@/components/RoleGate";

export const metadata = {
  title: "Sala del jurado — FROGL",
  description: "Panel cerrado. Chat que el pitcher ve como globos.",
};

export default function JuradoPage() {
  return (
    <RoleGate
      allow="jurado"
      title="Esta sala es solo para el jurado"
      body="El pitcher no entra acá. Si sos del panel, entrá para chatear. Tus mensajes le llegan como globos de texto."
    >
      <JuryRoom />
    </RoleGate>
  );
}
