import type { Metadata } from "next";
import ShaderHillsTestClient from "./ShaderHillsTestClient";

export const metadata: Metadata = {
  title: "Shader hills (test) · MenteMaestra Studio",
  description: "WebGL hills shader playground (120vh hero prototype).",
};

export default function ShaderHillsTestPage() {
  return <ShaderHillsTestClient />;
}
