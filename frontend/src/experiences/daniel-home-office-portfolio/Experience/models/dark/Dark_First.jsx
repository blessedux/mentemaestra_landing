import React, { useEffect, useRef } from "react";
import { useVideoTexture } from "@react-three/drei";
import * as THREE from "three";
import { useGLTFWithKTX2 } from "../../utils/useGLTFWithKTX2";
import { convertMaterialsToBasic } from "../../utils/convertToBasic";

export default function Model(props) {
  const { nodes, materials } = useGLTFWithKTX2(
    "/models/Dark Room/Dark_First.glb"
  );
  const newMaterials = convertMaterialsToBasic(materials);

  const macScreenRef = useRef();
  const computerScreenRef = useRef();

  // Match the known-good behavior from commit 033b898.
  const videoTexture = useVideoTexture("/videos/devwork.mp4", {
    crossOrigin: "anonymous",
    muted: true,
    loop: true,
    playsInline: true,
    start: true,
  });

  useEffect(() => {
    // GLTF UVs expect textures not flipped vertically.
    videoTexture.flipY = false;
    videoTexture.colorSpace = THREE.SRGBColorSpace;
    videoTexture.needsUpdate = true;
  }, [videoTexture]);

  return (
    <group {...props} dispose={null}>
      <mesh
        ref={macScreenRef}
        geometry={nodes.Mac_Screen.geometry}
        position={[-0.861, 0.815 - 0.02, 0.684]}
        rotation={[0, 0.523, 0]}
      >
        <meshBasicMaterial
          map={videoTexture}
          color="#ffffff"
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh
        ref={computerScreenRef}
        geometry={nodes.Computer_Screen.geometry}
        position={[-0.302, 0.955 - 0.02, 0.647]}
        rotation={[0, -0.053, 0]}
      >
        <meshBasicMaterial
          map={videoTexture}
          color="#ffffff"
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh
        geometry={nodes.First_Baked.geometry}
        material={newMaterials.first_real_realfdsa_Baked}
        position={[-0.231, -0.14 - 0.02, 0.652]}
        rotation={[Math.PI, 0, Math.PI]}
      />
    </group>
  );
}
