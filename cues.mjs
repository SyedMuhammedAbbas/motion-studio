// node cues.mjs --dir videos/<name>  -> writes <dir>/docs/cues.json from the page's window.cues (SFX timing)
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join, resolve, relative, extname } from 'node:path';

const i = process.argv.indexOf('--dir'), DIR = i > 0 ? process.argv[i + 1] : '.';
const ROOT = resolve(import.meta.dirname);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf', '.jpg': 'image/jpeg' };
const server = createServer((req, res) => {
  const file = resolve(ROOT, '.' + decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (relative(ROOT, file).startsWith('..') || !existsSync(file)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream' });
  res.end(readFileSync(file));
}).listen(0, '127.0.0.1');
await new Promise((r) => server.once('listening', r));
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`http://127.0.0.1:${server.address().port}/${DIR.replace(/\\/g, '/')}/index.html?w=540&h=960`);
await page.waitForFunction(() => Array.isArray(window.cues));
const cues = (await page.evaluate(() => window.cues)).sort((a, b) => a.t - b.t);
writeFileSync(join(ROOT, DIR, 'docs/cues.json'), JSON.stringify(cues, null, 0));
await browser.close(); server.close();
console.log(`${cues.length} cues`);
