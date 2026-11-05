import { Bone, BoxGeometry, Float32BufferAttribute, Matrix4, type Material, Skeleton, SkinnedMesh, Uint16BufferAttribute, Vector3 } from "three";

export const PAGE_WIDTH = 3;
export const PAGE_HEIGHT = PAGE_WIDTH * 760 / 1100;
export const PAGE_THICKNESS = .006;
export const PAGE_SEGMENTS = 40;
const SEGMENT_WIDTH = PAGE_WIDTH / PAGE_SEGMENTS;

/** A chain of bones bends a sheet without rescaling its printed material.
 * The first bone is fixed at the binding; the last vertex never references
 * a bone outside the skeleton, including at the exact outer edge. */
export function createSheetGeometry() {
  const geometry = new BoxGeometry(PAGE_WIDTH, PAGE_HEIGHT, PAGE_THICKNESS, PAGE_SEGMENTS, 4, 1);
  geometry.translate(PAGE_WIDTH / 2, 0, 0);
  const positions = geometry.getAttribute("position");
  const indices: number[] = [];
  const weights: number[] = [];
  for (let i = 0; i < positions.count; i++) {
    const x = Math.max(0, Math.min(PAGE_WIDTH, positions.getX(i)));
    const bone = Math.min(PAGE_SEGMENTS - 1, Math.floor(x / SEGMENT_WIDTH));
    const mix = Math.max(0, Math.min(1, x / SEGMENT_WIDTH - bone));
    indices.push(bone, bone + 1, 0, 0);
    weights.push(1 - mix, mix, 0, 0);
  }
  geometry.setAttribute("skinIndex", new Uint16BufferAttribute(indices, 4));
  geometry.setAttribute("skinWeight", new Float32BufferAttribute(weights, 4));
  return geometry;
}

export function createSheet(geometry: BoxGeometry, materials: Material[]) {
  const bones = Array.from({ length: PAGE_SEGMENTS + 1 }, () => new Bone());
  bones.forEach((bone, index) => {
    bone.position.x = index ? SEGMENT_WIDTH : 0;
    if (index) bones[index - 1].add(bone);
  });
  const mesh = new SkinnedMesh(geometry, materials);
  mesh.add(bones[0]);
  mesh.bind(new Skeleton(bones));
  mesh.frustumCulled = false;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.z = .018;
  return mesh;
}

/** RTL next turns the left sheet (-π) onto the right (0), through positive
 * height. A modest delayed bend and corner flex follow the root rotation. */
export function poseSheet(mesh: SkinnedMesh, angle: number, curl = 0, direction: -1 | 1 = 1) {
  mesh.rotation.y = angle;
  let previousTangent = 0;
  let previousTwist = 0;
  mesh.skeleton.bones.forEach((bone, index) => {
    const distance = index / PAGE_SEGMENTS;
    const restingSlope = .15 * Math.cos(distance * Math.PI);
    const tangent = -Math.cos(angle) * restingSlope - direction * .38 * curl * Math.sin(distance * Math.PI);
    const twist = direction * .055 * curl * Math.sin(distance * Math.PI) ** 2;
    bone.rotation.y = tangent - previousTangent;
    bone.rotation.x = twist - previousTwist;
    previousTangent = tangent;
    previousTwist = twist;
  });
  mesh.updateMatrixWorld(true);
  mesh.skeleton.update();
}

/** Arbitrary UV locations use the same skin weights as the rendered vertices.
 * This also projects native keyboard-accessible links onto the actual paper. */
export function sheetWorldPoint(mesh: SkinnedMesh, u: number, v: number, back = false) {
  const x = PAGE_WIDTH * (back ? 1 - u : u);
  const bone = Math.min(PAGE_SEGMENTS - 1, Math.floor(x / SEGMENT_WIDTH));
  const weight = Math.max(0, Math.min(1, x / SEGMENT_WIDTH - bone));
  const point = new Vector3(x, PAGE_HEIGHT * (.5 - v), back ? -PAGE_THICKNESS / 2 : PAGE_THICKNESS / 2);
  const a = new Matrix4().multiplyMatrices(mesh.skeleton.bones[bone].matrixWorld, mesh.skeleton.boneInverses[bone]);
  const b = new Matrix4().multiplyMatrices(mesh.skeleton.bones[bone + 1].matrixWorld, mesh.skeleton.boneInverses[bone + 1]);
  return point.clone().applyMatrix4(a).multiplyScalar(1 - weight).add(point.applyMatrix4(b).multiplyScalar(weight));
}

export function rtlTurnAngle(direction: -1 | 1, progress: number) {
  return -Math.PI * (direction === 1 ? 1 - progress : progress);
}
