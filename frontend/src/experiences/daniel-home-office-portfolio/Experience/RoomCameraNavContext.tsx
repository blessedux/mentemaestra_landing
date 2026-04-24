"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  type MutableRefObject,
  type ReactNode,
} from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";

/** Minimal surface of `OrbitControls` (three-stdlib) for reset sync without importing the class here. */
export type RoomOrbitControlsLike = {
  target: THREE.Vector3;
  update: () => void;
  saveState?: () => void;
};

export type RoomCameraNavValue = {
  resetView: () => void;
};

export const RoomCameraNavContext = createContext<RoomCameraNavValue | null>(
  null,
);

export function useRoomCameraNav(): RoomCameraNavValue | null {
  return useContext(RoomCameraNavContext);
}

type ProviderProps = {
  children: ReactNode;
  /** Ref whose `.current` is replaced with `resetView` so `<Canvas onPointerMissed>` can call it */
  bindPointerMissedReset?: MutableRefObject<() => void>;
  /** Ref to drei's `<OrbitControls />` so `resetView` can sync `target` after snapping the camera */
  bindOrbitControlsRef?: MutableRefObject<RoomOrbitControlsLike | null>;
};

const scratchForward = new THREE.Vector3();

export function RoomCameraNavProvider({
  children,
  bindPointerMissedReset,
  bindOrbitControlsRef,
}: ProviderProps) {
  const camera = useThree((s) => s.camera);
  const defaults = useRef({
    position: new THREE.Vector3(),
    quaternion: new THREE.Quaternion(),
    zoom: 1,
  });
  const defaultTarget = useRef(new THREE.Vector3());
  const captured = useRef(false);

  useLayoutEffect(() => {
    if (captured.current) return;
    if (!(camera instanceof THREE.OrthographicCamera)) return;
    defaults.current.position.copy(camera.position);
    defaults.current.quaternion.copy(camera.quaternion);
    defaults.current.zoom = camera.zoom;
    scratchForward.set(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
    defaultTarget.current
      .copy(camera.position)
      .addScaledVector(scratchForward, 2);
    captured.current = true;
  }, [camera]);

  const resetView = useCallback(() => {
    if (!(camera instanceof THREE.OrthographicCamera)) return;
    camera.position.copy(defaults.current.position);
    camera.quaternion.copy(defaults.current.quaternion);
    camera.zoom = defaults.current.zoom;
    camera.updateProjectionMatrix();

    const oc = bindOrbitControlsRef?.current;
    if (oc) {
      oc.target.copy(defaultTarget.current);
      oc.update();
      oc.saveState?.();
    }
  }, [bindOrbitControlsRef, camera]);

  useLayoutEffect(() => {
    if (!bindPointerMissedReset) return;
    const ref = bindPointerMissedReset;
    const prev = ref.current;
    ref.current = () => {
      resetView();
    };
    return () => {
      ref.current = prev;
    };
  }, [bindPointerMissedReset, resetView]);

  const value = useMemo(() => ({ resetView }), [resetView]);

  return (
    <RoomCameraNavContext.Provider value={value}>
      {children}
    </RoomCameraNavContext.Provider>
  );
}
