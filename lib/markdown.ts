/**
 * Flattens Markdown to plain text for places that show a short, clamped
 * preview (Explore cards, the landing-page table), where rendered headings
 * and lists would break the layout and raw `**`/`#` symbols would be noise.
 * Deliberately simple: it strips the common syntax, it is not a parser.
 */
export function markdownToPlainText(markdown: string | null | undefined): string {
  if (!markdown) return ""

  return markdown
    .replace(/```[^\n]*\n?([\s\S]*?)```/g, "$1") // fenced code → its contents
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1") // images → alt text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links → link text
    .replace(/^\s{0,3}#{1,6}\s+/gm, "") // headings
    .replace(/^\s{0,3}>\s?/gm, "") // blockquotes
    .replace(/^\s*(?:[-*+]|\d+[.)])\s+/gm, "") // list markers
    .replace(/^\s*(?:[-*_]\s*){3,}$/gm, "") // horizontal rules
    .replace(/(\*\*|__)(.+?)\1/g, "$2") // bold
    .replace(/(?<![\w*])([*_])(?!\s)(.+?)(?<!\s)\1(?![\w*])/g, "$2") // italics
    .replace(/~~(.+?)~~/g, "$1") // strikethrough
    .replace(/`([^`]+)`/g, "$1") // inline code
    .replace(/\s*\n\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
}
