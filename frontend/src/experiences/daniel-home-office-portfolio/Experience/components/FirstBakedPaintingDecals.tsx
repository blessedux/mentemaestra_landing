"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { TransformControls, useTexture } from "@react-three/drei";

export type PaintingDecalLiveRow = {
  src: string;
  position: [number, number, number];
  rotation: [number, number, number];
  args: [number, number];
};

export type FirstBakedPaintingEditorConfig = {
  selectedIndex: number;
  onLiveTransforms: (rows: PaintingDecalLiveRow[]) => void;
  translationSnap: number | null;
  transformSpace: "world" | "local";
};

/**
 * Same transform as `First_Baked` in `Dark_First.jsx` — decals are in this mesh’s
 * local space so they orbit with the room and stay glued to that bake.
 *
 * Replace the PNGs in `public/room-art-paintings/` (same filenames) or change `src`.
 * Tune `position`, `rotation`, and `args` (plane width × height) while the app runs.
 *
 * **Mesh inspector:** pass `paintingEditor` to enable translate gizmos on the
 * selected decal and live transform reporting for all four.
 */
export const FIRST_BAKED_PAINTING_DECALS: PaintingDecalLiveRow[] = [
  {
    src: "/room-art-paintings/01.png",
    position: [-0.664, 1.185, 2.128],
    rotation: [0, 0, 0],
    args: [0.38, 0.48],
  },
  {
    src: "/room-art-paintings/02.png",
    position: [-0.749, 2.045, 2.128],
    rotation: [0, 0, 0],
    args: [0.38, 0.48],
  },
  {
    src: "/room-art-paintings/03.png",
    position: [-1.244, 1.34, 2.113],
    rotation: [0, 0, 0],
    args: [0.38, 0.48],
  },
  {
    src: "/room-art-paintings/04.png",
    position: [-1.329, 1.895, 2.138],
    rotation: [0, 0, 0],
    args: [0.38, 0.48],
  },
];

/** Stable identity for `useTexture` / `useLoader` — do not allocate per render. */
const PAINTING_TEXTURE_URLS = FIRST_BAKED_PAINTING_DECALS.map((d) => d.src);

/** Matches `First_Baked` in `models/dark/Dark_First.jsx` */
const FIRST_BAKED_POSITION: [number, number, number] = [
  -0.231,
  -0.14 - 0.02,
  0.652,
];
const FIRST_BAKED_ROTATION: [number, number, number] = [Math.PI, 0, Math.PI];

function round4(n: number) {
  return Math.round(n * 10000) / 10000;
}

type Props = {
  paintingEditor?: FirstBakedPaintingEditorConfig | null;
};

export default function FirstBakedPaintingDecals({
  paintingEditor = null,
}: Props) {
  const textures = useTexture(PAINTING_TEXTURE_URLS);

  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  /** Stable ref callbacks — recreating each render makes React ref-detach in a loop. */
  const meshRefCallbacks = useRef<((el: THREE.Mesh | null) => void)[] | null>(
    null
  );
  if (!meshRefCallbacks.current) {
    meshRefCallbacks.current = FIRST_BAKED_PAINTING_DECALS.map(
      (_, i) => (el: THREE.Mesh | null) => {
        meshRefs.current[i] = el;
      }
    );
  }

  const paintingEditorRef = useRef(paintingEditor);
  paintingEditorRef.current = paintingEditor;

  const editorActive = paintingEditor != null;
  const snap =
    paintingEditor?.translationSnap != null
      ? paintingEditor.translationSnap
      : 0.005;
  const transformSpace = paintingEditor?.transformSpace ?? "world";

  const reportAll = useCallback(() => {
    const pe = paintingEditorRef.current;
    if (!pe?.onLiveTransforms) return;
    const rows: PaintingDecalLiveRow[] = FIRST_BAKED_PAINTING_DECALS.map(
      (decal, i) => {
        const m = meshRefs.current[i];
        if (!m) {
          return {
            src: decal.src,
            position: [...decal.position] as [number, number, number],
            rotation: [...decal.rotation] as [number, number, number],
            args: [...decal.args] as [number, number],
          };
        }
        return {
          src: decal.src,
          position: [
            round4(m.position.x),
            round4(m.position.y),
            round4(m.position.z),
          ],
          rotation: [
            round4(m.rotation.x),
            round4(m.rotation.y),
            round4(m.rotation.z),
          ],
          args: [decal.args[0], decal.args[1]],
        };
      }
    );
    pe.onLiveTransforms(rows);
  }, []);

  useEffect(() => {
    if (!editorActive) return;
    const t = window.setTimeout(reportAll, 0);
    return () => window.clearTimeout(t);
  }, [editorActive, reportAll]);

  useEffect(() => {
    if (!editorActive) return;
    reportAll();
  }, [
    editorActive,
    paintingEditor?.selectedIndex,
    paintingEditor?.transformSpace,
    paintingEditor?.translationSnap,
    reportAll,
  ]);

  useLayoutEffect(() => {
    textures.forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    });
  }, [textures]);

  const sel = paintingEditor?.selectedIndex ?? 0;
  const activeMesh = meshRefs.current[sel];

  return (
    <group position={FIRST_BAKED_POSITION} rotation={FIRST_BAKED_ROTATION}>
      {FIRST_BAKED_PAINTING_DECALS.map((decal, i) => (
        <mesh
          key={decal.src}
          ref={meshRefCallbacks.current![i]}
          position={decal.position}
          rotation={decal.rotation}
          renderOrder={2}
          userData={{ mmPaintingDecalIndex: i }}
        >
          <planeGeometry args={decal.args} />
          <meshBasicMaterial
            map={textures[i]}
            transparent
            toneMapped={false}
            depthWrite={false}
            depthTest
            side={THREE.DoubleSide}
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
          />
        </mesh>
      ))}
      {editorActive && activeMesh instanceof THREE.Mesh ? (
        <TransformControls
          key={`paint-tc-${sel}`}
          object={activeMesh}
          mode="translate"
          space={transformSpace}
          translationSnap={snap != null && snap > 0 ? snap : undefined}
          size={0.75}
          onObjectChange={reportAll}
          onMouseUp={reportAll}
        />
      ) : null}
    </group>
  );
}
