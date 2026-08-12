# Butterfly configuration

These files are the editable source for the Butterfly theme. Do not edit the
generated `_config.butterfly.yml` at the repository root.

| File | Owns |
| --- | --- |
| `site.yml` | Navigation, social links, avatar, covers, top images, favicon, and 404 page |
| `reading.yml` | Search, code blocks, article metadata, reward, table of contents, and copyright settings |
| `layout.yml` | Sidebar, footer, colour palette, dark mode, and loading behaviour |
| `community.yml` | Friends links and the message-board envelope |

Run `npm run config` after changing these files, or simply use `npm run dev` or
`npm run build`; both generate the runtime configuration automatically.

Each top-level setting may appear in exactly one YAML file. The generator fails
fast if a setting is duplicated, so a later file cannot silently override an
earlier one.

CategoryBar has its own [name-to-resource mapping](../categorybar.yml), because
it must cover every published category rather than rely on an unstable list
position. It may also include planned categories, which display with a count of
zero until their first article is published.
