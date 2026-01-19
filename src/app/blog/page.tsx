import { type SanityDocument } from "next-sanity";
import { defineQuery } from "next-sanity";
import { client } from "@/sanity/lib/client";
import BlogCard from "@/components/blog/blog-card";
import BlogCardSkeleton from "@/components/blog/blog-card-skeleton";
import { Suspense } from "react";

// Blog posts query for listing page - optimized following Sanity best practices
const POSTS_QUERY = defineQuery(`*[
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
  author->{
    _id,
    name,
    slug,
    image
  },
  categories[]->{
    _id,
    title,
    slug,
    color
  }
}`);

// Count query for pagination (future use)
const POSTS_COUNT_QUERY = defineQuery(`count(*[_type == "post" && defined(slug.current)])`);

const options = { next: { revalidate: 30 } };

async function BlogPostsGrid() {
  const posts = await client.fetch<SanityDocument[]>(POSTS_QUERY, {}, options);
  
  if (!posts || posts.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-xl text-gray-400 mb-4">No hay posts aún</p>
        <p className="text-gray-500">
          Crea tu primer post en Sanity Studio para comenzar
        </p>
      </div>
    );
  }

  return (
    <div className="blog-grid">
      {posts.map((post) => (
        <div key={post._id} className="blog-grid-item">
          <BlogCard post={post} />
        </div>
      ))}
    </div>
  );
}

function BlogPostsSkeleton() {
  return (
    <div className="blog-grid">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="blog-grid-item">
          <BlogCardSkeleton />
        </div>
      ))}
    </div>
  );
}

export default async function BlogPage() {
  return (
    <main className="min-h-screen bg-black text-white relative">
      <div className="w-full mx-auto" style={{ maxWidth: '100%' }}>
        {/* Blog Header */}
        <div className="py-16 md:py-24 text-center" style={{ paddingLeft: '1rem', paddingRight: '1rem' }}>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white">
            Blog
          </h1>
          <p className="text-lg md:text-xl text-white max-w-2xl mx-auto">
            Explorando el futuro del diseño Web3 y blockchain
          </p>
        </div>

        {/* Blog Cards Grid Layout - All Posts with Skeleton Loading */}
        <section className="mb-20 w-full">
          <Suspense fallback={<BlogPostsSkeleton />}>
            <BlogPostsGrid />
          </Suspense>
        </section>
      </div>
    </main>
  );
}

