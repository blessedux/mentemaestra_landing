import BrainTestView from "@/components/BrainTestView";

export default function BrainTestPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-2 text-xl font-medium">3D brain (test)</h1>
        <p className="mb-6 max-w-2xl text-sm text-white/60">
          Port of the Amelia Brain demo from{" "}
          <a
            className="underline decoration-white/30 underline-offset-2 hover:decoration-white/60"
            href="https://github.com/victors1681/3dbrain"
            rel="noopener noreferrer"
            target="_blank"
          >
            victors1681/3dbrain
          </a>
          . Drag to orbit, scroll to zoom. Code lives under{" "}
          <code className="rounded bg-white/10 px-1 py-0.5 text-xs">
            src/3dbrain/
          </code>
          ; assets under{" "}
          <code className="rounded bg-white/10 px-1 py-0.5 text-xs">
            public/3dbrain/static/
          </code>
          .
        </p>
        <BrainTestView />
      </div>
    </main>
  );
}
