import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LicitacionesExplorer from "@/components/licitaciones/LicitacionesExplorer";

export default function LicitacionesPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#0a0a0a] text-white">
      <Header />
      <div className="mx-auto max-w-7xl px-4 pt-28 pb-12 sm:px-6">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">
            Explorar licitaciones
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/70">
            Busca por <span className="font-medium text-white">código</span>{" "}
            (ej: 1509-5-L114) o por{" "}
            <span className="font-medium text-white">fecha</span> (ddmmaaaa).
            Guarda licitaciones relevantes y revisa el panel “cómo ganar” en el
            detalle.
          </p>
        </div>
        <LicitacionesExplorer />
      </div>
      <Footer />
    </main>
  );
}

