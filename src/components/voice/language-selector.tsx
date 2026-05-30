"use client";

import { Languages } from "lucide-react";
import { VOICE_LANGUAGES, type VoiceLanguage } from "@/lib/voice/languages";
import { cn } from "@/lib/utils";

type VoiceLanguageSelectorProps = {
  value: VoiceLanguage;
  onChange: (language: VoiceLanguage) => void;
  compact?: boolean;
  className?: string;
};

export function VoiceLanguageSelector({ value, onChange, compact = false, className }: VoiceLanguageSelectorProps) {
  return (
    <label
      className={cn(
        "sentra-focus flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] text-white/75",
        compact ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm",
        className,
      )}
    >
      <Languages className={cn("shrink-0 text-sentra-cyan", compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
      <span className={cn("shrink-0 text-white/45", compact && "hidden sm:inline")}>Language</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as VoiceLanguage)}
        className={cn(
          "min-w-0 flex-1 cursor-pointer bg-transparent font-medium text-white outline-none",
          compact ? "text-xs" : "text-sm",
        )}
        aria-label="Voice and speech language"
      >
        {VOICE_LANGUAGES.map((language) => (
          <option key={language.id} value={language.id} className="bg-sentra-ink text-white">
            {language.nativeLabel} · {language.label}
          </option>
        ))}
      </select>
    </label>
  );
}
