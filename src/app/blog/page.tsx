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
    <>
      {posts && (
        <Container>
          {/* Featured Posts */}
          {featuredPosts.length > 0 && (
            <div className="grid gap-10 md:grid-cols-2 lg:gap-10 mb-16">
              {featuredPosts.map(post => (
                <PostList
                  key={post._id}
                  posts={[post]}
                  aspect="landscape"
                  preloadImage={true}
                />
              ))}
            </div>
          )}

          {/* Regular Posts Grid */}
          <div className="grid gap-10 md:grid-cols-2 lg:gap-10 xl:grid-cols-3 mb-16">
            {regularPosts.slice(0, 12).map(post => (
              <PostList key={post._id} posts={[post]} aspect="square" />
            ))}
          </div>

          {/* View More Link */}
          {regularPosts.length > 12 && (
            <div className="flex justify-center">
              <a
                href="/blog/archive"
                className="relative inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-2 pl-4 text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-20 disabled:pointer-events-none disabled:opacity-40 dark:border-gray-500 dark:bg-gray-800 dark:text-gray-300"
              >
                <span>View all Posts</span>
              </a>
            </div>
          )}
        </Container>
      )}
    </>
  );
}

