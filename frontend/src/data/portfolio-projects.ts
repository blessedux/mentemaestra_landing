/**
 * Single source of truth for portfolio / infinite-menu projects.
 * Thumbnails: `public/imgs/project_images/`.
 */

const PROJECT_IMAGE_BASE = "/imgs/project_images";

const img = (name: string) => `${PROJECT_IMAGE_BASE}/${name}`;

export type PortfolioProject = {
  image: string;
  link: string;
  title: string;
  description: string;
};

/** Short job-to-be-done + outcome lines for the home featured list. */
export type FeaturedProjectHighlight = {
  title: string;
  jobToBeDone: { es: string; en: string };
  outcome: { es: string; en: string };
};

/**
 * Curated subset shown at the top of the home Featured section.
 * The order here is the display order. Titles must match `portfolioProjects[*].title`.
 */
export const featuredProjectHighlights: FeaturedProjectHighlight[] = [
  {
    title: "Sozu Pay",
    jobToBeDone: {
      es: "Sistema de pagos complejo, traducido a una experiencia simple y confiable para merchants.",
      en: "Complex payments stack translated into a simple, trustworthy merchant experience.",
    },
    outcome: {
      es: "Checkout multi-moneda listo para onboarding sin soporte.",
      en: "Multi-currency checkout ready for self-serve onboarding.",
    },
  },
  {
    title: "Sozu Capital",
    jobToBeDone: {
      es: "Plataforma de inversión que debía explicar oferta y riesgo sin jerga.",
      en: "Investment platform that had to explain offer and risk without jargon.",
    },
    outcome: {
      es: "Narrativa y UI alineadas para cerrar calls con inversionistas.",
      en: "Narrative and UI aligned to close investor calls faster.",
    },
  },
  {
    title: "Hotumatur RapaNui Travel",
    jobToBeDone: {
      es: "Servicio turístico local que necesitaba sentirse premium y confiable online.",
      en: "Local travel operator that needed to feel premium and trustworthy online.",
    },
    outcome: {
      es: "Sitio que pasó de brochure a motor de reservas directas.",
      en: "Site that went from brochure to direct-booking driver.",
    },
  },
  {
    title: "Maison Vera",
    jobToBeDone: {
      es: "Marca de lujo con exigencia editorial — de la identidad al sitio.",
      en: "Luxury brand with editorial demands — from identity to site.",
    },
    outcome: {
      es: "Sistema visual coherente en e-commerce, prensa y presentación.",
      en: "Coherent visual system across e-commerce, press, and pitch.",
    },
  },
  {
    title: "Consultora DejaVu",
    jobToBeDone: {
      es: "Servicio profesional con oferta amplia que confundía a los prospectos.",
      en: "Professional services with a broad offer confusing prospects.",
    },
    outcome: {
      es: "Una narrativa clara y rutas de contacto que priorizan las consultas correctas.",
      en: "One clear narrative and contact paths that prioritize the right inquiries.",
    },
  },
];

/** Subset of `portfolioProjects` that matches the curated home list, in display order. */
export function getFeaturedProjects(): PortfolioProject[] {
  const byTitle = new Map(portfolioProjects.map((p) => [p.title, p]));
  return featuredProjectHighlights
    .map((h) => byTitle.get(h.title))
    .filter((p): p is PortfolioProject => Boolean(p));
}

export const portfolioProjects: PortfolioProject[] = [
  {
    image: img("almaglobal_thumbnail.webp"),
    link: "https://alma-global.vercel.app/",
    title: "Alma Global",
    description:
      "Global investment platform with advanced portfolio management and real-time analytics",
  },
  {
    image: img("andesoricore_thumbnail.webp"),
    link: "https://andesoricore.com",
    title: "Andesori Core",
    description:
      "Core blockchain infrastructure for decentralized applications and smart contracts",
  },
  {
    image: img("archetypes_thumbnail.webp"),
    link: "https://archetypes-kappa.vercel.app/",
    title: "Archetypes MVP",
    description:
      "AI-powered personality analysis and behavioral insights platform",
  },
  {
    image: img("blessedux_thumbnail.webp"),
    link: "https://blessedux.com",
    title: "Blessed UX",
    description:
      "User experience design agency specializing in digital transformation and innovation",
  },
  {
    image: img("campus_thumbnail.webp"),
    link: "https://campus-on-chain.vercel.app/",
    title: "Campus On Chain",
    description:
      "Educational technology platform connecting students with learning opportunities worldwide",
  },
  {
    image: img("casatigre_thumbnail.webp"),
    link: "https://casatigre.xyz",
    title: "Casa Tigre",
    description:
      "Luxury hospitality and real estate development with sustainable design principles",
  },
  {
    image: img("chiledao_thumbnail.webp"),
    link: "https://chiledao.xyz",
    title: "Chile DAO",
    description:
      "Decentralized autonomous organization for Chilean blockchain ecosystem development",
  },
  {
    image: img("dejavu_thumbnail.webp"),
    link: "https://consultoradejavu.cl",
    title: "Consultora DejaVu",
    description:
      "Advanced facial recognition and identity verification platform with privacy protection",
  },
  {
    image: img("doberframwork_thumbnail.webp"),
    link: "https://dobber-agent-launchpad.vercel.app/",
    title: "Dober Framework",
    description:
      "Modern web development framework for building scalable and performant applications",
  },
  {
    image: img("doblanding_thumbnail.webp"),
    link: "https://doblanding.vercel.app/",
    title: "DOB Landingpage",
    description:
      "Professional landing page builder with conversion optimization and analytics",
  },
  {
    image: img("doblink_thumbnail.webp"),
    link: "https://doblink.vercel.app/",
    title: "DOB Link",
    description:
      "Smart URL shortener with advanced tracking, analytics, and link management features",
  },
  {
    image: img("dobwiki_thumbnail.webp"),
    link: "https://dob-wiki.vercel.app/",
    title: "DOB Wiki",
    description:
      "Collaborative knowledge management platform with version control and team features",
  },
  {
    image: img("domi_thumbnail.webp"),
    link: "https://domi-frontend.vercel.app/",
    title: "Domi Smart Architecture",
    description:
      "Home automation and smart living platform with IoT device integration",
  },
  {
    image: img("drtymoney_thumbnail.webp"),
    link: "https://drtymny.vercel.app/",
    title: "Dirty Money",
    description:
      "Financial transparency platform for tracking and analyzing money flows",
  },
  {
    image: img("ethchile_thumbnail.webp"),
    link: "https://eth-chile-2025.vercel.app/",
    title: "Ethereum Chile 2025",
    description:
      "Ethereum community and development hub for Chilean blockchain ecosystem",
  },
  {
    image: img("feridojo_thumbnail.webp"),
    link: "https://feridojo.cl",
    title: "Feridojo gasfiter",
    description:
      "Martial arts training platform with virtual coaching and progress tracking",
  },
  {
    image: img("fts_thumbnail.webp"),
    link: "https://fannytorresilva.com/",
    title: "Fanny Torres Silva",
    description:
      "Financial technology solutions for secure transactions and digital payments",
  },
  {
    image: img("hotumatur_thumbnail.webp"),
    link: "https://hotumatur-webapp.vercel.app/",
    title: "Hotumatur RapaNui Travel",
    description:
      "Advanced weather prediction and climate monitoring platform with AI insights",
  },
  {
    image: img("intidomains_thumbnail.webp"),
    link: "https://intidomains.vercel.app/",
    title: "Inti Domains",
    description:
      "Premium domain marketplace with advanced search and valuation tools",
  },
  {
    image: img("kuntur_thumbnail.webp"),
    link: "https://transferkuntur.cl",
    title: "Kuntur Transfer",
    description:
      "Aviation technology platform for flight tracking and airline management systems",
  },
  {
    image: img("maisonvera_thumbnail.webp"),
    link: "https://maisonvera.com",
    title: "Maison Vera",
    description:
      "Luxury fashion and lifestyle brand with sustainable and ethical practices",
  },
  {
    image: img("silvia_thumbnail.webp"),
    link: "https://silvia-coral.vercel.app/",
    title: "Silvia",
    description:
      "Personal assistant AI platform for productivity and task management",
  },
  {
    image: img("sozucapital_thumbnail.webp"),
    link: "https://sozu.capital",
    title: "Sozu Capital",
    description:
      "Investment management platform with portfolio optimization and risk analysis",
  },
  {
    image: img("sozucash_thumbnail.webp"),
    link: "https://sozucash.vercel.app/",
    title: "Sozu Cash",
    description:
      "Digital cash management system with instant transfers and financial tools",
  },
  {
    image: img("sozupay_thumbnail.webp"),
    link: "https://pay.sozu.capital",
    title: "Sozu Pay",
    description:
      "Payment processing platform with multi-currency support and fraud protection",
  },
  {
    image: img("urbe_booking_thumbnail.webp"),
    link: "https://urbe-booking.vercel.app/",
    title: "Urbe Village Booking",
    description:
      "Urban accommodation booking platform with smart city integration",
  },
  {
    image: img("validator_thumbnail.webp"),
    link: "https://validator-frontend-one.vercel.app/",
    title: "Dob Validator",
    description:
      "Blockchain validation and consensus mechanism platform for network security",
  },
];
