import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const dist = path.resolve("dist");
const files = fs.readdirSync(dist, { recursive: true });
const sitemap = fs.readFileSync(path.join(dist, "sitemap-0.xml"), "utf8");
const sharedPaths = new Set();

for (const file of files.filter(file => file.endsWith(".html"))) {
  const html = fs.readFileSync(path.join(dist, file), "utf8");
  if (!html.includes("<post-share")) continue;
  const url = html.match(/data-share-url[^>]*value="([^"]+)"/)?.[1];
  assert.ok(url, `Missing share URL: ${file}`);
  const shortPath = new URL(url).pathname;
  assert.match(shortPath, /^\/s\/[0-9a-f]{10}\/$/);
  assert.ok(!sharedPaths.has(shortPath), `Duplicate share link: ${shortPath}`);
  sharedPaths.add(shortPath);

  const redirect = fs.readFileSync(
    path.join(dist, shortPath, "index.html"),
    "utf8"
  );
  const canonical = html.match(/rel="canonical" href="([^"]+)"/)?.[1];
  const target = redirect.match(
    /http-equiv="refresh" content="0;url=([^"]+)"/
  )?.[1];
  assert.ok(target, `Missing redirect: ${shortPath}`);
  assert.equal(
    decodeURI(target),
    `/${file.replaceAll(path.sep, "/").replace(/index\.html$/, "")}`,
    `Redirect points to wrong post: ${shortPath}`
  );
  assert.ok(redirect.includes(`rel="canonical" href="${canonical}"`));
  assert.ok(redirect.includes('content="noindex, follow"'));
  assert.ok(!sitemap.includes(shortPath), `Short URL in sitemap: ${shortPath}`);
  assert.ok(html.includes("data-card-footer"));
  assert.ok(html.includes('alt="原文二维码"'));
}

assert.ok(sharedPaths.size > 0, "No share links were generated");
const redirects = files.filter(file =>
  /^s[/\\][^/\\]+[/\\]index\.html$/.test(file)
);
assert.equal(redirects.length, sharedPaths.size, "Orphaned share redirects");
process.stdout.write(
  `Sharing verified (${sharedPaths.size} posts and short links).\n`
);
