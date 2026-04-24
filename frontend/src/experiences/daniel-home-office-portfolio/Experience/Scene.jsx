import React, { Suspense, useRef } from "react";
import * as THREE from "three";

import DarkRoomFirst from "./models/dark/Dark_First";
import DarkRoomSecond from "./models/dark/Dark_Second";
import DarkRoomThird from "./models/dark/Dark_Third";
import DarkRoomFourth from "./models/dark/Dark_Fourth";
import DarkTargets from "./models/dark/Dark_Targets";
import FirstBakedPaintingDecals from "./components/FirstBakedPaintingDecals";

import { useFrame } from "@react-three/fiber";

const Scene = ({ pointerRef }) => {
  const darkGroupRef = useRef();
  const groupRotationRef = useRef(0);

  useFrame(() => {
    if (!darkGroupRef.current) return;

    const targetRotation = pointerRef.current.x * Math.PI * 0.032;

    groupRotationRef.current = THREE.MathUtils.lerp(
      groupRotationRef.current,
      targetRotation,
      0.1
    );

    darkGroupRef.current.rotation.y = groupRotationRef.current;
  });

  return (
    <Suspense>
      <group ref={darkGroupRef}>
        <DarkRoomFirst />
        <FirstBakedPaintingDecals />
        <DarkRoomSecond />
        <DarkRoomThird />
        <DarkRoomFourth />
        <DarkTargets />
      </group>
    </Suspense>
  );
};

export default Scene;
