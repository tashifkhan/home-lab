import { readFile, readdir, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { families, MATERIAL_SEEDS } from "./tokens.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, "dist");

const hex = (value) => {
  const match = /^#([0-9a-f]{6})$/i.exec((value || "").trim());
  if (!match) return null;
  const n = parseInt(match[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const lin = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

function contrast(a, b) {
  const ca = hex(a);
  const cb = hex(b);
  if (!ca || !cb) return null;
  const la = 0.2126 * lin(ca[0]) + 0.7152 * lin(ca[1]) + 0.0722 * lin(ca[2]);
  const lb = 0.2126 * lin(cb[0]) + 0.7152 * lin(cb[1]) + 0.0722 * lin(cb[2]);
  const light = Math.max(la, lb);
  const dark = Math.min(la, lb);
  return (light + 0.05) / (dark + 0.05);
}

function varsFrom(css) {
  const out = {};
  for (const match of css.matchAll(/--([\w-]+):\s*([^;]+);/g)) out[match[1]] = match[2].trim();
  return out;
}

const expected = [];
for (const key of ["taf", "dump", "sleeck", "simple", "bubblegum", "sketch"]) {
  for (const mode of ["light", "dark"]) expected.push(`${families[key].slug}-${mode}`);
}
for (const seed of MATERIAL_SEEDS) {
  for (const mode of ["light", "dark"]) expected.push(`material-${seed.slug}-${mode}`);
}

const failures = [];
const warnings = [];
const files = (await readdir(join(dist, "css"))).filter((f) => f.startsWith("theme-") && f.endsWith(".css"));
if (files.length !== expected.length) failures.push(`expected ${expected.length} themes, found ${files.length}`);

for (const slug of expected) {
  const path = join(dist, "css", `theme-${slug}.css`);
  let css;
  try {
    css = await readFile(path, "utf8");
  } catch {
    failures.push(`${slug}: missing theme file`);
    continue;
  }

  const size = (await stat(path)).size;
  if (size > 45 * 1024) warnings.push(`${slug}: ${(size / 1024).toFixed(1)} KB`);

  for (const needle of [
    './theme-forgejo-',
    '../themes/fonts.css',
    '../themes/base.css',
    '../themes/chrome.css',
    '../themes/chroma.css',
  ]) {
    if (!css.includes(needle)) failures.push(`${slug}: missing import ${needle}`);
  }

  const vars = varsFrom(css);
  for (const key of [
    "paper",
    "surface",
    "surface-2",
    "ink",
    "muted",
    "line",
    "accent",
    "on-accent",
    "highlight",
    "on-highlight",
    "code-bg",
    "radius-card",
    "font-ui",
    "font-mono",
  ]) {
    if (!vars[key]) failures.push(`${slug}: missing --${key}`);
  }

  const pairs = [
    ["ink/paper", vars.ink, vars.paper, 4.5],
    ["on-accent/accent", vars["on-accent"], vars.accent, 4.5],
    ["muted/paper", vars.muted, vars.paper, 4.5],
    ["on-highlight/highlight", vars["on-highlight"], vars.highlight, 4.5],
    ["accent/paper", vars.accent, vars.paper, 3],
  ];
  for (const [label, a, b, min] of pairs) {
    const ratio = contrast(a, b);
    if (ratio === null) {
      failures.push(`${slug}: ${label} is not a 6-digit hex (${a} / ${b})`);
    } else if (ratio < min) {
      failures.push(`${slug}: ${label} ${ratio.toFixed(2)} < ${min}`);
    }
  }
}

for (const warning of warnings) console.warn(`warn: ${warning}`);
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`ok: ${expected.length} themes, contrast and imports pass`);
