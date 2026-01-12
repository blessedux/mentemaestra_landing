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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => {
        const imageUrl = post?.image ? urlFor(post.image).url() : null;
        const authorImageUrl = post?.author?.image ? urlFor(post.author.image).url() : null;

        return (
          <Link
            key={post._id}
            href={`/blog/${post.slug.current}`}
            className="group flex flex-col overflow-hidden rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 hover:shadow-2xl transition-all duration-300 cursor-pointer"
          >
            {/* Card Image Container */}
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={post.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Card Content - Below Image */}
            <div className="flex flex-col p-5 bg-gray-900">
              {/* Category */}
              {post.categories && post.categories.length > 0 && (
                <div className="mb-3">
                  <Category categories={post.categories} />
                </div>
              )}
              
              {/* Title */}
              <h3 className="text-xl font-semibold text-white mb-3 line-clamp-2 group-hover:text-purple-300 transition-colors">
                {post.title}
              </h3>

              {/* Author and Date */}
              <div className="flex items-center gap-2 text-sm text-gray-400 mt-auto">
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
                <span className="truncate">{post.author?.name || "Anonymous"}</span>
                <span>·</span>
                <time dateTime={post.publishedAt || post._createdAt}>
                  {format(
                    parseISO(post.publishedAt || post._createdAt),
                    "MMM dd, yyyy"
                  )}
                </time>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
