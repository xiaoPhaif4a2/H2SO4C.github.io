import { slugifyStr } from "@/utils/slugify";

export type BlogCategory = {
  name: string;
  slug: string;
};

const categoryNames = ["文学", "英语", "计算机", "产品运营", "其他"];

export const BLOG_CATEGORIES: BlogCategory[] = categoryNames.map(name => ({
  name,
  slug: slugifyStr(name),
}));
