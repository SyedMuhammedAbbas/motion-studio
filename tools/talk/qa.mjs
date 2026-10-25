// Smoothness and layout QA for a reel page that exposes window.qa() -> { face, win, boxes, framing } (1080-wide layout units).
// node tools/talk/qa.mjs --dir videos/<client>/<reel> --dur <s>   (--dir: absolute or relative to the cwd, inside the studio root)
// Fails (exit 1) when: the picture sits frozen longer than --hold s (default 0.5); a text/graphic box overlaps the face; the head (face + 60% headroom) leaves the window;
// a cut changes the framing by 3-25% (too small to read as a new shot, too big to go unnoticed).
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve, relative, extname } from 'node:path';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const ROOT = resolve(import.meta.dirname, '../..');
// the page is served from the studio root, so the reel dir is rebased onto it
const DIR = relative(ROOT, resolve(arg('dir', '.'))), DUR = +arg('dur', 30), STEP = +arg('step', 0.1);
if (DIR.startsWith('..')) throw new Error(`--dir must be inside ${ROOT}`);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf', '.jpg': 'image/jpeg', '.png': 'image/png' };
const server = createServer((req, res) => {
  const file = resolve(ROOT, '.' + decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (relative(ROOT, file).startsWith('..') || !existsSync(file)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream' });
  res.end(readFileSync(file));
}).listen(0, '127.0.0.1');
await new Promise((r) => server.once('listening', r));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 540, height: 960 } });
await page.goto(`http://127.0.0.1:${server.address().port}/${DIR.replace(/\\/g, '/')}/index.html?w=540&h=960&render=1`);
await page.waitForFunction(() => typeof window.seek === 'function');
const HAS_QA = await page.evaluate(() => typeof window.qa === 'function'); // older reels have no qa(): only the frozen-picture check runs
await page.evaluate(() => window.ready);
const cuts = JSON.parse(readFileSync(join(ROOT, DIR, 'docs/cuts.json'), 'utf8')).map((c) => c.t).filter((t) => t > 0);

const overlap = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const problems = [];
const at = async (t) => { await page.evaluate((t) => window.seek(t), t); return HAS_QA ? page.evaluate(() => window.qa()) : null; };
for (let t = 0; t < DUR; t += STEP) {
  const q = await at(t);
  if (!q) continue;
  const f = q.face, pad = f.w * 0.1;
  const faceX = { x: f.x - pad, y: f.y - pad, w: f.w + 2 * pad, h: f.h + 2 * pad };
  for (const b of q.boxes) if (overlap(faceX, b)) problems.push(`${t.toFixed(1)}s text/graphic box over the face`);
  const head = { x: f.x, y: f.y - 0.6 * f.h, w: f.w, h: f.h * 1.6 };
  if (head.x < q.win.x || head.y < q.win.y || head.x + head.w > q.win.x + q.win.w || head.y + head.h > q.win.y + q.win.h)
    problems.push(`${t.toFixed(1)}s head not fully inside the window`);
}
// any instant framing change, cut or not (a push-in mid-shot is a cut too)
let prev = null;
for (let t = 0; HAS_QA && t < DUR; t += 1 / 30) {
  const fr = (await at(t)).framing;
  if (prev) {
    const d = Math.max(Math.abs(fr.zoom - prev.zoom) / Math.max(fr.zoom, prev.zoom), Math.abs(fr.cx - prev.cx) / (1080 / prev.zoom));
    if (d > 0.03 && d < 0.25 && !cuts.some((c) => Math.abs(c - t) < 0.05)) problems.push(`${t.toFixed(2)}s framing jumps ${(d * 100).toFixed(1)}% mid-shot (glitch zone 3-25%)`);
  }
  prev = fr;
}
// frozen picture: consecutive 30 fps frames with no pixel change for longer than --hold seconds (a talking reel should never sit still)
const HOLD = +arg('hold', 0.5);
let last = null, runStart = 0;
const flush = (t) => { if (last && t - runStart > HOLD) problems.push(`${runStart.toFixed(2)}s picture frozen for ${(t - runStart).toFixed(2)}s (limit ${HOLD}s)`); };
for (let t = 0; t < DUR; t += 1 / 30) {
  await page.evaluate((t) => window.seek(t), t);
  const px = await page.evaluate(() => {
    const c = document.getElementById('c'), o = document.createElement('canvas');
    o.width = 54; o.height = 96;
    const x = o.getContext('2d'); x.drawImage(c, 0, 0, 54, 96);
    return Array.from(x.getImageData(0, 0, 54, 96).data);
  });
  const diff = last ? px.reduce((s, v, i) => s + Math.abs(v - last[i]), 0) / px.length : 99;
  if (diff > 0.3) { flush(t); runStart = t; }
  last = px;
}
flush(DUR);
const cutReport = [];
for (const c of HAS_QA ? cuts : []) {
  const a = (await at(c - 0.05)).framing, b = (await at(c + 0.05)).framing;
  const d = Math.max(Math.abs(b.zoom - a.zoom) / Math.max(a.zoom, b.zoom), Math.abs(b.cx - a.cx) / (1080 / a.zoom));
  cutReport.push(`${c.toFixed(2)}s ${(d * 100).toFixed(1)}%`);
  if (d > 0.03 && d < 0.25) problems.push(`${c.toFixed(2)}s cut changes framing by ${(d * 100).toFixed(1)}% (glitch zone 3-25%)`);
}
const gaps = cuts.map((c, i) => c - (i ? cuts[i - 1] : 0));
console.log(`cuts: ${cuts.length} in ${DUR}s, shortest shot ${Math.min(...gaps).toFixed(2)}s; framing change per cut: ${cutReport.join(', ')}`);
const uniq = [...new Set(problems)];
console.log(uniq.length ? `FAIL ${uniq.length}:\n` + uniq.slice(0, 40).join('\n') : 'PASS: no text over the face, head always in frame, no glitch-size framing changes');
await browser.close(); server.close();
process.exitCode = uniq.length ? 1 : 0;
