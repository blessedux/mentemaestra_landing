import type { Metadata } from "next";
import { DM_Sans, Geist, Geist_Mono, Syne } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
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

// NOTE: This must match the public canonical origin used in production.
// It drives absolute OpenGraph/Twitter image URLs via `metadataBase`.
const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL || "https://www.mentemaestra.studio").replace(/\/$/, "");
const OG_IMAGE = "/imgs/opengraph_static.png";
const SITE_DESCRIPTION =
  "Branding y diseño estratégico + desarrollo web para negocios en expansión. Convertimos tu marca en una experiencia premium que atrae, convence y vende.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "MenteMaestra Studio",
  description: SITE_DESCRIPTION,
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
  openGraph: {
    title: "MenteMaestra Studio",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: "MenteMaestra Studio",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "MenteMaestra Studio" }],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MenteMaestra Studio",
    description: SITE_DESCRIPTION,
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
          href="/fonts/BootzyTM.woff"
          as="font"
          type="font/woff"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/new-icon-script.otf"
          as="font"
          type="font/otf"
          crossOrigin="anonymous"
        />
      </head>
      <body suppressHydrationWarning className="antialiased">
        <ClientBody>{children}</ClientBody>
        <Analytics />
      </body>
    </html>
  );
}
