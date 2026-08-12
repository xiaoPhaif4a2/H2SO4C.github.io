# H2SO4C Blog

This repository contains the source for the H2SO4C personal blog, built with
[Hexo](https://hexo.io/) and the
[Butterfly theme](https://github.com/jerryc127/hexo-theme-butterfly).

## Commands

The npm scripts are the repository's stable interface:

```bash
npm ci
npm run dev
npm run check
```

- `npm run config` compiles the split Butterfly settings into the runtime file
  Hexo expects.
- `npm run dev` builds once and serves the same `public/` output used in
  production. Re-run it after changing source files.
- `npm run build` compiles theme settings and generates the site in `public/`.
- `npm run check` performs a clean production build and verifies that the
  generated theme configuration is current.

Deployment is handled by Vercel from the `main` branch. This repository does
not use `hexo deploy` or keep generated output in Git.

## Structure

```text
.
├── _config.yml              # Core Hexo and site configuration
├── config/butterfly/         # Editable Butterfly settings, split by concern
├── config/categorybar.yml    # Name-to-resource mapping for home-page category cards
├── scripts/                  # Hexo extensions loaded during site generation
├── tools/                    # Build-time project tooling and output checks
├── scaffolds/               # Front-matter templates for new content
├── source/
│   ├── _data/               # Structured data consumed by the theme
│   ├── _posts/              # Blog posts
│   ├── audios/              # Public audio assets
│   ├── css/                 # Local style overrides
│   └── images/              # Public image assets
└── .github/                 # Dependency updates and build verification
```

## Maintenance rules

- Put Hexo/site settings in `_config.yml` and Butterfly settings in
  `config/butterfly/`. `_config.butterfly.yml` is generated and ignored; do
  not edit it.
- Keep public asset paths stable. Moving files under `source/images/` or
  `source/audios/` changes published URLs.
- Configure CategoryBar resources by category name in `config/categorybar.yml`.
  The build rejects missing or unused mappings instead of pairing cards by order.
- Install the theme and plugins through npm. Do not edit `node_modules/` or add
  a second theme implementation under `themes/`.
- Use npm and commit `package-lock.json`; do not add a second lock file.
