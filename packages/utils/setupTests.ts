import { setupMatchMedia } from "@repo/test-utils";
import "@testing-library/jest-dom/vitest";
import { ensureLocalStoragePolyfill } from "./src/storage";

ensureLocalStoragePolyfill();
setupMatchMedia();
