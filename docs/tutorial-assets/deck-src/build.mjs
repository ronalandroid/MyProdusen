// Builds docs/tutorial-assets/MyProdusen-Panduan-Penggunaan.pdf from the slide
// sources in this folder. Run from the repo root:
//   node docs/tutorial-assets/deck-src/prep-fonts.mjs   (once, downloads fonts/)
//   node docs/tutorial-assets/deck-src/build.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const SRC = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.resolve(SRC, "..");
const read = (f) => fs.readFileSync(path.join(SRC, f), "utf8");

// Slide markup references shots/<file>.png — expose the screenshot set there.
const shotsDir = path.join(SRC, "shots");
fs.mkdirSync(shotsDir, { recursive: true });
for (const f of fs.readdirSync(ASSETS).filter((f) => f.endsWith(".png"))) {
  fs.copyFileSync(path.join(ASSETS, f), path.join(shotsDir, f));
}

let html = `<!doctype html>
<html lang="id"><head><meta charset="utf-8">
<title>Panduan Lengkap MyProdusen</title>
<style>${read("fonts/fonts-local.css")}</style>
<style>${read("style.css")}</style>
</head><body>
${read("slides-a.html")}
${read("slides-b.html")}
</body></html>`;

// Progress rail: a top strip on every slide showing position in the deck.
const totalSlides = (html.match(/<section class="slide">/g) || []).length;
let slideNo = 0;
html = html.replace(/<section class="slide">/g, () => {
  slideNo += 1;
  const w = ((slideNo / totalSlides) * 100).toFixed(1);
  return `<section class="slide"><div class="rail"><i style="width:${w}%"></i></div>`;
});
fs.writeFileSync(path.join(SRC, "index.html"), html);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto("file://" + path.join(SRC, "index.html"));
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);
await page.pdf({
  path: path.join(ASSETS, "MyProdusen-Panduan-Penggunaan.pdf"),
  width: "1920px",
  height: "1080px",
  printBackground: true,
});
await browser.close();
console.log("PDF written to docs/tutorial-assets/MyProdusen-Panduan-Penggunaan.pdf");
