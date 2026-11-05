import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { animateVolumeSheet, createVolumeGeometry, createVolumeSheet, positionVolumeSheet, VOLUME_DEPTH, VOLUME_HEIGHT } from "./catalog-book-geometry";

const HEIGHT = VOLUME_HEIGHT;
const GAP = VOLUME_DEPTH * 1.18;

/** A complete bound volume: each leaf has two printed faces and its own skeleton. */
export class CatalogBookScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(35, 1, .1, 80);
  private controls: OrbitControls;
  private book = new THREE.Group();
  private binding = new THREE.Group();
  private sheets: THREE.SkinnedMesh[] = [];
  private textures = new Map<number, THREE.CanvasTexture>();
  private geometry = createVolumeGeometry();
  private spine: THREE.Mesh;
  private lastTime = 0;
  private roughness: THREE.Texture;
  private observer: ResizeObserver;
  private frame = 0;
  private cursor = 0;
  private animation: { from: number; to: number; start: number; done: () => void } | null = null;
  private disposed = false;
  private reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  readonly count: number;

  constructor(private canvas: HTMLCanvasElement, faceCount: number, private fail: () => void) {
    this.count = faceCount / 2;
    this.renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true, powerPreference:"high-performance"});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = .95;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.camera.position.set(0, 0, 8.5);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.controls.minDistance = 6;
    this.controls.maxDistance = 18;
    this.controls.minPolarAngle = Math.PI * .22;
    this.controls.maxPolarAngle = Math.PI * .72;
    this.controls.target.set(0, 0, 0);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xa59a87, 1.4));
    const key = new THREE.DirectionalLight(0xffffff, 2);
    key.position.set(-3, 7, 6); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -7; key.shadow.camera.right = 7;
    key.shadow.camera.top = 7; key.shadow.camera.bottom = -7;
    key.shadow.bias = -.0004;
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, .5);
    fill.position.set(5, 1, -3); this.scene.add(fill);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.ShadowMaterial({opacity:.17}));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -HEIGHT / 2 - .01; floor.receiveShadow = true;
    this.scene.add(floor);
    // Default pose faces the viewer head-on; orbit controls still allow turning it.
    this.book.rotation.set(0, 0, 0);
    this.book.scale.x = -1;
    this.binding.rotation.y = -Math.PI / 2;
    this.book.add(this.binding);
    this.scene.add(this.book);
    // Linen grain preserves the source's tactile cover without its Wawa logo pattern.
    const grain = new Uint8Array(128 * 128 * 4);
    for (let i = 0; i < 128 * 128; i++) {
      const value = 180 + ((i * 17 + Math.floor(i / 128) * 31) % 23);
      grain.set([value, value, value, 255], i * 4);
    }
    this.roughness = new THREE.DataTexture(grain, 128, 128);
    this.roughness.needsUpdate = true;
    for (let i = 0; i < this.count; i++) {
      const cover = i === 0 || i === this.count - 1;
      const materials = Array.from({length:6}, (_, face) => new THREE.MeshPhysicalMaterial({
        color:face < 4 ? (cover ? "#302c26" : "#eee9dd") : "#fffdf8",
        roughness:cover ? .8 : .85, roughnessMap:cover && face >= 4 ? this.roughness : null, metalness:0,
        specularIntensity:face >= 4 ? .05 : .3,
      }));
      const sheet = createVolumeSheet(this.geometry, materials);
      // Keep the floor shadow, without shadow-map acne on thin stacked paper.
      sheet.receiveShadow = false;
      sheet.userData.leaf = i;
      this.sheets.push(sheet); this.binding.add(sheet);
    }
    this.spine = new THREE.Mesh(new THREE.BoxGeometry(.018, HEIGHT, this.count * GAP), new THREE.MeshStandardMaterial({color:"#302c26",roughness:.8}));
    this.binding.add(this.spine);
    canvas.addEventListener("webglcontextlost", this.contextLost);
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas);
    this.resize();
    this.updatePose(0, 0, -1, 0, true);
    this.tick(0);
  }

  private contextLost = (event: Event) => { event.preventDefault(); this.fail(); };
  private resize() {
    const w = Math.max(1, this.canvas.clientWidth), h = Math.max(1, this.canvas.clientHeight);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // Keep the complete open volume visible on narrow screens.
    this.camera.fov = w / h < 1.1 ? 53 : 35;
    this.camera.position.set(0, 0, w / h < 1.1 ? 11 : 8.5);
    this.camera.updateProjectionMatrix();
  }

  setTexture(face: number, source: HTMLCanvasElement) {
    if (this.disposed || this.textures.has(face)) return;
    const texture = new THREE.CanvasTexture(source);
    texture.colorSpace = THREE.SRGBColorSpace;
    // Counter-mirror the print while the physical volume reads right to left.
    texture.repeat.x = -1; texture.offset.x = 1;
    texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    this.textures.set(face, texture);
    const material = (this.sheets[Math.floor(face / 2)].material as THREE.MeshStandardMaterial[])[face % 2 ? 5 : 4];
    material.map = texture; material.needsUpdate = true;
  }

  private trimTextures() {
    for (const [face, texture] of this.textures) {
      if (face === 0 || face === this.count * 2 - 1 || Math.abs(face - this.cursor * 2) <= 5) continue;
      const material = (this.sheets[Math.floor(face / 2)].material as THREE.MeshStandardMaterial[])[face % 2 ? 5 : 4];
      material.map = null; material.needsUpdate = true;
      texture.dispose(); this.textures.delete(face);
    }
  }

  hasTexture(face: number) { return this.textures.has(face); }

  turn(to: number, done: () => void) {
    if (this.animation || to < 0 || to > this.count || to === this.cursor) return;
    if (this.reduced) { this.cursor = to; this.updatePose(to, 0, -1, 0, true); this.trimTextures(); done(); return; }
    this.animation = {from:this.cursor, to, start:performance.now(), done};
    this.canvas.dataset.turning = "true";
  }

  private updatePose(cursor: number, delta: number, moving = -1, curl = 0, immediate = false) {
    const closed = cursor === 0 || cursor === this.count;
    for (let i = 0; i < this.count; i++) {
      const mesh = this.sheets[i];
      const turned = i < cursor;
      animateVolumeSheet(mesh, turned, closed, i, i === moving ? curl : 0, delta, immediate);
      // Follow each leaf's actual normal. The source's fixed Z offsets become
      // coplanar after closing the cover, causing visible depth interference.
      const offset = (cursor - i) * GAP;
      positionVolumeSheet(mesh, offset);
    }
    const bindingAngle = this.sheets[Math.min(cursor, this.count - 1)].rotation.y;
    const bindingOffset = (cursor - this.count / 2) * GAP;
    this.spine.rotation.y = bindingAngle;
    this.spine.position.set(Math.sin(bindingAngle) * bindingOffset, 0, Math.cos(bindingAngle) * bindingOffset);
    const closedCenter = cursor === 0 ? 1.5 : cursor === this.count ? -1.5 : 0;
    this.book.position.x = closedCenter;
  }

  private tick = (time: number) => {
    if (this.disposed) return;
    const delta = Math.min(.05, Math.max(.001, (time - this.lastTime) / 1000));
    this.lastTime = time;
    const a = this.animation;
    if (a) {
      const distance = Math.abs(a.to - a.from);
      const stepDelay = distance > 2 ? 50 : 150;
      const elapsed = time - a.start;
      const linear = Math.min(1, elapsed / (1300 + (distance - 1) * stepDelay));
      const eased = linear * linear * (3 - 2 * linear);
      const direction = a.to > a.from ? 1 : -1;
      const steps = Math.min(distance, Math.floor(elapsed / stepDelay) + 1);
      const delayedPage = a.from + direction * steps;
      const turningTime = Math.sin(Math.min(1, (elapsed - (steps - 1) * stepDelay) / 400) * Math.PI);
      this.updatePose(delayedPage, delta, direction === 1 ? delayedPage - 1 : delayedPage, turningTime);
      const fromCenter = a.from === 0 ? 1.5 : a.from === this.count ? -1.5 : 0;
      const toCenter = a.to === 0 ? 1.5 : a.to === this.count ? -1.5 : 0;
      this.book.position.x = THREE.MathUtils.lerp(fromCenter, toCenter, eased);
      if (linear >= 1) {
        this.cursor = a.to; this.animation = null; this.trimTextures();
        this.canvas.dataset.turning = "false"; a.done();
      }
    } else this.updatePose(this.cursor, delta, -1, 0, this.reduced);
    this.book.position.y = 0;
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.frame = requestAnimationFrame(this.tick);
  };

  pick(clientX: number, clientY: number): number | null {
    if (this.animation) return null;
    const bounds = this.canvas.getBoundingClientRect();
    const ray = new THREE.Raycaster();
    for (const sheet of this.sheets) sheet.computeBoundingSphere();
    ray.setFromCamera(new THREE.Vector2((clientX - bounds.left) / bounds.width * 2 - 1, -(clientY - bounds.top) / bounds.height * 2 + 1), this.camera);
    const hit = ray.intersectObjects(this.sheets)[0];
    if (!hit || !hit.face || hit.face.materialIndex < 4) return null;
    return hit.object.userData.leaf * 2 + (hit.face.materialIndex === 5 ? 1 : 0);
  }

  resetView() { this.camera.position.set(0, 0, this.camera.aspect < 1.1 ? 11 : 8.5); this.controls.target.set(0, 0, 0); this.controls.update(); }

  dispose() {
    this.disposed = true; cancelAnimationFrame(this.frame); this.observer.disconnect();
    this.canvas.removeEventListener("webglcontextlost", this.contextLost);
    this.controls.dispose();
    for (const texture of this.textures.values()) texture.dispose();
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry !== this.geometry) object.geometry.dispose();
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) material.dispose();
        if (object instanceof THREE.SkinnedMesh) object.skeleton.dispose();
      }
    });
    this.roughness.dispose(); this.geometry.dispose(); this.renderer.dispose();
  }
}
