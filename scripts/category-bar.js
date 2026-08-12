'use strict';

const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');
const urlFor = require('hexo-util').url_for.bind(hexo);

const configFile = path.join(hexo.base_dir, 'config', 'categorybar.yml');

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function readConfig() {
  if (!fs.existsSync(configFile)) {
    throw new Error('Missing config/categorybar.yml.');
  }

  const config = yaml.load(fs.readFileSync(configFile, 'utf8'));
  if (!config || Array.isArray(config) || typeof config !== 'object') {
    throw new Error('config/categorybar.yml must contain a mapping.');
  }

  return config;
}

function renderCategoryBar(categories, config) {
  const columns = config.column === 'even' ? 4 : 3;
  const mobileHeight = 160 * (config.row ?? 2);
  const desktopHeight = 190 * (config.row ?? 2);
  const itemWidth = columns === 4 ? '24%' : '32.3%';
  const publishedCategories = new Map(categories.map((category) => [category.name, category]));
  const cards = Object.entries(config.categories).map(([name, resource]) => {
    const category = publishedCategories.get(name);
    const cover = urlFor(resource.cover).replaceAll("'", '%27');
    const href = category ? urlFor(category.path) : urlFor(`/${hexo.config.category_dir}/`);
    const count = category?.length ?? 0;

    return `<li class="categoryBar-list-item" data-category="${escapeHtml(name)}" style="background-image: url('${escapeHtml(cover)}');"><a class="categoryBar-list-link" href="${escapeHtml(href)}">${escapeHtml(name)}</a><span class="categoryBar-list-count"><i class="categoryBar-list-count-icon fa-solid fa-book" aria-hidden="true"></i>${escapeHtml(count)}</span><span class="categoryBar-list-descr">${escapeHtml(resource.description)}</span></li>`;
  }).join('');

  return `<style>li.categoryBar-list-item{width:${itemWidth};}.categoryBar-list{max-height:${desktopHeight}px;overflow:auto;}.categoryBar-list::-webkit-scrollbar{width:0!important}@media screen and (max-width:650px){.categoryBar-list{max-height:${mobileHeight}px;}}</style><div class="recent-post-item" style="height:auto;width:100%;padding:0;"><div id="categoryBar"><ul class="categoryBar-list">${cards}</ul></div></div>`;
}

function validateMappings(categories, config) {
  if (!config.categories || Array.isArray(config.categories) || typeof config.categories !== 'object') {
    throw new Error('config/categorybar.yml requires a categories mapping.');
  }

  const configuredNames = new Set(Object.keys(config.categories));
  const publishedNames = new Set(categories.map((category) => category.name));
  const missingMappings = [...publishedNames].filter((name) => !configuredNames.has(name));

  if (missingMappings.length > 0) {
    throw new Error(`CategoryBar mapping mismatch (missing: ${missingMappings.join(', ')}).`);
  }

  for (const [name, resource] of Object.entries(config.categories)) {
    if (!resource?.cover || !resource.description) {
      throw new Error(`CategoryBar mapping for "${name}" requires cover and description.`);
    }
  }
}

hexo.extend.filter.register('before_generate', () => {
  const config = readConfig();
  if (!config.enable) {
    return;
  }

  const categories = [...hexo.locals.get('categories').data];
  // Hexo server performs one generation pass before its source watcher has
  // populated the category collection. Skip only when there is also no
  // configured card to render; configured empty categories are valid.
  if (categories.length === 0 && Object.keys(config.categories ?? {}).length === 0) {
    return;
  }

  validateMappings(categories, config);

  const layout = config.layout ?? {};
  const target = {
    type: layout.type ?? 'id',
    name: layout.name ?? 'recent-posts',
    index: layout.index ?? 0
  };
  const markup = renderCategoryBar(categories, config);
  const mountScript = `<script data-pjax>(function () { const categoryBarMarkup = ${JSON.stringify(markup)}; const target = ${JSON.stringify(target)}; const parent = target.type === 'class' ? document.getElementsByClassName(target.name)[target.index] : document.getElementById(target.name); if (!parent || document.getElementById('categoryBar')) return; parent.insertAdjacentHTML('afterbegin', categoryBarMarkup); })();</script>`;

  hexo.extend.injector.register('head_end', `<link rel="stylesheet" href="${urlFor('/css/categorybar.css')}">`, 'default');
  hexo.extend.injector.register('body_end', mountScript, 'default');
});
