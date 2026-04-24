import type { Metadata } from "next";

import Header from "@/components/Header";
import { messages } from "@/i18n/messages";

import PortalRecoverForm from "./PortalRecoverForm";

export const metadata: Metadata = {
  title: messages.es.portalRecover.metaTitle,
  description: messages.es.portalRecover.metaDescription,
};

export default function PortalLoginPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />
      <div className="mx-auto w-full max-w-md px-4 pb-24 pt-28 sm:px-6 sm:pt-36">
        <PortalRecoverForm />
      </div>
    </main>
  );
}
