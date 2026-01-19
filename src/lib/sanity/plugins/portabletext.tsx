import { PortableText as PortableTextComponent } from "@portabletext/react";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";

const components = {
  types: {
    image: ({ value }: any) => {
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
    h1: ({ children }: any) => <h1>{children}</h1>,
    h2: ({ children }: any) => <h2>{children}</h2>,
    h3: ({ children }: any) => <h3>{children}</h3>,
    h4: ({ children }: any) => <h4>{children}</h4>,
    h5: ({ children }: any) => <h5>{children}</h5>,
    h6: ({ children }: any) => <h6>{children}</h6>,
    // Paragraphs (normal blocks)
    normal: ({ children }: any) => {
      // Check if children is empty or only contains whitespace
      if (!children || (typeof children === 'string' && children.trim() === '')) {
        return <p className="mb-4">&nbsp;</p>;
      }
      return <p>{children}</p>;
    },
    // Blockquote
    blockquote: ({ children }: any) => <blockquote>{children}</blockquote>,
  },
  list: {
    // Bullet lists
    bullet: ({ children }: any) => <ul>{children}</ul>,
    // Numbered lists
    number: ({ children }: any) => <ol>{children}</ol>,
  },
  listItem: {
    // List items for bullet lists
    bullet: ({ children }: any) => <li>{children}</li>,
    // List items for numbered lists
    number: ({ children }: any) => <li>{children}</li>,
  },
  marks: {
    // Link (already exists, keeping it)
    link: ({ children, value }: any) => {
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
    strong: ({ children }: any) => <strong>{children}</strong>,
    // Italic/Emphasis
    em: ({ children }: any) => <em>{children}</em>,
    // Code (inline)
    code: ({ children }: any) => <code>{children}</code>,
    // Underline
    underline: ({ children }: any) => <span className="underline">{children}</span>,
    // Strike-through
    'strike-through': ({ children }: any) => <span className="line-through">{children}</span>,
  }
};

// Set up Portable Text serialization
export const PortableText = (props: any) => (
  <PortableTextComponent components={components} {...props} />
);
