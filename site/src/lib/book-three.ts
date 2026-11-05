import * as THREE from "three";
import { createSheet, createSheetGeometry, poseSheet, rtlTurnAngle } from "./book-geometry";
import { BOOK_WIDTH, BOOK_HEIGHT, pagePoint } from "./book-surface";
import { PHOTO_SCALE, photoRestPositions, photoWorldPoint } from "./book-photo-geometry";

export type PrintedSpread = { left: THREE.CanvasTexture; right: THREE.CanvasTexture };
export type BookProjection = { width: number; height: number; left: string; products: string[] };
type Box = { u: number; v: number; width: number; height: number };

export class BookScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-3.5, 3.5, 1.75, -1.75, .1, 40);
  private book = new THREE.Group();
  private leftRest!: Float32Array;
  private rightRest!: Float32Array;
  private left: THREE.SkinnedMesh;
  private right: THREE.SkinnedMesh;
  private turning: THREE.SkinnedMesh;
  private resize: ResizeObserver;
  private frame = 0;
  private width = 1;
  private height = 1;
  private disposed = false;
  private boxes: Box[] = [];
  private projection: (value: BookProjection) => void;

  constructor(private canvas: HTMLCanvasElement, projection: (value: BookProjection) => void, contextLost: () => void) {
    this.projection = projection;
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.autoClear = false;
    this.canvas.addEventListener("webglcontextlost", this.onContextLost);
    this.onFailure = contextLost;
    this.camera.position.set(0, -5, 9);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateMatrixWorld();
    this.scene.add(this.book);
    this.left = this.makeSheet();
    this.right = this.makeSheet();
    this.turning = this.makeSheet();
    this.turning.layers.set(1);
    poseSheet(this.left, -Math.PI);
    poseSheet(this.right, 0);
    this.turning.visible = false;
    this.measure();
    const hinge = photoWorldPoint(this.camera, 1025.5, 381.5, .018);
    for (const sheet of [this.left, this.right, this.turning]) sheet.position.copy(hinge);
    this.leftRest = photoRestPositions(this.left, this.camera, "left");
    this.rightRest = photoRestPositions(this.right, this.camera, "right");
    (this.left.geometry.getAttribute("position") as THREE.BufferAttribute).copyArray(this.leftRest);
    (this.right.geometry.getAttribute("position") as THREE.BufferAttribute).copyArray(this.rightRest);
    this.left.geometry.getAttribute("position").needsUpdate = true;
    this.right.geometry.getAttribute("position").needsUpdate = true;
    this.paint();
    this.resize = new ResizeObserver(() => this.measure());
    this.resize.observe(canvas.parentElement!);
    this.measure();
  }

  private onFailure: () => void;
  private onContextLost = (event: Event) => {
    event.preventDefault();
    if (!this.disposed) { cancelAnimationFrame(this.frame); this.onFailure(); }
  };

  private makeSheet() {
    // Photographed lighting is already baked into the printed page textures.
    const materials = Array.from({ length: 6 }, () => new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }));
    const mesh = createSheet(createSheetGeometry(), materials);
    this.book.add(mesh);
    return mesh;
  }

  private setMap(sheet: THREE.SkinnedMesh, face: 4 | 5, texture: THREE.CanvasTexture) {
    const materials = sheet.material as THREE.MeshBasicMaterial[];
    materials[face].map = texture;
    materials[face].needsUpdate = true;
  }

  makeTexture(canvas: HTMLCanvasElement) {
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    return texture;
  }

  show(pair: PrintedSpread, boxes: Box[]) {
    this.boxes = boxes;
    this.setMap(this.left, 5, pair.left);
    this.setMap(this.right, 4, pair.right);
    this.turning.visible = false;
    this.canvas.dataset.turnPhase = "idle";
    this.paint();
    this.publishProjection();
  }

  turn(direction: -1 | 1, from: PrintedSpread, to: PrintedSpread, boxes: Box[], done: () => void) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { this.show(to, boxes); done(); return; }
    this.setMap(this.left, 5, direction === 1 ? to.left : from.left);
    this.setMap(this.right, 4, direction === 1 ? from.right : to.right);
    this.setMap(this.turning, 4, direction === 1 ? to.right : from.right);
    this.setMap(this.turning, 5, direction === 1 ? from.left : to.left);
    this.turning.visible = true;
    this.turning.position.copy(this.left.position);
    this.turning.position.z += .0005;
    const start = performance.now();
    const animate = (time: number) => {
      if (this.disposed) return;
      const progress = Math.min(1, (time - start) / 1200);
      const eased = progress < .5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
      this.canvas.dataset.turnPhase = eased < .2 ? "early" : eased > .8 ? "late" : "middle";
      poseSheet(this.turning, rtlTurnAngle(direction, eased), Math.sin(progress * Math.PI) ** 2, direction);
      // The existing bone animation stays intact. Calibrated material positions
      // bridge the two photographed resting surfaces without a visible jump.
      const blend = direction === 1 ? eased : 1 - eased;
      const positions = this.turning.geometry.getAttribute("position");
      for (let i = 0; i < positions.count; i++) {
        const offset = i * 3;
        positions.setXYZ(i,
          this.leftRest[offset] * (1 - blend) + this.rightRest[offset] * blend,
          this.leftRest[offset + 1] * (1 - blend) + this.rightRest[offset + 1] * blend,
          this.leftRest[offset + 2] * (1 - blend) + this.rightRest[offset + 2] * blend);
      }
      positions.needsUpdate = true;
      const shade = 1 - .16 * Math.sin(progress * Math.PI) ** 2;
      for (const material of this.turning.material as THREE.MeshBasicMaterial[]) material.color.setRGB(shade, shade, shade);
      this.paint();
      if (progress < 1) this.frame = requestAnimationFrame(animate);
      else { this.show(to, boxes); done(); }
    };
    poseSheet(this.turning, rtlTurnAngle(direction, 0));
    this.frame = requestAnimationFrame(animate);
  }

  private measure() {
    if (this.disposed) return;
    this.width = Math.max(1, this.canvas.clientWidth);
    this.height = Math.max(1, this.canvas.clientHeight);
    this.renderer.setSize(this.width, this.height, false);
    const halfWidth = BOOK_WIDTH / (2 * PHOTO_SCALE);
    const halfHeight = halfWidth * this.height / this.width;
    this.camera.left = -halfWidth; this.camera.right = halfWidth;
    this.camera.top = halfHeight; this.camera.bottom = -halfHeight;
    this.camera.updateProjectionMatrix();
    this.paint();
    this.publishProjection();
  }

  private paint() {
    this.scene.updateMatrixWorld(true);
    this.renderer.clear();
    this.camera.layers.set(0);
    this.renderer.render(this.scene, this.camera);
    if (this.turning.visible) {
      // Calibrated sheets can intersect near the gutter while lifting and
      // landing. Draw the opaque moving sheet over the resting print, with
      // its own depth buffer so its front/back still occlude each other.
      this.renderer.clearDepth();
      this.camera.layers.set(1);
      this.renderer.render(this.scene, this.camera);
      this.camera.layers.set(0);
    }
  }

  private region(side: "left" | "right", u0 = 0, v0 = 0, u1 = 1, v1 = 1) {
    const points: string[] = [];
    const add = (u: number, v: number) => {
      const p = pagePoint(side, u, v);
      const scale = this.width / BOOK_WIDTH;
      const inset = (this.canvas.parentElement!.clientHeight - BOOK_HEIGHT * scale) / 2;
      points.push(`${points.length ? "L" : "M"}${(p.x * scale).toFixed(2)},${(p.y * scale + inset).toFixed(2)}`);
    };
    for (let i = 0; i <= 24; i++) add(u0 + (u1 - u0) * i / 24, v0);
    for (let i = 24; i >= 0; i--) add(u0 + (u1 - u0) * i / 24, v1);
    return points.join(" ") + " Z";
  }

  private publishProjection() {
    this.projection({ width: this.width, height: this.canvas.parentElement!.clientHeight, left: this.region("left"), products: this.boxes.map((box) => this.region("right", box.u, box.v, box.u + box.width, box.v + box.height)) });
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.resize.disconnect();
    this.canvas.removeEventListener("webglcontextlost", this.onContextLost);
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const maps = new Set<THREE.Texture>();
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        geometries.add(object.geometry);
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
          materials.add(material);
          if ((material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshBasicMaterial) && material.map) maps.add(material.map);
        }
        if (object instanceof THREE.SkinnedMesh) object.skeleton.dispose();
      }
      if (object instanceof THREE.DirectionalLight) object.shadow.dispose();
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    maps.forEach((texture) => texture.dispose());
    this.renderer.dispose();
  }
}
