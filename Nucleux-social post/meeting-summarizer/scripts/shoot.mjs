// Headless screenshot helper (system Google Chrome via playwright-core — no browser download).
// Usage:
//   node scripts/shoot.mjs <url> <out.png> [width=1440] [height=900] [--dark] [--reduced-motion] [--full] [--mobile] [--wait=ms]
// Or import { withPage } from "./shoot.mjs" in your own QA script:
//   await withPage({ width: 466, height: 678, mobile: true }, async (page) => { ... });
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export async function withPage(opts, fn) {
  const { width = 1440, height = 900, dark = false, reducedMotion = false, mobile = false, deviceScaleFactor = 1 } = opts ?? {};
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor,
      isMobile: mobile,
      hasTouch: mobile,
      colorScheme: dark ? "dark" : "light",
      reducedMotion: reducedMotion ? "reduce" : "no-preference",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    const result = await fn(page, { errors });
    return { result, errors };
  } finally {
    await browser.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [url, out, w = "1440", h = "900", ...flags] = process.argv.slice(2);
  if (!url || !out) { console.error("usage: node scripts/shoot.mjs <url> <out.png> [w] [h] [--dark] [--reduced-motion] [--full] [--mobile] [--wait=ms]"); process.exit(1); }
  const wait = Number((flags.find((f) => f.startsWith("--wait=")) ?? "--wait=600").split("=")[1]);
  mkdirSync(dirname(out), { recursive: true });
  const { errors } = await withPage(
    { width: +w, height: +h, dark: flags.includes("--dark"), reducedMotion: flags.includes("--reduced-motion"), mobile: flags.includes("--mobile") },
    async (page) => {
      await page.goto(url, { waitUntil: "networkidle" });
      await page.waitForTimeout(wait);
      await page.screenshot({ path: out, fullPage: flags.includes("--full") });
    },
  );
  console.log(`saved ${out}${errors.length ? `\nconsole errors:\n- ${errors.join("\n- ")}` : ""}`);
}
