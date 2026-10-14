// p5.js under the render contract: draw(p, t) is called by window.seek(t), never by p5's own loop.
// Usage: p5film({ setup: async (p) => {...load fonts/images...}, draw: (p, t) => {...}, seed: 1 })
import p5 from '/node_modules/p5/lib/p5.esm.min.js';

export function p5film({ setup = () => {}, draw, seed = 1 }) {
  const q = new URLSearchParams(location.search), W = +q.get('w') || 1080, H = +q.get('h') || 1920;
  let t = 0;
  window.ready = new Promise((done) => new p5((p) => {
    p.setup = async () => {
      p.pixelDensity(1);
      p.createCanvas(W, H);
      p.canvas.id = 'c';
      p.noLoop(); // no timer-driven frames; only seek() redraws
      await setup(p);
      done();
    };
    // Reseed every frame so random()/noise() give the same result for the same t.
    p.draw = () => { p.randomSeed(seed); p.noiseSeed(seed); draw(p, t); };
    window.seek = (s) => { t = s; return p.redraw(); };
  }));
}
