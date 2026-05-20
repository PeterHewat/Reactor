import { z } from "astro/zod";

/**
 * Zod schema for blog collection frontmatter (Astro content collections).
 *
 * @example
 * blogPostSchema.parse({ title: "Hi", description: "...", pubDate: new Date() });
 */
export const blogPostSchema = z.object({
  title: z.string(),
  description: z.string(),
  pubDate: z.coerce.date(),
  author: z.string().optional(),
  image: z.string().optional(),
});
