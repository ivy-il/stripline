// Adapted from Wawa Sensei's Book.jsx, requested by the site owner.
// https://github.com/wass08/r3f-animated-book-slider-final/blob/main/src/components/Book.jsx
// Original proportions, skinning and damped bone animation; mirrored for RTL.
import { Bone, BoxGeometry, Float32BufferAttribute, MathUtils, Skeleton, SkinnedMesh, Uint16BufferAttribute, type Material } from "three";
import { easing } from "maath";

export const VOLUME_WIDTH = 3;
export const VOLUME_HEIGHT = VOLUME_WIDTH * 1.71 / 1.28;
export const VOLUME_DEPTH = VOLUME_WIDTH * .003 / 1.28;
const SEGMENTS = 30;
const SEGMENT_WIDTH = VOLUME_WIDTH / SEGMENTS;

export function createVolumeGeometry() {
  const geometry = new BoxGeometry(VOLUME_WIDTH, VOLUME_HEIGHT, VOLUME_DEPTH, SEGMENTS, 2);
  geometry.translate(VOLUME_WIDTH / 2, 0, 0);
  const positions = geometry.getAttribute("position");
  const indices: number[] = [], weights: number[] = [];
  for (let i = 0; i < positions.count; i++) {
    const x = MathUtils.clamp(positions.getX(i), 0, VOLUME_WIDTH);
    // Clamp the outer edge so it never references a nonexistent bone.
    const index = Math.min(SEGMENTS - 1, Math.floor(x / SEGMENT_WIDTH));
    const weight = MathUtils.clamp(x / SEGMENT_WIDTH - index, 0, 1);
    indices.push(index, index + 1, 0, 0); weights.push(1 - weight, weight, 0, 0);
  }
  geometry.setAttribute("skinIndex", new Uint16BufferAttribute(indices, 4));
  geometry.setAttribute("skinWeight", new Float32BufferAttribute(weights, 4));
  return geometry;
}

export function createVolumeSheet(geometry: BoxGeometry, materials: Material[]) {
  const bones: Bone[] = [];
  for (let i = 0; i <= SEGMENTS; i++) {
    const bone = new Bone(); bone.position.x = i === 0 ? 0 : SEGMENT_WIDTH;
    if (i > 0) bones[i - 1].add(bone);
    bones.push(bone);
  }
  const mesh = new SkinnedMesh(geometry, materials);
  mesh.add(bones[0]); mesh.bind(new Skeleton(bones));
  mesh.castShadow = mesh.receiveShadow = true; mesh.frustumCulled = false;
  return mesh;
}

/** Stack along the paper normal, including when the volume closes flat. */
export function positionVolumeSheet(mesh: SkinnedMesh, offset: number) {
  mesh.position.set(Math.sin(mesh.rotation.y) * offset, 0, Math.cos(mesh.rotation.y) * offset);
}

export function animateVolumeSheet(mesh: SkinnedMesh, opened: boolean, closed: boolean, fanIndex: number, turningTime: number, delta: number, immediate = false) {
  // Keep the source animation intact; the scene mirrors the complete volume.
  let targetRotation = opened ? -Math.PI / 2 : Math.PI / 2;
  if (!closed) targetRotation += MathUtils.degToRad(fanIndex * .8);
  const bones = mesh.skeleton.bones;
  for (let i = 0; i < bones.length; i++) {
    const target = i === 0 ? mesh : bones[i];
    const inside = i < 8 ? Math.sin(i * .2 + .25) : 0;
    const outside = i >= 8 ? Math.cos(i * .3 + .09) : 0;
    const turning = Math.sin(i * Math.PI / bones.length) * turningTime;
    let angle = .18 * inside * targetRotation - .05 * outside * targetRotation + .09 * turning * targetRotation;
    let fold = MathUtils.degToRad(Math.sign(targetRotation) * 2);
    if (closed) { angle = i === 0 ? targetRotation : 0; fold = 0; }
    const foldIntensity = i > 8 ? Math.sin(i * Math.PI / bones.length - .5) * turningTime : 0;
    if (immediate) { target.rotation.y = angle; target.rotation.x = fold * foldIntensity; }
    else {
      easing.dampAngle(target.rotation, "y", angle, .5, delta);
      easing.dampAngle(target.rotation, "x", fold * foldIntensity, .3, delta);
    }
  }
  mesh.updateMatrixWorld(true); mesh.skeleton.update();
}
