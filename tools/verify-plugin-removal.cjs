const fs = require('node:fs');
const path = require('node:path');

const rootDirectory = path.resolve(__dirname, '..');
const publicDirectory = path.join(rootDirectory, 'public');
const packageJson = JSON.parse(fs.readFileSync(path.join(rootDirectory, 'package.json'), 'utf8'));
const packageLock = fs.readFileSync(path.join(rootDirectory, 'package-lock.json'), 'utf8');
const failures = [];

const removedPackages = [
  'hexo-butterfly-swiper',
  'hexo-butterfly-tag-plugins-plus',
  'hexo-tag-aplayer'
];

for (const packageName of removedPackages) {
  if (packageJson.dependencies?.[packageName]) {
    failures.push(`${packageName} remains in package.json.`);
  }

  if (packageLock.includes(`node_modules/${packageName}`)) {
    failures.push(`${packageName} remains in package-lock.json.`);
  }
}

for (const post of fs.readdirSync(path.join(rootDirectory, 'source', '_posts'))) {
  const source = fs.readFileSync(path.join(rootDirectory, 'source', '_posts', post), 'utf8');
  if (source.includes('{%')) {
    failures.push(`${post} still contains a removed plugin tag.`);
  }
}

const homePage = readPage('index.html');
const remoteScripts = [...homePage.matchAll(/<script\b[^>]*\bsrc=["']((?:https?:)?\/\/[^"']+)["'][^>]*>/g)]
  .map((match) => match[1]);

if (remoteScripts.length > 0) {
  failures.push(`home page still has remote scripts: ${remoteScripts.join(', ')}.`);
}

for (const [page, audioPath] of [
  ['2026/08/12/共和国战歌/index.html', '/audios/bhorepublica.mp3'],
  ['2026/08/12/在巴尔干的繁星下/index.html', '/audios/under the balkanian sky.mp3']
]) {
  const html = readPage(page);
  if (!html.includes('<audio controls preload="none">') || !html.includes(audioPath)) {
    failures.push(`${page} does not contain the expected native audio player.`);
  }
}

if (failures.length > 0) {
  console.error(`Plugin removal verification failed:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log('Plugin removal verified (no removed dependencies, tags, or homepage scripts).');
}

function readPage(relativePath) {
  return fs.readFileSync(path.join(publicDirectory, relativePath), 'utf8');
}
