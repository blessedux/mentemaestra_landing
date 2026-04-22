import { Suspense } from "react";

import BookLegacyRedirect from "@/components/BookLegacyRedirect";

function BookFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-zinc-400">
      Redirecting…
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={<BookFallback />}>
      <BookLegacyRedirect />
    </Suspense>
  );
}
