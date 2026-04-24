"use client";

import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { RefObject } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Bounds, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useRouter, useSearchParams } from "next/navigation";

import DarkRoomFirst from "@/experiences/daniel-home-office-portfolio/Experience/models/dark/Dark_First";
import DarkRoomSecond from "@/experiences/daniel-home-office-portfolio/Experience/models/dark/Dark_Second";
import DarkRoomThird from "@/experiences/daniel-home-office-portfolio/Experience/models/dark/Dark_Third";
import DarkRoomFourth from "@/experiences/daniel-home-office-portfolio/Experience/models/dark/Dark_Fourth";
import FirstBakedPaintingDecals, {
  type FirstBakedPaintingEditorConfig,
  type PaintingDecalLiveRow,
} from "@/experiences/daniel-home-office-portfolio/Experience/components/FirstBakedPaintingDecals";
import {
  SOFA_PAINTINGS_HITBOX_POSITION,
  SOFA_PAINTINGS_HITBOX_SCALE,
} from "@/experiences/daniel-home-office-portfolio/Experience/sofaPaintingsHitbox";

const ASSET_PATHS = {
  first: "/models/Dark Room/Dark_First.glb",
  second: "/models/Dark Room/Dark_Second.glb",
  third: "/models/Dark Room/Dark_Third.glb",
  fourth: "/models/Dark Room/Dark_Fourth.glb",
  targets: "/models/Dark Room/Dark_Targets.glb",
} as const;

type AssetKey = keyof typeof ASSET_PATHS;

const CHUNK_ORDER: AssetKey[] = [
  "first",
  "second",
  "third",
  "fourth",
  "targets",
];

const ASSET_LABELS: Record<AssetKey, string> = {
  first: "Dark_First — desk, Mac, screens, First_Baked + painting decals",
  second: "Dark_Second — baked wall chunk",
  third: "Dark_Third — floor, wall, fan (3 meshes, one shared texture)",
  fourth: "Dark_Fourth — chair + baked chunk",
  targets: "Dark_Targets — hitbox meshes (no room materials)",
};

function isAssetKey(v: string): v is AssetKey {
  return v in ASSET_PATHS;
}

function parseChunkList(searchParams: URLSearchParams): AssetKey[] {
  const raw = searchParams.get("chunks");
  if (raw) {
    const parts = raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const keys = parts.filter((p): p is AssetKey => isAssetKey(p));
    const uniq = [...new Set(keys)].sort(
      (a, b) => CHUNK_ORDER.indexOf(a) - CHUNK_ORDER.indexOf(b)
    );
    if (uniq.length > 0) return uniq;
  }
  const legacy = searchParams.get("asset");
  if (legacy && isAssetKey(legacy.toLowerCase())) {
    return [legacy.toLowerCase() as AssetKey];
  }
  return ["second"];
}

function serializeChunks(list: AssetKey[]): string {
  return [...new Set(list)]
    .sort((a, b) => CHUNK_ORDER.indexOf(a) - CHUNK_ORDER.indexOf(b))
    .join(",");
}

type MeshRow = { chunk: string; name: string };

function formatPaintingDecalsForSource(rows: PaintingDecalLiveRow[]): string {
  const lines = rows.map(
    (r) =>
      `  {\n    src: ${JSON.stringify(r.src)},\n    position: [${r.position.join(", ")}],\n    rotation: [${r.rotation.join(", ")}],\n    args: [${r.args.join(", ")}],\n  }`
  );
  return `// Paste into FIRST_BAKED_PAINTING_DECALS in FirstBakedPaintingDecals.tsx\nexport const FIRST_BAKED_PAINTING_DECALS = [\n${lines.join(",\n")},\n];\n`;
}

function chunkTagForObject(obj: THREE.Object3D): string | null {
  let p: THREE.Object3D | null = obj;
  while (p) {
    const m = /^__chunk_(.+)$/.exec(p.name);
    if (m) return m[1];
    p = p.parent;
  }
  return null;
}

/** Raw GLB for targets only (avoids Dark_Targets router clicks). */
function InspectTargetsGltf() {
  const gltf = useGLTF(ASSET_PATHS.targets, true, true, undefined);
  const root = useMemo(() => gltf.scene.clone(true), [gltf]);
  return <primitive object={root} />;
}

/** Wireframe clone of `About_Hitbox` at the sofa cushion preset (`paintingsSofa` hit volume). */
function SofaPaintingsInspectWire() {
  const { nodes } = useGLTF(ASSET_PATHS.targets);
  const aboutHit = nodes.About_Hitbox as THREE.Mesh;
  return (
    <mesh
      geometry={aboutHit.geometry}
      position={SOFA_PAINTINGS_HITBOX_POSITION}
      scale={SOFA_PAINTINGS_HITBOX_SCALE}
    >
      <meshBasicMaterial
        color="#5ad8a6"
        wireframe
        transparent
        opacity={0.42}
        depthTest
      />
    </mesh>
  );
}

const SnapshotBridge = createContext<{
  registerSnapshot: (fn: (() => string) | null) => void;
} | null>(null);

function useSnapshotBridge() {
  const ctx = useContext(SnapshotBridge);
  if (!ctx)
    throw new Error("SnapshotBridge missing (wrap Canvas with provider)");
  return ctx;
}

function CameraSnapshotCore() {
  const { camera, controls } = useThree();
  const { registerSnapshot } = useSnapshotBridge();

  useEffect(() => {
    const snap = () => {
      const pos = camera.position.toArray().map((n) => Number(n.toFixed(5)));
      const quat = camera.quaternion
        .toArray()
        .map((n) => Number(n.toFixed(5))) as [number, number, number, number];
      const euler = new THREE.Euler().setFromQuaternion(
        camera.quaternion,
        "YXZ"
      );
      const rad = [euler.x, euler.y, euler.z];
      const deg = rad.map((r) =>
        Number(((r * 180) / Math.PI).toFixed(3))
      ) as [number, number, number];
      let target: number[] | null = null;
      const oc = controls as OrbitControlsImpl | null;
      if (oc && "target" in oc && oc.target instanceof THREE.Vector3) {
        target = oc.target.toArray().map((n) => Number(n.toFixed(5)));
      }
      let fov: number | null = null;
      if (camera instanceof THREE.PerspectiveCamera) {
        fov = Number(camera.fov.toFixed(4));
      }
      const payload = {
        note: "Three.js Y-up. Euler order YXZ (radians + degrees). Quaternion (x,y,z,w).",
        position: pos,
        quaternion: quat,
        rotationYXZRadians: rad.map((r) => Number(r.toFixed(5))),
        rotationYXZDegrees: deg,
        target,
        fov,
        near: camera.near,
        far: camera.far,
      };
      const text = JSON.stringify(payload, null, 2);
      console.info("[mm:DanielMeshInspector] camera snapshot\n", text);
      return text;
    };
    registerSnapshot(snap);
    return () => registerSnapshot(null);
  }, [camera, controls, registerSnapshot]);

  return null;
}

function RoomChunks({
  chunks,
  combinedRef,
  paintingEditor,
}: {
  chunks: AssetKey[];
  combinedRef: RefObject<THREE.Group | null>;
  paintingEditor: FirstBakedPaintingEditorConfig | null;
}) {
  const ordered = CHUNK_ORDER.filter((c) => chunks.includes(c));

  return (
    <group ref={combinedRef}>
      {ordered.map((key) => (
        <group key={key} name={`__chunk_${key}`}>
          {key === "first" ? (
            <>
              <DarkRoomFirst />
              <FirstBakedPaintingDecals paintingEditor={paintingEditor} />
            </>
          ) : null}
          {key === "second" ? <DarkRoomSecond /> : null}
          {key === "third" ? <DarkRoomThird /> : null}
          {key === "fourth" ? <DarkRoomFourth /> : null}
          {key === "targets" ? (
            <>
              <InspectTargetsGltf />
              <SofaPaintingsInspectWire />
            </>
          ) : null}
        </group>
      ))}
    </group>
  );
}

function InspectScene({
  chunks,
  onMeshesDiscovered,
  paintingEditor,
}: {
  chunks: AssetKey[];
  onMeshesDiscovered: (rows: MeshRow[]) => void;
  paintingEditor: FirstBakedPaintingEditorConfig | null;
}) {
  const combinedRef = useRef<THREE.Group>(null);

  useEffect(() => {
    let cancelled = false;
    const collect = () => {
      if (cancelled || !combinedRef.current) return;
      const rows: MeshRow[] = [];
      combinedRef.current.updateMatrixWorld(true);
      combinedRef.current.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const tag = chunkTagForObject(obj);
          const chunk = tag ?? "?";
          const name = obj.name?.trim() ? obj.name : "(unnamed mesh)";
          rows.push({ chunk, name });
        }
      });
      onMeshesDiscovered(rows);
    };
    const id = window.setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(collect);
      });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [chunks, onMeshesDiscovered]);

  return (
    <>
      <color attach="background" args={["#070708"]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[3.5, 5.5, 2.5]} intensity={1.05} />
      <hemisphereLight
        color="#b8c4d8"
        groundColor="#1a1410"
        intensity={0.35}
      />
      <Suspense fallback={null}>
        {/* observe=false: live decal snippet / sidebar layout changes `size` and would refit the camera into a bad frame (looks like an empty scene). */}
        <Bounds fit observe={false} margin={1.35} maxDuration={0.45}>
          <RoomChunks
            chunks={chunks}
            combinedRef={combinedRef}
            paintingEditor={paintingEditor}
          />
        </Bounds>
      </Suspense>
      <CameraSnapshotCore />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.06}
        minDistance={0.35}
        maxDistance={80}
      />
    </>
  );
}

export default function DanielMeshInspectorClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chunks = useMemo(
    () => parseChunkList(searchParams),
    [searchParams]
  );

  const [meshRows, setMeshRows] = useState<MeshRow[]>([]);
  const onMeshesDiscovered = useCallback((rows: MeshRow[]) => {
    setMeshRows(rows);
  }, []);

  const [cameraLog, setCameraLog] = useState("");
  const snapshotFnRef = useRef<(() => string) | null>(null);
  const registerSnapshot = useCallback((fn: (() => string) | null) => {
    snapshotFnRef.current = fn;
  }, []);

  const [selectedDecalIndex, setSelectedDecalIndex] = useState(0);
  const [decalSourceSnippet, setDecalSourceSnippet] = useState("");
  const [decalSnap, setDecalSnap] = useState<number | null>(0.005);
  const [decalSpace, setDecalSpace] = useState<"world" | "local">("world");

  const onDecalLiveTransforms = useCallback((rows: PaintingDecalLiveRow[]) => {
    setDecalSourceSnippet(formatPaintingDecalsForSource(rows));
  }, []);

  const paintingEditor = useMemo((): FirstBakedPaintingEditorConfig | null => {
    if (!chunks.includes("first")) return null;
    return {
      selectedIndex: Math.min(3, Math.max(0, selectedDecalIndex)),
      onLiveTransforms: onDecalLiveTransforms,
      translationSnap: decalSnap,
      transformSpace: decalSpace,
    };
  }, [
    chunks,
    selectedDecalIndex,
    onDecalLiveTransforms,
    decalSnap,
    decalSpace,
  ]);

  useEffect(() => {
    setMeshRows([]);
  }, [chunks]);

  useEffect(() => {
    if (!chunks.includes("first")) {
      setDecalSourceSnippet("");
    }
  }, [chunks]);

  const setChunks = (next: AssetKey[]) => {
    const list: AssetKey[] = next.length > 0 ? next : (["first"] as AssetKey[]);
    const params = new URLSearchParams(searchParams.toString());
    params.set("chunks", serializeChunks(list));
    params.delete("asset");
    router.replace(`/daniel-mesh-inspector?${params.toString()}`, {
      scroll: false,
    });
  };

  const toggleChunk = (key: AssetKey) => {
    if (chunks.includes(key)) {
      const next = chunks.filter((c) => c !== key);
      setChunks(next.length > 0 ? next : [key]);
    } else {
      setChunks([...chunks, key]);
    }
  };

  const takeSnapshot = () => {
    const fn = snapshotFnRef.current;
    if (!fn) {
      setCameraLog("// Canvas not ready yet — wait a moment and try again.");
      return;
    }
    setCameraLog(fn());
  };

  return (
    <SnapshotBridge.Provider value={{ registerSnapshot }}>
      <div className="flex min-h-[100dvh] flex-col bg-[#070708] text-zinc-100 md:flex-row">
        <div className="relative h-[58dvh] min-h-[280px] w-full md:h-auto md:flex-1">
          <Canvas
            camera={{
              fov: 42,
              near: 0.08,
              far: 500,
              position: [2.2, 1.6, 2.6],
            }}
            gl={{ alpha: false, antialias: true }}
          >
            <InspectScene
              chunks={chunks}
              onMeshesDiscovered={onMeshesDiscovered}
              paintingEditor={paintingEditor}
            />
          </Canvas>
          <p className="pointer-events-none absolute bottom-3 left-3 max-w-[min(92vw,22rem)] text-xs leading-snug text-white/45">
            Drag to orbit · scroll to zoom. With{" "}
            <code className="text-white/60">first</code> selected, use the
            translate gizmo on the chosen PNG (sidebar) — orbit pauses while
            dragging. URL: <code className="text-white/60">?chunks=first,third</code>
          </p>
        </div>

        <aside className="flex w-full flex-col gap-4 overflow-y-auto border-t border-white/10 p-4 md:max-h-[100dvh] md:w-[min(100%,24rem)] md:border-l md:border-t-0 md:p-5">
          <div>
            <h1 className="text-sm font-medium tracking-tight text-white">
              Mesh inspector
            </h1>
            <p className="mt-1 text-xs leading-relaxed text-white/55">
              Uses the same React chunks as{" "}
              <code className="text-white/65">/daniel-dark-room-test</code>{" "}
              (not raw GLB roots), so transforms match the real scene — including{" "}
              <code className="text-white/65">FirstBakedPaintingDecals</code>{" "}
              whenever <code className="text-white/65">first</code> is checked.
            </p>
          </div>

          <fieldset className="flex flex-col gap-2 text-xs">
            <legend className="mb-1 text-white/50">GLB chunks (multi-select)</legend>
            {CHUNK_ORDER.map((key) => (
              <label
                key={key}
                className="flex cursor-pointer items-start gap-2 rounded-md border border-white/10 bg-white/[0.03] px-2 py-2 hover:bg-white/[0.06]"
              >
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={chunks.includes(key)}
                  onChange={() => toggleChunk(key)}
                />
                <span>
                  <span className="font-mono text-sky-200/90">{key}</span>
                  <span className="block text-[11px] text-white/45">
                    {ASSET_LABELS[key]}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>

          {chunks.includes("first") ? (
            <div className="flex flex-col gap-3 rounded-md border border-emerald-500/25 bg-emerald-500/5 p-3 text-xs">
              <h2 className="font-medium text-emerald-100/95">
                Painting decals (First_Baked space)
              </h2>
              <p className="leading-relaxed text-emerald-50/75">
                Pick a PNG, drag the <strong className="text-emerald-100">red / green / blue</strong>{" "}
                arrows (translate only). Values update live — paste the snippet
                into{" "}
                <code className="text-emerald-100/90">
                  FIRST_BAKED_PAINTING_DECALS
                </code>{" "}
                in <code className="text-emerald-100/90">FirstBakedPaintingDecals.tsx</code>.
              </p>
              <p className="text-[10px] leading-snug text-emerald-50/55">
                Auto camera refit is off while you edit decals so the view does not
                jump when this panel updates. Reload the page after a large window
                resize if framing feels off.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <button
                    key={i}
                    type="button"
                    className={`rounded px-2.5 py-1 font-mono text-[11px] ${
                      selectedDecalIndex === i
                        ? "bg-emerald-500/35 text-emerald-50"
                        : "bg-white/10 text-white/70 hover:bg-white/15"
                    }`}
                    onClick={() => setSelectedDecalIndex(i)}
                  >
                    0{i + 1}
                  </button>
                ))}
              </div>
              <label className="flex flex-col gap-1 text-[11px] text-white/50">
                Gizmo axes
                <select
                  className="rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-white"
                  value={decalSpace}
                  onChange={(e) =>
                    setDecalSpace(e.target.value as "world" | "local")
                  }
                >
                  <option value="world">World (global X Y Z)</option>
                  <option value="local">Local (relative to First_Baked group)</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-[11px] text-white/50">
                Translation snap (meters)
                <select
                  className="rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-white"
                  value={decalSnap === null ? "off" : String(decalSnap)}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDecalSnap(v === "off" ? null : Number(v));
                  }}
                >
                  <option value="off">Off</option>
                  <option value="0.002">0.002</option>
                  <option value="0.005">0.005</option>
                  <option value="0.01">0.01</option>
                  <option value="0.02">0.02</option>
                </select>
              </label>
              <button
                type="button"
                className="rounded-md border border-emerald-500/40 bg-emerald-500/15 px-2 py-1.5 text-[11px] font-medium text-emerald-100 hover:bg-emerald-500/25"
                onClick={() => {
                  if (!decalSourceSnippet) return;
                  console.info(
                    "[mm:DanielMeshInspector] painting decals snippet\n",
                    decalSourceSnippet
                  );
                  void navigator.clipboard?.writeText(decalSourceSnippet);
                }}
              >
                Log snippet to console + copy to clipboard
              </button>
              <textarea
                readOnly
                rows={14}
                className="w-full resize-y rounded-md border border-white/10 bg-black/40 p-2 font-mono text-[10px] leading-relaxed text-emerald-200/90"
                placeholder="Move a decal to populate…"
                value={decalSourceSnippet}
              />
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="rounded-md border border-sky-500/40 bg-sky-500/15 px-3 py-2 text-xs font-medium text-sky-100 hover:bg-sky-500/25"
              onClick={takeSnapshot}
            >
              Log camera (console + copy below)
            </button>
            <textarea
              readOnly
              rows={12}
              className="w-full resize-y rounded-md border border-white/10 bg-black/40 p-2 font-mono text-[10px] leading-relaxed text-emerald-200/90"
              placeholder='Click "Log camera" after framing the view…'
              value={cameraLog}
            />
          </div>

          <div>
            <h2 className="text-xs font-medium uppercase tracking-wide text-white/40">
              Meshes ({meshRows.length})
            </h2>
            <ul className="mt-2 max-h-48 overflow-auto rounded-md border border-white/10 bg-black/30 px-2 py-1.5 font-mono text-[10px] leading-relaxed text-sky-200/90">
              {meshRows.length === 0 ? (
                <li className="text-white/35">Loading…</li>
              ) : (
                meshRows.map((row, i) => (
                  <li key={`${row.chunk}-${row.name}-${i}`}>
                    <span className="text-white/40">{row.chunk}</span> /{" "}
                    {row.name}
                  </li>
                ))
              )}
            </ul>
          </div>

          <details className="rounded-md border border-violet-500/25 bg-violet-500/5 p-3 text-xs leading-relaxed text-violet-100/90 open:bg-violet-500/10">
            <summary className="cursor-pointer font-medium text-violet-200/95">
              Dark_Third: can I replace only the wall?
            </summary>
            <div className="mt-2 space-y-2 text-violet-50/85">
              <p>
                That file has <strong className="text-violet-100">three</strong>{" "}
                meshes (floor, wall, fan) but they all use the{" "}
                <strong className="text-violet-100">
                  same baked material / texture atlas
                </strong>{" "}
                (<code className="text-violet-100/90">Third_Real_Real_Texture_Set_Baked</code>
                ). So in this export you{" "}
                <strong className="text-violet-100">
                  cannot change only the wall’s pixels
                </strong>{" "}
                in code without also changing how the floor and fan look, unless
                you split UVs and materials in Blender and re-export.
              </p>
              <p>
                Practically: a new texture for that material replaces the look on{" "}
                <strong className="text-violet-100">all three</strong> meshes at
                once. To treat them independently you need separate materials (and
                usually separate textures or UV layouts) in the source model.
              </p>
            </div>
          </details>

          <details className="rounded-md border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-relaxed text-amber-100/85 open:bg-amber-500/10">
            <summary className="cursor-pointer font-medium text-amber-200/95">
              Paintings & baked atlases
            </summary>
            <div className="mt-2 space-y-2 text-amber-50/80">
              <p>
                Decals are edited in{" "}
                <code className="text-amber-100/90">
                  FirstBakedPaintingDecals.tsx
                </code>{" "}
                (<code className="text-amber-100/90">FIRST_BAKED_PAINTING_DECALS</code>
                ). With <code className="text-amber-100/90">first</code> enabled
                here, you align them against the same First_Baked mesh as in the
                live room.
              </p>
            </div>
          </details>

          <p className="text-[11px] text-white/35">
            Full scene:{" "}
            <a
              href="/daniel-dark-room-test"
              className="text-sky-400/90 underline-offset-2 hover:underline"
            >
              /daniel-dark-room-test
            </a>
          </p>
        </aside>
      </div>
    </SnapshotBridge.Provider>
  );
}
