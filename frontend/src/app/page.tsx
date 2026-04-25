import dynamic from "next/dynamic";

import Header from "@/components/Header";
import HomeMobileSnap from "@/components/HomeMobileSnap";
import HomeScrollToSection from "@/components/HomeScrollToSection";
import About from "@/components/About";
import { DanielRoomEmbed } from "@/components/DanielRoomEmbed";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/blocks/features-8";

// Below-the-fold sections — each is a separate lazy JS chunk so the initial
// client bundle only contains what is needed for first paint. SSR still runs
// for these (required by App Router), but the client-side JS is deferred.
// Height shims in `loading` keep the page tall during client hydration so
// mobile browsers never mark it as non-scrollable before chunks load.
const SectionShim = ({ h = "600px" }: { h?: string }) => (
  <div style={{ minHeight: h }} aria-hidden />
);

const ProcessFeatures = dynamic(
  () => import("@/components/ui/process-features").then((m) => ({ default: m.ProcessFeatures })),
  { loading: () => <SectionShim h="480px" /> },
);
const Services = dynamic(() => import("@/components/Services"), {
  loading: () => <SectionShim h="640px" />,
});
const FeaturedWorks = dynamic(() => import("@/components/FeaturedWorks"), {
  loading: () => <SectionShim h="640px" />,
});
const Stack = dynamic(() => import("@/components/Stack"), {
  loading: () => <SectionShim h="480px" />,
});
const Experience = dynamic(() => import("@/components/Experience"), {
  loading: () => <SectionShim h="480px" />,
});
const Testimonials = dynamic(() => import("@/components/Testimonials"), {
  loading: () => <SectionShim h="480px" />,
});
const BookMeetingSection = dynamic(() => import("@/components/BookMeetingSection"), {
  loading: () => <SectionShim h="480px" />,
});
const Footer = dynamic(() => import("@/components/Footer"), {
  loading: () => <SectionShim h="240px" />,
});

export default function Home() {
  return (
    <main
      data-home-snap="true"
      className="min-h-screen overflow-x-clip bg-[#0a0a0a] text-white"
    >
      <HomeMobileSnap />
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
