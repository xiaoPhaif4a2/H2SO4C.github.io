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

## 文章分享

文章标题下方可复制短链接、复制 `【文章标题】短链接` 文案，以及在支持的设备上调用系统分享。短链接为 `/s/十位编号/`，构建时按 `legacyPath` 稳定生成并检查重复，跳转到原有日期文章地址。更改标题、摘要或新增文章不会改变已有编号；需保持 `legacyPath` 不变。

“生成正文长图”在浏览器中生成 PNG，可预览、下载或长按保存。长图包含全文、配图、作者、日期和原文二维码，使用独立的浅色纸张样式；较长文章按段落边界分图。音视频以提示替代，加载失败或不允许跨域读取的配图会保留说明。导出库在点击时才加载。

分享网址与二维码使用 `astro-paper.config.ts` 的 `site.url`。更换域名后需重新构建，并保留旧域名的跳转，才能继续使用之前分享的链接和二维码。这里缩短的是路径；如需视频网站那样很短的域名，可以再绑定一个短域名。

## 致谢与许可

本项目基于 [AstroPaper](https://github.com/satnaing/astro-paper)（MIT License）改造。完整许可文本见 [LICENSE](LICENSE)。
