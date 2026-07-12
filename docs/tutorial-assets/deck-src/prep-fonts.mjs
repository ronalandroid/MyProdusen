import fs from "node:fs";
import path from "node:path";

const dir = path.dirname(new URL(import.meta.url).pathname);
const cssPath = path.join(dir, "fonts", "fonts.css");
let css = fs.readFileSync(cssPath, "utf8");

const urls = [...new Set(css.match(/https:\/\/fonts\.gstatic\.com[^)]+/g))];
let i = 0;
for (const url of urls) {
  const name = "f" + String(i++).padStart(2, "0") + ".woff2";
  const res = await fetch(url);
  if (!res.ok) throw new Error("font fetch failed " + res.status + " " + url);
  fs.writeFileSync(path.join(dir, "fonts", name), Buffer.from(await res.arrayBuffer()));
  css = css.split(url).join("fonts/" + name);
}
fs.writeFileSync(path.join(dir, "fonts", "fonts-local.css"), css);
console.log("downloaded", urls.length, "font files; wrote fonts-local.css");
