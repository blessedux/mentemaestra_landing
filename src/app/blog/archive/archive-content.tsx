import { type SanityDocument } from "next-sanity";
import { client } from "@/sanity/lib/client";
import PostList from "@/components/blog/postlist";
import Container from "@/components/container";

const ALL_POSTS_QUERY = `*[
  _type == "post"
  && defined(slug.current)
]|order(publishedAt desc){
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

export default async function ArchiveContent({ searchParams }: { searchParams: { page?: string } }) {
  const posts = await client.fetch<SanityDocument[]>(ALL_POSTS_QUERY, {}, options);

  const currentPage = parseInt(searchParams.page || "1");
  const postsPerPage = 12;
  const totalPosts = posts.length;
  const totalPages = Math.ceil(totalPosts / postsPerPage);

  const startIndex = (currentPage - 1) * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  const currentPosts = posts.slice(startIndex, endIndex);

  return (
    <div className="mt-10 grid gap-10 md:grid-cols-2 lg:gap-10 xl:grid-cols-3">
      {currentPosts.map(post => (
        <PostList key={post._id} posts={[post]} aspect="square" />
      ))}
    </div>
  );
}
