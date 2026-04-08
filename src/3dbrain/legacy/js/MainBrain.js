/* eslint no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor": ["child", memories] }] */
import "./install-three-examples";

/* global THREE — provided by webpack ProvidePlugin (same instance examples patch). */
import { Power4, TweenMax } from "gsap-v1";
import AbstractApplication from "./views/AbstractApplication";
import Loaders from "./Loaders/Loaders";
import ThinkingAnimation from "./services/thinkingAnimation";
import GUI from "./services/gui";
import Font from "./services/font";
import ParticleSystem from "./services/particlesSystem";
import Memories from "./data/memories.json";

class MainBrain extends AbstractApplication {
  constructor(container, options = {}) {
    super(container, options);

    this._brainDisposed = false;
    this.brainOptions = options;

    this.clock = new THREE.Clock();
    this.addBrain = this.addBrain.bind(this);

    if (!this.brainOptions.particlesOnly) {
      this.addFloor();
      this.addIllumination();
      const w = Math.max(container.clientWidth, 1);
      const h = Math.max(container.clientHeight, 1);
      this.spotLight.shadow.camera.aspect = w / h;
      this.spotLight.shadow.camera.updateProjectionMatrix();
    } else {
      this.plane = null;
      this.spotLight = null;
      this.ambienlight = null;
    }

    this.deltaTime = 0;
    this.particlesColor = new THREE.Color(0xffffff);
    this.particlesStartColor = new THREE.Color(0xffffff);
    this.loaders = new Loaders(this.runAnimation.bind(this));
    this.memories = Memories;
    this.memorySelected = [
      "analytic",
      "episodic",
      "process",
      "semantic",
      "affective",
    ];
    this.frame = 0;
    this.frameName = 0;
    this.isRecording = false;
    this.gui = null;
    this.thinkingAnimation = null;

    /** particlesOnly: ray vs brain bounds → smooth uBurst on hover */
    this._burstHoverTarget = 0;
    this._mouseNdc = new THREE.Vector2();
    this._raycaster = new THREE.Raycaster();
    this._brainBurstCenter = null;
    this._brainBurstRadius = 1;
    this._onCanvasPointerLeave = null;
    this._onCanvasPointerMove = null;
    this._particlesPointerBurstAttached = false;
  }

  onContainerResize(w, h) {
    if (
      this.spotLight &&
      this.spotLight.shadow &&
      this.spotLight.shadow.camera
    ) {
      this.spotLight.shadow.camera.aspect = w / h;
      this.spotLight.shadow.camera.updateProjectionMatrix();
    }
  }

  addFloor() {
    const geometry = new THREE.PlaneBufferGeometry(20000, 20000);
    const material = new THREE.MeshPhongMaterial({
      opacity: 0.1,
      transparent: true,
    });
    this.plane = new THREE.Mesh(geometry, material);
    this.plane.receiveShadow = true;
    this.plane.material.color.setHex(0x111112);
    this.plane.position.y = -160;
    this.plane.rotation.x = -0.5 * Math.PI;
    this.scene.add(this.plane);
  }
  addIllumination() {
    this.ambienlight = new THREE.AmbientLight(0xb8c5cf, 0);
    this.scene.add(this.ambienlight);

    this.spotLight = new THREE.SpotLight(
      0xb8c5cf,
      1.45,
      175,
      Math.PI / 2,
      0.0,
      0.0
    );
    this.spotLight.position.set(0, 500, -10);
    this.spotLight.castShadow = true;

    this.spotLight.castShadow = true;
    const cw = Math.max(this._container.clientWidth, 1);
    const ch = Math.max(this._container.clientHeight, 1);
    this.spotLight.shadow = new THREE.LightShadow(
      new THREE.PerspectiveCamera(54, cw / ch, 1, 2000)
    );
    this.spotLight.shadow.bias = -0.000222;
    this.spotLight.shadow.mapSize.width = 1024;
    this.spotLight.shadow.mapSize.height = 1024;

    this.scene.add(this.spotLight);
    this.spotLightHelper = new THREE.SpotLightHelper(this.spotLight);
  }

  static decimateBrainPositions(bufferGeometry, stride) {
    const s = Math.max(1, Math.floor(stride));
    if (s === 1) return bufferGeometry;
    const attr = bufferGeometry.attributes.position;
    if (!attr) return bufferGeometry;
    const pos = attr.array;
    const n = pos.length / 3;
    const newN = Math.ceil(n / s);
    const out = new Float32Array(newN * 3);
    let o = 0;
    for (let i = 0; i < n; i += s) {
      const ix = i * 3;
      out[o++] = pos[ix];
      out[o++] = pos[ix + 1];
      out[o++] = pos[ix + 2];
    }
    const geom = new THREE.BufferGeometry();
    geom.addAttribute("position", new THREE.BufferAttribute(out, 3));
    return geom;
  }

  addBrain() {
    this.brainBufferGeometries = [];

    this.loaders.BRAIN_MODEL.traverse((child) => {
      if (child instanceof THREE.LineSegments) {
        this.memories.lines = {
          ...this.memories.lines,
          ...MainBrain.addLinesPath(child, this.memories),
        };
      }
      if (!(child instanceof THREE.Mesh)) {
        return;
      }
      child.geometry.verticesNeedUpdate = true;
      this.brainBufferGeometries.push(child.geometry);

      this.memories = {
        ...this.memories,
        ...MainBrain.storeBrainVertices(child, this.memories),
      };
    });

    this.endPointsCollections = THREE.BufferGeometryUtils.mergeBufferGeometries(
      this.brainBufferGeometries
    );
    const stride = this.brainOptions.particleStride ?? 3;
    this.endPointsCollections = MainBrain.decimateBrainPositions(
      this.endPointsCollections,
      stride
    );
  }

  startIntro() {
    if (this._brainDisposed || !this.particlesSystem) return;
    const progress = { p: 1000 };
    TweenMax.fromTo(
      progress,
      3.8,
      { p: 1000 },
      {
        p: 380,
        ease: Power4.easeInOut,
        onUpdate: () => {
          if (this._brainDisposed) return;
          this.camera.position.z = progress.p;
        },
        onStart: () => {
          if (this._brainDisposed) return;
          this.particlesSystem.transform(true);
        },
        onComplete: () => {
          if (this._brainDisposed) return;
          if (this.brainOptions.particlesOnly) {
            this._attachParticlesOnlyPointerBurst();
          } else {
            this.particlesSystem.xRay.material.uniforms.c.value = 1.0;
            this.startAutoDemo();
          }
        },
      }
    );
  }

  startAutoDemo() {
    if (this._brainDisposed) return;
    this.scene.add(this.particlesSystem.xRay);
    this.particlesSystem.isXRayActive(true);
  }

  static addLinesPath(mesh, memories) {
    const keys = Object.keys(memories.lines);
    keys.map((l) => {
      if (mesh.name.includes(l)) {
        memories.lines[l] = mesh.geometry.attributes.position.array;
        return memories.lines;
      }
      return [];
    });
  }

  static storeBrainVertices(mesh, memories) {
    const keys = Object.keys(memories);

    keys.map((m) => {
      if (mesh.name.includes(m)) {
        if (memories[m].length) {
          memories[m].push(mesh.geometry);
          memories[m] = [
            THREE.BufferGeometryUtils.mergeBufferGeometries(memories[m]),
          ];
          return memories;
        }
        return memories[m].push(mesh.geometry);
      }
      return [];
    });
  }

  runAnimation() {
    if (this.brainOptions.debug) {
      this.gui = new GUI(this);
    }
    this.addBrain();
    this.addParticlesSystem();
    this.font = new Font(this.loaders, this.scene);
    this.bubblesAnimation = {
      update() {},
      initAnimation() {},
      updateSubSystem() {},
      updateBurbleUp() {},
      animate() {},
    };

    if (!this.brainOptions.particlesOnly) {
      this.thinkingAnimation = new ThinkingAnimation(this);
      this.thinkingAnimation.initAnimation();
      this.thinkingAnimation.isActive(true);
    }

    this.startIntro();
    this.animate();
  }

  animate(timestamp) {
    if (this._brainDisposed) return;

    requestAnimationFrame(this.animate.bind(this));

    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.deltaTime += dt;

    this.orbitControls.update();
    const rot =
      this.gui && this.gui.controls ? this.gui.controls.rotationSpeed : 0.5;
    this.orbitControls.autoRotateSpeed = rot;

    this.particlesSystem.update(
      this.deltaTime,
      this.camera,
      this.particlesSystem.xRay
    );
    if (this.brainOptions.particlesOnly && this.particlesSystem) {
      const ub = this.particlesSystem.particles.material.uniforms.uBurst;
      const target = this._burstHoverTarget;
      const k = 1 - Math.exp(-dt * 11);
      ub.value += (target - ub.value) * k;
    }
    if (this.thinkingAnimation) {
      this.thinkingAnimation.update(this.camera, this.deltaTime);
    }

    this.stats.update();

    this.font.facingToCamera(this.camera);
    this.camera.updateProjectionMatrix();

    if (this.thinkingAnimation) {
      this.thinkingAnimation.flashing.geometry.verticesNeedUpdate = true;
      this.thinkingAnimation.flashing.geometry.attributes.position.needsUpdate = true;
    }

    if (this.brainOptions.particlesOnly) {
      this.renderer.render(this.scene, this.camera);
    } else {
      this.composer.render();
    }

    if (this.isRecording && this.socket) {
      if (this.frame > 10) {
        this.socket.emit("render-frame", {
          frame: (this.frameName += 1),
          file: document.querySelector("canvas").toDataURL(),
        });
      }
      this.frame += 1;
    }
  }
  onMouseMove(event) {
    this._updateBurstHoverFromPointer(event.clientX, event.clientY);
  }

  static computeBrainBoundingSphere(bufferGeometry) {
    const attr = bufferGeometry.attributes.position;
    if (!attr || !attr.array) {
      return { center: new THREE.Vector3(), radius: 120 };
    }
    const arr = attr.array;
    let minX = Infinity;
    let minY = Infinity;
    let minZ = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let maxZ = -Infinity;
    for (let i = 0; i < arr.length; i += 3) {
      const x = arr[i];
      const y = arr[i + 1];
      const z = arr[i + 2];
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      minZ = Math.min(minZ, z);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      maxZ = Math.max(maxZ, z);
    }
    const cx = (minX + maxX) * 0.5;
    const cy = (minY + maxY) * 0.5;
    const cz = (minZ + maxZ) * 0.5;
    const center = new THREE.Vector3(cx, cy, cz);
    let maxR = 0;
    for (let i = 0; i < arr.length; i += 3) {
      const dx = arr[i] - cx;
      const dy = arr[i + 1] - cy;
      const dz = arr[i + 2] - cz;
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d > maxR) maxR = d;
    }
    return { center, radius: Math.max(maxR, 1) };
  }

  _updateBurstHoverFromPointer(clientX, clientY) {
    if (
      !this.brainOptions.particlesOnly ||
      this._brainDisposed ||
      !this.particlesSystem ||
      !this._brainBurstCenter
    ) {
      return;
    }
    const canvas = this.renderer.domElement;
    const rect = canvas.getBoundingClientRect();
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      this._burstHoverTarget = 0;
      return;
    }
    this._mouseNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this._mouseNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this._raycaster.setFromCamera(this._mouseNdc, this.camera);
    const ray = this._raycaster.ray;
    const c = this._brainBurstCenter;
    const oc = new THREE.Vector3().subVectors(c, ray.origin);
    const t = Math.max(0, oc.dot(ray.direction));
    const closest = new THREE.Vector3()
      .copy(ray.direction)
      .multiplyScalar(t)
      .add(ray.origin);
    const dist = closest.distanceTo(c);
    const r = this._brainBurstRadius;
    const fullSpread = r * 0.42;
    const brainShape = r * 2.55;
    let burst = 0;
    if (dist <= fullSpread) {
      burst = 1;
    } else if (dist >= brainShape) {
      burst = 0;
    } else {
      burst = 1 - (dist - fullSpread) / (brainShape - fullSpread);
      burst = burst * burst * (3 - 2 * burst);
    }
    this._burstHoverTarget = burst;
  }

  _attachParticlesOnlyPointerBurst() {
    if (this._brainDisposed || !this.renderer) return;
    const sphere = MainBrain.computeBrainBoundingSphere(this.endPointsCollections);
    this._brainBurstCenter = sphere.center;
    this._brainBurstRadius = sphere.radius;

    this.particlesSystem.stopBurstPulseLoop();
    const mat = this.particlesSystem.particles.material;
    mat.uniforms.uBurst.value = 0;
    mat.uniforms.uScatterSeed.value = Math.random() * 2000.0;

    if (this._particlesPointerBurstAttached) return;
    this._particlesPointerBurstAttached = true;
    const canvas = this.renderer.domElement;
    this._onCanvasPointerLeave = () => {
      this._burstHoverTarget = 0;
    };
    this._onCanvasPointerMove = (e) => {
      this._updateBurstHoverFromPointer(e.clientX, e.clientY);
    };
    canvas.addEventListener("pointerleave", this._onCanvasPointerLeave, {
      passive: true,
    });
    canvas.addEventListener("pointermove", this._onCanvasPointerMove, {
      passive: true,
    });
  }

  addParticlesSystem() {
    this.particlesSystem = new ParticleSystem(
      this,
      this.endPointsCollections,
      this.memories
    );
    this.scene.add(this.particlesSystem.particles);
  }

  destroy() {
    if (this._brainDisposed) return;
    this._brainDisposed = true;
    if (this.renderer && this.renderer.domElement) {
      const canvas = this.renderer.domElement;
      if (this._onCanvasPointerLeave) {
        canvas.removeEventListener("pointerleave", this._onCanvasPointerLeave);
        this._onCanvasPointerLeave = null;
      }
      if (this._onCanvasPointerMove) {
        canvas.removeEventListener("pointermove", this._onCanvasPointerMove);
        this._onCanvasPointerMove = null;
      }
    }
    this._particlesPointerBurstAttached = false;
    if (this.particlesSystem) {
      this.particlesSystem.stopBurstPulseLoop();
    }
    if (typeof TweenMax.killAll === "function") {
      TweenMax.killAll(false, true, true);
    }
    this.disposeBase();
  }

  static getRandomPointOnSphere(r) {
    const u = THREE.Math.randFloat(0, 1);
    const v = THREE.Math.randFloat(0, 1);
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const x = r * Math.sin(theta) * Math.sin(phi);
    const y = r * Math.cos(theta) * Math.sin(phi);
    const z = r * Math.cos(phi);
    return {
      x,
      y,
      z,
    };
  }
}

export default MainBrain;
