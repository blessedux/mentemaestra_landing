"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ChevronRight } from "lucide-react";

export type BlogStackPost = {
  title: string;
  description: string;
  image: string;
  href: string;
};

type StackCard = {
  id: number;
  postIndex: number;
};

const positionStyles = [
  { scale: 1, y: 12 },
  { scale: 0.95, y: -16 },
  { scale: 0.9, y: -44 },
];

const exitAnimation = {
  y: 340,
  scale: 1,
  zIndex: 10,
};

const enterAnimation = {
  y: -16,
  scale: 0.9,
};

function CardContent({
  post,
  readLabel,
}: {
  post: BlogStackPost;
  readLabel: string;
}) {
  return (
    <div className="flex h-full w-full flex-col gap-4">
      <div className="-outline-offset-1 relative flex h-[200px] w-full items-center justify-center overflow-hidden rounded-xl outline outline-black/10 dark:outline-white/10">
        <Image
          src={post.image}
          alt={post.title}
          fill
          className="select-none object-cover"
          sizes="(max-width: 640px) 90vw, 512px"
          priority={false}
        />
      </div>
      <div className="flex w-full items-center justify-between gap-2 px-3 pb-6">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-medium text-foreground">
            {post.title}
          </span>
          <span className="line-clamp-2 text-sm text-muted-foreground">
            {post.description}
          </span>
        </div>
        <Link
          href={post.href}
          className="flex h-10 shrink-0 cursor-pointer select-none items-center gap-0.5 rounded-full bg-foreground pl-4 pr-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          {readLabel}
          <ChevronRight className="size-4" strokeWidth={2.5} aria-hidden />
        </Link>
      </div>
    </div>
  );
}

function AnimatedCard({
  card,
  index,
  posts,
  readLabel,
}: {
  card: StackCard;
  index: number;
  posts: readonly BlogStackPost[];
  readLabel: string;
}) {
  const { scale, y } = positionStyles[index] ?? positionStyles[2];
  const zIndex = 3 - index;
  const exitAnim = index === 0 ? exitAnimation : undefined;
  const initialAnim = index === 2 ? enterAnimation : undefined;
  const post = posts[card.postIndex];

  return (
    <motion.div
      key={card.id}
      initial={initialAnim}
      animate={{ y, scale }}
      exit={exitAnim}
      transition={{
        type: "spring",
        duration: 1,
        bounce: 0,
      }}
      style={{
        zIndex,
        left: "50%",
        x: "-50%",
        bottom: 0,
      }}
      className="absolute flex h-[280px] w-[324px] items-center justify-center overflow-hidden rounded-t-xl border-x border-t border-border bg-card p-1 shadow-lg will-change-transform sm:w-[512px]"
    >
      <CardContent post={post} readLabel={readLabel} />
    </motion.div>
  );
}

function buildInitialCards(length: number): StackCard[] {
  return [0, 1, 2].map((i, idx) => ({
    id: idx + 1,
    postIndex: i % length,
  }));
}

export default function AnimatedCardStack({
  posts,
  readLabel,
  cycleLabel,
}: {
  posts: readonly BlogStackPost[];
  readLabel: string;
  cycleLabel: string;
}) {
  const safePosts = posts.length >= 3 ? posts : [...posts, ...posts, ...posts];
  const n = safePosts.length;

  const [cards, setCards] = useState<StackCard[]>(() =>
    buildInitialCards(n),
  );
  const [nextId, setNextId] = useState(4);

  const handleCycle = () => {
    const nextPostIndex = (cards[2].postIndex + 1) % n;
    setCards((prev) => [
      ...prev.slice(1),
      { id: nextId, postIndex: nextPostIndex },
    ]);
    setNextId((prev) => prev + 1);
  };

  return (
    <div className="flex w-full flex-col items-center justify-center pt-2">
      <div className="relative h-[380px] w-full overflow-hidden sm:w-[644px]">
        <AnimatePresence initial={false}>
          {cards.slice(0, 3).map((card, index) => (
            <AnimatedCard
              key={card.id}
              card={card}
              index={index}
              posts={safePosts}
              readLabel={readLabel}
            />
          ))}
        </AnimatePresence>
      </div>

      <div className="relative z-10 -mt-px flex w-full items-center justify-center border-t border-border py-4">
        <button
          type="button"
          onClick={handleCycle}
          aria-label={cycleLabel}
          className="flex h-9 cursor-pointer select-none items-center justify-center gap-1 overflow-hidden rounded-lg border border-border bg-background px-3 font-medium text-secondary-foreground transition-all hover:bg-secondary/80 active:scale-[0.98]"
        >
          {cycleLabel}
        </button>
      </div>
    </div>
  );
}
