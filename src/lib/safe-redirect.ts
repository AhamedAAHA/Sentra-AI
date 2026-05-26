/** Allow only same-origin relative paths for post-auth redirects. */
export function safeRedirectPath(next: string | null | undefined, fallback = "/dashboard") {
  if (!next || typeof next !== "string") return fallback;

  const trimmed = next.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return fallback;

  try {
    const url = new URL(trimmed, "http://localhost");
    if (url.origin !== "http://localhost") return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
