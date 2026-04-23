"use client";

import dynamic from "next/dynamic";

const Brain3dExperience = dynamic(
  () => import("@/components/Brain3dExperience"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[480px] items-center justify-center text-sm text-white/50">
        Loading WebGL brain…
      </div>
    ),
  }
);

export default function BrainTestView() {
  return (
    <div className="h-[min(85vh,720px)] w-full rounded-xl border border-white/10 bg-[#a7b6d2]/20">
      <Brain3dExperience
        className="min-h-[480px]"
        particlesOnly={false}
        enableOrbitZoom
      />
    </div>
  );
}
