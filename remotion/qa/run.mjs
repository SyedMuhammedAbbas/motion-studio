// Automated QA for a Remotion film driven by a scene config (scenes.json + words.json beside it).
//   node qa/run.mjs --config src/videos/<video>/scenes.json --out <dir> \
//     --comp <id-16x9> --video <16x9.mp4> [--comp <id-9x16> --video <9x16.mp4>] [--fault <name>]
// Checks, each printed with its reasons, then one PASS or FAIL:
//   config     no gaps or overlaps, light pool and object continue across every join, paper/dark switches only on a
//              hard cut, each scene starts on its word
//   stills     representative stills per scene plus the start, middle and end of every join, tiled into a contact sheet
//   bounds     every [data-qa] element inside the 90 % title-safe box at the sampled frames (real DOM, Playwright)
//   clip       no [data-qa] element cut by an ancestor with overflow or clip-path
//   blank      no near-uniform frames (luma variance) in the render, last frame included
//   cuts       no isolated frame-to-frame jumps except at the declared hard cuts; each frame's change is measured
//              against the largest change in the 4 frames either side, so small word swaps count as well as big cuts
//   freeze     the picture is never static for more than 0.5 s (ffmpeg freezedetect, noise 0.001)
//   media      audio and video lengths within 1 frame, frame count as configured, -14 LUFS +-1, true peak <= -1 dBTP
// --fault makes one check fail on purpose: bounds | clip | config | blank | cuts | freeze | duration | loudness.
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { openComposition } from './driver.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const require = createRequire(join(ROOT, 'package.json'));
const { openBrowser, selectComposition, renderStill } = require('@remotion/renderer');

const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : undefined; };
const all = (k) => argv.flatMap((a, i) => (a === `--${k}` ? [argv[i + 1]] : []));
const cfgPath = resolve(opt('config'));
const out = resolve(opt('out'));
const fault = opt('fault');
const jobs = all('comp').map((id, i) => ({ id, video: resolve(all('video')[i]) }));
mkdirSync(out, { recursive: true });

const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
const words = JSON.parse(readFileSync(join(dirname(cfgPath), 'words.json'), 'utf8'));
if (fault === 'config') cfg.scenes[3].start.pool.x += 0.2; // breaks the light pool at a join
const { fps, frames, scenes } = cfg;
// declared cuts: hard scene starts plus every word that cuts in on its frame (wordCuts); declared events: the first
// frames of each fast move (morph scene starts) and the patch slam, where a sudden local change is intended
const declared = [...new Set([...scenes.filter((s) => s.cut === 'hard').map((s) => s.from), ...(cfg.wordCuts ?? [])])].sort((a, b) => a - b);
const hardCuts = fault === 'cuts' ? [] : declared;
const events = fault === 'cuts' ? [] : [...scenes.filter((s) => s.cut === 'morph').flatMap((s) => [0, 1, 2, 3, 4].map((o) => s.from + o)), ...(cfg.patchFrame ? [-2, -1, 0, 1, 2, 3, 4, 5, 6].map((o) => cfg.patchFrame + o) : [])];

const run = (cmd, args, o = {}) => spawnSync(cmd, args, { encoding: o.binary ? 'buffer' : 'utf8', maxBuffer: 1 << 30, ...o });
const results = [];
const report = (job, check, problems, note = '') => {
  results.push({ job, check, ok: problems.length === 0, problems, note });
  console.log(`${problems.length ? 'FAIL' : 'ok  '} ${job} ${check}${note ? ` (${note})` : ''}${problems.length ? `\n       ${problems.slice(0, 8).join('\n       ')}${problems.length > 8 ? `\n       ... ${problems.length - 8} more` : ''}` : ''}`);
};

// ---- config ----
{
  const p = [];
  if (scenes[0].from !== 0) p.push(`first scene starts at ${scenes[0].from}`);
  if (scenes.at(-1).to !== frames) p.push(`last scene ends at ${scenes.at(-1).to}, not ${frames}`);
  const same = (a, b) => Object.keys(a).every((k) => Math.abs(a[k] - b[k]) < 1e-9);
  scenes.forEach((s, i) => {
    if (s.word) {
      const w = words.find((x) => x.w === s.word);
      const want = w ? Math.round((w.s + cfg.voiceOffset) * fps) : NaN;
      if (want !== s.from) p.push(`${s.id} starts at ${s.from} but "${s.word}" is spoken at frame ${want}`);
    }
    if (!i) return;
    const q = scenes[i - 1];
    if (s.from !== q.to) p.push(`${q.id} -> ${s.id}: gap or overlap (${q.to} vs ${s.from})`);
    if (!same(q.end.pool, s.start.pool)) p.push(`${q.id} -> ${s.id}: the light pool does not continue`);
    if (!same(q.end.object, s.start.object)) p.push(`${q.id} -> ${s.id}: the object does not continue`);
    if (q.end.cam && !same(q.end.cam, s.start.cam)) p.push(`${q.id} -> ${s.id}: the camera does not continue`);
    if (q.end.bg !== s.start.bg && s.cut !== 'hard') p.push(`${q.id} -> ${s.id}: paper/dark switch without a hard cut`);
  });
  report('config', 'continuity', p, `${scenes.length} scenes, hard cuts at ${hardCuts.join(', ') || 'none'}`);
}

// ---- bundle once ----
const bundle = opt('bundle') ? resolve(opt('bundle')) : join(ROOT, 'out', 'qa-bundle');
if (!opt('bundle')) {
  const b = run(`npx remotion bundle src/index.ts --out-dir "${bundle}" --log=error`, [], { cwd: ROOT, shell: true });
  if (b.status !== 0) { console.error(b.stderr); process.exit(2); }
}

const mid = (s) => Math.floor((s.from + s.to) / 2);
const stillFrames = [...new Set([...scenes.map(mid), ...scenes.slice(1).flatMap((s) => [s.from - 2, s.from, s.from + 2]), frames - 1])].filter((f) => f >= 0 && f < frames).sort((a, b) => a - b);
const domFrames = [...new Set([...Array.from({ length: Math.ceil(frames / 6) }, (_, i) => i * 6), ...scenes.map((s) => s.to - 1)])].filter((f) => f < frames).sort((a, b) => a - b);

for (const job of jobs) {
  const browser = await openBrowser('chrome');
  const comp = await selectComposition({ serveUrl: bundle, id: job.id, puppeteerInstance: browser });
  const { width: W, height: H } = comp;

  // ---- stills and contact sheet ----
  const sdir = join(out, `stills_${job.id}`); mkdirSync(sdir, { recursive: true });
  const files = [];
  for (const f of stillFrames) {
    const file = join(sdir, `${String(f).padStart(4, '0')}.png`);
    await renderStill({ composition: comp, serveUrl: bundle, output: file, frame: f, scale: 0.5, puppeteerInstance: browser, imageFormat: 'png', overwrite: true });
    files.push(file);
  }
  await browser.close({ silent: true });
  const sheet = join(out, `contact_${job.id}.png`);
  const cols = W > H ? 6 : 10;
  run('sh', [join(ROOT, '..', 'tools', 'sheet.sh'), sheet, String(cols), String(W > H ? 320 : 180), ...files]);
  report(job.id, 'stills', existsSync(sheet) ? [] : ['contact sheet was not written'], `${files.length} stills -> ${sheet}`);

  // ---- DOM: title-safe bounds and clipping ----
  const c = await openComposition({ bundle, id: job.id, width: W, height: H, frames, fps });
  if (fault === 'bounds') await c.page.addStyleTag({ content: '[data-qa^="word"] { translate: 0 -480px; }' });
  if (fault === 'clip') await c.page.addStyleTag({ content: 'div:has(> span > [data-qa^="word"]) { overflow: hidden; max-height: 0.4em; }' });
  const bounds = [], clips = [];
  for (const f of domFrames) {
    await c.seek(f);
    const r = await c.page.evaluate(([W, H]) => {
      const o = { bounds: [], clip: [] };
      const L = W * 0.05, T = H * 0.05, R = W * 0.95, Bm = H * 0.95;
      for (const el of document.querySelectorAll('[data-qa]')) {
        const b = el.getBoundingClientRect();
        if (!b.width || !b.height || getComputedStyle(el).visibility === 'hidden') continue;
        const name = el.getAttribute('data-qa');
        if (b.left < L - 0.5 || b.top < T - 0.5 || b.right > R + 0.5 || b.bottom > Bm + 0.5) o.bounds.push(`${name} [${Math.round(b.left)}, ${Math.round(b.top)}, ${Math.round(b.right)}, ${Math.round(b.bottom)}]`);
        for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
          const cs = getComputedStyle(a);
          if (cs.overflowX === 'visible' && cs.overflowY === 'visible' && cs.clipPath === 'none') continue;
          const ar = a.getBoundingClientRect();
          if (b.left < ar.left - 1 || b.top < ar.top - 1 || b.right > ar.right + 1 || b.bottom > ar.bottom + 1) { o.clip.push(name); break; }
        }
      }
      return o;
    }, [W, H]);
    r.bounds.forEach((x) => bounds.push(`frame ${f}: ${x} outside the 90 % box`));
    r.clip.forEach((x) => clips.push(`frame ${f}: ${x} cut by an ancestor`));
  }
  if (c.errors.length) bounds.push(...c.errors.map((e) => `page error: ${e}`));
  await c.close();
  report(job.id, 'bounds', bounds, `${domFrames.length} frames sampled`);
  report(job.id, 'clip', clips);

  // ---- the render: blank frames and discontinuities, from 192 px wide grey thumbnails ----
  let video = job.video;
  if (['blank', 'freeze', 'duration', 'loudness'].includes(fault)) {
    video = join(out, `fault_${fault}_${job.id}.mp4`);
    const vf = {
      blank: ['-i', job.video, '-vf', `drawbox=enable='between(n,120,150)':x=0:y=0:w=iw:h=ih:color=0xF5F9F0:t=fill`, '-c:a', 'copy'],
      freeze: ['-i', job.video, '-i', job.video, '-filter_complex', '[0:v][1:v]freezeframes=first=120:last=170:replace=120[v]', '-map', '[v]', '-map', '0:a', '-c:a', 'copy'],
      duration: ['-i', job.video, '-c:v', 'copy', '-af', `atrim=0:${(frames / fps - 0.5).toFixed(2)}`, '-c:a', 'aac'],
      loudness: ['-i', job.video, '-c:v', 'copy', '-af', 'volume=-8dB', '-c:a', 'aac'],
    }[fault];
    run('ffmpeg', ['-y', '-loglevel', 'error', ...vf, video]);
  }
  const tw = 192, th = Math.round((tw * H) / W / 2) * 2;
  const raw = run('ffmpeg', ['-loglevel', 'error', '-i', video, '-vf', `scale=${tw}:${th}:flags=area,format=gray`, '-f', 'rawvideo', '-'], { binary: true }).stdout;
  const n = raw.length / (tw * th);
  const varOf = (k) => { let s = 0, s2 = 0; for (let i = k * tw * th; i < (k + 1) * tw * th; i++) { s += raw[i]; s2 += raw[i] * raw[i]; } const m = s / (tw * th); return s2 / (tw * th) - m * m; };
  const vars = Array.from({ length: n }, (_, k) => varOf(k));
  const blank = vars.flatMap((v, k) => (v < 10 ? [`frame ${k}: luma variance ${v.toFixed(1)}`] : []));
  report(job.id, 'blank', blank, `${n} frames, lowest variance ${Math.min(...vars).toFixed(0)}, last frame ${vars[n - 1].toFixed(0)}`);
  // a cut is an isolated burst of strong pixel changes (> 40 luma levels) in at least one tile of a 6 x 4 grid: the
  // tile's share of strong changes (at least 1 % of its pixels) is at least 3x its share on each of the 3 frames either side. Measured per tile, a
  // word that cuts in is caught even while something else moves elsewhere in the frame; a continuous move changes the
  // same tiles on several frames in a row, so it is not flagged.
  const GX = 6, GY = 4, tiles = [];
  for (let k = 0; k < n; k++) {
    const t = new Array(GX * GY).fill(0);
    if (k > 0) for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) { const i = y * tw + x; if (Math.abs(raw[k * tw * th + i] - raw[(k - 1) * tw * th + i]) > 40) t[Math.min(GY - 1, Math.floor((y * GY) / th)) * GX + Math.min(GX - 1, Math.floor((x * GX) / tw))]++; }
    tiles.push(t.map((c) => c / ((tw * th) / (GX * GY))));
  }
  const burst = (k) => Math.max(0, ...tiles[k].map((v, j) => (v < 0.01 ? 0 : v / Math.max(0.002, ...[-3, -2, -1, 1, 2, 3].map((o) => tiles[k + o]?.[j] ?? 0)))));
  const isSpike = (k) => k >= 1 && burst(k) >= 3;
  const near = (list, k) => list.some((cf) => Math.abs(cf - k) <= 1);
  const spikes = tiles.flatMap((_, k) => (isSpike(k) && !near(hardCuts, k) && !events.includes(k) ? [`frame ${k}: isolated change (x${burst(k).toFixed(1)} its neighbours)`] : []));
  const caught = declared.filter((cf) => [cf - 1, cf, cf + 1].some(isSpike));
  const missed = declared.filter((cf) => !caught.includes(cf));
  report(job.id, 'cuts', spikes, `${caught.length} of ${declared.length} declared cuts show as spikes${missed.length ? ` (not seen: ${missed.join(', ')})` : ''}${fault === 'cuts' ? '; cut list dropped' : ''}`);

  // ---- freeze ----
  const fz = run('ffmpeg', ['-hide_banner', '-i', video, '-map', '0:v', '-vf', 'freezedetect=n=0.001:d=0.5', '-f', 'null', '-']).stderr;
  const starts = [...fz.matchAll(/freeze_start: ([\d.]+)/g)].map((m) => +m[1]);
  const durs = [...fz.matchAll(/freeze_duration: ([\d.]+)/g)].map((m) => +m[1]);
  report(job.id, 'freeze', starts.map((s0, i) => `static from ${s0.toFixed(2)} s for ${durs[i] !== undefined ? `${durs[i].toFixed(2)} s` : 'the rest of the film'}`));

  // ---- media ----
  const m = [];
  const pr = JSON.parse(run('ffprobe', ['-v', 'error', '-count_frames', '-show_entries', 'stream=codec_type,nb_read_frames,duration', '-of', 'json', video]).stdout).streams;
  const vs = pr.find((s) => s.codec_type === 'video'), as = pr.find((s) => s.codec_type === 'audio');
  const vdur = +vs.nb_read_frames / fps;
  if (+vs.nb_read_frames !== frames) m.push(`${vs.nb_read_frames} video frames, config says ${frames}`);
  if (!as) m.push('no audio stream');
  else if (Math.abs(+as.duration - vdur) > 1 / fps + 1e-6) m.push(`audio ${(+as.duration).toFixed(3)} s vs video ${vdur.toFixed(3)} s`);
  if (vars[n - 1] < 10) m.push('last frame is blank');
  const eb = run('ffmpeg', ['-hide_banner', '-i', video, '-vn', '-af', 'ebur128=peak=true', '-f', 'null', '-']).stderr;
  const sum = eb.slice(eb.lastIndexOf('Summary'));
  const I = +sum.match(/I:\s+(-?[\d.]+) LUFS/)[1], TP = +sum.match(/Peak:\s+(-?[\d.]+) dBFS/)[1];
  if (Math.abs(I + 14) > 1) m.push(`loudness ${I} LUFS, target -14 +-1`);
  if (TP > -1) m.push(`true peak ${TP} dBTP, limit -1`);
  report(job.id, 'media', m, `video ${vdur.toFixed(3)} s, audio ${as ? (+as.duration).toFixed(3) : '-'} s, ${I} LUFS, true peak ${TP} dBTP`);
}

const pass = results.every((r) => r.ok);
writeFileSync(join(out, 'qa.json'), JSON.stringify({ fault: fault ?? null, pass, results }, null, 1));
console.log(pass ? 'PASS' : `FAIL: ${results.filter((r) => !r.ok).map((r) => `${r.job} ${r.check}`).join(', ')}`);
process.exit(pass ? 0 : 1);
