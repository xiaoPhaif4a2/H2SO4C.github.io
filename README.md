# H2SO4-blog

H2SO4C 的个人博客，使用 [AstroPaper](https://github.com/satnaing/astro-paper) 构建。

## 本地运行

```bash
npm ci
npm run dev
npm run check
```

需要 Node.js 22.12 或更高版本。

## 内容结构

- `src/content/posts/YYYY/MM/DD/`：博客文章。目录即文章的永久路径；保留这一规则以兼容已有链接。
- `src/data/friends.json`：友链数据；页面路径为 `/link/`。
- `public/images/` 与 `public/audios/`：文章和友链使用的静态资源。

文章 Frontmatter 至少应包含：

```yaml
title: 文章标题
description: 文章摘要
pubDatetime: 2026-08-11T00:00:00+08:00
tags: []
categories: []
legacyPath: 2026/08/11/文章路径
```

`npm run check` 会校验类型、代码格式、构建结果、全部历史文章路径以及友链页。

## 致谢与许可

本项目基于 [AstroPaper](https://github.com/satnaing/astro-paper)（MIT License）改造。完整许可文本见 [LICENSE](LICENSE)。
