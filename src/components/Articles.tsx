import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";

const articles = [
  {
    category: "Experience",
    date: "May 15, 2024",
    title: "How to build work culture for young office?",
    image: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=600&q=80",
  },
  {
    category: "Design Trends",
    date: "May 1, 2024",
    title: "Hubfolio - Winner SOTY at CSS Winner 2023 with Zumar project",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80",
  },
  {
    category: "Tips & Tricks",
    date: "April 24, 2024",
    title: "Rebrand vs Refresh: 10 Minutes On Brand by Hubfolio",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80",
  },
];

export default function Articles() {
  return (
    <section id="articles" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <h2 className="text-4xl md:text-5xl font-bold">Our Articles</h2>
          <Link
            href="/"
            className="flex items-center gap-2 px-6 py-3 border border-zinc-700 rounded-full text-sm hover:bg-zinc-800 transition-colors w-fit"
          >
            See All Articles
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Articles Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article, index) => (
            <article key={index} className="group cursor-pointer">
              {/* Meta */}
              <div className="flex items-center gap-3 text-sm text-zinc-500 mb-4 border-t border-zinc-800 pt-4">
                <span className="hover:text-white transition-colors">{article.category}</span>
                <span>/</span>
                <span>{article.date}</span>
              </div>

              {/* Title */}
              <h3 className="mb-4 text-xl font-medium transition-colors group-hover:text-accent">
                {article.title}
              </h3>

              {/* Image */}
              <div className="aspect-[4/3] rounded-xl overflow-hidden relative bg-zinc-800">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                    <ArrowUpRight className="w-5 h-5 text-black" />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
