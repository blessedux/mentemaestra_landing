import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Proyectos Web3 | Mente Maestra - Portfolio de Diseño",
  description: "Explora nuestro portfolio de experiencias digitales que conectan con usuarios y potencian marcas. Descubre cómo podemos ayudarte con tu próximo proyecto.",
  keywords: [
    "portfolio web3",
    "proyectos blockchain",
    "diseño web de élite",
    "experiencias digitales",
    "innovación tecnológica",
    "proyectos cutting-edge",
    "portfolio premium",
    "diseño web3 latinoamérica"
  ],
  openGraph: {
    title: "Proyectos Web3 | Mente Maestra - Portfolio de Diseño",
    description: "Explora nuestro portfolio de experiencias digitales que conectan con usuarios y potencian marcas. Descubre cómo podemos ayudarte con tu próximo proyecto.",
    images: [
      {
        url: "/og-projects.jpg",
        width: 1200,
        height: 630,
        alt: "Mente Maestra - Portfolio de Proyectos Web3",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    title: "Proyectos Web3 | Mente Maestra - Portfolio de Diseño",
    description: "Explora nuestro portfolio de experiencias digitales que conectan con usuarios y potencian marcas.",
    images: ["/og-projects.jpg"],
  },
  alternates: {
    canonical: "https://mentemaestra.space/projects",
  },
};

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
