// Drives a Remotion bundle in Chromium (Playwright from the studio root) frame by frame, so checks can read the real
// DOM of any frame: the same handshake @remotion/renderer uses (remotion_setBundleMode, remotion_setFrame, renderReady).
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { extname, relative, resolve } from 'node:path';

const require = createRequire(resolve(import.meta.dirname, '..', '..', 'package.json'));
const { chromium } = require('playwright');

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.json': 'application/json', '.wav': 'audio/wav', '.css': 'text/css' };

export const openComposition = async ({ bundle, id, width, height, frames, fps }) => {
  const srv = createServer((q, r) => {
    const p = decodeURIComponent(new URL(q.url, 'http://x').pathname);
    const f = resolve(bundle, '.' + (p === '/' ? '/index.html' : p));
    if (relative(bundle, f).startsWith('..') || !existsSync(f)) return void r.writeHead(404).end();
    r.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' });
    r.end(readFileSync(f));
  }).listen(0, '127.0.0.1');
  await new Promise((r) => srv.once('listening', r));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    Object.assign(window, { remotion_puppeteerTimeout: 30000, remotion_isMainTab: true, remotion_mediaCacheSizeInBytes: 1e9, remotion_initialMemoryAvailable: 8e9, remotion_sampleRate: 48000,
      remotion_inputProps: '{}', remotion_initialFrame: 0, remotion_attempt: 1, remotion_proxyPort: 0, remotion_audioEnabled: false, remotion_videoEnabled: true, remotion_logLevel: 'error', remotion_envVariables: '{}' });
    window.process = { env: { NODE_ENV: 'production' } };
  });
  await page.goto(`http://127.0.0.1:${srv.address().port}/index.html`);
  await page.waitForFunction(() => typeof window.remotion_setBundleMode === 'function');
  await page.evaluate(([id, w, h, n, fps]) => window.remotion_setBundleMode({
    type: 'composition', compositionName: id, serializedResolvedPropsWithSchema: '{}', compositionDurationInFrames: n, compositionFps: fps, compositionHeight: h, compositionWidth: w,
    compositionDefaultCodec: 'h264', compositionDefaultOutName: id, compositionDefaultVideoImageFormat: 'png', compositionDefaultPixelFormat: 'yuv420p', compositionDefaultProResProfile: null, compositionDefaultSampleRate: 48000,
  }), [id, width, height, frames, fps]);
  return {
    page,
    errors,
    seek: async (f) => {
      await page.evaluate(([f, id]) => window.remotion_setFrame(f, id, 1), [f, id]);
      await page.waitForFunction(() => window.remotion_renderReady === true, null, { timeout: 30000 });
    },
    close: async () => { await browser.close(); srv.close(); },
  };
};
