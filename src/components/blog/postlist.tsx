import Image from "next/image";
import Link from "next/link";
import { cx } from "@/utils/all";
import { urlFor } from "@/sanity/lib/image";
import { parseISO, format } from "date-fns";
import Category from "@/components/blog/category";

interface PostListProps {
  posts: any[];
  aspect?: "landscape" | "custom" | "square";
  minimal?: boolean;
  pathPrefix?: string;
  preloadImage?: boolean;
  fontSize?: string;
  fontWeight?: string;
}

export default function PostList({
  posts,
  aspect,
  minimal,
  pathPrefix,
  preloadImage,
  fontSize,
  fontWeight
}: PostListProps) {
  return (
    <>
      {posts.map((post) => {
        const imageUrl = post?.image ? urlFor(post.image).url() : null;
        const authorImageUrl = post?.author?.image ? urlFor(post.author.image).url() : null;

        return (
          <div
            key={post._id}
            className={cx(
              "group cursor-pointer",
              minimal && "grid gap-10 md:grid-cols-2"
            )}
          >
            <div
              className={cx(
                " overflow-hidden rounded-md bg-gray-100 transition-all hover:scale-105   dark:bg-gray-800"
              )}
            >
              <Link
                className={cx(
                  "relative block",
                  aspect === "landscape"
                    ? "aspect-video"
                    : aspect === "custom"
                    ? "aspect-[5/4]"
                    : "aspect-square"
                )}
                href={`/blog/${pathPrefix ? `${pathPrefix}/` : ""}${
                  post.slug.current
                }`}
              >
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    {...(post.image?.blurDataURL && {
                      placeholder: "blur",
                      blurDataURL: post.image.blurDataURL
                    })}
                    alt={post.image?.alt || "Thumbnail"}
                    priority={preloadImage ? true : false}
                    className="object-cover transition-all"
                    fill
                    sizes="(max-width: 768px) 30vw, 33vw"
                  />
                ) : (
                  <span className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 text-gray-200">
                    <svg fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM4 7v10h16V7H4zm8 2l5 4H7l5-4z"/>
                    </svg>
                  </span>
                )}
              </Link>
            </div>

            <div className={cx(minimal && "flex items-center")}>
              <div>
                <Category categories={post.categories} nomargin={minimal} />
                <h2
                  className={cx(
                    fontSize === "large"
                      ? "text-2xl"
                      : minimal
                      ? "text-3xl"
                      : "text-lg",
                    fontWeight === "normal"
                      ? "line-clamp-2 font-medium  tracking-normal text-white"
                      : "font-semibold leading-snug tracking-tight text-white",
                    "mt-2"
                  )}
                >
                  <Link
                    href={`/blog/${pathPrefix ? `${pathPrefix}/` : ""}${
                      post.slug.current
                    }`}
                  >
                    <span
                      className="bg-gradient-to-r from-purple-600 to-purple-800 bg-[length:0px_10px] bg-left-bottom
      bg-no-repeat
      transition-[background-size]
      duration-500
      hover:bg-[length:100%_3px]
      group-hover:bg-[length:100%_10px]"
                    >
                      {post.title}
                    </span>
                  </Link>
                </h2>

                <div className="hidden">
                  {post.excerpt && (
                    <p className="mt-2 line-clamp-3 text-sm text-gray-500 dark:text-gray-400">
                      <Link
                        href={`/blog/${
                          pathPrefix ? `${pathPrefix}/` : ""
                        }${post.slug.current}`}
                      >
                        {post.excerpt}
                      </Link>
                    </p>
                  )}
                </div>

                {post?.author && (
                  <div className="mt-3 flex items-center space-x-3 text-gray-400">
                    {post.author.slug?.current ? (
                      <Link href={`/author/${post.author.slug.current}`}>
                    <div className="flex items-center gap-3">
                      <div className="relative h-5 w-5 flex-shrink-0">
                            {authorImageUrl && (
                          <Image
                                src={authorImageUrl}
                                alt={post.author.name || "Author"}
                            className="rounded-full object-cover"
                            fill
                            sizes="20px"
                          />
                        )}
                      </div>
                      <span className="truncate text-sm">
                            {post.author.name}
                      </span>
                    </div>
                  </Link>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="relative h-5 w-5 flex-shrink-0">
                          {authorImageUrl && (
                            <Image
                              src={authorImageUrl}
                              alt={post.author.name || "Author"}
                              className="rounded-full object-cover"
                              fill
                              sizes="20px"
                            />
                          )}
                        </div>
                        <span className="truncate text-sm">
                          {post.author.name}
                        </span>
                      </div>
                    )}
                    {post?.publishedAt && (
                      <>
                        <span className="text-xs text-gray-600">
                    &bull;
                  </span>
                  <time
                    className="truncate text-sm"
                          dateTime={post.publishedAt || post._createdAt}
                  >
                    {format(
                            parseISO(post.publishedAt || post._createdAt),
                      "MMMM dd, yyyy"
                    )}
                  </time>
                      </>
                    )}
                </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
