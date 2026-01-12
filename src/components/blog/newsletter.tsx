"use client";

import dynamic from "next/dynamic";
import Container from "@/components/container";

// Dynamically import CtaCard to avoid SSR issues with framer-motion
const CtaCard = dynamic(() => import("@/components/ui/cta-card").then(mod => ({ default: mod.CtaCard })), {
  ssr: false,
  loading: () => (
    <div className="relative w-full overflow-hidden rounded-xl border bg-gray-900 h-64 flex items-center justify-center">
      <div className="text-gray-400">Cargando...</div>
    </div>
  ),
});

export default function Newsletter() {
  const handleSignUp = (email: string) => {
    // TODO: Implement newsletter subscription API call
    console.log("Newsletter signup:", email);
    // You can add toast notification here
  };

  return (
    <section className="py-16 md:py-24 border-t border-gray-800">
      <Container>
        <CtaCard
          title="Suscríbete para más contenido"
          description="Recibe nuestros últimos artículos sobre Web3 y diseño directamente en tu inbox. Exploramos el futuro del diseño digital y blockchain."
          buttonText="Suscribirse"
          inputPlaceholder="Ingresa tu email"
          imageSrc="https://images.unsplash.com/photo-1557683316-973673baf926?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZGFyayUyMGJhY2tncm91bmQlMjB3ZWJ8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=2574&q=80"
          onButtonClick={handleSignUp}
        />
      </Container>
    </section>
  );
}
