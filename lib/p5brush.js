// p5.brush bound to the same p5 that p5film uses. Use with p5film({ webgl: true, ... }).
// The ESM build only registers its p5 addon (lifecycle flush, push/pop, randomSeed/noiseSeed hooks) when a global p5
// exists while it loads, so expose p5 for that one import and take it away again.
import p5 from '/node_modules/p5/lib/p5.esm.min.js';

// p5.brush 2.2.3's blend shader takes dFdx/dFdy after an early return, i.e. in non-uniform control flow, where the
// GPU leaves them undefined: watercolour fill edges then differ by a 2x2 pixel quad from run to run and renders are not
// frame-exact. Move the edge-blur sampling above the early return; the maths is unchanged.
const EARLY = 'if(maskColor.a==0.0){outColor=source;return;}';
const BLUR = 'if(!u_isBrush){vec2 texelSize=1.0/vec2(textureSize(u_mask,0));float scaledAlpha=maskColor.a*15.0;float blurEdge=0.0;for(int i=-2;i<=2;i+=2){for(int j=-2;j<=2;j+=2){vec2 neighborUV=maskUV+vec2(float(i),float(j))*texelSize;float neighborAlpha=texture(u_mask,neighborUV).a*15.0;blurEdge+=smoothstep(EDGE_MIN,EDGE_MAX,length(vec2(dFdx(neighborAlpha),dFdy(neighborAlpha))));}}blurEdge/=9.0;mixIntensity=clamp(maskColor.a+blurEdge*0.1,0.0,1.0);}';
const HOISTED = 'vec2 texelSize=1.0/vec2(textureSize(u_mask,0));float blurEdge=0.0;for(int i=-2;i<=2;i+=2){for(int j=-2;j<=2;j+=2){vec2 neighborUV=maskUV+vec2(float(i),float(j))*texelSize;float neighborAlpha=texture(u_mask,neighborUV).a*15.0;blurEdge+=smoothstep(EDGE_MIN,EDGE_MAX,length(vec2(dFdx(neighborAlpha),dFdy(neighborAlpha))));}}blurEdge/=9.0;';
const shaderSource = WebGL2RenderingContext.prototype.shaderSource;
WebGL2RenderingContext.prototype.shaderSource = function (shader, src) {
  if (src.includes('dFdx(neighborAlpha)')) {
    if (!src.includes(EARLY) || !src.includes(BLUR)) throw new Error('p5brush.js: p5.brush blend shader changed; update the determinism patch');
    src = src.replace(EARLY, HOISTED + EARLY).replace(BLUR, 'if(!u_isBrush){mixIntensity=clamp(maskColor.a+blurEdge*0.1,0.0,1.0);}');
  }
  return shaderSource.call(this, shader, src);
};

globalThis.p5 = p5;
export const brush = await import('/node_modules/p5.brush/dist/p5.brush.esm.js');
delete globalThis.p5;
