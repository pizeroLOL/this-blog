import { getCollection } from "astro:content";

/**
 * 首页 / 404 共用的文章列表：按日期倒序，
 * 线上隐藏带「测试」标签的文章（开发环境全部显示）。
 */
export default async function getVisiblePosts() {
  const posts = await getCollection("blogs");
  return posts
    .filter((post) => import.meta.env.DEV || !post.data.tags.includes("测试"))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}
