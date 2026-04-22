/**
 * @deprecated Import `portfolioProjects` from `@/data/portfolio-projects` instead.
 * Alias kept for call sites that expect “featured” naming.
 */

export type { PortfolioProject as FeaturedProject } from "./portfolio-projects";
export { portfolioProjects as featuredProjects } from "./portfolio-projects";
