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

    if (category) {
      cards.push({ category, cover, description, hasBookIcon });
    }
  }

  return cards;
}

const cards = extractCards(getCategoryMarkup(indexHtml));
const failures = [];

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
}

if (failures.length > 0) {
  console.error(`Category bar verification failed:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(`Category bar verified (${cards.length} cards).`);
}
