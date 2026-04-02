import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Welcome from "@/components/Welcome";
import Services from "@/components/Services";
import Marquee from "@/components/Marquee";
import FeaturedWorks from "@/components/FeaturedWorks";
import Partners from "@/components/Partners";
import Testimonials from "@/components/Testimonials";
import PricingFaq from "@/components/PricingFaq";
import Experience from "@/components/Experience";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#0a0a0a] text-white">
      <Header />
      <Hero />
      <Welcome />
      <Services />
      <Marquee />
      <FeaturedWorks />
      <Partners />
      <Testimonials />
      <Experience />
      <PricingFaq />
      <Footer />
    </main>
  );
}
