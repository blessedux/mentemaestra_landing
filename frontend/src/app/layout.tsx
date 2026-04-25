import type { Metadata } from "next";
import { DM_Sans, Geist, Geist_Mono, Syne } from "next/font/google";
import "./globals.css";
import ClientBody from "./ClientBody";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  adjustFontFallback: true,
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  adjustFontFallback: true,
});

const SITE_URL = "https://mentemaestra.com";
const OG_IMAGE = "/imgs/opengraph_static.png";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "MenteMaestra Studio",
  description: "Diseño, código y crecimiento para marcas que escalan.",
  openGraph: {
    title: "MenteMaestra Studio",
    description: "Diseño, código y crecimiento para marcas que escalan.",
    url: SITE_URL,
    siteName: "MenteMaestra Studio",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "MenteMaestra Studio" }],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MenteMaestra Studio",
    description: "Diseño, código y crecimiento para marcas que escalan.",
    images: [OG_IMAGE],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${syne.variable} ${dmSans.variable}`}
    >
      <head>
        <link
          rel="preload"
          href="/fonts/bootzy.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/new-icon-script.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body suppressHydrationWarning className="antialiased">
        <ClientBody>{children}</ClientBody>
      </body>
    </html>
  );
}
