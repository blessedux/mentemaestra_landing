import "../install-three-examples";

/* global THREE — provided by webpack ProvidePlugin (same instance examples patch). */

import Stats from "three/examples/js/libs/stats.min";
import {
  EffectComposer,
  RenderPass,
  BloomPass,
  MaskPass,
} from "postprocessing";

class AbstractApplication {
  constructor(container, options = {}) {
    this._container = container;
    this._brainOptions = options;
    this._boundMouseMove = this.onMouseMove.bind(this);
    this._disposed = false;

    const w = Math.max(container.clientWidth, 1);
    const h = Math.max(container.clientHeight, 1);

    this.a_camera = new THREE.PerspectiveCamera(50, w / h, 1, 1000);
    this.a_camera.position.z = 1000;

    this.a_scene = new THREE.Scene();
    // Match site: Stack section `bg-zinc-900/50` over page `#0a0a0a` → rgb(17,17,18)
    this.a_scene.background = new THREE.Color(0x111112);

    this.a_blurScene = new THREE.Scene();
    this.a_bloomScene = new THREE.Scene();

    const particlesOnly = Boolean(options.particlesOnly);
    this._particlesOnly = particlesOnly;
    /** When false (landing): no wheel-zoom or pan; drag still rotates (mouse + touch). */
    this._orbitZoomEnabled = options.enableOrbitZoom !== false;
    const embedLight = particlesOnly && !this._orbitZoomEnabled;

    if (!particlesOnly) {
      this.a_scene.fog = new THREE.Fog(0x111112, 300, 1300);
    }

    this.a_renderer = new THREE.WebGLRenderer({
      antialias: !embedLight,
      alpha: true,
      preserveDrawingBuffer: false,
      logarithmicDepthBuffer: !embedLight,
      powerPreference: embedLight ? "low-power" : "high-performance",
    });
    const pr = Math.min(
      typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
      embedLight ? 1.25 : 2,
    );
    this.a_renderer.setPixelRatio(pr);
    this.a_renderer.setSize(w, h);
    this.a_renderer.sortObjects = false;
    this.a_renderer.setClearColor(0x00000, 0.0);

    this.a_renderer.shadowMap.enabled = !particlesOnly;
    this.a_renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.a_renderer.gammaInput = true;
    this.a_renderer.gammaOutput = true;
    this.a_renderer.shadowDepthMaterialSide = THREE.BackSide;

    if (!particlesOnly) {
      this.composer = new EffectComposer(this.a_renderer, {
        stencilBuffer: true,
        depthTexture: true,
      });

      this.renderPass = new RenderPass(this.scene, this.camera);
      this.composer.addPass(this.renderPass);

      this.bloomPass = new BloomPass({
        resolutionScale: 0.7,
        resolution: 2.9,
        intensity: 1.35,
        distinction: 9.0,
        blend: true,
      });

      this.bloomPass.renderToScreen = true;
      this.composer.addPass(this.bloomPass);

      this.blurMask = new MaskPass(this.blurScene, this.camera);
      this.renderPass2 = new RenderPass(this.blurScene, this.camera);
    } else {
      this.composer = null;
      this.renderPass = null;
      this.bloomPass = null;
      this.blurMask = null;
      this.renderPass2 = null;
    }

    container.appendChild(this.a_renderer.domElement);

    const debug = Boolean(options.debug);
    if (debug) {
      this.stats = AbstractApplication.initStats(container);
    } else {
      this.stats = { update: () => {} };
    }

    // OrbitControls is not in the default `three` build; legacy script patches `THREE`.
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- sync side-effect before ctor
    require("three/examples/js/controls/OrbitControls");
    this.orbitControls = new THREE.OrbitControls(
      this.camera,
      this.a_renderer.domElement,
    );
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.25;
    this.orbitControls.enableZoom = this._orbitZoomEnabled;
    this.orbitControls.enablePan = this._orbitZoomEnabled;
    this.orbitControls.zoomSpeed = 0.1;
    this.orbitControls.panSpeed = 0.1;
    this.orbitControls.minDistance = 50;
    this.orbitControls.maxDistance = 2500;
    this.orbitControls.autoRotate = true;
    this.orbitControls.autoRotateSpeed = 0.5;
    this.orbitControls.rotateSpeed = 0.1;
    this.orbitControls.screenSpacePanning = true;
    const canvas = this.a_renderer.domElement;
    /** Let one-finger drag rotate on touch; scroll the page from outside the canvas. */
    canvas.style.touchAction = "none";

    this._resize = () => {
      if (this._disposed || !this._container) return;
      const rw = Math.max(this._container.clientWidth, 1);
      const rh = Math.max(this._container.clientHeight, 1);
      this.a_camera.aspect = rw / rh;
      this.a_camera.updateProjectionMatrix();
      this.a_renderer.setSize(rw, rh);
      if (
        this.composer &&
        typeof this.composer.setSize === "function"
      ) {
        this.composer.setSize(rw, rh);
      }
      if (typeof this.onContainerResize === "function") {
        this.onContainerResize(rw, rh);
      }
    };

    this._resizeObserver = new ResizeObserver(() => this._resize());
    this._resizeObserver.observe(container);

    window.addEventListener("resize", this._resize, false);
    window.addEventListener("mousemove", this._boundMouseMove, false);
  }

  get renderer() {
    return this.a_renderer;
  }

  get camera() {
    return this.a_camera;
  }

  get scene() {
    return this.a_scene;
  }

  get blurScene() {
    return this.a_blurScene;
  }
  get bloomScene() {
    return this.a_bloomScene;
  }

  static initStats(render) {
    const stats = new Stats();
    stats.setMode(0);
    stats.domElement.style.position = "absolute";
    stats.domElement.style.left = "0px";
    stats.domElement.style.top = "0px";
    render.appendChild(stats.domElement);
    return stats;
  }

  static onMouseMove(e) {}
  onWindowResize() {
    this._resize();
  }

  disposeBase() {
    if (this._disposed) return;
    this._disposed = true;
    window.removeEventListener("resize", this._resize, false);
    window.removeEventListener("mousemove", this._boundMouseMove, false);
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    if (this.orbitControls) {
      this.orbitControls.dispose();
    }
    if (this.stats && this.stats.domElement && this.stats.domElement.parentNode) {
      this.stats.domElement.parentNode.removeChild(this.stats.domElement);
    }
    if (this.a_renderer) {
      this.a_renderer.dispose();
      const el = this.a_renderer.domElement;
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    }
  }

  animate(timestamp) {
    requestAnimationFrame(this.animate.bind(this));
    this.a_renderer.render(this.a_scene, this.a_camera);
  }
}

export default AbstractApplication;
