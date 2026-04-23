"use client";

import {
  LayeredText,
  type LayeredTextLine,
} from "@/components/ui/layered-text";
import { useLocale } from "@/i18n/LocaleProvider";

/**
 * About band — layered isometric stack (principles, not a studio title).
 */
export default function About() {
  const { t } = useLocale();
  const lines: LayeredTextLine[] = [...t.about.principleLines];

  return (
    <section
      id="about"
      aria-label="About"
      className="w-full bg-[#0A0A0A] md:min-h-[50vh]"
    >
      <div className="mx-auto flex w-full max-w-7xl justify-start px-6 pb-12 pt-8 md:px-10 md:pb-16 md:pt-12">
        <LayeredText
          lines={lines}
          contentAlign="start"
          hoverTrigger="leading"
          className="py-10 text-white md:py-14"
          fontSize="clamp(1.75rem, 4.5vw, 3rem)"
          fontSizeMd="clamp(1rem, 3vw, 1.65rem)"
          lineHeight={52}
          lineHeightMd={32}
        />
      </div>
    </section>
  );
}
