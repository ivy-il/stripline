import * as THREE from "three";
import { createSheet, createSheetGeometry, poseSheet, rtlTurnAngle, PAGE_HEIGHT, PAGE_WIDTH } from "./book-geometry";

export type PrintedSpread = { left: THREE.CanvasTexture; right: THREE.CanvasTexture };

/** How far the canvas extends past the open pages, as a fraction of their width / height.
 * A lifted sheet rises toward the camera and so projects outside the resting spread.
 * The album CSS (.album-canvas) uses the same numbers. */
export const FLAT_OVERFLOW = { x: .06, y: .3 };
const CAMERA_DISTANCE = 12;

/** The paper is drawn at least twice the CSS size and scaled down by the browser: canvas type has
 * no hinting, so at 1:1 on an ordinary screen small text comes out soft. */
export const flatPixelRatio = () => Math.min(3, Math.max(2, window.devicePixelRatio || 1));

/**
 * The album seen from directly above: two resting sheets and one turning sheet that bends as
 * it lifts over the binding. The photographed cover and page blocks are a CSS background;
 * this scene only draws the paper.
 */
export class FlatBookScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(20, 1, .1, 60);
  private left: THREE.SkinnedMesh;
  private right: THREE.SkinnedMesh;
  private turning: THREE.SkinnedMesh;
  private shadow: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private resize: ResizeObserver;
  private frame = 0;
  private disposed = false;

  constructor(private canvas: HTMLCanvasElement, private onFailure: () => void) {
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(flatPixelRatio());
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.autoClear = false;
    this.canvas.addEventListener("webglcontextlost", this.onContextLost);
    this.camera.position.set(0, 0, CAMERA_DISTANCE);
    this.camera.lookAt(0, 0, 0);
    this.left = this.makeSheet();
    this.right = this.makeSheet();
    this.turning = this.makeSheet();
    this.turning.layers.set(1);
    this.turning.visible = false;
    poseSheet(this.left, -Math.PI);
    poseSheet(this.right, 0);
    // The turning sheet dims the spread beneath it.
    this.shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(PAGE_WIDTH * 2, PAGE_HEIGHT),
      new THREE.MeshBasicMaterial({ color: 0x1b1917, transparent: true, opacity: 0, depthTest: false, depthWrite: false }),
    );
    this.shadow.position.z = .3;
    this.shadow.renderOrder = 2;
    this.scene.add(this.shadow);
    this.resize = new ResizeObserver(() => this.measure());
    this.resize.observe(canvas);
    this.measure();
  }

  private onContextLost = (event: Event) => {
    event.preventDefault();
    if (!this.disposed) { cancelAnimationFrame(this.frame); this.onFailure(); }
  };

  private makeSheet() {
    const materials = Array.from({ length: 6 }, () => new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }));
    const mesh = createSheet(createSheetGeometry(), materials);
    // The resting bulge shortens the sheet's footprint; widen it to reach the page block.
    mesh.scale.x = 1.012;
    this.scene.add(mesh);
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
    // Pages are printed at their displayed size; mipmaps would only soften the resting type.
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    return texture;
  }

  show(pair: PrintedSpread) {
    this.setMap(this.left, 5, pair.left);
    this.setMap(this.right, 4, pair.right);
    this.turning.visible = false;
    this.shadow.material.opacity = 0;
    this.paint();
  }

  turn(direction: -1 | 1, from: PrintedSpread, to: PrintedSpread, done: () => void) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { this.show(to); done(); return; }
    this.setMap(this.left, 5, direction === 1 ? to.left : from.left);
    this.setMap(this.right, 4, direction === 1 ? from.right : to.right);
    this.setMap(this.turning, 4, direction === 1 ? to.right : from.right);
    this.setMap(this.turning, 5, direction === 1 ? from.left : to.left);
    this.turning.visible = true;
    const start = performance.now();
    const animate = (time: number) => {
      if (this.disposed) return;
      const progress = Math.min(1, (time - start) / 1200);
      const eased = progress < .5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
      const lift = Math.sin(progress * Math.PI) ** 2;
      poseSheet(this.turning, rtlTurnAngle(direction, eased), lift, direction);
      const shade = 1 - .16 * lift;
      for (const material of this.turning.material as THREE.MeshBasicMaterial[]) material.color.setRGB(shade, shade, shade);
      this.shadow.material.opacity = .14 * lift;
      this.paint();
      if (progress < 1) this.frame = requestAnimationFrame(animate);
      else { this.show(to); done(); }
    };
    poseSheet(this.turning, rtlTurnAngle(direction, 0));
    this.frame = requestAnimationFrame(animate);
  }

  private measure() {
    if (this.disposed) return;
    const width = Math.max(1, this.canvas.clientWidth);
    const height = Math.max(1, this.canvas.clientHeight);
    this.renderer.setSize(width, height, false);
    // The resting spread spans exactly the un-overflowed part of the canvas.
    const visibleWidth = PAGE_WIDTH * 2 * (1 + 2 * FLAT_OVERFLOW.x);
    const halfHeight = visibleWidth * height / width / 2;
    this.camera.aspect = width / height;
    this.camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(halfHeight / CAMERA_DISTANCE));
    this.camera.updateProjectionMatrix();
    this.paint();
  }

  private paint() {
    this.scene.updateMatrixWorld(true);
    this.renderer.clear();
    this.camera.layers.set(0);
    this.renderer.render(this.scene, this.camera);
    if (this.turning.visible) {
      // The moving sheet is drawn over the resting print with its own depth buffer.
      this.renderer.clearDepth();
      this.camera.layers.set(1);
      this.renderer.render(this.scene, this.camera);
      this.camera.layers.set(0);
    }
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.resize.disconnect();
    this.canvas.removeEventListener("webglcontextlost", this.onContextLost);
    this.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.geometry.dispose();
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) material.dispose();
      if (object instanceof THREE.SkinnedMesh) object.skeleton.dispose();
    });
    this.renderer.dispose();
  }
}
