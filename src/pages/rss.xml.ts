import rss from "@astrojs/rss";
import getVisiblePosts from "../scripts/posts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(context: any) {
  const posts = await getVisiblePosts();
  return rss({
    // `<title>` field in output xml
    title: "Pizero's Blog",
    // `<description>` field in output xml
    description: "又一个 Astro 博客",
    // Pull in your project "site" from the endpoint context
    // https://docs.astro.build/en/reference/api-reference/#site
    site: context.site,
    // Array of `<item>`s in output xml
    // See "Generating items" section for examples using content collections and glob imports
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      link: `/blogs/${post.id}`,
    })),
    // (optional) inject custom xml
    customData: `<language>zh-cn</language>`,
  });
}
