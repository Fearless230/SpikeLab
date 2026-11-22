#!/usr/bin/env node
/* release.mjs: run before every publish (no install needed, plain Node 18+).
     node tools/release.mjs                      bump the offline-cache VERSION, rebuild the CORE file list, update the CSP hash
     node tools/release.mjs --site https://you.github.io/repo/   also make the share-preview image address absolute
     node tools/release.mjs --check              change nothing; fail if anything is out of date (used by CI)
   What it keeps in step:
     sw.js        VERSION (so phones pick up new files) and CORE (every file the app needs offline)
     index.html   the sha256 of the inline theme script in the Content-Security-Policy, and og:image / og:url */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const check = args.includes("--check");
const siteArg = args.includes("--site") ? args[args.indexOf("--site") + 1] : null;
const problems = [];
const read = f => readFileSync(join(root, f), "utf8");

/* 1. every file the app ships, for the offline cache */
const walk = d => readdirSync(join(root, d)).flatMap(n => {
  const p = d + "/" + n;
  if (n.startsWith(".") || /^(LICENSE|README)/i.test(n)) return [];
  return statSync(join(root, p)).isDirectory() ? walk(p) : [p];
});
/* the pose model, MediaPipe and other big files are cached on first use instead (see IMMUTABLE in sw.js) */
const shipped = ["js", "css", "img", "fonts"].flatMap(walk).filter(f => /\.(js|css|png|webp|jpg|svg|woff2?)$/.test(f) && !f.startsWith("js/vendor/mediapipe/"));
const core = ["./", "index.html", "manifest.webmanifest", ...shipped.sort()];

/* 2. files index.html points at must exist */
let html = read("index.html");
for (const m of html.matchAll(/(?:src|href)="(?!https?:|#|data:|mailto:)([^"]+)"/g)) {
  const f = m[1].split(/[?#]/)[0];
  if (f && !f.startsWith("./#") && f !== "./" && !existsSync(join(root, f))) problems.push(`index.html points at a missing file: ${f}`);
}

/* 3. CSP hash of the inline script(s) */
const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => "'sha256-" + createHash("sha256").update(m[1]).digest("base64") + "'");
const cspNow = (html.match(/http-equiv="Content-Security-Policy" content="([^"]*)"/) || [])[1];
if (!cspNow) problems.push("index.html has no Content-Security-Policy meta tag");
else {
  const cspNew = cspNow.replace(/(script-src 'self')(?: 'sha256-[^']*')*/, `$1 ${inline.join(" ")}`);
  if (cspNew !== cspNow) { if (check) problems.push("the CSP hash for the inline script is out of date"); html = html.replace(cspNow, cspNew); }
}

/* 4. absolute share-preview addresses */
if (siteArg) {
  const site = siteArg.endsWith("/") ? siteArg : siteArg + "/";
  html = html.replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${site}img/og.png">`);
  if (/<meta property="og:url"/.test(html)) html = html.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${site}">`);
  else html = html.replace(/(<meta property="og:type"[^>]*>)/, `$1\n<meta property="og:url" content="${site}">`);
} else if (!/property="og:image" content="https:/.test(html)) {
  console.log("note: og:image is a relative address. Run with --site <your published address> so link previews show the image.");
}

/* 5. sw.js: VERSION and CORE */
let sw = read("sw.js");
const coreNow = JSON.parse((sw.match(/const CORE=(\[[^\]]*\]);/) || [, "[]"])[1]);
const coreChanged = JSON.stringify(coreNow) !== JSON.stringify(core);
if (check) {
  if (coreChanged) {
    const add = core.filter(f => !coreNow.includes(f)), gone = coreNow.filter(f => !core.includes(f));
    problems.push(`sw.js CORE is out of date${add.length ? "; missing: " + add.join(", ") : ""}${gone.length ? "; no longer exists: " + gone.join(", ") : ""}`);
  }
} else {
  sw = sw.replace(/const CORE=\[[^\]]*\];/, "const CORE=" + JSON.stringify(core).replace(/","/g, '", "') + ";");
  sw = sw.replace(/const VERSION="([^"]*?)(\d+)";/, (_, pre, n) => `const VERSION="${pre}${+n + 1}";`);
  writeFileSync(join(root, "sw.js"), sw);
  writeFileSync(join(root, "index.html"), html);
  console.log("sw.js " + (sw.match(/const VERSION="([^"]*)"/) || [])[1] + ", " + core.length + " files cached offline. CSP hash updated.");
}

if (problems.length) { console.error(problems.map(p => "✗ " + p).join("\n")); process.exit(1); }
if (check) console.log("✓ release files are up to date");
