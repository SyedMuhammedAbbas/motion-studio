// Shared pieces for talk reels: edited footage frames, speaker-tracked crop, caption groups, marker strokes.
// Each reel page: import { loadReel, ... } from '/tools/talk/reel.js'; files come from the page's own folder
// (docs/words_edit.json, docs/cuts.json, docs/track.json, source/frames/NNNNN.jpg, written by cut.py and track.py).
import { clamp, rng } from '/lib/motion.js';

export const FPS = 30000 / 1001;
const SW = 1920, SH = 1080;

export async function loadReel() {
  const get = (u) => fetch(u).then((r) => r.json());
  const [words, cuts, trackRaw] = await Promise.all([get('docs/words_edit.json'), get('docs/cuts.json'), get('docs/track.json')]);
  const NF = trackRaw.length;
  // smooth the tracked face per shot (Gaussian, sigma 0.35 s) so the crop glides inside a shot and snaps on a cut
  const starts = cuts.map((c) => Math.round(c.t * FPS));
  const shotOf = (i) => { let s = 0; for (let k = 0; k < starts.length; k++) if (starts[k] <= i) s = k; return s; };
  const sig = 0.35 * FPS, R = Math.ceil(sig * 3);
  const track = trackRaw.map((_, i) => {
    const sh = shotOf(i), out = { x: 0, y: 0, h: 0 }; let wsum = 0;
    for (let j = Math.max(0, i - R); j <= Math.min(NF - 1, i + R); j++) {
      if (shotOf(j) !== sh) continue;
      const w = Math.exp(-((j - i) ** 2) / (2 * sig * sig)); wsum += w;
      for (const k of ['x', 'y', 'h']) out[k] += trackRaw[j][k] * w;
    }
    for (const k of ['x', 'y', 'h']) out[k] /= wsum;
    return out;
  });
  return { words, cuts, track, NF, dur: NF / FPS };
}

const cache = new Map();
export function frame(n, NF) {
  n = Math.max(1, Math.min(NF, n));
  if (!cache.has(n)) {
    const img = new Image(); img.src = `source/frames/${String(n).padStart(5, '0')}.jpg`;
    cache.set(n, img.decode().then(() => img));
    if (cache.size > 12) cache.delete(cache.keys().next().value);
  }
  return cache.get(n);
}
export const frameAt = (t, NF) => Math.floor(t * FPS) + 1;

// Draw footage into box (canvas px). zoom 1 = tallest crop the source allows for that box; face sits at fy of the box height.
export function footage(ctx, img, tr, box, { zoom = 1, fy = 0.3, dx = 0 } = {}) {
  const a = box.w / box.h;
  let ch = SH / zoom, cw = ch * a;
  if (cw > SW / zoom) { cw = SW / zoom; ch = cw / a; }
  const sx = clamp(tr.x + dx - cw / 2, 0, SW - cw), sy = clamp(tr.y - fy * ch, 0, SH - ch);
  ctx.drawImage(img, sx, sy, cw, ch, box.x, box.y, box.w, box.h);
}

// Index of the cut (shot) that contains edited time t
export const shotIndex = (cuts, t) => { let s = 0; cuts.forEach((c, i) => { if (c.t <= t + 1e-6) s = i; }); return s; };

// Caption groups: break on sentence punctuation, on pauses, or at maxWords / maxChars
export function captionGroups(words, { maxWords = 3, maxChars = 16, gap = 0.35 } = {}) {
  const groups = []; let cur = [];
  words.forEach((w, i) => {
    const prev = words[i - 1];
    const len = cur.reduce((n, x) => n + x.w.length + 1, 0) + w.w.length;
    if (cur.length && (cur.length >= maxWords || len > maxChars || w.s - prev.e > gap || /[.?!,]$/.test(prev.w))) { groups.push(cur); cur = []; }
    cur.push(w);
  });
  if (cur.length) groups.push(cur);
  return groups.map((g, i) => ({ words: g, s: g[0].s, e: groups[i + 1] ? groups[i + 1][0].s : g[g.length - 1].e + 0.4 }));
}
export const clean = (w) => w.replace(/[.,?!]+$/, '');

// Hand-drawn marker stroke from (x1,y1) to (x2,y2), drawn up to progress p (0..1). Seeded wobble, round caps.
export function marker(ctx, x1, y1, x2, y2, p, { seed = 1, width = 18, color = '#E5372A', wobble = 6 } = {}) {
  if (p <= 0) return;
  p = Math.min(p, 1); // springs can overshoot a hair
  const r = rng(seed), N = 24, pts = [];
  const nx = -(y2 - y1), ny = x2 - x1, nl = Math.hypot(nx, ny) || 1;
  const ph = r() * 6.28, amp = wobble * (0.6 + r() * 0.8), bow = (r() - 0.5) * wobble * 2;
  for (let i = 0; i <= N; i++) {
    const u = i / N, off = Math.sin(u * 3.1 + ph) * amp * 0.5 + Math.sin(u * Math.PI) * bow;
    pts.push([x1 + (x2 - x1) * u + (nx / nl) * off, y1 + (y2 - y1) * u + (ny / nl) * off]);
  }
  const upto = p * N;
  ctx.save();
  ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i <= Math.ceil(upto); i++) {
    const f = Math.min(1, upto - (i - 1));
    ctx.lineTo(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f);
  }
  ctx.lineWidth = width; ctx.stroke();
  ctx.restore();
}

// ---------- person cut-out (needs matte.py: source/matte/NNNNN.png, 896x512, alpha = speaker) ----------
const mcache = new Map();
// dir 'matte_hi': 1.5x mattes with a choked edge for close-ups (matte.py <client> <reel> --hi t0 t1)
export function matte(n, NF, dir = 'matte') {
  n = Math.max(1, Math.min(NF, n));
  const key = dir + n;
  if (!mcache.has(key)) {
    const img = new Image(); img.src = `source/${dir}/${String(n).padStart(5, '0')}.png`;
    mcache.set(key, img.decode().then(() => img));
    if (mcache.size > 12) mcache.delete(mcache.keys().next().value);
  }
  return mcache.get(key);
}
const off = document.createElement('canvas'), octx = off.getContext('2d');
// Same crop maths as footage(), but only the speaker: footage masked by their matte. Draw it over anything (frame break, vertigo, cover story...).
export function cutout(ctx, img, mat, tr, box, { zoom = 1, fy = 0.3, dx = 0, filter = 'none' } = {}) {
  const a = box.w / box.h;
  let ch = SH / zoom, cw = ch * a;
  if (cw > SW / zoom) { cw = SW / zoom; ch = cw / a; }
  const sx = clamp(tr.x + dx - cw / 2, 0, SW - cw), sy = clamp(tr.y - fy * ch, 0, SH - ch);
  const w = Math.ceil(Math.abs(box.w)), h = Math.ceil(Math.abs(box.h));
  if (off.width !== w || off.height !== h) { off.width = w; off.height = h; }
  octx.globalCompositeOperation = 'source-over'; octx.clearRect(0, 0, w, h);
  octx.filter = filter; octx.drawImage(img, sx, sy, cw, ch, 0, 0, w, h); octx.filter = 'none';
  const k = mat.width / SW;
  octx.globalCompositeOperation = 'destination-in';
  octx.drawImage(mat, sx * k, sy * k, cw * k, ch * k, 0, 0, w, h);
  octx.globalCompositeOperation = 'source-over';
  ctx.drawImage(off, box.x, box.y, box.w, box.h);
}
