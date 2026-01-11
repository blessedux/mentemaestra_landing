import Image from "next/image";
import Link from "next/link";
import Container from "@/components/container";
import { notFound } from "next/navigation";
import { PortableText } from "@/lib/sanity/plugins/portabletext";
import { urlFor } from "@/sanity/lib/image";
import { parseISO, format } from "date-fns";
import AuthorCard from "@/components/blog/authorCard";
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
    <main className="min-h-screen bg-black text-white">
      <Container className="!pt-0">
        <div className="mx-auto max-w-screen-md py-16">
          <div className="flex justify-center mb-6">
            <Category categories={post.categories} />
          </div>

          <h1 className="mb-6 mt-2 text-center text-3xl font-semibold tracking-tight text-white lg:text-4xl lg:leading-snug">
            {post.title}
          </h1>

          <div className="mt-6 flex justify-center space-x-3 text-gray-400">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 flex-shrink-0">
                {authorImageUrl && (
                  <Link href={`/author/${post.author.slug.current}`}>
                    <Image
                      src={authorImageUrl}
                      alt={post?.author?.name || "Author"}
                      className="rounded-full object-cover"
                      fill
                      sizes="40px"
                    />
                  </Link>
                )}
              </div>
              <div>
                <p className="text-gray-300">
                  <Link href={`/author/${post.author.slug.current}`} className="hover:text-white transition-colors">
                    {post.author.name}
                  </Link>
                </p>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <time
                    dateTime={post?.publishedAt || post._createdAt}>
                    {format(
                      parseISO(post?.publishedAt || post._createdAt),
                      "MMMM dd, yyyy"
                    )}
                  </time>
                  <span>· {post.readingTime || "5"} min read</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>

      <div className="relative z-0 mx-auto aspect-video max-w-screen-lg overflow-hidden lg:rounded-lg mb-12">
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={post.image?.alt || "Thumbnail"}
            loading="eager"
            fill
            sizes="100vw"
            className="object-cover"
          />
        )}
      </div>

      <Container>
        <article className="mx-auto max-w-screen-md pb-20">
          <div className="prose prose-invert mx-auto my-8 prose-headings:text-white prose-p:text-gray-300 prose-a:text-blue-400 prose-strong:text-white prose-code:text-blue-400 prose-pre:bg-gray-900">
            {post.body && <PortableText value={post.body} />}
          </div>
          <div className="mb-12 mt-12 flex justify-center">
            <Link
              href="/blog"
              className="rounded-full border border-gray-600 bg-transparent px-6 py-3 text-sm text-white hover:bg-gray-900 hover:border-gray-500 transition-colors">
              ← Ver todos los posts
            </Link>
          </div>
          {post.author && <AuthorCard author={post.author} />}
        </article>
      </Container>
    </main>
  );
}

