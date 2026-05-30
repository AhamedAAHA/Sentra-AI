export type VoiceLanguage =
  | "en"
  | "es"
  | "fr"
  | "de"
  | "pt"
  | "hi"
  | "ja"
  | "zh"
  | "ar"
  | "ko"
  | "it"
  | "nl";

export type VoiceLanguageOption = {
  id: VoiceLanguage;
  label: string;
  nativeLabel: string;
  sttCode: string;
  speechApiCode: string;
};

/** Hackathon-friendly languages — Speechmatics STT + browser speech APIs. */
export const VOICE_LANGUAGES: VoiceLanguageOption[] = [
  { id: "en", label: "English", nativeLabel: "English", sttCode: "en", speechApiCode: "en-US" },
  { id: "es", label: "Spanish", nativeLabel: "Español", sttCode: "es", speechApiCode: "es-ES" },
  { id: "fr", label: "French", nativeLabel: "Français", sttCode: "fr", speechApiCode: "fr-FR" },
  { id: "de", label: "German", nativeLabel: "Deutsch", sttCode: "de", speechApiCode: "de-DE" },
  { id: "pt", label: "Portuguese", nativeLabel: "Português", sttCode: "pt", speechApiCode: "pt-BR" },
  { id: "hi", label: "Hindi", nativeLabel: "हिन्दी", sttCode: "hi", speechApiCode: "hi-IN" },
  { id: "ja", label: "Japanese", nativeLabel: "日本語", sttCode: "ja", speechApiCode: "ja-JP" },
  { id: "zh", label: "Chinese", nativeLabel: "中文", sttCode: "cmn", speechApiCode: "zh-CN" },
  { id: "ar", label: "Arabic", nativeLabel: "العربية", sttCode: "ar", speechApiCode: "ar-SA" },
  { id: "ko", label: "Korean", nativeLabel: "한국어", sttCode: "ko", speechApiCode: "ko-KR" },
  { id: "it", label: "Italian", nativeLabel: "Italiano", sttCode: "it", speechApiCode: "it-IT" },
  { id: "nl", label: "Dutch", nativeLabel: "Nederlands", sttCode: "nl", speechApiCode: "nl-NL" },
];

export const DEFAULT_VOICE_LANGUAGE: VoiceLanguage = "en";

export function getVoiceLanguageOption(language?: string) {
  return VOICE_LANGUAGES.find((item) => item.id === language) ?? VOICE_LANGUAGES[0]!;
}

export function resolveSttLanguage(language?: string) {
  return getVoiceLanguageOption(language).sttCode;
}

export function resolveSpeechRecognitionLanguage(language?: string) {
  return getVoiceLanguageOption(language).speechApiCode;
}

export function resolveBrowserTtsLanguage(language?: string) {
  return getVoiceLanguageOption(language).speechApiCode;
}

export function supportsSpeechmaticsTts(language?: string) {
  return getVoiceLanguageOption(language).id === "en";
}
