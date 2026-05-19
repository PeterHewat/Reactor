import { setupMatchMedia } from "@repo/test-utils";
import "@testing-library/jest-dom/vitest";
import { getLocalStorageOrMemory } from "./src/storage";

if (typeof globalThis.localStorage === "undefined") {
  Object.defineProperty(globalThis, "localStorage", {
    value: getLocalStorageOrMemory(),
    configurable: true,
  });
}

setupMatchMedia();
