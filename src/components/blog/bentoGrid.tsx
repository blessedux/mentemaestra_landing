import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import { parseISO, format } from "date-fns";
import { type SanityDocument } from "next-sanity";
import Category from "./category";
import { cx } from "@/utils/all";

interface BentoGridProps {
  posts: SanityDocument[];
}

export default function BentoGrid({ posts }: BentoGridProps) {
  if (!posts || posts.length === 0) {
    return null;
  }

  // Create a bento grid layout with varying sizes
  // First post: large featured (2x2)
  // Next 2 posts: medium (1x2 each)
  // Remaining posts: small (1x1)
  
  const featuredPost = posts[0];
  const mediumPosts = posts.slice(1, 3);
  const smallPosts = posts.slice(3, 9); // Show up to 6 more posts

  const featuredImageUrl = featuredPost?.image ? urlFor(featuredPost.image).url() : null;
  const featuredAuthorImageUrl = featuredPost?.author?.image ? urlFor(featuredPost.author.image).url() : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {/* Featured Post - Large (2x2) */}
      {featuredPost && (
        <Link
          href={`/blog/${featuredPost.slug.current}`}
          className="group relative md:col-span-2 md:row-span-2 overflow-hidden rounded-xl bg-gray-900 hover:bg-gray-800 transition-all duration-300"
        >
          <div className="relative h-full min-h-[400px] md:min-h-[500px]">
            {featuredImageUrl && (
              <Image
                src={featuredImageUrl}
                alt={featuredPost.title}
                fill
                className="object-cover opacity-60 group-hover:opacity-70 transition-opacity"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
            <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">
              <div className="mb-3">
                <Category categories={featuredPost.categories} />
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 line-clamp-3 group-hover:text-purple-300 transition-colors">
                {featuredPost.title}
              </h2>
              {featuredPost.excerpt && (
                <p className="text-gray-300 text-sm md:text-base mb-4 line-clamp-2">
                  {featuredPost.excerpt}
                </p>
              )}
              <div className="flex items-center gap-3 text-sm text-gray-400">
                {featuredAuthorImageUrl && (
                  <div className="relative h-6 w-6 flex-shrink-0">
                    <Image
                      src={featuredAuthorImageUrl}
                      alt={featuredPost.author?.name || "Author"}
                      className="rounded-full object-cover"
                      fill
                      sizes="24px"
                    />
                  </div>
                )}
                <span>{featuredPost.author?.name}</span>
                <span>·</span>
                <time dateTime={featuredPost.publishedAt || featuredPost._createdAt}>
                  {format(
                    parseISO(featuredPost.publishedAt || featuredPost._createdAt),
                    "MMM dd, yyyy"
                  )}
                </time>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Medium Posts (1x2 each) */}
      {mediumPosts.map((post) => {
        const imageUrl = post?.image ? urlFor(post.image).url() : null;
        const authorImageUrl = post?.author?.image ? urlFor(post.author.image).url() : null;

        return (
          <Link
            key={post._id}
            href={`/blog/${post.slug.current}`}
            className="group relative overflow-hidden rounded-xl bg-gray-900 hover:bg-gray-800 transition-all duration-300"
          >
            <div className="relative h-full min-h-[300px] md:min-h-[350px]">
              {imageUrl && (
                <Image
                  src={imageUrl}
                  alt={post.title}
                  fill
                  className="object-cover opacity-60 group-hover:opacity-70 transition-opacity"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <div className="mb-2">
                  <Category categories={post.categories} />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-3 line-clamp-2 group-hover:text-purple-300 transition-colors">
                  {post.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  {authorImageUrl && (
                    <div className="relative h-5 w-5 flex-shrink-0">
                      <Image
                        src={authorImageUrl}
                        alt={post.author?.name || "Author"}
                        className="rounded-full object-cover"
                        fill
                        sizes="20px"
                      />
                    </div>
                  )}
                  <span>{post.author?.name}</span>
                  <span>·</span>
                  <time dateTime={post.publishedAt || post._createdAt}>
                    {format(
                      parseISO(post.publishedAt || post._createdAt),
                      "MMM dd"
                    )}
                  </time>
                </div>
              </div>
            </div>
          </Link>
        );
      })}

      {/* Small Posts (1x1) */}
      {smallPosts.map((post) => {
        const imageUrl = post?.image ? urlFor(post.image).url() : null;
        const authorImageUrl = post?.author?.image ? urlFor(post.author.image).url() : null;

        return (
          <Link
            key={post._id}
            href={`/blog/${post.slug.current}`}
            className="group relative overflow-hidden rounded-xl bg-gray-900 hover:bg-gray-800 transition-all duration-300"
          >
            <div className="relative aspect-square">
              {imageUrl && (
                <Image
                  src={imageUrl}
                  alt={post.title}
                  fill
                  className="object-cover opacity-60 group-hover:opacity-70 transition-opacity"
                  sizes="(max-width: 768px) 100vw, 25vw"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute inset-0 p-4 flex flex-col justify-end">
                <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors">
                  {post.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  {authorImageUrl && (
                    <div className="relative h-4 w-4 flex-shrink-0">
                      <Image
                        src={authorImageUrl}
                        alt={post.author?.name || "Author"}
                        className="rounded-full object-cover"
                        fill
                        sizes="16px"
                      />
                    </div>
                  )}
                  <span className="truncate">{post.author?.name}</span>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
