// node lib/motion.test.mjs
import assert from 'node:assert/strict';
import { spring, track, rng } from './motion.js';

assert.equal(spring(0), 0);
assert.ok(Math.abs(spring(5) - 1) < 1e-6, 'spring settles at 1');
assert.ok(Math.abs(spring(5, 100, 30) - 1) < 1e-6, 'overdamped spring settles at 1');
const keys = [[0, 10], [1, 50], [2, -20]];
assert.equal(track(0.5, keys), 10, 'holds first value before first change');
assert.ok(Math.abs(track(10, keys) - -20) < 1e-6, 'track settles at last target');
assert.deepEqual([1, 2, 3].map(rng(7)), [1, 2, 3].map(rng(7)), 'rng is deterministic per seed');
console.log('motion.js ok');
