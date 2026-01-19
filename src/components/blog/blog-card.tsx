"use client"

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { urlFor } from '@/sanity/lib/image';
import { type SanityDocument } from 'next-sanity';

interface BlogCardProps {
  post: SanityDocument;
  className?: string;
}

export default function BlogCard({ post, className }: BlogCardProps) {
  // Format data for display - ensure images are properly sized and optimized
  const imageUrl = post?.image 
    ? urlFor(post.image)
        .width(800)
        .height(500)
        .fit('crop')
        .auto('format')
        .quality(85)
        .url() 
    : null;

  // Get category title for subtitle (first category or default)
  const subtitle = post?.categories && post.categories.length > 0 
    ? post.categories[0]?.title || 'Default'
    : 'Default';

  return (
    <Link
      href={`/blog/${post.slug.current}`}
      className="block group blog-card-link"
      style={{ width: '100%', display: 'block', textDecoration: 'none' }}
    >
      <article 
        className={`bg-gray-900 border border-gray-800 overflow-hidden hover:border-gray-700 transition-all duration-300 ${className}`}
        style={{ borderRadius: '2rem', width: '100%', maxWidth: '100%' }}
      >
        {/* Header Section - Circle, Title, Subtitle */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-start gap-3">
            {/* Colored Circle - Top Left */}
            <div className="flex-shrink-0 ml-2">
              <div 
                className="w-10 h-10 rounded-full"
                style={{ 
                  backgroundColor: post?.categories?.[0]?.color || '#6366f1' 
                }}
              />
            </div>

            {/* Title and Subtitle - Center Aligned */}
            <div className="flex-1 min-w-0 text-center">
              <h2 className="text-sm font-semibold text-white mb-1 line-clamp-2">
                {post.title}
              </h2>
              <p className="text-xs text-gray-400 line-clamp-1">
                {subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content - Image Display */}
        <div 
          className="relative aspect-[16/10] overflow-hidden bg-gray-800"
          style={{ borderBottomLeftRadius: '2rem', borderBottomRightRadius: '2rem' }}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={post.title || "Blog post image"}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 33vw, 25vw"
              priority={false}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
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
      </article>
    </Link>
  );
}
