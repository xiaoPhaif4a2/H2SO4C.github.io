import { getRelativeLocaleUrl } from "astro:i18n";
import config from "@/config";

function getPostSlugPath(legacyPath: string): string {
  return legacyPath.replace(/^\/+/, "");
}

/**
 * Returns the slug-only path for use as a route param in `getStaticPaths`.
 * No base prefix, no locale — Astro handles those at a higher level.
 * e.g. `/examples/my-post`
 */
export function getPostSlug(legacyPath: string): string {
  return `/${getPostSlugPath(legacyPath)}`;
}

/**
 * Returns a fully navigable URL for use in `<a href>` and RSS links.
 * Applies both locale routing and the configured Astro base via
 * `getRelativeLocaleUrl`.
 * e.g. `/posts/my-post` or `/en/posts/my-post`
 */
export function getPostUrl(
  legacyPath: string,
  locale: string | undefined = config.site.lang
): string {
  return getRelativeLocaleUrl(locale, getPostSlugPath(legacyPath));
}
