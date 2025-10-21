// Mente Maestra Projects Data
// 27 real projects with actual images from public/imgs/project_images

import { MenuItem } from "./types";

// Helper function to get the appropriate image based on device
const getImagePath = (baseName: string): string => {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  
  if (isMobile || isIOS) {
    // Use mobile-optimized images (256x256px)
    return `/imgs/project_images/mobile/${baseName}`;
  } else {
    // Use desktop images (512x512px)
    return `/imgs/project_images/${baseName}`;
  }
};

export const projectsData: MenuItem[] = [
  {
    image: getImagePath("almaglobal_thumbnail.webp"),
    link: "https://alma-global.vercel.app/",
    title: "Alma Global",
    description: "Global investment platform with advanced portfolio management and real-time analytics",
  },
  {
    image: getImagePath("andesoricore_thumbnail.webp"),
    link: "https://andesoricore.com",
    title: "Andesori Core",
    description: "Core blockchain infrastructure for decentralized applications and smart contracts",
  },
  {
    image: getImagePath("archetypes_thumbnail.webp"),
    link: "https://archetypes-kappa.vercel.app/",
    title: "Archetypes MVP",
    description: "AI-powered personality analysis and behavioral insights platform",
  },
  {
    image: getImagePath("blessedux_thumbnail.webp"),
    link: "https://blessedux.com",
    title: "Blessed UX",
    description: "User experience design agency specializing in digital transformation and innovation",
  },
  {
    image: getImagePath("campus_thumbnail.webp"),
    link: "https://campus-on-chain.vercel.app/",
    title: "Campus On Chain",
    description: "Educational technology platform connecting students with learning opportunities worldwide",
  },
  {
    image: getImagePath("casatigre_thumbnail.webp"),
    link: "https://casatigre.xyz",
    title: "Casa Tigre",
    description: "Luxury hospitality and real estate development with sustainable design principles",
  },
  {
    image: getImagePath("chiledao_thumbnail.webp"),
    link: "https://chiledao.xyz",
    title: "Chile DAO",
    description: "Decentralized autonomous organization for Chilean blockchain ecosystem development",
  },
  {
    image: getImagePath("dejavu_thumbnail.webp"),
    link: "https://consultoradejavu.cl",
    title: "Consultora DejaVu",
    description: "Advanced facial recognition and identity verification platform with privacy protection",
  },
  {
    image: getImagePath("doberframwork_thumbnail.webp"),
    link: "https://dobber-agent-launchpad.vercel.app/",
    title: "Dober Framework",
    description: "Modern web development framework for building scalable and performant applications",
  },
  {
    image: getImagePath("doblanding_thumbnail.webp"),
    link: "https://doblanding.vercel.app/",
    title: "DOB Landingpage",
    description: "Professional landing page builder with conversion optimization and analytics",
  },
  {
    image: getImagePath("doblink_thumbnail.webp"),
    link: "https://doblink.vercel.app/",
    title: "DOB Link",
    description: "Smart URL shortener with advanced tracking, analytics, and link management features",
  },
  {
    image: getImagePath("dobwiki_thumbnail.webp"),
    link: "https://dob-wiki.vercel.app/",
    title: "DOB Wiki",
    description: "Collaborative knowledge management platform with version control and team features",
  },
  {
    image: getImagePath("domi_thumbnail.webp"),
    link: "https://domi-frontend.vercel.app/",
    title: "Domi Smart Architecture",
    description: "Home automation and smart living platform with IoT device integration",
  },
  {
    image: getImagePath("drtymoney_thumbnail.webp"),
    link: "https://drtymny.vercel.app/",
    title: "Dirty Money",
    description: "Financial transparency platform for tracking and analyzing money flows",
  },
  {
    image: getImagePath("ethchile_thumbnail.webp"),
    link: "https://eth-chile-2025.vercel.app/",
    title: "Ethereum Chile 2025",
    description: "Ethereum community and development hub for Chilean blockchain ecosystem",
  },
  {
    image: getImagePath("feridojo_thumbnail.webp"),
    link: "https://feridojo.cl",
    title: "Feridojo gasfiter",
    description: "Martial arts training platform with virtual coaching and progress tracking",
  },
  {
    image: getImagePath("fts_thumbnail.webp"),
    link: "https://fannytorresilva.com/",
    title: "Fanny Torres Silva",
    description: "Financial technology solutions for secure transactions and digital payments",
  },
  {
    image: getImagePath("hotumatur_thumbnail.webp"),
    link: "https://hotumatur-webapp.vercel.app/",
    title: "Hotumatur RapaNui Travel",
    description: "Advanced weather prediction and climate monitoring platform with AI insights",
  },
  {
    image: getImagePath("intidomains_thumbnail.webp"),
    link: "https://intidomains.vercel.app/",
    title: "Inti Domains",
    description: "Premium domain marketplace with advanced search and valuation tools",
  },
  {
    image: getImagePath("kuntur_thumbnail.webp"),
    link: "https://transferkuntur.cl",
    title: "Kuntur Transfer",
    description: "Aviation technology platform for flight tracking and airline management systems",
  },
  {
    image: getImagePath("maisonvera_thumbnail.webp"),
    link: "https://maisonvera.com",
    title: "Maison Vera",
    description: "Luxury fashion and lifestyle brand with sustainable and ethical practices",
  },
  {
    image: getImagePath("silvia_thumbnail.webp"),
    link: "https://silvia-coral.vercel.app/",
    title: "Silvia",
    description: "Personal assistant AI platform for productivity and task management",
  },
  {
    image: getImagePath("sozucapital_thumbnail.webp"),
    link: "https://sozu.capital",
    title: "Sozu Capital",
    description: "Investment management platform with portfolio optimization and risk analysis",
  },
  {
    image: getImagePath("sozucash_thumbnail.webp"),
    link: "https://sozucash.vercel.app/",
    title: "Sozu Cash",
    description: "Digital cash management system with instant transfers and financial tools",
  },
  {
    image: getImagePath("sozupay_thumbnail.webp"),
    link: "https://pay.sozu.capital",
    title: "Sozu Pay",
    description: "Payment processing platform with multi-currency support and fraud protection",
  },
  {
    image: getImagePath("urbe_booking_thumbnail.webp"),
    link: "https://urbe-booking.vercel.app/",
    title: "Urbe Village Booking",
    description: "Urban accommodation booking platform with smart city integration",
  },
  {
    image: getImagePath("validator_thumbnail.webp"),
    link: "https://validator-frontend-one.vercel.app/",
    title: "Dob Validator",
    description: "Blockchain validation and consensus mechanism platform for network security",
  },
];

// Default fallback items (keeping the original for compatibility)
export const defaultItems: MenuItem[] = [
  {
    image: "https://picsum.photos/900/900?grayscale",
    link: "https://google.com/",
    title: "Item 1",
    description: "This is a default item, customize with props!",
  },
];
