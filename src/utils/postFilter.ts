import type { CollectionEntry } from "astro:content";
import config from "@/config";
import { ARCHIVED_CATEGORY_SLUG } from "@/data/categories";
import { slugifyAll } from "./slugify";

/**
 * Whether a post belongs to the archived category.
 */
export function isArchivedPost(post: CollectionEntry<"posts">) {
  return slugifyAll(post.data.categories).includes(ARCHIVED_CATEGORY_SLUG);
}

/**
 * Whether a post is eligible to be rendered, ignoring archived status.
 */
export function isPublishablePost(post: CollectionEntry<"posts">) {
  const { data } = post;
  const isPublishTimePassed =
    Date.now() >
    new Date(data.pubDatetime).getTime() - config.posts.scheduledPostMargin;
  return !data.draft && (import.meta.env.DEV || isPublishTimePassed);
}

/**
 * Determines whether a post is eligible to be listed/rendered.
 *
 * - Excludes drafts always
 * - Excludes archived posts from regular listings
 * - In production, excludes scheduled posts until `pubDatetime` minus the configured margin
 * - In dev, always shows non-draft posts to make authoring easier
 */
export function postFilter(post: CollectionEntry<"posts">) {
  return isPublishablePost(post) && !isArchivedPost(post);
}

/**
 * Includes archived posts while still respecting drafts and scheduled posts.
 */
export function postFilterIncludingArchived(post: CollectionEntry<"posts">) {
  return isPublishablePost(post);
}
