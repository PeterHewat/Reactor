import { glob } from "astro/loaders";
import { defineCollection } from "astro:content";
import { blogPostSchema } from "./lib/blog-schema";

const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.md" }),
  schema: blogPostSchema,
});

export const collections = { blog };
