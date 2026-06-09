import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  applyLicenseFromConfig,
  applyProprietaryLicense,
  isMitLicense,
  renderProprietaryLicense,
  shouldOfferLicenseRemoval,
} from "./license-identity";
import type { GitHubRepo } from "./repo-identity";

const upstream: GitHubRepo = {
  org: "PeterHewat",
  repo: "Reactor",
  repoUrl: "https://github.com/PeterHewat/Reactor",
};

const fork: GitHubRepo = {
  org: "acme",
  repo: "my-app",
  repoUrl: "https://github.com/acme/my-app",
};

describe("shouldOfferLicenseRemoval", () => {
  test("offers for forks and missing remote", () => {
    expect(shouldOfferLicenseRemoval(null)).toBe(true);
    expect(shouldOfferLicenseRemoval(fork)).toBe(true);
  });

  test("skips upstream template remote", () => {
    expect(shouldOfferLicenseRemoval(upstream)).toBe(false);
  });
});

describe("isMitLicense", () => {
  test("detects MIT marker", () => {
    expect(isMitLicense("MIT License\n\nCopyright")).toBe(true);
    expect(isMitLicense("All rights reserved.")).toBe(false);
  });
});

describe("renderProprietaryLicense", () => {
  test("substitutes placeholders", () => {
    const rendered = renderProprietaryLicense(
      "Copyright (c) {{year}} {{copyrightHolder}}\nAll rights reserved.",
      "Acme Inc",
    );
    expect(rendered).toContain("Acme Inc");
    expect(rendered).toMatch(/Copyright \(c\) \d{4} Acme Inc/);
  });
});

describe("applyProprietaryLicense", () => {
  let root = "";

  afterEach(() => {
    if (root) {
      rmSync(root, { recursive: true, force: true });
      root = "";
    }
  });

  test("overwrites LICENSE and package.json license", () => {
    root = mkdtempSync(join(tmpdir(), "reactor-license-"));
    mkdirSync(join(root, ".reactor"), { recursive: true });
    writeFileSync(
      join(root, ".reactor/LICENSE.proprietary.template"),
      "Copyright (c) {{year}} {{copyrightHolder}}\nAll rights reserved.\n",
    );
    writeFileSync(join(root, "LICENSE"), "MIT License\n");
    writeFileSync(
      join(root, "package.json"),
      `${JSON.stringify({ name: "app", license: "MIT" }, null, 2)}\n`,
    );

    expect(applyProprietaryLicense(root, "Acme")).toBe(true);
    expect(readFileSync(join(root, "LICENSE"), "utf8")).toContain("All rights reserved.");
    expect(JSON.parse(readFileSync(join(root, "package.json"), "utf8")).license).toBe("UNLICENSED");

    expect(applyProprietaryLicense(root, "Acme")).toBe(false);
  });

  test("returns false when template is missing", () => {
    root = mkdtempSync(join(tmpdir(), "reactor-license-"));
    expect(applyProprietaryLicense(root, "Acme")).toBe(false);
    expect(existsSync(join(root, "LICENSE"))).toBe(false);
  });
});

describe("applyLicenseFromConfig", () => {
  let root = "";

  afterEach(() => {
    if (root) {
      rmSync(root, { recursive: true, force: true });
      root = "";
    }
  });

  test("skips upstream template remote", () => {
    root = mkdtempSync(join(tmpdir(), "reactor-license-"));
    mkdirSync(join(root, ".reactor"), { recursive: true });
    writeFileSync(
      join(root, ".reactor/LICENSE.proprietary.template"),
      "Copyright (c) {{year}} {{copyrightHolder}}\n",
    );
    writeFileSync(join(root, "LICENSE"), "MIT License\n");

    expect(
      applyLicenseFromConfig(
        root,
        {
          productName: "Reactor",
          github: { org: "PeterHewat", repo: "Reactor" },
          removeMitLicense: true,
        },
        upstream,
      ),
    ).toBe(false);
    expect(readFileSync(join(root, "LICENSE"), "utf8")).toContain("MIT License");
  });
});
