import { Suspense } from "react";
import { AnalystWorkspace } from "@/features/analyst/analyst-workspace";

export default function AnalystPage() {
  return (
    <Suspense fallback={<p className="text-sm text-white/50">Loading analyst workspace…</p>}>
      <AnalystWorkspace />
    </Suspense>
  );
}
