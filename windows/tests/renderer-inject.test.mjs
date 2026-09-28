import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const windowsRoot = path.resolve(here, "..");
const repositoryRoot = path.resolve(windowsRoot, "..");

const [windowsTemplate, macosTemplate, windowsCss, macosCss, windowsMiku, macosMiku] =
  await Promise.all([
    fs.readFile(path.join(windowsRoot, "assets", "renderer-inject.js"), "utf8"),
    fs.readFile(path.join(repositoryRoot, "macos", "assets", "renderer-inject.js"), "utf8"),
    fs.readFile(path.join(windowsRoot, "assets", "dream-skin.css"), "utf8"),
    fs.readFile(path.join(repositoryRoot, "macos", "assets", "dream-skin.css"), "utf8"),
    fs.readFile(path.join(windowsRoot, "themes", "miku-dream-skin", "theme.json"), "utf8"),
    fs.readFile(
      path.join(repositoryRoot, "macos", "themes", "miku-dream-skin", "theme.json"),
      "utf8",
    ),
  ]);

assert.equal(
  windowsTemplate,
  macosTemplate,
  "Windows and macOS must ship the same renderer behavior.",
);
assert.equal(windowsCss, macosCss, "Windows and macOS must ship the same theme stylesheet.");
assert.equal(windowsMiku, macosMiku, "Bundled Miku manifests must remain identical across platforms.");
const miku = JSON.parse(windowsMiku);
assert.equal(miku.appearance, "auto", "The bundled Hatsune Miku theme must follow system appearance.");
assert.ok(miku.colorsLight, "The bundled Hatsune Miku theme must provide a light palette.");
assert.ok(miku.colorsDark, "The bundled Hatsune Miku theme must provide a dark palette.");

assert.match(
  windowsTemplate,
  /THEME\.appearance === "light" \|\| THEME\.appearance === "dark"/,
  "The Windows renderer must honor a theme's forced appearance.",
);
assert.match(
  windowsTemplate,
  /dream-skin-settings-sidebar[\s\S]{0,600}dream-skin-settings-shell/,
  "The Windows renderer must style settings navigation and content.",
);
assert.match(
  windowsCss,
  /data-dream-shell="light"[\s\S]{0,2200}--color-token-text-primary:\s*var\(--ds-text\)/,
  "Windows light themes must remap native Codex text tokens.",
);
assert.match(
  windowsCss,
  /main\.main-surface:not\(\.dream-skin-home-shell\)[\s\S]{0,500}var\(--dream-skin-art\) 72% center \/ cover no-repeat/,
  "Windows chat and utility routes must keep the full-cover background.",
);
assert.match(
  windowsTemplate,
  /data-app-shell-main-surface/,
  "The renderer must recognize the current Codex main surface marker.",
);
assert.match(
  windowsTemplate,
  /data-codex-composer-root[\s\S]{0,900}composer-surface-chrome/,
  "The renderer must bridge the current native composer to the shared skin CSS.",
);
assert.match(
  windowsTemplate,
  /data-composer-placement[\s\S]{0,240}home-composer-layout/,
  "The renderer must identify the current home composer layout.",
);
assert.match(
  windowsTemplate,
  /removeCompatibilityClasses[\s\S]{0,500}COMPAT_MAIN_ATTR/,
  "Renderer cleanup must remove only compatibility classes it added.",
);

console.log("PASS: Windows renderer and theme resources match the verified macOS implementation.");
