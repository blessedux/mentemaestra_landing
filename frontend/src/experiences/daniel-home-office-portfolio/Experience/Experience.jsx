"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import gsap from "gsap";
import Scene from "./Scene";
import { Canvas, useThree } from "@react-three/fiber";

import { OrthographicCamera, OrbitControls } from "@react-three/drei";
import { RoomCameraNavProvider } from "./RoomCameraNavContext";
import { useResponsiveStore } from "../stores/useResponsiveStore";
import { useExperienceStore } from "../stores/experienceStore";

/** Ortho zoom: lower = wider field (zoomed out). Only applied in landing embed where the box feels tight. */
const EMBEDDED_ZOOM_FACTOR = 0.6;

/** Canvas extends past the embed box on each side (0.18 → 136% width/height) so the room can bleed visually. */
const EMBEDDED_CANVAS_OVERSCAN = 0.18;

/**
 * Value that falls through `OrbitControls` two-touch `switch` default so the stock two-finger dolly/pan
 * state machine stays idle (we drive pinch zoom ourselves when embedded).
 */
const TOUCH_TWO_INACTIVE = 4;

/**
 * Narrow embedded landing: map one-finger drag on the canvas to `pointerRef` (same parallax as hover).
 * OrbitControls stay disabled so pan/zoom never steal the gesture.
 */
function EmbeddedPointerRefTouchSync({ pointerRef, enabled }) {
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);

  React.useEffect(() => {
    if (!enabled) return undefined;
    const el = gl.domElement;
    const apply = (clientX, clientY) => {
      pointerRef.current.x = (clientX / window.innerWidth) * 2 - 1;
      pointerRef.current.y = -(clientY / window.innerHeight) * 2 + 1;
      invalidate();
    };
    const onTouchStart = (e) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      apply(t.clientX, t.clientY);
    };
    const onTouchMove = (e) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      apply(t.clientX, t.clientY);
    };
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, [enabled, gl, pointerRef, invalidate]);
  return null;
}

/**
 * Pan with drag. Fullscreen: wheel + pinch zoom via OrbitControls. Embedded: page can scroll with wheel;
 * zoom = two-finger pinch or pinch-to-zoom (ctrl/meta + wheel) so the landing keeps native scroll.
 */
function PortfolioControlsSetup({
  controlsRef,
  embedded,
  embedTouchOrbitOnly,
  minZoom,
  maxZoom,
}) {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);

  React.useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return undefined;

    controls.mouseButtons = {
      LEFT: THREE.MOUSE.PAN,
      MIDDLE: THREE.MOUSE.PAN,
      RIGHT: THREE.MOUSE.PAN,
    };
    controls.touches = embedded
      ? { ONE: THREE.TOUCH.PAN, TWO: TOUCH_TWO_INACTIVE }
      : { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN };

    const el = gl.domElement;

    if (!embedded) {
      return undefined;
    }

    if (embedTouchOrbitOnly) {
      return undefined;
    }

    const pinchPointers = new Map();
    let lastPinchSpan = 0;

    const pairSpan = () => {
      if (pinchPointers.size !== 2) return 0;
      const [a, b] = [...pinchPointers.values()];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      return Math.hypot(dx, dy);
    };

    const applyOrthoZoom = (factor) => {
      if (!(camera instanceof THREE.OrthographicCamera)) return;
      const next = THREE.MathUtils.clamp(camera.zoom * factor, minZoom, maxZoom);
      if (Math.abs(next - camera.zoom) < 1e-6) return;
      camera.zoom = next;
      camera.updateProjectionMatrix();
      controls.dispatchEvent({ type: "change" });
      invalidate();
    };

    /** Trackpad / magic-mouse “pinch” sends wheel with ctrlKey (Chrome) or metaKey (some setups). */
    const onWheelPinchHint = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (!(camera instanceof THREE.OrthographicCamera)) return;
      e.preventDefault();
      const scale = Math.exp(-e.deltaY * 0.0022);
      applyOrthoZoom(scale);
    };

    const onPointerDown = (e) => {
      pinchPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinchPointers.size === 2) {
        lastPinchSpan = pairSpan();
      }
    };

    const onPointerMove = (e) => {
      const p = pinchPointers.get(e.pointerId);
      if (p) {
        p.x = e.clientX;
        p.y = e.clientY;
      }
      if (pinchPointers.size !== 2 || !(camera instanceof THREE.OrthographicCamera)) return;
      const span = pairSpan();
      if (lastPinchSpan > 1 && span > 1) {
        const ratio = span / lastPinchSpan;
        applyOrthoZoom(Math.pow(ratio, 0.92));
      }
      lastPinchSpan = span;
      e.preventDefault();
    };

    const onPointerUpOrCancel = (e) => {
      pinchPointers.delete(e.pointerId);
      if (pinchPointers.size < 2) lastPinchSpan = 0;
    };

    el.addEventListener("wheel", onWheelPinchHint, { passive: false });
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove, { passive: false });
    el.addEventListener("pointerup", onPointerUpOrCancel);
    el.addEventListener("pointercancel", onPointerUpOrCancel);

    return () => {
      el.removeEventListener("wheel", onWheelPinchHint);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUpOrCancel);
      el.removeEventListener("pointercancel", onPointerUpOrCancel);
    };
  }, [
    controlsRef,
    gl,
    camera,
    embedded,
    embedTouchOrbitOnly,
    invalidate,
    minZoom,
    maxZoom,
  ]);

  return null;
}

/**
 * @param {{ embedded?: boolean }} props
 * `embedded` — Canvas fills a positioned parent (e.g. landing). Default full-viewport fixed layer for the test route.
 */
const Experience = ({ embedded = false }) => {
  const cameraRef = useRef();
  const orbitControlsRef = useRef(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const pointerMissedResetRef = useRef(() => {});

  const { isExperienceReady } = useExperienceStore();

  const { isMobile, isNarrowViewport } = useResponsiveStore();
  const embedTouchOrbitOnly = Boolean(embedded && isNarrowViewport);

  const cameraPosition = [
    -5.091815760151335 * 1.5,
    4.21834729421205 * 1.5,
    5.338096715730072 * 1.5,
  ];

  const zoomFactor = embedded ? EMBEDDED_ZOOM_FACTOR : 1;
  const zoomValues = {
    default: (isMobile ? 74 : 135) * zoomFactor,
    animation: (isMobile ? 65 : 110) * zoomFactor,
  };

  useEffect(() => {
    if (!cameraRef.current) return;

    gsap.set(cameraRef.current.position, {
      x: cameraPosition[0],
      y: cameraPosition[1],
      z: cameraPosition[2],
    });
  }, [isExperienceReady]);

  useEffect(() => {
    if (!cameraRef.current) return;

    const f = embedded ? EMBEDDED_ZOOM_FACTOR : 1;
    cameraRef.current.zoom = (isMobile ? 74 : 135) * f;
    cameraRef.current.updateProjectionMatrix();
  }, [isMobile, embedded]);

  useEffect(() => {
    const onPointerMove = (e) => {
      pointerRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointerRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const onTouchMove = (e) => {
      if (e.touches.length === 1) {
        pointerRef.current.x =
          (e.touches[0].clientX / window.innerWidth) * 2 - 1;
        pointerRef.current.y =
          -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
      }
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("touchmove", onTouchMove);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("touchmove", onTouchMove);
    };
  });

  const overscanPct = EMBEDDED_CANVAS_OVERSCAN * 100;
  const canvasSizePct = (1 + 2 * EMBEDDED_CANVAS_OVERSCAN) * 100;

  /** Positive = shift canvas right in the shell so the viewport shows more of the render’s left → room reads left. */
  const embeddedCanvasShiftXPct = 10;

  const canvasStyle = embedded
    ? {
        position: "absolute",
        top: `-${overscanPct}%`,
        left: `-${overscanPct}%`,
        width: `${canvasSizePct}%`,
        height: `${canvasSizePct}%`,
        transform: `translateX(${embeddedCanvasShiftXPct}%)`,
        zIndex: 0,
        // Embedded on mobile should never trap page scrolling.
        // Allow vertical pan while still letting pointer events hit the canvas.
        touchAction: embedTouchOrbitOnly ? "pan-y" : "none",
        // On narrow mobile embeds, make the canvas render-only so scrolling always wins.
        pointerEvents: embedTouchOrbitOnly ? "none" : "auto",
      }
    : {
        position: "fixed",
        zIndex: 1,
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        touchAction: "none",
      };

  const EMBED_SCENE_BG = 0x080708;

  const embeddedGlProps = embedded
    ? {
        gl: { alpha: false, antialias: true },
        onCreated: ({ gl, scene }) => {
          scene.background = new THREE.Color(EMBED_SCENE_BG);
          gl.setClearColor(EMBED_SCENE_BG, 1);
        },
      }
    : {};

  const minZoom = embedded ? 22 : 38;
  const maxZoom = embedded ? 130 : 220;

  // Cap DPR when embedded so mobile GPUs are not overloaded.
  // Non-embedded (full-screen test route) keeps the default R3F behavior.
  const embeddedDpr = isMobile ? [1, 1.25] : [1, 1.75];

  return (
    <>
      <Canvas
        style={canvasStyle}
        {...(embedded ? { dpr: embeddedDpr } : {})}
        {...embeddedGlProps}
        onPointerMissed={() => pointerMissedResetRef.current?.()}
      >
        <OrthographicCamera
          ref={cameraRef}
          makeDefault
          position={cameraPosition}
          rotation={[
            -0.6138097686916666, -0.6852967312960734, -0.41947779883392433,
          ]}
          zoom={zoomValues.default}
        />
        <RoomCameraNavProvider
          bindPointerMissedReset={pointerMissedResetRef}
          bindOrbitControlsRef={orbitControlsRef}
        >
          <Scene pointerRef={pointerRef} />
          <OrbitControls
            ref={orbitControlsRef}
            makeDefault
            enabled={!embedTouchOrbitOnly}
            enableDamping
            dampingFactor={0.07}
            minPolarAngle={0.28}
            maxPolarAngle={Math.PI / 2 - 0.06}
            minZoom={minZoom}
            maxZoom={maxZoom}
            zoomSpeed={0.7}
            panSpeed={0.88}
            enablePan={!embedTouchOrbitOnly}
            enableRotate={false}
            enableZoom={!embedded}
            screenSpacePanning
          />
          <EmbeddedPointerRefTouchSync
            pointerRef={pointerRef}
            enabled={embedTouchOrbitOnly}
          />
          <PortfolioControlsSetup
            controlsRef={orbitControlsRef}
            embedded={embedded}
            embedTouchOrbitOnly={embedTouchOrbitOnly}
            minZoom={minZoom}
            maxZoom={maxZoom}
          />
        </RoomCameraNavProvider>
      </Canvas>
    </>
  );
};

export default Experience;
