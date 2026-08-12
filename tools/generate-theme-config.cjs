const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');

const rootDirectory = path.resolve(__dirname, '..');
const sourceDirectory = path.join(rootDirectory, 'config', 'butterfly');
const outputFile = path.join(rootDirectory, '_config.butterfly.yml');
const checkOnly = process.argv.includes('--check');

function listYamlFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return listYamlFiles(entryPath);
      }

      return /\.ya?ml$/i.test(entry.name) ? [entryPath] : [];
    });
}

function loadThemeConfig() {
  if (!fs.existsSync(sourceDirectory)) {
    throw new Error('Missing config/butterfly/.');
  }

  const files = listYamlFiles(sourceDirectory);
  if (files.length === 0) {
    throw new Error('No YAML files found in config/butterfly/.');
  }

  const merged = {};
  const origins = new Map();

  for (const file of files) {
    const relativeFile = path.relative(rootDirectory, file);
    const parsed = yaml.load(fs.readFileSync(file, 'utf8'));

    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      throw new Error(`${relativeFile} must contain a top-level mapping.`);
    }

    for (const [key, value] of Object.entries(parsed)) {
      if (origins.has(key)) {
        throw new Error(
          `Duplicate top-level key "${key}" in ${relativeFile}; it is already defined in ${origins.get(key)}.`
        );
      }

      merged[key] = value;
      origins.set(key, relativeFile);
    }
  }

  const generated = [
    '# GENERATED FILE — DO NOT EDIT.',
    '# Edit config/butterfly/*.yml, then run: npm run config',
    '',
    yaml.dump(merged, { lineWidth: -1, noRefs: true }).trimEnd(),
    ''
  ].join('\n');

  return { files, generated };
}

function run() {
  const { files, generated } = loadThemeConfig();

  if (checkOnly) {
    if (!fs.existsSync(outputFile) || fs.readFileSync(outputFile, 'utf8') !== generated) {
      throw new Error('Generated _config.butterfly.yml is out of date. Run "npm run config".');
    }

    console.log(`Theme configuration is current (${files.length} source files).`);
    return;
  }

  fs.writeFileSync(outputFile, generated, 'utf8');
  console.log(`Generated _config.butterfly.yml from ${files.length} source files.`);
}

try {
  run();
} catch (error) {
  console.error(`Theme configuration error: ${error.message}`);
  process.exitCode = 1;
}
