/**
 * Featured work slides — aligned with mentemaestra_landing infinite menu projects.
 * Thumbnails: copy `public/imgs/project_images/*.webp` from that repo, or rely on the CDN base below.
 */

const PROJECT_IMAGE_BASE =
  "https://cdn.jsdelivr.net/gh/blessedux/mentemaestra_landing@main/public/imgs/project_images";

export type FeaturedProject = {
  title: string;
  link: string;
  description: string;
  image: string;
};

function img(name: string): string {
  return `${PROJECT_IMAGE_BASE}/${name}`;
}

export const featuredProjects: FeaturedProject[] = [
  // Order matters: index 0 is the first “center” slide.
  {
    image: img("ethchile_thumbnail.webp"),
    link: "https://eth-chile-2025.vercel.app/",
    title: "Ethereum Chile 2025",
    description:
      "Ethereum community and development hub for Chilean blockchain ecosystem",
  },
  {
    // One2b doesn't exist in the blessedux repo's `project_images/` folder,
    // so we use a thumbnail extracted from their homepage.
    image:
      "https://ik.imagekit.io/3bfeucft4/kling_20260113_Image_to_Video____________5377_0.mp4/ik-thumbnail.jpg?updatedAt=1769294639705",
    link: "https://one2b.io/",
    title: "One2b",
    description: "Your data, bankable infrastructure for institutional adoption.",
  },
  {
    image: img("kuntur_thumbnail.webp"),
    link: "https://kuntur-git-main-mentes-projects.vercel.app/",
    title: "Kuntur Transfer",
    description: "Private transport services across Magallanes, Chile.",
  },
  {
    image: img("campus_thumbnail.webp"),
    link: "https://campus-on-chain.vercel.app/",
    title: "Campus On Chain",
    description:
      "Educational technology platform connecting students with learning opportunities worldwide",
  },
  {
    image: img("dobwiki_thumbnail.webp"),
    link: "https://dob-wiki.vercel.app/",
    title: "DOB Wiki",
    description:
      "Collaborative knowledge management platform with version control and team features",
  },
  {
    image: img("sozucapital_thumbnail.webp"),
    link: "https://sozu.capital",
    title: "Sozu Capital",
    description:
      "Investment management platform with portfolio optimization and risk analysis",
  },
  {
    image: img("urbe_booking_thumbnail.webp"),
    link: "https://urbe-booking.vercel.app/",
    title: "Urbe Village Booking",
    description:
      "Urban accommodation booking platform with smart city integration",
  },
  {
    image: img("sozucapital_thumbnail.webp"),
    link: "https://sozu.capital",
    title: "Sozu Capital",
    description:
      "Investment management platform with portfolio optimization and risk analysis",
  },
];
