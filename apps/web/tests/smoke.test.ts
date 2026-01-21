import { describe, expect, it } from "vitest";

describe("web workspace setup", () => {
  it("runs vitest with jsdom and jest-dom", () => {
    const el = document.createElement("div");
    el.textContent = "hello";
    document.body.appendChild(el);
    expect(el).toBeInTheDocument();
    expect(el).toHaveTextContent("hello");
  });
});
