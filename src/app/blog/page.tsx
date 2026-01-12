import { type SanityDocument } from "next-sanity";
import { client } from "@/sanity/lib/client";
import Container from "@/components/container";
import BentoGrid from "@/components/blog/bentoGrid";

const POSTS_QUERY = `*[
  _type == "post"
  && defined(slug.current)
]|order(publishedAt desc){
  _id,
  title,
  slug,
  publishedAt,
  excerpt,
  featured,
  image,
  author->{name, slug, image},
  categories[]->{title, slug, color}
}`;

const options = { next: { revalidate: 30 } };

export default async function BlogPage() {
  const posts = await client.fetch<SanityDocument[]>(POSTS_QUERY, {}, options);

  return (
    <main className="min-h-screen bg-black text-white relative">
      <Container>
        {/* Blog Header */}
        <div className="py-16 md:py-24 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white">
            Blog
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
            Explorando el futuro del diseño Web3 y blockchain
          </p>
        </div>

        {posts && posts.length > 0 ? (
          <>
            {/* Bento Grid Layout - All Posts */}
            <section className="mb-20">
              <BentoGrid posts={posts} />
            </section>
          </>
        ) : (
          <div className="py-20 text-center">
            <p className="text-xl text-gray-400 mb-4">No hay posts aún</p>
            <p className="text-gray-500">
              Crea tu primer post en Sanity Studio para comenzar
            </p>
          </div>
        )}
      </Container>
    </main>
  );
}

