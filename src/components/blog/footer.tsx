import Link from "next/link";

export default function BlogFooter() {
  return (
    <footer className="border-t border-gray-800 py-8">
      <div className="container mx-auto px-8">
        <div className="flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
          <div>
            <p>Mente Maestra Blog © {new Date().getFullYear()}</p>
          </div>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link href="/" className="hover:text-white transition-colors">
              Inicio
            </Link>
            <Link href="/blog" className="hover:text-white transition-colors">
              Blog
            </Link>
            <Link href="/projects" className="hover:text-white transition-colors">
              Proyectos
            </Link>
            <a
              href="https://blessedux.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              built with ❤️ by blessedux
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
