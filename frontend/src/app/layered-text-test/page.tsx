import type { Metadata } from "next";
import LayeredTextTestClient from "./LayeredTextTestClient";

export const metadata: Metadata = {
  title: "Layered text (test) · MenteMaestra Studio",
  description: "Isometric stacked lines — MENTE → MAESTRA → DESIGN → STUDIO.",
};

export default function LayeredTextTestPage() {
  return <LayeredTextTestClient />;
}
