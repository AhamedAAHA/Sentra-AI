import { AiOrb } from "@/components/shared/ai-orb";

export default function Loading() {
  return (
    <div className="grid min-h-screen place-items-center bg-sentra-ink">
      <div className="text-center">
        <AiOrb speaking size="md" />
        <p className="mt-6 text-sm uppercase tracking-[0.3em] text-white/40">
          Sentra is reasoning
        </p>
      </div>
    </div>
  );
}
