/* eslint-disable no-console -- CLI prompts */
import * as readline from "node:readline";
import * as readlinePromises from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

/**
 * Returns whether secret prompts can use muted TTY input (hide echo + clear line).
 */
export function isInteractivePrompt(): boolean {
  return Boolean(input.isTTY && output.isTTY);
}

/**
 * Erases the previous terminal line (prompt + hidden input) from the display.
 */
export function erasePreviousPromptLine(): void {
  output.write("\x1b[1A\r\x1b[2K");
}

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
  const rl = readlinePromises.createInterface({ input, output });
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
  const rl = readlinePromises.createInterface({ input, output });
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
 * Prompts for a secret on stdin without echoing input or leaving the value on screen.
 * Falls back to {@link promptLine} when stdin/stdout are not a TTY (CI, pipes).
 *
 * @param question - Prompt label (without trailing colon)
 * @param options - Default value and whether empty input is allowed
 */
export async function promptSecret(
  question: string,
  options?: {
    defaultValue?: string;
    displayDefault?: string;
    required?: boolean;
    /** One-line context printed above the prompt (where to find the value). */
    hint?: string;
  },
): Promise<string> {
  if (!isInteractivePrompt()) {
    return promptLine(question, options);
  }

  const rl = readline.createInterface({ input, output, terminal: true });
  type MutedInterface = readline.Interface & { _writeToOutput: (chunk: string) => void };
  const muted = rl as MutedInterface;
  muted._writeToOutput = (chunk: string) => {
    if (chunk.includes("\n") || chunk.includes("\r")) {
      output.write(chunk);
    }
  };

  try {
    while (true) {
      const shown = options?.displayDefault ?? options?.defaultValue;
      const suffix = shown ? ` [${shown}]` : "";
      if (options?.hint) {
        console.log(`  ${options.hint}`);
      }
      output.write(`\n${question}${suffix}: `);
      const answer = await new Promise<string>((resolve) => {
        rl.question("", resolve);
      });
      erasePreviousPromptLine();
      const trimmed = answer.trim();
      if (!trimmed && options?.defaultValue !== undefined) {
        return options.defaultValue;
      }
      if (!trimmed && options?.required) {
        console.log("  Required — enter a value.");
        continue;
      }
      return trimmed;
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
