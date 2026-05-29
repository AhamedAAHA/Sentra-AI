export const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024;
export const MAX_EXTRACTED_CHARS = 120_000;
export const DOCUMENT_CONTEXT_CHARS = 14_000;

export const ACCEPTED_DOCUMENT_MIME = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export type ParsedDocument = {
  fileName: string;
  mimeType: string;
  text: string;
  truncated: boolean;
  charCount: number;
};

function normalizeText(text: string) {
  return text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/[ \t]+/g, " ").trim();
}

function resolveKind(fileName: string, mimeType: string) {
  const lower = fileName.toLowerCase();
  if (mimeType === "application/pdf" || lower.endsWith(".pdf")) return "pdf" as const;
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lower.endsWith(".docx")
  ) {
    return "docx" as const;
  }
  if (
    mimeType.startsWith("text/") ||
    lower.endsWith(".txt") ||
    lower.endsWith(".md") ||
    lower.endsWith(".csv")
  ) {
    return "text" as const;
  }
  return null;
}

export function sliceDocumentForContext(text: string) {
  return text.slice(0, DOCUMENT_CONTEXT_CHARS);
}

export async function extractDocumentFromBuffer(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
): Promise<ParsedDocument> {
  if (buffer.byteLength > MAX_DOCUMENT_BYTES) {
    throw new Error("File is too large. Maximum size is 8 MB.");
  }

  const kind = resolveKind(fileName, mimeType);
  if (!kind) {
    throw new Error("Unsupported file type. Upload PDF, DOCX, TXT, MD, or CSV.");
  }

  let raw = "";

  if (kind === "pdf") {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    try {
      const parsed = await parser.getText();
      raw = parsed.text ?? "";
    } finally {
      await parser.destroy().catch(() => undefined);
    }
  } else if (kind === "docx") {
    const mammoth = await import("mammoth");
    const parsed = await mammoth.extractRawText({ buffer });
    raw = parsed.value ?? "";
  } else {
    raw = buffer.toString("utf-8");
  }

  const normalized = normalizeText(raw);
  if (!normalized) {
    throw new Error("No readable text was found in this document.");
  }

  const truncated = normalized.length > MAX_EXTRACTED_CHARS;
  const text = truncated ? normalized.slice(0, MAX_EXTRACTED_CHARS) : normalized;

  return {
    fileName,
    mimeType,
    text,
    truncated,
    charCount: text.length,
  };
}

export async function extractDocumentFromFile(file: File): Promise<ParsedDocument> {
  const mimeType = file.type || "application/octet-stream";
  if (!ACCEPTED_DOCUMENT_MIME.has(mimeType) && !resolveKind(file.name, mimeType)) {
    throw new Error("Unsupported file type. Upload PDF, DOCX, TXT, MD, or CSV.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  return extractDocumentFromBuffer(buffer, file.name, mimeType);
}
