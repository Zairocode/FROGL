import { AccountGate } from "@/components/AccountGate";
import { JuryRoom } from "@/components/JuryRoom";

export const metadata = {
  title: "Sala del jurado — FROGL",
  description: "Panel cerrado. Chat que el pitcher ve como globos.",
};

export default function JuradoPage() {
  return (
    <AccountGate>
      <JuryRoom />
    </AccountGate>
  );
}
