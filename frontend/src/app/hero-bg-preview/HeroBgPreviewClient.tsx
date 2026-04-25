"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";

const GLSLHills = dynamic(() => import("@/components/GLSLHills"), {
  ssr: false,
  loading: () => null,
});

/**
 * Full-viewport, content-free render of the GLSLHills shader.
 * Use this page to screen-record the background animation so it can be
 * embedded as a <video> in the Hero section for mobile users.
 *
 * The matchMedia("max-width: 767px") guard inside GLSLHills means WebGL only
 * runs on desktop — resize to a desktop window before recording.
 */
export default function HeroBgPreviewClient() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        inset: 0,
        background: "#0a0a0a",
        overflow: "hidden",
      }}
    >
      <GLSLHills
        className="absolute inset-0 h-full w-full"
        width="100%"
        height="100%"
        interactionRootRef={containerRef}
      />
    </div>
  );
}
