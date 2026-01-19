import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PortableText } from "@/lib/sanity/plugins/portabletext";
import { urlFor } from "@/sanity/lib/image";
import { parseISO, format } from "date-fns";
import { defineQuery } from "next-sanity";
import { client } from "@/sanity/lib/client";
import { CalendarIcon, ClockIcon, UserIcon } from "lucide-react";

// Individual blog post query - optimized following Sanity best practices
const POST_QUERY = defineQuery(`*[_type == "post" && slug.current == $slug][0]{
  _id,
  title,
  slug,
  publishedAt,
  excerpt,
  featured,
  image,
  body[]{
    ...,
    _type == "image" => {
      ...,
      asset->{
        _id,
        url,
        metadata {
          dimensions
        }
      },
      alt,
      caption
    }
  },
  readingTime,
  author->{
    _id,
    name,
    slug,
    image,
    bio,
    email,
    website,
    socialLinks
  },
  categories[]->{
    _id,
    title,
    slug,
    color,
    description
  }
}`);

// Related posts query for future use
// const RELATED_POSTS_QUERY = defineQuery(`*[_type == "post" && slug.current != $currentSlug && count(categories[@._ref in $categoryIds]) > 0][0...3]{
//   _id,
//   title,
//   slug,
//   publishedAt,
//   image,
//   excerpt
// }`);

const options = { next: { revalidate: 30 } };

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await client.fetch(POST_QUERY, { slug }, options);

  const postSlug = post?.slug;

  if (!postSlug) {
    notFound();
  }

  // Format data for display
  const imageUrl = post?.image ? urlFor(post.image).width(1200).height(600).fit('crop').url() : null;
  const authorImageUrl = post?.author?.image ? urlFor(post.author.image).width(64).height(64).fit('crop').url() : null;
  const publishedDate = post?.publishedAt ? parseISO(post.publishedAt) : null;
  const readingTime = post?.readingTime || Math.max(1, Math.ceil((post?.body?.length || 1000) / 200));

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Title Only - Top with Proper Margins */}
      <div className="w-full px-8 sm:px-12 md:px-16 lg:px-20 xl:px-28 pt-20 md:pt-32 pb-8">
        <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight max-w-5xl mx-auto">
          {post.title}
        </h1>
      </div>

      {/* Featured Image - Reduced Height with Margin */}
      {imageUrl && (
        <div className="w-full max-w-screen-lg px-8 sm:px-12 md:px-16 lg:px-20 xl:px-28 mx-auto mb-12 mt-8">
          <div className="relative overflow-hidden rounded-xl" style={{ height: '50vh', maxHeight: '600px' }}>
            <Image
              src={imageUrl}
              alt={post.image?.alt || post.title || "Featured image"}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 1024px"
            />
          </div>
        </div>
      )}

      {/* Article Content - centered with equal margin on both sides */}
      <div className="w-full px-8 sm:px-12 md:px-16 lg:px-20 xl:px-28 pb-32">
        <article className="max-w-screen-md mx-auto">
          <div className="prose prose-blog prose-lg">
            {post.body && <PortableText value={post.body} />}
          </div>
        </article>
      </div>

      {/* Author and Date - Bottom of Page */}
      <footer className="w-full px-8 sm:px-12 md:px-16 lg:px-20 xl:px-28 pt-12 pb-16 mt-auto">
        <div className="max-w-screen-md mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            {/* Author Information */}
            <div className="flex items-center gap-4 mt-4">
              {authorImageUrl ? (
                <Image
                  src={authorImageUrl}
                  alt={post.author?.name || "Author"}
                  width={48}
                  height={48}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <div>
                <p className="text-white font-medium">
                  {post.author?.slug?.current ? (
                    <Link
                      href={`/author/${post.author.slug.current}`}
                      className="hover:text-white transition-colors"
                    >
                      {post.author.name}
                    </Link>
                  ) : (
                    <span>{post.author?.name || "Anonymous"}</span>
                  )}
                </p>
                {post.author?.bio && (
                  <p className="text-gray-400 text-sm mt-1">
                    {post.author.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Date and Reading Time */}
            <div className="flex items-center gap-6 text-sm text-gray-400 mt-4">
              {publishedDate && (
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  <time dateTime={post.publishedAt}>
                    {format(publishedDate, "MMMM dd, yyyy")}
                  </time>
                </div>
              )}
              <div className="flex items-center gap-2">
                <ClockIcon className="w-4 h-4" />
                <span>{readingTime} min read</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

