import dynamic from "next/dynamic";

import Header from "@/components/Header";
import HomeScrollToSection from "@/components/HomeScrollToSection";
import About from "@/components/About";
import { DanielRoomEmbed } from "@/components/DanielRoomEmbed";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/blocks/features-8";

// Below-the-fold sections — each is a separate lazy JS chunk so the initial
// client bundle only contains what is needed for first paint. SSR still runs
// for these (required by App Router), but the client-side JS is deferred.
const ProcessFeatures = dynamic(() =>
  import("@/components/ui/process-features").then((m) => ({ default: m.ProcessFeatures })),
);
const Services = dynamic(() => import("@/components/Services"));
const FeaturedWorks = dynamic(() => import("@/components/FeaturedWorks"));
const Stack = dynamic(() => import("@/components/Stack"));
const Experience = dynamic(() => import("@/components/Experience"));
const Testimonials = dynamic(() => import("@/components/Testimonials"));
const BookMeetingSection = dynamic(() => import("@/components/BookMeetingSection"));
const Footer = dynamic(() => import("@/components/Footer"));

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#0a0a0a] text-white">
      <HomeScrollToSection />
      <Header />
      <Hero />
      <About />
      <section
        className="relative w-full overflow-x-hidden bg-[#080708]"
        aria-label="Daniel home office"
      >
        <DanielRoomEmbed extendSceneBottomVh={20} />
      </section>
      <Features />
      <ProcessFeatures />
      <Services />
      <FeaturedWorks />
      <Stack />
      <Experience />
      <Testimonials />
      <BookMeetingSection />
      <Footer />
    </main>
  );
}
