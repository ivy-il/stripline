import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { Group, MeshStandardMaterial, Vector3 } from 'three';

const source = await readFile(new URL('../src/lib/book-geometry.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ES2020 } }).outputText.replace('from "three"', `from ${JSON.stringify(import.meta.resolve('three'))}`);
const { createSheetGeometry, createSheet, poseSheet, sheetWorldPoint, rtlTurnAngle, PAGE_WIDTH, PAGE_SEGMENTS } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const geometry = createSheetGeometry();
const indices = geometry.getAttribute('skinIndex');
const weights = geometry.getAttribute('skinWeight');
for (let i = 0; i < indices.count; i++) {
  assert.ok(indices.getX(i) <= PAGE_SEGMENTS && indices.getY(i) <= PAGE_SEGMENTS, 'Skinning must stay inside the skeleton at the outer edge');
  assert.ok(Math.abs(weights.getX(i) + weights.getY(i) - 1) < 1e-6);
}
const mesh = createSheet(geometry, Array.from({length: 6}, () => new MeshStandardMaterial()));
const group = new Group(); group.rotation.z = -.025; group.add(mesh);
for (const direction of [-1, 1]) for (let step = 0; step <= 100; step++) {
  const p = step / 100;
  const angle = rtlTurnAngle(direction, p);
  poseSheet(mesh, angle, Math.sin(p * Math.PI) ** 2, direction);
  group.updateMatrixWorld(true);
  for (let i = 1; i <= PAGE_SEGMENTS; i++) {
    const a = mesh.skeleton.bones[i - 1].getWorldPosition(new Vector3());
    const b = mesh.skeleton.bones[i].getWorldPosition(new Vector3());
    assert.ok(Math.abs(a.distanceTo(b) - PAGE_WIDTH / PAGE_SEGMENTS) < 1e-8, 'The sheet must bend without stretching');
  }
  const hinge = sheetWorldPoint(mesh, 0, .5);
  assert.ok(Math.hypot(hinge.x, hinge.y) < .004, 'Binding must remain pinned');
  const tip = sheetWorldPoint(mesh, 1, .5);
  if (step === 50) assert.ok(tip.z > 2.5, 'The sheet must actually rise into 3D at mid-turn');
  if (step === 0 || step === 100) {
    const right = (direction === 1) === (step === 100);
    assert.ok(right ? tip.x > 2.9 : tip.x < -2.9, 'RTL next must travel left to right, previous must reverse it');
  }
  // Native links must follow the exact GPU skinning, also under the rotated book.
  const positions = geometry.getAttribute('position');
  const frontFace = geometry.groups.find(group => group.materialIndex === 4);
  for (let offset = frontFace.start; offset < frontFace.start + frontFace.count; offset += 17) {
    const i = geometry.index.getX(offset);
    const base = new Vector3().fromBufferAttribute(positions, i);
    if (Math.abs(base.z - .003) > 1e-6) continue;
    const uv = geometry.getAttribute('uv');
    const projected = sheetWorldPoint(mesh, uv.getX(i), 1 - uv.getY(i));
    const actual = mesh.applyBoneTransform(i, base).applyMatrix4(mesh.matrixWorld);
    assert.ok(projected.distanceTo(actual) < 1e-6, 'Product link projection must match rendered paper');
  }
}
mesh.skeleton.dispose(); geometry.dispose(); mesh.material.forEach(material => material.dispose());
console.log('3D book verified: valid skinning, fixed binding, conserved sheet length, actual 3D lift, RTL direction and exact link projection.');
