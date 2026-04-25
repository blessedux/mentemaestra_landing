"use client";

import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";

import { cn } from "@/lib/utils";

/** r91 has no typings; `Mesh` exists at runtime. Split types so `<(` is not parsed as JSX. */
type ThreeMeshCtor = (typeof THREE)["Mesh"];
type ThreeMesh = InstanceType<ThreeMeshCtor>;

export type GLSLHillsProps = {
  width?: string;
  height?: string;
  cameraZ?: number;
  planeSize?: number;
  speed?: number;
  /** Max yaw (orbit) in radians when pointer is at screen edge. Default ~12.5° */
  hoverTiltYaw?: number;
  /** Max roll (dutch tilt) in radians at screen edge. Default ~2.5° */
  hoverTiltRoll?: number;
  /** Pointer smoothing; higher = snappier. Default 9 */
  hoverTiltSmoothing?: number;
  /** Extra “look down” from page scroll, in radians, at full scroll (see `scrollTiltDistance`). Default ~18° */
  scrollTiltMax?: number;
  /** `window.scrollY` over this many px → full extra pitch. Default one viewport height */
  scrollTiltDistance?: number;
  /** Scroll pitch smoothing; higher = snappier. Default 8 */
  scrollTiltSmoothing?: number;
  /**
   * When set (e.g. a hero `<section>` ref), pointer tilt uses this element’s bounds and
   * listeners so the WebGL wrapper can use `pointer-events-none` and copy stays clickable.
   */
  interactionRootRef?: RefObject<HTMLElement | null>;
  className?: string;
};

export default function GLSLHills({
  width = "100%",
  height = "100%",
  cameraZ = 125,
  planeSize = 256,
  speed = 0.5,
  hoverTiltYaw = 0.22,
  hoverTiltRoll = 0.044,
  hoverTiltSmoothing = 9,
  scrollTiltMax = 0.31,
  scrollTiltDistance,
  scrollTiltSmoothing = 8,
  interactionRootRef,
  className,
}: GLSLHillsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    class Plane {
      uniforms: { time: { type: "f"; value: number } };
      mesh: ThreeMesh;
      time: number;

      constructor() {
        this.uniforms = {
          time: { type: "f", value: 0 },
        };
        this.mesh = this.createMesh();
        this.time = speed;
      }

      createMesh() {
        return new THREE.Mesh(
          new THREE.PlaneGeometry(planeSize, planeSize, planeSize, planeSize),
          new THREE.RawShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: `
              #define GLSLIFY 1
              attribute vec3 position;
              uniform mat4 projectionMatrix;
              uniform mat4 modelViewMatrix;
              uniform float time;
              varying vec3 vPosition;

              mat4 rotateMatrixX(float radian) {
                return mat4(
                  1.0, 0.0, 0.0, 0.0,
                  0.0, cos(radian), -sin(radian), 0.0,
                  0.0, sin(radian), cos(radian), 0.0,
                  0.0, 0.0, 0.0, 1.0
                );
              }

              vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
              vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
              vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
              vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
              vec3 fade(vec3 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

              float cnoise(vec3 P) {
                vec3 Pi0 = floor(P);
                vec3 Pi1 = Pi0 + vec3(1.0);
                Pi0 = mod289(Pi0);
                Pi1 = mod289(Pi1);
                vec3 Pf0 = fract(P);
                vec3 Pf1 = Pf0 - vec3(1.0);
                vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
                vec4 iy = vec4(Pi0.yy, Pi1.yy);
                vec4 iz0 = Pi0.zzzz;
                vec4 iz1 = Pi1.zzzz;

                vec4 ixy = permute(permute(ix) + iy);
                vec4 ixy0 = permute(ixy + iz0);
                vec4 ixy1 = permute(ixy + iz1);

                vec4 gx0 = ixy0 * (1.0 / 7.0);
                vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
                gx0 = fract(gx0);
                vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
                vec4 sz0 = step(gz0, vec4(0.0));
                gx0 -= sz0 * (step(0.0, gx0) - 0.5);
                gy0 -= sz0 * (step(0.0, gy0) - 0.5);

                vec4 gx1 = ixy1 * (1.0 / 7.0);
                vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
                gx1 = fract(gx1);
                vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
                vec4 sz1 = step(gz1, vec4(0.0));
                gx1 -= sz1 * (step(0.0, gx1) - 0.5);
                gy1 -= sz1 * (step(0.0, gy1) - 0.5);

                vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
                vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
                vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
                vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
                vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
                vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
                vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
                vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

                vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
                g000 *= norm0.x;
                g010 *= norm0.y;
                g100 *= norm0.z;
                g110 *= norm0.w;
                vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
                g001 *= norm1.x;
                g011 *= norm1.y;
                g101 *= norm1.z;
                g111 *= norm1.w;

                float n000 = dot(g000, Pf0);
                float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
                float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
                float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
                float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
                float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
                float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
                float n111 = dot(g111, Pf1);

                vec3 fade_xyz = fade(Pf0);
                vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
                vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
                float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
                return 2.2 * n_xyz;
              }

              void main(void) {
                vec3 updatePosition = (rotateMatrixX(radians(90.0)) * vec4(position, 1.0)).xyz;
                float sin1 = sin(radians(updatePosition.x / 128.0 * 90.0));
                vec3 noisePosition = updatePosition + vec3(0.0, 0.0, time * -30.0);
                float noise1 = cnoise(noisePosition * 0.08);
                float noise2 = cnoise(noisePosition * 0.06);
                float noise3 = cnoise(noisePosition * 0.4);
                vec3 lastPosition = updatePosition + vec3(0.0,
                  noise1 * sin1 * 8.0
                  + noise2 * sin1 * 8.0
                  + noise3 * (abs(sin1) * 2.0 + 0.5)
                  + pow(sin1, 2.0) * 40.0, 0.0);

                vPosition = lastPosition;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(lastPosition, 1.0);
              }
            `,
            fragmentShader: `
              precision highp float;
              #define GLSLIFY 1
              varying vec3 vPosition;

              void main(void) {
                float opacity = (96.0 - length(vPosition)) / 256.0 * 0.6;
                vec3 color = vec3(0.6);
                gl_FragColor = vec4(color, opacity);
              }
            `,
            transparent: true,
          })
        );
      }

      render(time: number) {
        this.uniforms.time.value += time * this.time;
      }
    }

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
    });
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 1, 10000);
    const clock = new THREE.Clock();
    const plane = new Plane();

    /** Same framing as pre–hover-tilt: position (0,16,cz), lookAt (0,28,0). Yaw = orbit around world Y through lookTarget; roll = rotateZ after lookAt. */
    const lookTarget = new THREE.Vector3(0, 28, 0);
    const baseOffset = new THREE.Vector3(0, 16 - 28, cameraZ);
    const yAxis = new THREE.Vector3(0, 1, 0);
    const rotatedOffset = new THREE.Vector3();

    let pointerTargetX = 0;
    let pointerSmoothedX = 0;

    const scrollDistance =
      scrollTiltDistance ??
      (typeof window !== "undefined" ? window.innerHeight : 800);

    let scrollTargetPitch = 0;
    let scrollSmoothedPitch = 0;

    const onScroll = () => {
      const y = typeof window !== "undefined" ? window.scrollY : 0;
      scrollTargetPitch = Math.min(1, Math.max(0, y / Math.max(scrollDistance, 1)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const pointerRoot = () => interactionRootRef?.current ?? container;

    const onPointerMove = (ev: PointerEvent) => {
      // Ignore touch-generated pointer events — hover tilt is mouse-only.
      if (ev.pointerType === "touch") return;
      const root = pointerRoot();
      const rect = root.getBoundingClientRect();
      const w = Math.max(rect.width, 1);
      const nx = ((ev.clientX - rect.left) / w) * 2 - 1;
      pointerTargetX = Math.max(-1, Math.min(1, nx));
    };
    const onPointerLeave = (ev: PointerEvent) => {
      if (ev.pointerType === "touch") return;
      pointerTargetX = 0;
    };
    const pr = pointerRoot();
    // { passive: true } — we never call preventDefault, so mark as passive to
    // unblock scroll on Chrome/Android immediately instead of waiting for the handler.
    pr.addEventListener("pointermove", onPointerMove, { passive: true });
    pr.addEventListener("pointerleave", onPointerLeave, { passive: true });

    let raf = 0;
    let disposed = false;
    let visible = true;

    const applySize = (w: number, h: number) => {
      if (w <= 0 || h <= 0) return;
      // Cap DPR lower on narrow/mobile viewports to ease GPU pressure.
      const dprCap = w < 768 ? 1.25 : 2;
      const pr = Math.min(window.devicePixelRatio || 1, dprCap);
      renderer.setPixelRatio(pr);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };

    const resizeFromContainer = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      applySize(w, h);
    };

    const renderFrame = () => {
      const dt = clock.getDelta();
      plane.render(dt);
      const hoverSmooth = 1 - Math.exp(-dt * hoverTiltSmoothing);
      pointerSmoothedX += (pointerTargetX - pointerSmoothedX) * hoverSmooth;
      const scrollSmooth = 1 - Math.exp(-dt * scrollTiltSmoothing);
      const scrollPitchTarget = scrollTargetPitch * scrollTiltMax;
      scrollSmoothedPitch += (scrollPitchTarget - scrollSmoothedPitch) * scrollSmooth;

      const yaw = -pointerSmoothedX * hoverTiltYaw;
      const roll = pointerSmoothedX * hoverTiltRoll;
      rotatedOffset.copy(baseOffset).applyAxisAngle(yAxis, yaw);
      camera.position.copy(lookTarget).add(rotatedOffset);
      camera.up.set(0, 1, 0);
      camera.lookAt(lookTarget);
      // Negative X = nose down in Three.js Y-up after lookAt.
      camera.rotateX(-scrollSmoothedPitch);
      camera.rotateZ(roll);
      renderer.render(scene, camera);
    };

    const scheduleLoop = () => {
      if (disposed || !visible || document.hidden) return;
      renderFrame();
      raf = requestAnimationFrame(scheduleLoop);
    };

    const pauseLoop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const resumeLoop = () => {
      if (disposed || raf !== 0) return;
      resizeFromContainer();
      scheduleLoop();
    };

    // Pause when hero scrolls off-screen; resume when it re-enters.
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) resumeLoop();
        else pauseLoop();
      },
      { root: null, rootMargin: "80px", threshold: 0 },
    );
    io.observe(container);

    // Pause when the tab is backgrounded.
    const onVisibilityChange = () => {
      if (document.hidden) pauseLoop();
      else resumeLoop();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    renderer.setClearColor(0x000000, 0);
    scene.add(plane.mesh);

    const ro = new ResizeObserver(() => {
      resizeFromContainer();
    });
    ro.observe(container);
    resizeFromContainer();
    scheduleLoop();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      pr.removeEventListener("pointermove", onPointerMove);
      pr.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      io.disconnect();
      ro.disconnect();
      renderer.dispose();
      plane.mesh.geometry.dispose();
      const mat = plane.mesh.material as { dispose: () => void };
      mat.dispose();
    };
  }, [
    cameraZ,
    hoverTiltRoll,
    hoverTiltSmoothing,
    hoverTiltYaw,
    planeSize,
    scrollTiltDistance,
    scrollTiltMax,
    scrollTiltSmoothing,
    speed,
    interactionRootRef,
  ]);

  return (
    <div
      ref={containerRef}
      className={cn("relative", className)}
      style={{ width, height }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          display: "block",
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
}
