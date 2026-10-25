// node tools/still.mjs --dir videos/<name> --times 0.5,2.2,5.1 [--w 1920 --h 1080]  -> videos/<name>/out/still_<t>.png
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, extname, resolve, relative } from 'node:path';
const a = process.argv, g = (k, d) => { const i = a.indexOf('--' + k); return i > 0 ? a[i + 1] : d; };
const DIR = g('dir'), W = +g('w', 1920), H = +g('h', 1080), TIMES = g('times').split(',').map(Number);
const ROOT = resolve(import.meta.dirname, '..');
const T = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.json': 'application/json' };
const srv = createServer((q, r) => { const f = resolve(ROOT, '.' + decodeURIComponent(new URL(q.url, 'http://x').pathname)); if (relative(ROOT, f).startsWith('..') || !existsSync(f)) { r.writeHead(404).end(); return; } r.writeHead(200, { 'content-type': T[extname(f)] || 'application/octet-stream' }); r.end(readFileSync(f)); }).listen(0, '127.0.0.1');
await new Promise((r) => srv.once('listening', r));
const b = await chromium.launch(), p = await b.newPage({ viewport: { width: W, height: H } });
p.on('pageerror', (e) => console.error('page error:', e.message));
p.on('console', (m) => { if (m.type() === 'error') console.error(m.text()); });
await p.goto(`http://127.0.0.1:${srv.address().port}/${DIR}/index.html?w=${W}&h=${H}&render=1`);
await p.evaluate(() => document.fonts.ready); await p.waitForFunction(() => typeof window.seek === 'function'); await p.evaluate(() => window.ready);
mkdirSync(join(ROOT, DIR, 'out'), { recursive: true });
for (const t of TIMES) { await p.evaluate((t) => window.seek(t), t); await p.screenshot({ path: join(ROOT, DIR, 'out', `still_${t}.png`) }); }
await b.close(); srv.close();
