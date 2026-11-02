/* Exports the "How Nucleux works" scenes to ../../Nucleux video/exports/:
     how-<scene>.mp4          one silent H.264 MP4 per scene (1280×960, 30 fps)
     how-<scene>-poster.png   its finished frame
     how-nucleux-works.mp4    the three scenes back to back, for sharing
   Every frame is captured from pg-preview/how-scene.html, i.e. the real
   @nucleux/react components, drawn at an exact time (the scenes are pure
   functions of t), then encoded in Chrome with WebCodecs + mp4-muxer.

   Needs the site served (e.g. the library-v03-serve launch config) and Chrome:
     npm run build:how
     BASE=http://localhost:8012 node capture-how.mjs */
import puppeteer from "puppeteer-core";
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const BASE = process.env.BASE || "http://localhost:8012";
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = "../../Nucleux video/exports";
const W = 1280, H = 960, FPS = 30;
const HOLD = 0.6;   // seconds of the finished frame after each scene
const SCENES = ["describe", "patterns", "build"];
const require = createRequire(import.meta.url);

mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--hide-scrollbars"] });

/* the encoder page: one VideoEncoder + muxer per output file */
const enc = await browser.newPage();
await enc.goto(`${BASE}/pg-preview/how.html`);   // any same-origin page; only its JS context is used
await enc.addScriptTag({ path: require.resolve("mp4-muxer") });
const codec = await enc.evaluate(async (W, H) => {
  for (const c of ["avc1.640028", "avc1.4d0028", "avc1.42002a"]) {
    const s = await VideoEncoder.isConfigSupported({ codec: c, width: W, height: H, bitrate: 6e6, framerate: 30 });
    if (s.supported) return c;
  }
  return null;
}, W, H);
if (!codec) throw new Error("this Chrome cannot encode H.264 with WebCodecs");

await enc.evaluate((W, H, FPS, codec) => {
  window.outs = {};
  window.open_ = (name) => {
    const muxer = new Mp4Muxer.Muxer({ target: new Mp4Muxer.ArrayBufferTarget(), video: { codec: "avc", width: W, height: H, frameRate: FPS }, fastStart: "in-memory" });
    const encoder = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: (e) => { throw e; } });
    encoder.configure({ codec, width: W, height: H, bitrate: 6e6, framerate: FPS });
    window.outs[name] = { muxer, encoder, n: 0 };
  };
  window.frame_ = async (names, b64) => {
    const bmp = await createImageBitmap(await (await fetch("data:image/png;base64," + b64)).blob());
    for (const name of names) {
      const o = window.outs[name];
      const f = new VideoFrame(bmp, { timestamp: Math.round((o.n * 1e6) / FPS), duration: Math.round(1e6 / FPS) });
      o.encoder.encode(f, { keyFrame: o.n % (FPS * 2) === 0 });
      f.close();
      o.n++;
    }
    bmp.close();
  };
  window.close_ = async (name) => {
    const o = window.outs[name];
    await o.encoder.flush();
    o.muxer.finalize();
    const bytes = new Uint8Array(o.muxer.target.buffer);
    let s = "";
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(s);
  };
}, W, H, FPS, codec);

await enc.evaluate(() => window.open_("all"));
const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });

for (const id of SCENES) {
  await page.goto(`${BASE}/pg-preview/how-scene.html?scene=${id}&w=${W}&t=0`, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  const dur = await page.evaluate(() => window.__nxDur);
  await enc.evaluate((id) => window.open_(id), id);
  const frames = Math.round((dur + HOLD) * FPS);
  for (let i = 0; i <= frames; i++) {
    await page.evaluate((t) => window.__nxSeek(t), Math.min(i / FPS, dur));
    const png = await page.screenshot({ type: "png", encoding: "base64", clip: { x: 0, y: 0, width: W, height: H } });
    await enc.evaluate((names, b64) => window.frame_(names, b64), [id, "all"], png);
    if (i === frames) writeFileSync(`${OUT}/how-${id}-poster.png`, Buffer.from(png, "base64"));
  }
  writeFileSync(`${OUT}/how-${id}.mp4`, Buffer.from(await enc.evaluate((id) => window.close_(id), id), "base64"));
  console.log(`how-${id}.mp4  ${frames + 1} frames (${((frames + 1) / FPS).toFixed(1)} s)`);
}
writeFileSync(`${OUT}/how-nucleux-works.mp4`, Buffer.from(await enc.evaluate(() => window.close_("all")), "base64"));
console.log("how-nucleux-works.mp4", codec);
await browser.close();
