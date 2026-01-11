import { type SanityDocument } from "next-sanity";
import { client } from "@/sanity/lib/client";
import PostList from "@/components/blog/postlist";
import Container from "@/components/container";

const POSTS_QUERY = `*[
  _type == "post"
  && defined(slug.current)
]|order(publishedAt desc)[0...14]{
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

const FEATURED_POSTS_QUERY = `*[
  _type == "post"
  && defined(slug.current)
  && featured == true
]|order(publishedAt desc)[0...2]{
  _id,
  title,
  slug,
  publishedAt,
  excerpt,
  image,
  author->{name, slug, image},
  categories[]->{title, slug, color}
}`;

const options = { next: { revalidate: 30 } };

export default async function BlogPage() {
  const [posts, featuredPosts] = await Promise.all([
    client.fetch<SanityDocument[]>(POSTS_QUERY, {}, options),
    client.fetch<SanityDocument[]>(FEATURED_POSTS_QUERY, {}, options),
  ]);

  // Filter out featured posts from regular posts to avoid duplication
  const regularPosts = posts.filter(post =>
    !featuredPosts.some(featured => featured._id === post._id)
  );

  return (
    <main className="min-h-screen bg-black text-white">
      <Container>
        {/* Blog Header */}
        <div className="py-16 md:py-24">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white">
            Blog
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl">
            Explorando el futuro del diseño Web3 y blockchain
          </p>
        </div>

        {posts && posts.length > 0 ? (
          <>
            {/* Featured Posts */}
            {featuredPosts.length > 0 && (
              <section className="mb-20">
                <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-white">
                  Destacados
                </h2>
                <div className="grid gap-10 md:grid-cols-2 lg:gap-10">
                  {featuredPosts.map(post => (
                    <PostList
                      key={post._id}
                      posts={[post]}
                      aspect="landscape"
                      preloadImage={true}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Regular Posts Grid */}
            <section className="mb-20">
              {featuredPosts.length > 0 && (
                <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-white">
                  Todos los Posts
                </h2>
              )}
              <div className="grid gap-10 md:grid-cols-2 lg:gap-10 xl:grid-cols-3">
                {regularPosts.slice(0, 12).map(post => (
                  <PostList key={post._id} posts={[post]} aspect="square" />
                ))}
              </div>
            </section>

            {/* View More Link */}
            {regularPosts.length > 12 && (
              <div className="flex justify-center pb-20">
                <a
                  href="/blog/archive"
                  className="relative inline-flex items-center gap-1 rounded-md border border-gray-600 bg-transparent px-6 py-3 text-sm font-medium text-white hover:bg-gray-900 hover:border-gray-500 transition-colors"
                >
                  <span>Ver todos los Posts</span>
                </a>
              </div>
            )}
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

