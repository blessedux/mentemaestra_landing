import {
  LayeredText,
  type LayeredTextLine,
} from "@/components/ui/layered-text";

/** Clarity → signal (heuristics) → proof (trust / business) → story → swag. */
const ABOUT_PRINCIPLE_LINES: LayeredTextLine[] = [
  { top: "\u00A0", bottom: "CLARITY" },
  { top: "CLARITY", bottom: "SIGNAL" },
  { top: "SIGNAL", bottom: "PROOF" },
  { top: "PROOF", bottom: "STORY" },
  { top: "STORY", bottom: "SWAG" },
  { top: "SWAG", bottom: "\u00A0" },
];

/**
 * About band — layered isometric stack (principles, not a studio title).
 */
export default function About() {
  return (
    <section
      id="about"
      aria-label="About"
      className="w-full bg-[#0A0A0A] md:min-h-[50vh]"
    >
      <div className="mx-auto flex w-full max-w-7xl justify-start px-6 pb-12 pt-8 md:px-10 md:pb-16 md:pt-12">
        <LayeredText
          lines={ABOUT_PRINCIPLE_LINES}
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
