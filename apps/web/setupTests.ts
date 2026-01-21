// Vitest setup for web workspace
// Adds jest-dom matchers and shared test utilities
import "@testing-library/jest-dom/vitest";
import { setupMatchMedia } from "@repo/test-utils";

// Mock matchMedia for theme tests
setupMatchMedia();
