import {
  createChatCompletion,
  getLlmClient,
  getVisionModel,
  isAimlConfigured,
} from "@/lib/llm/client";
import {
  createFeatherlessChatCompletion,
  getFeatherlessVisionModel,
  isFeatherlessConfigured,
} from "@/lib/llm/featherless";

const OCR_PROMPT =
  "You are an expert OCR system. Extract every readable word from this document image. Preserve paragraph breaks and bullet structure. Output plain text only — no commentary.";

export type OcrResult = {
  text: string;
  provider: "aiml-vision" | "featherless-vision";
};

async function ocrWithAiml(dataUrl: string, pageHint?: string) {
  const client = getLlmClient();
  if (!client || !isAimlConfigured()) return null;

  const response = await createChatCompletion(client, {
    model: getVisionModel(),
    temperature: 0.1,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: pageHint ? `${OCR_PROMPT}\n\nContext: ${pageHint}` : OCR_PROMPT },
          { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
        ],
      },
    ],
  });

  const text = response.choices[0]?.message?.content?.trim();
  if (!text) return null;
  return { text, provider: "aiml-vision" as const };
}

async function ocrWithFeatherless(dataUrl: string, pageHint?: string) {
  if (!isFeatherlessConfigured()) return null;

  const response = await createFeatherlessChatCompletion({
    model: getFeatherlessVisionModel(),
    temperature: 0.1,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: pageHint ? `${OCR_PROMPT}\n\nContext: ${pageHint}` : OCR_PROMPT },
          { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
        ],
      },
    ],
  });

  const text = response.choices[0]?.message?.content?.trim();
  if (!text) return null;
  return { text, provider: "featherless-vision" as const };
}

/** Smart OCR: AIML vision first, Featherless vision fallback. */
export async function ocrImageDataUrl(dataUrl: string, pageHint?: string): Promise<OcrResult> {
  try {
    const aiml = await ocrWithAiml(dataUrl, pageHint);
    if (aiml?.text) return aiml;
  } catch (error) {
    console.warn("AIML vision OCR failed, trying Featherless", error);
  }

  try {
    const featherless = await ocrWithFeatherless(dataUrl, pageHint);
    if (featherless?.text) return featherless;
  } catch (error) {
    console.warn("Featherless vision OCR failed", error);
  }

  throw new Error("OCR could not read this image. Try a clearer scan or a text-based PDF.");
}

export async function ocrImageBuffer(buffer: Buffer, mimeType: string, fileName: string) {
  const base64 = buffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64}`;
  return ocrImageDataUrl(dataUrl, fileName);
}

const MAX_OCR_PAGES = 4;
const MIN_TEXT_BEFORE_OCR = 100;

export async function ocrPdfBuffer(buffer: Buffer, fileName: string) {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  const pageTexts: string[] = [];

  try {
    const screenshots = await parser.getScreenshot({
      partial: Array.from({ length: MAX_OCR_PAGES }, (_, index) => index + 1),
      imageDataUrl: true,
      scale: 1.5,
    });

    for (const page of screenshots.pages ?? []) {
      if (!page.dataUrl) continue;
      const result = await ocrImageDataUrl(page.dataUrl, `${fileName} — page ${page.pageNumber}`);
      if (result.text) pageTexts.push(result.text);
    }
  } finally {
    await parser.destroy().catch(() => undefined);
  }

  if (!pageTexts.length) {
    throw new Error("Could not OCR this PDF. The file may be encrypted or contain only non-text visuals.");
  }

  return pageTexts.join("\n\n---\n\n");
}

export function needsOcrFallback(extractedText: string) {
  return extractedText.replace(/\s+/g, "").length < MIN_TEXT_BEFORE_OCR;
}
