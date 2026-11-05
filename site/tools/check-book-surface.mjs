import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/lib/book-surface.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ES2020 } }).outputText;
const { pagePoint, turningPagePoint, paperCoordinate, productBox, BOOK_WIDTH, BOOK_HEIGHT, MESH_COLUMNS, MESH_ROWS } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

// Both pages must meet at the same photographed binding at every height.
for (let row = 0; row <= 100; row++) {
  assert.deepEqual(pagePoint('left', 1, row / 100), pagePoint('right', 0, row / 100));
}

// A folded/inverted quad produces mirrored content and invalid click targets.
let cells = 0;
for (const side of ['left', 'right']) {
  assert.equal(paperCoordinate(side, 0), 0);
  assert.equal(paperCoordinate(side, 1), 1);
  for (let i = 0; i < 1000; i++) {
    assert.ok(paperCoordinate(side, (i + 1) / 1000) > paperCoordinate(side, i / 1000), 'Gutter mapping must not fold back on itself');
  }
  for (let x = 0; x < MESH_COLUMNS; x++) for (let y = 0; y < MESH_ROWS; y++) {
    const a = pagePoint(side, x / MESH_COLUMNS, y / MESH_ROWS);
    const b = pagePoint(side, (x + 1) / MESH_COLUMNS, y / MESH_ROWS);
    const c = pagePoint(side, x / MESH_COLUMNS, (y + 1) / MESH_ROWS);
    for (const p of [a, b, c]) {
      assert.ok(p.x >= 0 && p.x <= BOOK_WIDTH && p.y >= 0 && p.y <= BOOK_HEIGHT);
    }
    assert.ok((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x) > 0, `${side}: inverted cell ${x},${y}`);
    cells++;
  }
}
for (const side of ['left', 'right']) {
  const spine = side === 'left' ? 1 : 0;
  const near = side === 'left' ? .99 : .01;
  const gutterWidth = Math.abs(pagePoint(side, spine, .5).x - pagePoint(side, near, .5).x);
  const flatWidth = Math.abs(pagePoint(side, .5, .5).x - pagePoint(side, .49, .5).x);
  assert.ok(gutterWidth < flatWidth * .85, 'Printed material must narrow on the steep fold');
}
// Independently measured outer corners must stay pinned to the blank shell.
assert.deepEqual(pagePoint('left', 0, 0), { x: 216, y: 124 });
assert.deepEqual(pagePoint('left', 0, 1), { x: 136, y: 619 });
assert.deepEqual(pagePoint('right', 1, 0), { x: 1826, y: 126 });
assert.deepEqual(pagePoint('right', 1, 1), { x: 1902, y: 627 });
for (let i = 0; i < 6; i++) {
  const box = productBox(i);
  assert.ok(box.u > 0 && box.v > 0 && box.u + box.width < 1 && box.v + box.height < 1);
  if (i % 2 === 0) assert.ok(box.u > productBox(i + 1).u, 'Product order must remain RTL');
}
// The turning sheet must stay hinged, land exactly on its destination, and
// pass through its edge-on phase without switching geometries at halfway.
for (const direction of [-1, 1]) {
  for (const v of [0, .5, 1]) {
    const side = direction === 1 ? 'left' : 'right';
    assert.deepEqual(turningPagePoint(direction, .25, .25, v), pagePoint(side, side === 'left' ? .75 : .25, v), 'Unfolded print must stay fixed instead of shrinking');
  }
  for (let row = 0; row <= 8; row++) for (let column = 0; column <= 16; column++) {
    const d = column / 16;
    const v = row / 8;
    for (const progress of [0, 1]) {
      const left = (direction === 1) === (progress === 0);
      const expected = pagePoint(left ? 'left' : 'right', left ? 1 - d : d, v);
      const actual = turningPagePoint(direction, progress, d, v);
      assert.ok(Math.hypot(actual.x - expected.x, actual.y - expected.y) < 1e-8, 'Turning sheet must land on the calibrated surface');
    }
    let previous;
    for (let step = 0; step <= 100; step++) {
      const p = turningPagePoint(direction, step / 100, d, v);
      assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y) && p.y >= 0 && p.y <= BOOK_HEIGHT, 'Turning geometry must stay finite and in frame');
      if (d === 0) {
        const spine = pagePoint('right', 0, v);
        assert.ok(Math.hypot(p.x - spine.x, p.y - spine.y) < 1e-8, 'The sheet must stay attached to the spine');
      }
      if (previous) assert.ok(Math.hypot(p.x - previous.x, p.y - previous.y) < 40, 'No discontinuity at the face transition');
      previous = p;
    }
  }
}
console.log(`Book surface verified: calibrated corners, monotonic gutter compression, shared spine, ${cells} non-inverted cells, six RTL product targets, continuous forward/backward turns and exact landings.`);
