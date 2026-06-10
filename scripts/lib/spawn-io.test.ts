import { describe, expect, it } from "vitest";
import { readSpawnPipe } from "./spawn-io";

describe("readSpawnPipe", () => {
  it("returns empty string for null, undefined, or fd numbers", async () => {
    await expect(readSpawnPipe(null)).resolves.toBe("");
    await expect(readSpawnPipe(undefined)).resolves.toBe("");
    await expect(readSpawnPipe(1)).resolves.toBe("");
  });

  it("reads a readable stream", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("hello\n"));
        controller.close();
      },
    });
    await expect(readSpawnPipe(stream)).resolves.toBe("hello");
  });
});
