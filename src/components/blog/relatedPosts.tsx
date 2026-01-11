import PostList from "./postlist";
import Container from "@/components/container";
import { type SanityDocument } from "next-sanity";

interface RelatedPostsProps {
  posts: SanityDocument[];
  currentPostId: string;
}

export default function RelatedPosts({ posts, currentPostId }: RelatedPostsProps) {
  // Filter out current post and get up to 3 related posts
  const relatedPosts = posts
    .filter(post => post._id !== currentPostId)
    .slice(0, 3);

  if (relatedPosts.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-24 border-t border-gray-800">
      <Container>
        <h2 className="text-2xl md:text-3xl font-semibold mb-12 text-white">
          Artículos relacionados
        </h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {relatedPosts.map(post => (
            <PostList key={post._id} posts={[post]} aspect="square" />
          ))}
        </div>
      </Container>
    </section>
  );
}
