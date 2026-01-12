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
  marks: {
    link: ({ children, value }: any) => {
      const rel = !value.href.startsWith("/")
        ? "noopener"
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
  }
};

// Set up Portable Text serialization
export const PortableText = (props: any) => (
  <PortableTextComponent components={components} {...props} />
);
