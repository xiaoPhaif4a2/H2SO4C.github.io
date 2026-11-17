import { parseFragment, type DefaultTreeAdapterTypes } from "parse5";

const excludedTags = new Set([
  "pre",
  "code",
  "script",
  "style",
  "template",
  "svg",
  "math",
  "audio",
  "video",
]);

const blockTags = new Set([
  "address",
  "article",
  "aside",
  "blockquote",
  "br",
  "dd",
  "div",
  "dl",
  "dt",
  "figcaption",
  "figure",
  "footer",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hr",
  "li",
  "ol",
  "p",
  "section",
  "table",
  "td",
  "th",
  "tr",
  "ul",
]);

function getText(node: DefaultTreeAdapterTypes.Node): string {
  if ("value" in node) return node.value;
  if (!("childNodes" in node)) return "";

  if ("tagName" in node) {
    if (
      excludedTags.has(node.tagName) ||
      node.attrs.some(
        ({ name, value }) =>
          name === "hidden" ||
          (name === "aria-hidden" && value === "true") ||
          name === "data-footnote-ref" ||
          name === "data-footnote-backref"
      )
    ) {
      return " ";
    }
  }

  const text = node.childNodes.map(getText).join("");
  return "tagName" in node && blockTags.has(node.tagName) ? ` ${text} ` : text;
}

/** Count rendered article text, without markup, metadata, or code. */
export function getWordCount(html: string): number {
  const text = getText(parseFragment(html));
  let characterCount = 0;
  // Count CJK characters individually; keep adjacent Latin words separate.
  const words = text.replace(
    /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu,
    () => {
      characterCount += 1;
      return " ";
    }
  );
  const wordCount =
    words.match(/[\p{L}\p{N}][\p{L}\p{M}\p{N}]*(?:['’][\p{L}\p{N}]+)*/gu)
      ?.length ?? 0;

  return characterCount + wordCount;
}
