"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Camera, Globe2 } from "lucide-react";
import { useState } from "react";
import { InvestigationStudio } from "@/features/image-intelligence/investigation-studio";
import { WorldEngineStudio } from "@/features/world-engine/world-engine-studio";
import { cn } from "@/lib/utils";

type AnalystMode = "world" | "vision";

export function AnalystWorkspace() {
  const [mode, setMode] = useState<AnalystMode>("world");

  return (
    <>
      <nav className="mb-7 inline-flex rounded-full border border-white/10 bg-white/[0.045] p-1" aria-label="AI Analyst modes">
        {[
          { id: "world" as const, label: "AI World Engine", icon: Globe2 },
          { id: "vision" as const, label: "Visual Forensics", icon: Camera },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setMode(item.id)}
            className={cn(
              "sentra-focus flex items-center gap-2 rounded-full px-4 py-2.5 text-sm transition",
              mode === item.id ? "bg-cyan-300/12 text-cyan-50 shadow-glow" : "text-white/54 hover:text-white",
            )}
            aria-current={mode === item.id ? "page" : undefined}
          >
            <item.icon className="h-4 w-4" /> {item.label}
          </button>
        ))}
      </nav>
      <AnimatePresence mode="wait">
        <motion.div key={mode} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
          {mode === "world" ? <WorldEngineStudio /> : <InvestigationStudio />}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
