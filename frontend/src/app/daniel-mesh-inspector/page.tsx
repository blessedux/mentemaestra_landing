import type { Metadata } from "next";
import { Suspense } from "react";
import DanielMeshInspectorClient from "./DanielMeshInspectorClient";

export const metadata: Metadata = {
  title: "Daniel room · mesh inspector (dev)",
  description:
    "Inspect a single dark-room GLB chunk with orbit controls and mesh names.",
};

export default function DanielMeshInspectorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center bg-[#070708] text-sm text-white/45">
          Loading…
        </div>
      }
    >
      <DanielMeshInspectorClient />
    </Suspense>
  );
}
