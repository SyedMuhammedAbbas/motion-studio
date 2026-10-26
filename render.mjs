// node render.mjs --dir videos/<name> [--start 0] [--fps 60] [--dur 15] [--sub 4] [--w 1080] [--h 1920] [--out silent.mp4]
// Serves the studio root over http (ES modules don't load from file://), opens <dir>/index.html,
// calls window.seek(t) per subframe, screenshots #c and pipes PNGs into ffmpeg (sub-frames blended = motion blur).
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join, extname, resolve, relative } from 'node:path';

const argv = process.argv;
const str = (k, d) => { const i = argv.indexOf('--' + k); return i > 0 ? argv[i + 1] : d; };
const num = (k, d) => Number(str(k, d));
const DIR = str('dir', '.'), START = num('start', 0), FPS = num('fps', 60), DUR = num('dur', 15), SUB = num('sub', 4);
const W = num('w', 1080), H = num('h', 1920), OUT = str('out', 'silent.mp4');
const ROOT = resolve(import.meta.dirname);
if (!existsSync(join(ROOT, DIR, 'index.html'))) throw new Error(`no index.html in ${DIR}`);

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
  '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf' };
const server = createServer((req, res) => {
  const file = resolve(ROOT, '.' + decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (relative(ROOT, file).startsWith('..') || !existsSync(file)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream' });
  res.end(readFileSync(file));
}).listen(0, '127.0.0.1');
await new Promise((r) => server.once('listening', r));
const base = `http://127.0.0.1:${server.address().port}`;

const outDir = join(ROOT, DIR, 'out');
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => { console.error('page error:', e.message); process.exitCode = 1; });
await page.goto(`${base}/${DIR.replace(/\\/g, '/')}/index.html?w=${W}&h=${H}&render=1`);
// Canvas films draw on #c; DOM/CSS pages (recipes) are captured as the whole viewport.
const shot = (await page.$('#c')) ? page.locator('#c') : page;
await page.evaluate(() => document.fonts.ready);
await page.waitForFunction(() => typeof window.seek === 'function');
await page.evaluate(() => window.ready); // optional promise the page sets while loading images/assets

const vf = `tmix=frames=${SUB},select='eq(mod(n\\,${SUB})\\,${SUB - 1})',setpts=N/${FPS}/TB`;
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS * SUB), '-i', '-',
  '-vf', vf, '-r', String(FPS), '-c:v', 'libx264', '-crf', '16', '-pix_fmt', 'yuv420p', join(outDir, OUT)],
  { stdio: ['pipe', 'inherit', 'inherit'] });

// Sub-frame blur must not blend across a hard cut (it leaves a one-frame ghost of both shots).
// A page lists its cut times in window.hardCuts; a frame whose sub-frames straddle one renders all of them after the cut.
const hardCuts = await page.evaluate(() => window.hardCuts || []);
// Optional window.motion(t0, t1): max on-screen travel in px during one frame's shutter. A frame under 1 px is
// captured once and repeated SUB times (same result after blending, SUB times faster on holds).
const hasMotion = await page.evaluate(() => typeof window.motion === 'function');
const total = Math.round(DUR * FPS * SUB);
for (let i = 0; i < total; i++) {
  let t = START + i / (FPS * SUB);
  const k = Math.floor(i / SUB), f0 = START + (k * SUB) / (FPS * SUB), f1 = START + (k * SUB + SUB - 1) / (FPS * SUB);
  const c = hardCuts.find((c) => c > f0 && c <= f1);
  if (c !== undefined && t < c) t = f1;
  if (hasMotion && SUB > 1 && i % SUB === 0 && (await page.evaluate(([a, b]) => window.motion(a, b), [f0, f1])) < 1) {
    await page.evaluate((t) => window.seek(t), f1);
    const png = await shot.screenshot({ type: 'png' });
    for (let s = 0; s < SUB; s++) if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % (FPS * SUB) === 0) console.log(`rendered ${i / (FPS * SUB)}s / ${DUR}s`);
    i += SUB - 1;
    continue;
  }
  await page.evaluate((t) => window.seek(t), t);
  const png = await shot.screenshot({ type: 'png' });
  if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
  if (i % (FPS * SUB) === 0) console.log(`rendered ${i / (FPS * SUB)}s / ${DUR}s`);
}
ff.stdin.end();
const code = await new Promise((r) => ff.on('close', r));
await browser.close();
server.close();
if (code !== 0) throw new Error(`ffmpeg exited ${code}`);
console.log(`wrote ${join(DIR, 'out', OUT)}`);
