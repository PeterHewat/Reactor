/* eslint-disable no-console -- CLI prompts */
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

/**
 * Prompts for a single line on stdin.
 *
 * @param question - Prompt label (without trailing colon)
 * @param options - Default value and whether empty input is allowed
 */
export async function promptLine(
  question: string,
  options?: { defaultValue?: string; displayDefault?: string; required?: boolean },
): Promise<string> {
  const rl = readline.createInterface({ input, output });
  try {
    while (true) {
      const shown = options?.displayDefault ?? options?.defaultValue;
      const suffix = shown ? ` [${shown}]` : "";
      const answer = (await rl.question(`${question}${suffix}: `)).trim();
      if (!answer && options?.defaultValue !== undefined) {
        return options.defaultValue;
      }
      if (!answer && options?.required) {
        console.log("  Required — enter a value.");
        continue;
      }
      return answer;
    }
  } finally {
    rl.close();
  }
}

/**
 * Prompts for yes/no; Enter uses the default.
 *
 * @param question - Prompt without trailing [y/N]
 * @param options - Default when the user presses Enter
 */
export async function promptConfirm(
  question: string,
  options?: { defaultYes?: boolean },
): Promise<boolean> {
  const defaultYes = options?.defaultYes ?? false;
  const hint = defaultYes ? "[Y/n]" : "[y/N]";
  const rl = readline.createInterface({ input, output });
  try {
    while (true) {
      const answer = (await rl.question(`${question} ${hint}: `)).trim();
      if (!answer) {
        return defaultYes;
      }
      if (/^y(es)?$/i.test(answer)) {
        return true;
      }
      if (/^n(o)?$/i.test(answer)) {
        return false;
      }
      console.log("  Enter y or n (or press Enter for the default).");
    }
  } finally {
    rl.close();
  }
}

/**
 * Masks a secret for confirmation output (first 7 + last 4 chars).
 *
 * @param value - Secret string
 */
export function maskSecret(value: string): string {
  if (value.length <= 12) {
    return "…";
  }
  return `${value.slice(0, 7)}…${value.slice(-4)}`;
}
