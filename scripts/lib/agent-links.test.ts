import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  ensureAgentLinks,
  ensureClaudeMdLink,
  ensureClaudeSkillsLink,
  ensureGitSymlinksEnabled,
  isSymlinkTo,
} from "./agent-links";

describe("agent-links", () => {
  let root = "";

  afterEach(() => {
    if (root) {
      rmSync(root, { recursive: true, force: true });
      root = "";
    }
  });

  it("creates shared skills symlink idempotently", () => {
    root = mkdtempSync(join(tmpdir(), "reactor-agent-links-"));
    ensureClaudeSkillsLink(root);
    ensureClaudeSkillsLink(root);
    expect(isSymlinkTo(join(root, ".claude/skills"), join(root, ".agents/skills"))).toBe(true);
  });

  it("replaces a real .claude/skills directory with the shared symlink", () => {
    root = mkdtempSync(join(tmpdir(), "reactor-agent-links-"));
    const claudeSkills = join(root, ".claude/skills");
    mkdirSync(claudeSkills, { recursive: true });
    writeFileSync(join(claudeSkills, "stale.txt"), "remove me");
    ensureClaudeSkillsLink(root);
    expect(isSymlinkTo(claudeSkills, join(root, ".agents/skills"))).toBe(true);
  });

  it("creates CLAUDE.md symlink to AGENTS.md", () => {
    root = mkdtempSync(join(tmpdir(), "reactor-agent-links-"));
    writeFileSync(join(root, "AGENTS.md"), "# AGENTS\n");
    writeFileSync(join(root, "CLAUDE.md"), "# duplicate\n");
    ensureClaudeMdLink(root);
    expect(isSymlinkTo(join(root, "CLAUDE.md"), join(root, "AGENTS.md"))).toBe(true);
  });

  it("ensureGitSymlinksEnabled is a no-op outside a git repo", () => {
    root = mkdtempSync(join(tmpdir(), "reactor-agent-links-"));
    expect(() => ensureGitSymlinksEnabled(root)).not.toThrow();
  });

  it("ensureAgentLinks wires skills and CLAUDE.md symlinks", () => {
    root = mkdtempSync(join(tmpdir(), "reactor-agent-links-"));
    writeFileSync(join(root, "AGENTS.md"), "# AGENTS\n");
    ensureAgentLinks(root);
    expect(isSymlinkTo(join(root, ".claude/skills"), join(root, ".agents/skills"))).toBe(true);
    expect(isSymlinkTo(join(root, "CLAUDE.md"), join(root, "AGENTS.md"))).toBe(true);
  });
});
