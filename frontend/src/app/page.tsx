import Header from "@/components/Header";
import HomeScrollToSection from "@/components/HomeScrollToSection";
import About from "@/components/About";
import { Hero } from "@/components/Hero";
import Welcome from "@/components/Welcome";
import { Features } from "@/components/blocks/features-8";
import { ProcessFeatures } from "@/components/ui/process-features";
import Services from "@/components/Services";
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
      <Hero />
      <About />
      <Welcome />
      <Features />
      <Services />
      <FeaturedWorks />
      <Stack />
      <Experience />
      <Testimonials />
      <ProcessFeatures />
      <BookMeetingSection />
      <Footer />
    </main>
  );
}
