import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import { getWordCount } from "../src/utils/getWordCount.ts";

const markdown = await createMarkdownProcessor({ syntaxHighlight: false });
const examples = [
  ["建安诗歌，Hello world！2026。", 7],
  ["𠮷，café，don't，don’t，123。", 5],
  [
    "# 标题\n\n**正文**与[链接](https://example.com/hidden)\n\n![图片](https://example.com/image.png)",
    7,
  ],
  ["正文 `inline code`\n\n```js\nconst hidden = '代码';\n```", 2],
  ["<p>hel<strong>lo</strong></p><p>world<br>again</p>", 3],
  [
    "<p>one&nbsp;two &amp; three</p><!-- 注释 --><script>隐藏</script><style>隐藏</style><span hidden>隐藏</span>",
    3,
  ],
  ["，。！？ --- ***", 0],
  ["", 0],
];

for (const [source, expected] of examples) {
  const { code } = await markdown.render(source);
  assert.equal(getWordCount(code), expected, source);
}

const dist = path.resolve("dist");
const counts = new Set();
let articleCount = 0;
for (const file of fs.readdirSync(dist, { recursive: true })) {
  if (!file.endsWith(".html")) continue;
  const html = fs.readFileSync(path.join(dist, file), "utf8");
  const article = html.match(
    /<article\b[^>]*id="article"[^>]*>([\s\S]*?)<\/article>/
  );
  if (!article) continue;
  const displayedCount = html.match(/data-word-count="(\d+)"/);
  assert.ok(displayedCount, `Missing word count: ${file}`);
  assert.equal(Number(displayedCount[1]), getWordCount(article[1]), file);
  counts.add(Number(displayedCount[1]));
  articleCount += 1;
}
assert.ok(articleCount > 0, "No articles were verified");

const home = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const cardCounts = [...home.matchAll(/data-word-count="(\d+)"/g)];
assert.ok(cardCounts.length > 0, "Missing article-list word counts");
for (const [, count] of cardCounts) {
  assert.ok(counts.has(Number(count)), `Unknown article-list count: ${count}`);
}

process.stdout.write(`Word counts verified (${articleCount} articles).\n`);
