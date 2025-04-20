import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blogs = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/blogs" }),
  schema: z.object({
    title: z.string().min(1).max(20),
    date: z.date(),
    tags: z.array(z.string().min(1).max(20)),
    description: z.string().min(1).max(200),
  }),
});

export const collections = {
  blogs,
};
