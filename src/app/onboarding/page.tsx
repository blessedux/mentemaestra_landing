import Header from "@/components/Header";
import HomeScrollToSection from "@/components/HomeScrollToSection";
import PricingFaq from "@/components/PricingFaq";
import Footer from "@/components/Footer";

export default function OnboardingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#0a0a0a] text-white">
      <HomeScrollToSection />
      <Header />
      <div className="pt-24 md:pt-28">
        <PricingFaq />
      </div>
      <Footer />
    </main>
  );
}
