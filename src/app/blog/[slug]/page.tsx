import Image from "next/image";
import Link from "next/link";
import Container from "@/components/container";
import { notFound } from "next/navigation";
import { PortableText } from "@/lib/sanity/plugins/portabletext";
import { urlFor } from "@/sanity/lib/image";
import { parseISO, format } from "date-fns";
import Category from "@/components/blog/category";
import { client } from "@/sanity/lib/client";

const POST_QUERY = `*[_type == "post" && slug.current == $slug][0]{
  _id,
  title,
  slug,
  publishedAt,
  excerpt,
  featured,
  image,
  body,
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
}`;

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

  const imageUrl = post?.image
    ? urlFor(post.image).url()
    : null;

  const authorImageUrl = post?.author?.image
    ? urlFor(post.author.image).url()
    : null;

  return (
    <main className="min-h-screen bg-black text-white relative">
      {/* Article Header - Above Banner Image */}
      <Container className="!pt-0">
        <div className="mx-auto max-w-screen-md py-12 md:py-16">
          <div className="flex justify-center mb-4">
            <Category categories={post.categories} />
          </div>

          <h1 className="mb-6 text-center text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
            {post.title}
          </h1>

          {post.author && (
            <div className="mt-6 flex flex-col items-center space-y-2 text-gray-400">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 flex-shrink-0">
                  {authorImageUrl && (
                    post.author.slug?.current ? (
                      <Link href={`/author/${post.author.slug.current}`}>
                        <Image
                          src={authorImageUrl}
                          alt={post.author.name || "Author"}
                          className="rounded-full object-cover"
                          fill
                          sizes="40px"
                        />
                      </Link>
                    ) : (
                      <Image
                        src={authorImageUrl}
                        alt={post.author.name || "Author"}
                        className="rounded-full object-cover"
                        fill
                        sizes="40px"
                      />
                    )
                  )}
                </div>
                <div className="text-center md:text-left">
                  <p className="text-gray-300">
                    {post.author.slug?.current ? (
                      <Link href={`/author/${post.author.slug.current}`} className="hover:text-white transition-colors">
                        {post.author.name}
                      </Link>
                    ) : (
                      <span>{post.author.name}</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <time
                  dateTime={post?.publishedAt || post._createdAt}>
                  {format(
                    parseISO(post?.publishedAt || post._createdAt),
                    "dd MMM yyyy"
                  )}
                </time>
                <span>· {post.readingTime || "5"} min read</span>
              </div>
            </div>
          )}
        </div>
      </Container>

      {/* Top Banner Image - Full Width */}
      <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] mb-12 md:mb-16">
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={post.image?.alt || post.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        )}
      </div>

      {/* Article Content */}
      <Container>
        <article className="mx-auto max-w-screen-md pb-20">
          <div className="prose prose-invert prose-lg mx-auto prose-headings:text-white prose-headings:font-bold prose-p:text-gray-300 prose-p:leading-relaxed prose-a:text-purple-400 prose-a:no-underline hover:prose-a:text-purple-300 prose-strong:text-white prose-code:text-purple-400 prose-code:bg-gray-900 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-900 prose-blockquote:border-purple-500 prose-blockquote:text-gray-300">
            {post.body && <PortableText value={post.body} />}
          </div>
        </article>
      </Container>
    </main>
  );
}

