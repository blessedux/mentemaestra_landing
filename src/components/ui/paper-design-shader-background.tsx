"use client";

import { useEffect, useState } from "react";
import { GrainGradient } from "@paper-design/shaders-react";

export function GradientBackground() {
  const [mounted, setMounted] = useState(false);
  const [size, setSize] = useState({ width: 1920, height: 1080 });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const updateSize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setSize({ width: w, height: h });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [mounted]);

  if (!mounted) {
    return (
      <div
        className="fixed inset-0 -z-10 bg-black w-screen h-screen"
        aria-hidden
      />
    );
  }

  return (
    <div
      className="fixed inset-0 -z-10 w-screen h-screen min-h-screen"
      style={{ width: "100vw", height: "100vh", minHeight: "100vh" }}
    >
      <GrainGradient
        width={size.width}
        height={size.height}
        colorBack="hsl(0, 0%, 0%)"
        softness={0.76}
        intensity={0.45}
        noise={0}
        shape="corners"
        offsetX={0}
        offsetY={0}
        scale={0.48}
        rotation={0}
        speed={1}
        colors={[
          "hsl(14, 100%, 57%)",
          "hsl(45, 100%, 51%)",
          "hsl(340, 82%, 52%)",
        ]}
      />
    </div>
  );
}
