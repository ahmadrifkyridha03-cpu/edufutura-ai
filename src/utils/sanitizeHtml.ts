import DOMPurify from "dompurify";

/**
 * Sanitasi konten HTML sebelum dirender ke DOM.
 * Mencegah Cross-Site Scripting (XSS) dari konten eksternal/AI
 * dengan tetap mempertahankan tag & atribut styling dokumen (tabel, border, font, dsb).
 */
export function sanitizeHtml(rawHtml: string): string {
  if (!rawHtml) return "";
  if (typeof window === "undefined") return rawHtml;

  return DOMPurify.sanitize(rawHtml, {
    ADD_TAGS: ["style", "table", "thead", "tbody", "tfoot", "tr", "th", "td", "colgroup", "col", "font"],
    ADD_ATTR: [
      "style",
      "class",
      "colspan",
      "rowspan",
      "border",
      "cellpadding",
      "cellspacing",
      "width",
      "height",
      "align",
      "valign",
      "bgcolor",
      "color"
    ],
    FORCE_BODY: false
  });
}
