import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LicitacionDetail from "@/components/licitaciones/LicitacionDetail";

export default async function LicitacionDetailPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#0a0a0a] text-white">
      <Header />
      <div className="mx-auto max-w-7xl px-4 pt-28 pb-12 sm:px-6">
        <LicitacionDetail codigo={decodeURIComponent(codigo)} />
      </div>
      <Footer />
    </main>
  );
}

