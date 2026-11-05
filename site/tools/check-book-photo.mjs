import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { OrthographicCamera, Vector3, MeshBasicMaterial } from 'three';

const urls = {};
for (const name of ['book-surface', 'book-geometry', 'book-photo-geometry']) {
  const source = await readFile(new URL(`../src/lib/${name}.ts`, import.meta.url), 'utf8');
  let code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ES2020 } }).outputText;
  code = code.replaceAll('from "three"', `from ${JSON.stringify(import.meta.resolve('three'))}`);
  for (const [dependency, url] of Object.entries(urls)) code = code.replaceAll(`from "./${dependency}"`, `from ${JSON.stringify(url)}`);
  urls[name] = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
}
const { BOOK_WIDTH, BOOK_HEIGHT, pagePoint } = await import(urls['book-surface']);
const { createSheetGeometry, createSheet, poseSheet, rtlTurnAngle, PAGE_WIDTH, PAGE_HEIGHT } = await import(urls['book-geometry']);
const { PHOTO_SCALE, photoRestPositions, photoWorldPoint } = await import(urls['book-photo-geometry']);
const camera = new OrthographicCamera(-BOOK_WIDTH / (2 * PHOTO_SCALE), BOOK_WIDTH / (2 * PHOTO_SCALE), BOOK_WIDTH / 2.3 * 1.8 / (2 * PHOTO_SCALE), -BOOK_WIDTH / 2.3 * 1.8 / (2 * PHOTO_SCALE), .1, 40);
camera.position.set(0, -5, 9); camera.lookAt(0, 0, 0); camera.updateMatrixWorld();
const mesh = createSheet(createSheetGeometry(), Array.from({length: 6}, () => new MeshBasicMaterial()));
mesh.position.copy(photoWorldPoint(camera, 1025.5, 381.5, .018));
poseSheet(mesh, -Math.PI);
const left = photoRestPositions(mesh, camera, 'left');
poseSheet(mesh, 0);
const right = photoRestPositions(mesh, camera, 'right');
const positions = mesh.geometry.getAttribute('position');
const original = new Float32Array(positions.array);
const faceCentre = (sign) => {
  for (let i = 0; i < positions.count; i++) if (Math.abs(original[i * 3] - PAGE_WIDTH / 2) < 1e-6 && Math.abs(original[i * 3 + 1]) < 1e-6 && original[i * 3 + 2] * sign > 0) return i;
  throw new Error('Missing printed face centre');
};
const front = faceCentre(1);
const back = faceCentre(-1);
const worldVertex = (i) => mesh.applyBoneTransform(i, new Vector3().fromBufferAttribute(positions, i)).applyMatrix4(mesh.matrixWorld);
for (const [side, base, angle] of [['left', left, -Math.PI], ['right', right, 0]]) {
  positions.copyArray(base); poseSheet(mesh, angle);
  assert.ok((worldVertex(front).z - worldVertex(back).z) * (side === 'left' ? -1 : 1) > .005, 'The visible printed face must be above the opposite face, including the turned-over left sheet');
  for (let i = 0; i < positions.count; i++) {
    const actual = mesh.applyBoneTransform(i, new Vector3().fromBufferAttribute(positions, i)).applyMatrix4(mesh.matrixWorld).project(camera);
    const distance = original[i * 3] / PAGE_WIDTH;
    const expected = pagePoint(side, side === 'left' ? 1 - distance : distance, .5 - original[i * 3 + 1] / PAGE_HEIGHT);
    const x = (actual.x + 1) * BOOK_WIDTH / 2;
    const y = BOOK_HEIGHT / 2 - actual.y * camera.top * PHOTO_SCALE;
    assert.ok(Math.hypot(x - expected.x, y - expected.y) < .001, 'Resting paper must land on the photographed edges, for both faces and all UVs');
  }
}
for (const direction of [-1, 1]) for (let step = 0; step <= 100; step++) {
  const progress = step / 100;
  const blend = direction === 1 ? progress : 1 - progress;
  for (let i = 0; i < positions.array.length; i++) positions.array[i] = left[i] * (1 - blend) + right[i] * blend;
  poseSheet(mesh, rtlTurnAngle(direction, progress), Math.sin(progress * Math.PI) ** 2, direction);
  assert.ok(worldVertex(front).distanceTo(worldVertex(back)) > .004, 'Front and back must not collapse together during a turn and mix their text');
  for (let i = 0; i < positions.count; i += 11) {
    const point = mesh.applyBoneTransform(i, new Vector3().fromBufferAttribute(positions, i)).applyMatrix4(mesh.matrixWorld).project(camera);
    assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y));
    assert.ok(Math.abs(point.y) < 1, 'The lifted sheet must stay inside the extended animation canvas');
  }
}
mesh.skeleton.dispose(); mesh.geometry.dispose(); mesh.material.forEach(material => material.dispose());
console.log('Photographed book verified: exact resting alignment on both sides, continuous RTL turn, and unclipped raised pages.');
