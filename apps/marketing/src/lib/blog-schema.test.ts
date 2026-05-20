import { describe, expect, it } from "vitest";
import { blogPostSchema } from "./blog-schema";

describe("blogPostSchema", () => {
  it("parses valid frontmatter", () => {
    const parsed = blogPostSchema.parse({
      title: "Hello World",
      description: "Our first blog post",
      pubDate: "2024-01-15",
      author: "Team Reactor",
    });

    expect(parsed.title).toBe("Hello World");
    expect(parsed.description).toBe("Our first blog post");
    expect(parsed.pubDate).toEqual(new Date("2024-01-15"));
    expect(parsed.author).toBe("Team Reactor");
  });

  it("rejects missing title", () => {
    expect(() =>
      blogPostSchema.parse({
        description: "No title",
        pubDate: "2024-01-15",
      }),
    ).toThrow();
  });
});
