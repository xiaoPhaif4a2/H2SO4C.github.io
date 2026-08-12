const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');

const rootDirectory = path.resolve(__dirname, '..');
const config = yaml.load(fs.readFileSync(path.join(rootDirectory, 'config', 'categorybar.yml'), 'utf8'));
const indexHtml = fs.readFileSync(path.join(rootDirectory, 'public', 'index.html'), 'utf8');

function getCategoryMarkup(html) {
  const generatedMarkup = html.match(/const categoryBarMarkup = ("(?:[^"\\]|\\.)*");/s);
  if (generatedMarkup) {
    return JSON.parse(generatedMarkup[1]);
  }

  const oldMarkup = html.match(/<div id="categoryBar">[\s\S]*?<\/div><\/div>';/);
  return oldMarkup ? oldMarkup[0] : html;
}

function extractCards(markup) {
  const cards = [];
  const itemPattern = /<li class="categoryBar-list-item"(?<attributes>[^>]*)>(?<content>[\s\S]*?)<\/li>/g;

  for (const match of markup.matchAll(itemPattern)) {
    const style = match.groups.attributes.match(/style="(?<style>[^"]*)"/)?.groups.style ?? '';
    const cover = style.match(/url\((?:'|")?(?<cover>[^)'"\s]+)(?:'|")?\)/)?.groups.cover ?? '';
    const category = match.groups.content.match(/class="categoryBar-list-link"[^>]*>(?<name>[^<]+)<\/a>/)?.groups.name?.trim();
    const description = match.groups.content.match(/class="categoryBar-list-descr">(?<description>[^<]*)<\/span>/)?.groups.description?.trim() ?? '';
    const hasBookIcon = /categoryBar-list-count-icon[^\"]*fa-book/.test(match.groups.content);
    const count = Number.parseInt(match.groups.content.match(/categoryBar-list-count-icon[^>]*><\/i>(?<count>\d+)</)?.groups.count ?? '', 10);

    if (category) {
      cards.push({ category, cover, description, hasBookIcon, count });
    }
  }

  return cards;
}

function getPublishedCategoryCounts() {
  const counts = new Map();
  const postsDirectory = path.join(rootDirectory, 'source', '_posts');

  for (const entry of fs.readdirSync(postsDirectory, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;

    const source = fs.readFileSync(path.join(postsDirectory, entry.name), 'utf8');
    const frontMatter = source.match(/^---\r?\n(?<data>[\s\S]*?)\r?\n---(?:\r?\n|$)/)?.groups.data;
    if (!frontMatter) continue;

    const data = yaml.load(frontMatter) ?? {};
    const categories = data.categories ?? data.category ?? [];
    const names = Array.isArray(categories) ? categories : [categories];

    for (const category of names) {
      if (typeof category === 'string') {
        counts.set(category, (counts.get(category) ?? 0) + 1);
      }
    }
  }

  return counts;
}

const cards = extractCards(getCategoryMarkup(indexHtml));
const failures = [];
const publishedCategoryCounts = getPublishedCategoryCounts();

if (cards.length !== Object.keys(config.categories).length) {
  failures.push(`expected ${Object.keys(config.categories).length} category cards, received ${cards.length}.`);
}

for (const [category, expected] of Object.entries(config.categories)) {
  const card = cards.find((candidate) => candidate.category === category);

  if (!card) {
    failures.push(`${category}: category card is missing.`);
    continue;
  }

  if (card.cover !== expected.cover) {
    failures.push(`${category}: expected cover ${expected.cover}, received ${card.cover || '<none>'}.`);
  }

  if (card.description !== expected.description) {
    failures.push(`${category}: expected description "${expected.description}", received "${card.description}".`);
  }

  if (!card.hasBookIcon) {
    failures.push(`${category}: the count does not contain a Font Awesome book icon.`);
  }

  const expectedCount = publishedCategoryCounts.get(category) ?? 0;
  if (card.count !== expectedCount) {
    failures.push(`${category}: expected count ${expectedCount}, received ${Number.isNaN(card.count) ? '<none>' : card.count}.`);
  }
}

if (failures.length > 0) {
  console.error(`Category bar verification failed:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(`Category bar verified (${cards.length} cards).`);
}
