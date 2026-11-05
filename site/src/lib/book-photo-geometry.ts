import { Matrix4, OrthographicCamera, SkinnedMesh, Vector3 } from "three";
import { BOOK_WIDTH, BOOK_HEIGHT, pagePoint, type PageSide } from "./book-surface";
import { PAGE_WIDTH, PAGE_HEIGHT } from "./book-geometry";

export const PHOTO_SCALE = 300;

/** Lift the measured photograph into the camera's world at a chosen height.
 * The printed silhouette stays identical to the photograph when projected. */
export function photoWorldPoint(camera: OrthographicCamera, x: number, y: number, z: number) {
  const point = new Vector3(
    (x - BOOK_WIDTH / 2) / PHOTO_SCALE / camera.right,
    (BOOK_HEIGHT / 2 - y) / PHOTO_SCALE / camera.top,
    0,
  ).unproject(camera);
  const ray = camera.getWorldDirection(new Vector3());
  return point.addScaledVector(ray, (z - point.z) / ray.z);
}

/** Invert the same weighted bone matrices used by the GPU. Each endpoint
 * matches the supplier-style photograph rather than an approximate rectangle.
 * Call on an untouched sheet geometry, after posing its skeleton. */
export function photoRestPositions(mesh: SkinnedMesh, camera: OrthographicCamera, side: PageSide) {
  mesh.updateMatrixWorld(true);
  mesh.skeleton.update();
  const positions = mesh.geometry.getAttribute("position");
  const indices = mesh.geometry.getAttribute("skinIndex");
  const weights = mesh.geometry.getAttribute("skinWeight");
  const result = new Float32Array(positions.count * 3);
  const matrices = mesh.skeleton.bones.map((bone, i) => new Matrix4().multiplyMatrices(bone.matrixWorld, mesh.skeleton.boneInverses[i]));
  for (let i = 0; i < positions.count; i++) {
    const distance = positions.getX(i) / PAGE_WIDTH;
    const uv = pagePoint(side, side === "left" ? 1 - distance : distance, .5 - positions.getY(i) / PAGE_HEIGHT);
    // The left sheet is turned over: its back face must remain above its
    // front face. Keeping the original sign inverted its physical thickness.
    const faceHeight = positions.getZ(i) * (side === "left" ? -1 : 1);
    const height = mesh.position.z + .14 * Math.sin(distance * Math.PI) + faceHeight;
    const target = photoWorldPoint(camera, uv.x, uv.y, height);
    const a = matrices[indices.getX(i)];
    const b = matrices[indices.getY(i)];
    const transform = new Matrix4();
    for (let k = 0; k < 16; k++) transform.elements[k] = a.elements[k] * weights.getX(i) + b.elements[k] * weights.getY(i);
    target.applyMatrix4(transform.invert());
    result.set([target.x, target.y, target.z], i * 3);
  }
  return result;
}
