import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Proyectos Web3 | Mente Maestra - Portfolio de Diseño de Élite",
  description: "Descubre nuestro portfolio exclusivo de proyectos Web3 y blockchain. Experiencias digitales revolucionarias que redefinen el futuro del diseño web. Cada proyecto es una obra maestra de innovación tecnológica.",
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
    title: "Proyectos Web3 | Mente Maestra - Portfolio de Diseño de Élite",
    description: "Descubre nuestro portfolio exclusivo de proyectos Web3 y blockchain. Experiencias digitales revolucionarias que redefinen el futuro del diseño web. Cada proyecto es una obra maestra de innovación tecnológica.",
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
    title: "Proyectos Web3 | Mente Maestra - Portfolio de Diseño de Élite",
    description: "Descubre nuestro portfolio exclusivo de proyectos Web3 y blockchain. Experiencias digitales revolucionarias que redefinen el futuro del diseño web.",
    images: ["/og-projects.jpg"],
  },
  alternates: {
    canonical: "https://mentemaestra.com/projects",
  },
};

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
