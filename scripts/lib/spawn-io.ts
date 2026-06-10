/**
 * Reads trimmed text from a Bun.spawn stdout/stderr pipe.
 *
 * @param stream - Pipe stream from `Bun.spawn` when `stdout`/`stderr` is `"pipe"`
 */
export async function readSpawnPipe(
  stream: ReadableStream<Uint8Array> | number | null | undefined,
): Promise<string> {
  if (stream == null || typeof stream === "number") {
    return "";
  }
  return (await new Response(stream).text()).trim();
}
