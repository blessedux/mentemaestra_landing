// Re-export canonical list for the WebGL infinite menu (same order as landing 3D marquee).

import type { MenuItem } from "./types";
import { portfolioProjects } from "@/data/portfolio-projects";

export const projectsData: MenuItem[] = portfolioProjects;

export const defaultItems: MenuItem[] = [
  {
    image: "https://picsum.photos/900/900?grayscale",
    link: "https://google.com/",
    title: "Item 1",
    description: "This is a default item, customize with props!",
  },
];
