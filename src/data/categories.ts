import { slugifyStr } from "@/utils/slugify";

export type BlogCategory = {
  name: string;
  slug: string;
};

export const ARCHIVED_CATEGORY_NAME = "已归档";
export const ARCHIVED_CATEGORY_SLUG = slugifyStr(ARCHIVED_CATEGORY_NAME);

const categoryNames = [
  "文学",
  "英语",
  "计算机",
  "产品运营",
  "其他",
  ARCHIVED_CATEGORY_NAME,
];

export const BLOG_CATEGORIES: BlogCategory[] = categoryNames.map(name => ({
  name,
  slug: slugifyStr(name),
}));
