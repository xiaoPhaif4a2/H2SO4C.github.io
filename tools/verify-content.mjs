import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const postsDirectory = path.join(root, "src", "content", "posts");
const manifest = JSON.parse(
  fs.readFileSync(
    path.join(root, "src", "data", "legacy-content-manifest.json"),
    "utf8"
  )
);
const friends = JSON.parse(
  fs.readFileSync(path.join(root, "src", "data", "friends.json"), "utf8")
);
const errors = [];

function getMarkdownBody(contents) {
  const match = contents.match(
    /^---\r?\n[\s\S]*?\r?\n---\r?\n?\r?\n?([\s\S]*)$/
  );
  if (!match) throw new Error("Missing front matter.");
  return match[1].replace(/\r\n/g, "\n");
}

for (const post of manifest.posts) {
  const filePath =
    path.join(postsDirectory, ...post.legacyPath.split("/")) + ".md";
  if (!fs.existsSync(filePath)) {
    errors.push(`missing migrated post: ${post.legacyPath}`);
    continue;
  }

  const bodyHash = crypto
    .createHash("sha256")
    .update(getMarkdownBody(fs.readFileSync(filePath, "utf8")))
    .digest("hex");
  if (bodyHash !== post.sourceHash) {
    errors.push(`body changed during migration: ${post.legacyPath}`);
  }

  const output = path.join(
    root,
    "dist",
    ...post.legacyPath.split("/"),
    "index.html"
  );
  if (!fs.existsSync(output))
    errors.push(`missing historical route: /${post.legacyPath}/`);
}

const heroPostPath = "2026/10/10/英雄的发生";
const heroMarkdown = fs.readFileSync(
  path.join(postsDirectory, `${heroPostPath}.md`),
  "utf8"
);
const heroHtml = fs.readFileSync(
  path.join(root, "dist", heroPostPath, "index.html"),
  "utf8"
);
const expectedBoldTexts = Array.from(
  getMarkdownBody(heroMarkdown).matchAll(/\*\*([^\n]+?)\*\*/g),
  match => match[1]
);
for (const text of expectedBoldTexts) {
  if (!heroHtml.includes(`<strong>${text}</strong>`)) {
    errors.push(`missing rendered bold text in ${heroPostPath}: ${text}`);
  }
}
if (
  Array.from(heroHtml.matchAll(/<p>[\s\S]*?<\/p>/g)).some(match =>
    match[0].includes("**")
  )
) {
  errors.push(`unrendered bold markers in ${heroPostPath}`);
}
for (const heading of [
  "一、从价值选择到命定道路",
  "二、功绩，责任，公正",
  "三、英雄是怎样被讲述的",
]) {
  if (!heroHtml.includes(`>${heading}</h2>`)) {
    errors.push(`missing level-two section in ${heroPostPath}: ${heading}`);
  }
}

const migratedPostCount = fs
  .readdirSync(path.join(postsDirectory, "2026", "08", "11"))
  .filter(file => file.endsWith(".md")).length;
if (migratedPostCount !== manifest.posts.length) {
  errors.push(
    `expected ${manifest.posts.length} posts, received ${migratedPostCount}`
  );
}

if (!fs.existsSync(path.join(root, "dist", "link", "index.html"))) {
  errors.push("missing friend-link page: /link/");
}

const friendCount = friends.reduce(
  (count, group) => count + group.link_list.length,
  0
);
if (friendCount !== 7)
  errors.push(`expected 7 friend links, received ${friendCount}`);

if (errors.length > 0) {
  process.stderr.write("Content verification failed:\n");
  for (const error of errors) process.stderr.write(`- ${error}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    `Content verified (${manifest.posts.length} posts, ${friendCount} friend links).\n`
  );
}
