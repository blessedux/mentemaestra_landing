import type { Metadata } from "next";
import DanielPortfolioExperienceClient from "./DanielPortfolioExperienceClient";

export const metadata: Metadata = {
  title: "Daniel home office room (test) · MenteMaestra Studio",
  description:
    "Isolated port of the dark/light 3D room from andrewwoan/daniels-home-office-portfolio.",
};

export default function DanielDarkRoomTestPage() {
  return <DanielPortfolioExperienceClient />;
}
