/* smoke.mjs: opens the app in a headless browser, goes through onboarding, and visits every screen and Toolkit tab.
   Fails if any page error or console error shows up. Supabase is blocked, so it runs fully offline.
     npm i --no-save playwright@1 && npx playwright install chromium && node tests/smoke.mjs
   Options: --no-gl (skip WebGL, much faster), --chrome /path/to/chrome, --shots <folder> (save a screenshot per screen) */
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = k => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".webp": "image/webp", ".webmanifest": "application/manifest+json", ".json": "application/json" };

const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  try { const body = await readFile(join(root, p)); res.writeHead(200, { "content-type": TYPES[extname(p)] || "application/octet-stream" }); res.end(body); }
  catch { res.writeHead(404); res.end("not found"); }
}).listen(0, "127.0.0.1");
await new Promise(r => server.on("listening", r));
const base = `http://127.0.0.1:${server.address().port}/`;

const launchArgs = args.includes("--no-gl") ? ["--disable-3d-apis"] : ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"];
const browser = await chromium.launch({ executablePath: opt("--chrome") || undefined, args: launchArgs });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: "block" });
const page = await ctx.newPage();
page.setDefaultTimeout(120000);  // software 3D on CI machines is slow
const errors = [];
let where = "load";
page.on("pageerror", e => errors.push(`[${where}] ${e.message}`));
page.on("console", m => { if (m.type() === "error" && !/supabase|Failed to load resource|net::ERR/i.test(m.text())) errors.push(`[${where}] console: ${m.text()}`); });
await page.route(/supabase\.co|fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const shots = opt("--shots");
if (shots) await mkdir(shots, { recursive: true });
const snap = async name => { if (shots) await page.screenshot({ path: join(shots, name.replace(/[^\w-]+/g, "_") + ".png") }); };

await page.goto(base, { waitUntil: "domcontentloaded" });
await page.getByRole("button", { name: /Continue without an account/ }).click();

/* onboarding */
where = "onboarding";
await page.fill("#p-name", "Smoke Test");
await page.fill("#p-age", "15");
await page.fill("#p-height-cm", "178").catch(() => {});
await page.fill("#p-weight", "68");
const next = async () => { await page.click("#wizNext"); const e = await page.$eval("#perr", el => el.hidden ? "" : el.textContent).catch(() => ""); if (e) throw new Error("Onboarding stopped: " + e); };
await next();
await page.selectOption("#p-pos", "outside");
await page.selectOption("#p-exp", { index: 2 });
await next();
await next();
await page.evaluate(() => { const g = document.querySelector('input[name="goal"]'); g.checked = true; g.dispatchEvent(new Event("change", { bubbles: true })); });
await page.click("#wizSave");
await page.waitForFunction(() => !!(window.VB && VB.state && VB.state.profile), null, { timeout: 15000 });

const views = ["today", "skills", "plan", "body", "film", "progress", "squad", "profile"];
for (const v of views) { where = v; await page.evaluate(h => { location.hash = h; }, "#" + v); await page.waitForTimeout(900); await snap(v); }

/* every Toolkit tab, read from the page so new tools are covered automatically */
where = "tools";
await page.evaluate(() => { location.hash = "#tools"; });
await page.waitForTimeout(600);
const tabs = await page.$$eval("[data-ttab]", bs => bs.map(b => b.dataset.ttab));
for (const t of tabs) {
  where = "tools/" + t;
  await page.click(`[data-ttab="${t}"]`);
  await page.waitForTimeout(500);
  await snap("tools-" + t);
  /* press the safe buttons in each tool once, to exercise its handlers */
  const btns = await page.$$("#tpanel button:not([disabled]):not([data-danger])");
  for (const b of btns.slice(0, 25)) { try { if (await b.isVisible()) await b.click({ timeout: 800 }); } catch {} }
  await page.waitForTimeout(200);
}
where = "reload";
await page.reload();
await page.waitForTimeout(1500);

await browser.close();
server.close();
console.log(`Visited ${views.length} screens and ${tabs.length} Toolkit tabs (${tabs.join(", ")}).`);
if (errors.length) { console.error("✗ " + errors.length + " error(s):\n" + [...new Set(errors)].join("\n")); process.exit(1); }
console.log("✓ no page errors");
