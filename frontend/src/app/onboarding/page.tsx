import Header from "@/components/Header";
import PublicOnboardingFlow from "@/components/PublicOnboardingFlow";

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />
      <PublicOnboardingFlow />
    </main>
  );
}
