import { Suspense } from "react";
import Container from "@/components/container";
import ArchiveContent from "./archive-content";
import Loading from "@/components/loading";

export const dynamic = "force-dynamic";

export const runtime = "edge";

export default async function ArchivePage({ 
  searchParams 
}: { 
  searchParams: Promise<{ page?: string }> 
}) {
  const params = await searchParams;
  
  return (
    <>
      <Container className="relative">
        <h1 className="text-center text-3xl font-semibold tracking-tight dark:text-white lg:text-4xl lg:leading-snug">
          Archive
        </h1>
        <div className="text-center">
          <p className="mt-2 text-lg">
            See all posts we have ever written.
          </p>
        </div>
        <Suspense
          key={params.page || "1"}
          fallback={<Loading />}>
          <ArchiveContent searchParams={params} />
        </Suspense>
      </Container>
    </>
  );
}
