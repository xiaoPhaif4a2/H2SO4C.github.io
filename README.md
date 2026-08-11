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

- `npm run dev` starts the local Hexo server.
- `npm run build` generates the site in `public/`.
- `npm run check` performs a clean production build.

Deployment is handled by Vercel from the `main` branch. This repository does
not use `hexo deploy` or keep generated output in Git.

## Structure

```text
.
├── _config.yml              # Core Hexo and site configuration
├── _config.butterfly.yml    # Butterfly theme and theme-plugin configuration
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
  `_config.butterfly.yml`; do not duplicate keys between them.
- Keep public asset paths stable. Moving files under `source/images/` or
  `source/audios/` changes published URLs.
- Install the theme and plugins through npm. Do not edit `node_modules/` or add
  a second theme implementation under `themes/`.
- Use npm and commit `package-lock.json`; do not add a second lock file.
