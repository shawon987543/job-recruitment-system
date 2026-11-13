const allowedTags = new Set([
  "a",
  "b",
  "blockquote",
  "br",
  "code",
  "div",
  "em",
  "h2",
  "h3",
  "h4",
  "i",
  "li",
  "ol",
  "p",
  "pre",
  "s",
  "strong",
  "u",
  "ul",
]);

const discardedTags = new Set([
  "audio",
  "embed",
  "form",
  "iframe",
  "img",
  "input",
  "link",
  "math",
  "meta",
  "object",
  "script",
  "style",
  "svg",
  "video",
]);

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeHref(value: string | null) {
  if (!value) return null;
  const href = value.trim();

  if (
    href.startsWith("/") ||
    href.startsWith("#") ||
    /^(https?:|mailto:|tel:)/i.test(href)
  ) {
    return href;
  }

  return null;
}

/**
 * Keeps only simple formatting tags and safe link URLs. Call from client
 * components because it uses the browser's HTML parser.
 */
export function sanitizeRichText(value: string) {
  const parsed = new DOMParser().parseFromString(value || "", "text/html");

  const serialize = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return escapeHtml(node.textContent || "").replace(/\r?\n/g, "<br>");
    }

    if (!(node instanceof Element)) return "";

    const tag = node.tagName.toLowerCase();
    if (discardedTags.has(tag)) return "";

    const content = Array.from(node.childNodes, serialize).join("");
    if (!allowedTags.has(tag)) return content;
    if (tag === "br") return "<br>";

    const href = tag === "a" ? safeHref(node.getAttribute("href")) : null;
    const attributes = href ? ` href="${escapeHtml(href)}"` : "";

    return `<${tag}${attributes}>${content}</${tag}>`;
  };

  return Array.from(parsed.body.childNodes, serialize).join("");
}

export function richTextHasContent(value: string) {
  const sanitized = sanitizeRichText(value);
  const parsed = new DOMParser().parseFromString(sanitized, "text/html");

  return Boolean(parsed.body.textContent?.replace(/\u00a0/g, " ").trim());
}
