/* eslint-disable no-console -- CLI output */
import { promptConfirm } from "./prompt";

/**
 * Opens a URL in the system default browser.
 *
 * @param url - HTTPS URL to open
 */
export function openUrlInBrowser(url: string): void {
  const command =
    process.platform === "darwin" ? "open" : process.platform === "win32" ? "cmd" : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
  Bun.spawn([command, ...args], { stdout: "ignore", stderr: "ignore" });
}

/**
 * Prints a URL (clickable in most terminals) and prompts to open it in the browser.
 *
 * @param url - HTTPS URL to display
 * @param options - When `interactive` is false, only prints the URL (no prompt)
 */
export async function offerOpenUrl(
  url: string,
  options?: { interactive?: boolean },
): Promise<void> {
  console.log(`  ${url}`);
  const interactive = options?.interactive ?? Boolean(process.stdin.isTTY);
  if (!interactive) {
    return;
  }
  if (await promptConfirm("Open link?", { defaultYes: false })) {
    openUrlInBrowser(url);
  }
}
