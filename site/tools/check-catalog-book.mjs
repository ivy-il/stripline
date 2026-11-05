import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { Group, MeshStandardMaterial, Vector3 } from 'three';

const source = await readFile(new URL('../src/lib/catalog-book-geometry.ts', import.meta.url), 'utf8');
let code = ts.transpileModule(source, {compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ES2020}}).outputText;
for (const name of ['three', 'maath']) code = code.replace(`from "${name}"`, `from ${JSON.stringify(import.meta.resolve(name))}`);
const {createVolumeGeometry,createVolumeSheet,positionVolumeSheet,animateVolumeSheet,VOLUME_WIDTH,VOLUME_DEPTH} = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const geometry = createVolumeGeometry();
const indices = geometry.getAttribute('skinIndex'), weights = geometry.getAttribute('skinWeight');
for (let i = 0; i < indices.count; i++) {
  assert.ok(indices.getX(i) <= 30 && indices.getY(i) <= 30);
  assert.ok(Math.abs(weights.getX(i) + weights.getY(i) - 1) < 1e-6);
}
const mesh = createVolumeSheet(geometry, Array.from({length:6},()=>new MeshStandardMaterial()));
const binding = new Group(); binding.rotation.y = -Math.PI / 2; binding.add(mesh);
const volume = new Group(); volume.scale.x = -1; volume.add(binding);
assert.equal(mesh.skeleton.bones.length,31);
for (const opened of [false,true]) {
  animateVolumeSheet(mesh,opened,true,0,0,0,true); volume.updateMatrixWorld(true);
  const end = mesh.skeleton.bones[30].getWorldPosition(new Vector3());
  assert.ok(opened ? end.x > 2.99 : end.x < -2.99, 'RTL cover must move from left to right');
  for (let frame = 0; frame < 180; frame++) {
    animateVolumeSheet(mesh,opened,false,2,Math.sin(Math.min(1,frame/24)*Math.PI),1/60);
    volume.updateMatrixWorld(true);
    for (let i = 1; i <= 30; i++) {
      const a=mesh.skeleton.bones[i-1].getWorldPosition(new Vector3()), b=mesh.skeleton.bones[i].getWorldPosition(new Vector3());
      assert.ok(Math.abs(a.distanceTo(b)-VOLUME_WIDTH/30)<1e-6,'Bending must preserve paper length');
      assert.ok(Number.isFinite(b.x+b.y+b.z));
    }
  }
  const positions=mesh.skeleton.bones.map(b=>b.getWorldPosition(new Vector3()).z);
  assert.ok(Math.max(...positions)-Math.min(...positions)>.3,'Open paper must retain the source model’s visible curve');
}
// Fixed binding-Z offsets put closed leaves in one plane. Their normals must
// instead separate all 37 leaves by more than the physical paper thickness.
const stack = Array.from({length:37},()=>createVolumeSheet(geometry, mesh.material));
for (const leaf of stack) binding.add(leaf);
for (const opened of [false,true]) {
  for (let i=0;i<stack.length;i++) {
    animateVolumeSheet(stack[i],opened,true,i,0,0,true);
    positionVolumeSheet(stack[i],((opened?37:0)-i)*VOLUME_DEPTH*1.18);
  }
  volume.updateMatrixWorld(true);
  const depths=stack.map(leaf=>leaf.getWorldPosition(new Vector3()).z);
  for (let i=1;i<depths.length;i++) assert.ok(Math.abs(depths[i]-depths[i-1])>VOLUME_DEPTH*1.1,'Closed faces must not coincide or intersect');
}
console.log('Catalog model verified: skinning, RTL rotation, curved paper, stable damping and separated front/back closed stacks.');
