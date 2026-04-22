import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0a0a0a] px-6 text-white">
      <h1 className="text-4xl font-bold tracking-tight">404</h1>
      <p className="text-center text-zinc-400">This page could not be found.</p>
      <Link
        href="/"
        className="text-sm text-zinc-300 underline-offset-4 transition-colors hover:text-white hover:underline"
      >
        Back home
      </Link>
    </main>
  );
}
