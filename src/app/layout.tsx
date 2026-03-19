import type { Metadata } from "next";
import { Geist, Geist_Mono, Merriweather } from "next/font/google";
import "./globals.css";
import ClientWrapper from "@/components/ClientWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const merigo = Merriweather({
  variable: "--font-merigo",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
});

export const metadata: Metadata = {
  title: "Mente Maestra | Estudio de Diseño Web inmersivo",
  description: "Estudio de diseño especializado en Web3 y blockchain. Creamos experiencias digitales innovadoras que conectan con tu audiencia y potencian tu proyecto. Soluciones personalizadas para el futuro del diseño web.",
  keywords: [
    "diseño web3",
    "estudio de diseño premium",
    "blockchain design",
    "experiencias digitales",
    "diseño web de élite",
    "innovación digital",
    "web3 latinoamérica",
    "diseño cutting-edge"
  ],
  authors: [{ name: "Mente Maestra Studio" }],
  creator: "Mente Maestra",
  publisher: "Mente Maestra",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://mentemaestra.space",
    siteName: "Mente Maestra",
    title: "Mente Maestra | Estudio de Diseño Web inmersivo",
    description: "Especialistas en Web3 y blockchain. Creamos experiencias digitales que conectan con tu audiencia y potencian tu proyecto. Soluciones personalizadas para el futuro del diseño web.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Mente Maestra - Estudio de Diseño Web inmersivo",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@mentemaestra",
    creator: "@mentemaestra",
    title: "Mente Maestra | Estudio de Diseño Web inmersivo",
    description: "Especialistas en Web3 y blockchain. Creamos experiencias digitales que conectan con tu audiencia y potencian tu proyecto.",
    images: ["/og-image.jpg"],
  },
  alternates: {
    canonical: "https://mentemaestra.space",
  },
  category: "technology",
  classification: "Web3 Design Studio",
  other: {
    "apple-mobile-web-app-title": "Mente Maestra",
    "application-name": "Mente Maestra",
    "msapplication-TileColor": "#000000",
    "theme-color": "#000000",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${merigo.variable} antialiased`}
      >
        <ClientWrapper>
          {children}
        </ClientWrapper>
      </body>
    </html>
  );
}
