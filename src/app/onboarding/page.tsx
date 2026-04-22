import Header from "@/components/Header";
import OnboardingProjectTypeStep from "@/components/OnboardingProjectTypeStep";
import Footer from "@/components/Footer";

export default function OnboardingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#0a0a0a] text-white">
      <Header />
      <OnboardingProjectTypeStep />
      <Footer />
    </main>
  );
}
