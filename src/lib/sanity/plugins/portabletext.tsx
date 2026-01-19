import { PortableText as PortableTextComponent, type PortableTextComponents } from "@portabletext/react";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import type { ReactNode } from "react";
import type { TypedObject } from "@portabletext/types";

interface PortableTextImageValue {
  asset?: {
    _ref?: string;
    _type?: string;
  };
  alt?: string;
  caption?: string;
}

interface PortableTextLinkValue {
  href: string;
}

const components: PortableTextComponents = {
  types: {
    image: ({ value }: { value: PortableTextImageValue }) => {
      if (!value?.asset) {
        return null;
      }

      const imageUrl = urlFor(value).width(1200).height(800).fit("max").url();
      const alt = value.alt || "Article image";
      const caption = value.caption;

      return (
        <figure className="my-8 md:my-12">
          <div className="relative w-full aspect-video overflow-hidden rounded-lg">
            <Image
              src={imageUrl}
              alt={alt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 800px"
            />
          </div>
          {caption && (
            <figcaption className="mt-4 text-sm text-gray-400 text-center italic">
              {caption}
            </figcaption>
          )}
        </figure>
      );
    },
  },
  block: {
    // Headings
    h1: ({ children }: { children?: ReactNode }) => <h1>{children}</h1>,
    h2: ({ children }: { children?: ReactNode }) => <h2>{children}</h2>,
    h3: ({ children }: { children?: ReactNode }) => <h3>{children}</h3>,
    h4: ({ children }: { children?: ReactNode }) => <h4>{children}</h4>,
    h5: ({ children }: { children?: ReactNode }) => <h5>{children}</h5>,
    h6: ({ children }: { children?: ReactNode }) => <h6>{children}</h6>,
    // Paragraphs (normal blocks)
    normal: ({ children }: { children?: ReactNode }) => {
      // Check if children is empty or only contains whitespace
      if (!children || (typeof children === 'string' && children.trim() === '')) {
        return <p className="mb-4">&nbsp;</p>;
      }
      return <p>{children}</p>;
    },
    // Blockquote
    blockquote: ({ children }: { children?: ReactNode }) => <blockquote>{children}</blockquote>,
  },
  list: {
    // Bullet lists
    bullet: ({ children }: { children?: ReactNode }) => <ul>{children}</ul>,
    // Numbered lists
    number: ({ children }: { children?: ReactNode }) => <ol>{children}</ol>,
  },
  listItem: {
    // List items for bullet lists
    bullet: ({ children }: { children?: ReactNode }) => <li>{children}</li>,
    // List items for numbered lists
    number: ({ children }: { children?: ReactNode }) => <li>{children}</li>,
  },
  marks: {
    // Link (already exists, keeping it)
    link: ({ children, value }: { children?: ReactNode; value?: PortableTextLinkValue }) => {
      if (!value?.href) return <>{children}</>;

      const rel = !value.href.startsWith("/")
        ? "noopener noreferrer"
        : undefined;
      const target = !value.href.startsWith("/")
        ? "_blank"
        : undefined;
      return (
        <a href={value.href} rel={rel} target={target}>
          {children}
        </a>
      );
    },
    // Bold/Strong
    strong: ({ children }: { children?: ReactNode }) => <strong>{children}</strong>,
    // Italic/Emphasis
    em: ({ children }: { children?: ReactNode }) => <em>{children}</em>,
    // Code (inline)
    code: ({ children }: { children?: ReactNode }) => <code>{children}</code>,
    // Underline
    underline: ({ children }: { children?: ReactNode }) => <span className="underline">{children}</span>,
    // Strike-through
    'strike-through': ({ children }: { children?: ReactNode }) => <span className="line-through">{children}</span>,
  }
};

// Set up Portable Text serialization
export const PortableText = (props: { value: TypedObject | TypedObject[] }) => (
  <PortableTextComponent components={components} {...props} />
);
