import type { Metadata } from "next";
import HeroBgPreviewClient from "./HeroBgPreviewClient";

export const metadata: Metadata = {
  title: "Hero BG Preview · MenteMaestra",
  description: "Isolated render of the GLSLHills shader for screen-recording.",
  robots: { index: false, follow: false },
};

/**
 * Temporary capture page: full-viewport GLSLHills shader, no UI.
 * Navigate to /hero-bg-preview on desktop, then screen-record to produce
 * the hero background video for mobile fallback.
 */
export default function HeroBgPreviewPage() {
  return <HeroBgPreviewClient />;
}
