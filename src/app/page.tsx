import Header from "@/components/Header";
import HomeScrollToSection from "@/components/HomeScrollToSection";
import { HeroDitheringCard } from "@/components/ui/hero-dithering-card";
import Welcome from "@/components/Welcome";
import Services from "@/components/Services";
import Marquee from "@/components/Marquee";
import FeaturedWorks from "@/components/FeaturedWorks";
import Stack from "@/components/Stack";
import BookMeetingSection from "@/components/BookMeetingSection";
import Testimonials from "@/components/Testimonials";
import Experience from "@/components/Experience";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#0a0a0a] text-white">
      <HomeScrollToSection />
      <Header />
      <HeroDitheringCard />
      <Welcome />
      <Services />
      <Marquee />
      <FeaturedWorks />
      <Stack />
      <Experience />
      <Testimonials />
      <BookMeetingSection />
      <Footer />
    </main>
  );
}
