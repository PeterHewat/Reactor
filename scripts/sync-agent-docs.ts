#!/usr/bin/env bun
/* eslint-disable no-console -- CLI output */
/**
 * Copies shared rules from AGENTS.md into CLAUDE.md when CLAUDE.md is a separate file.
 * When `CLAUDE.md` is a symlink to `AGENTS.md`, there is nothing to sync.
 */
import { existsSync, lstatSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const agentsPath = resolve(root, "AGENTS.md");
const claudePath = resolve(root, "CLAUDE.md");

const START = "<!-- convex-ai-start -->";
const END = "<!-- convex-ai-end -->";

/**
 * Extracts a marked section from markdown.
 */
function extractBlock(text: string, start: string, end: string): string {
  const startIdx = text.indexOf(start);
  const endIdx = text.indexOf(end);
  if (startIdx === -1 || endIdx === -1) {
    throw new Error(`Missing markers ${start} / ${end}`);
  }
  return text.slice(startIdx, endIdx + end.length);
}

if (existsSync(claudePath) && lstatSync(claudePath).isSymbolicLink()) {
  console.log("○ CLAUDE.md is a symlink to AGENTS.md — nothing to sync");
  process.exit(0);
}

const agents = readFileSync(agentsPath, "utf8");
const claude = readFileSync(claudePath, "utf8");

const agentsHead = agents.slice(0, agents.indexOf(START)).trimEnd();
const claudeConvex = extractBlock(claude, START, END);
const next = `${agentsHead}\n\n${claudeConvex}\n`;

if (next === claude) {
  console.log("○ CLAUDE.md already in sync with AGENTS.md");
  process.exit(0);
}

writeFileSync(claudePath, next);
console.log("✓ CLAUDE.md updated from AGENTS.md (Convex block preserved from CLAUDE.md)");
