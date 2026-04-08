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

    this._introTimer = setTimeout(() => {
      if (this._brainDisposed) return;
      this.startIntro();
    }, 400);

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
    if (this._brainDisposed) return;
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
            this.particlesSystem.startBurstPulseLoop();
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
    const y = window.innerHeight - event.clientY;
    const x = window.innerHeight - event.clientX;
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
    if (this._introTimer) {
      clearTimeout(this._introTimer);
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
