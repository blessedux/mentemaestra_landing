"use client";

import React from "react";
import { motion, MotionConfig } from "framer-motion";

export interface BrainCard {
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
}

const defaultCards: BrainCard[] = [
  {
    title: "Innovation Hub",
    subtitle: "500+ Participants | $50K+ Prize Pool",
    description:
      "Join the largest Web3 hackathon in Chile, bringing together the brightest minds in blockchain, DeFi, and decentralized applications.",
    imageUrl: "/imgs/RARE_sponsor.png",
  },
  {
    title: "DeFi",
    subtitle: "Build the future of finance",
    description: "Projects focused on decentralized finance and tokenization.",
    imageUrl: "/imgs/WAGMI_sponsor.png",
  },
  {
    title: "AI & Web3 Integration",
    subtitle: "Merge AI with blockchain",
    description: "Explore how AI can enhance blockchain applications.",
    imageUrl: "/imgs/HASH.png",
  },
  {
    title: "Regulatory Compliance",
    subtitle: "Navigate Chile's fintech regulations",
    description: "Solutions that align with Chile's financial regulations.",
    imageUrl: "/imgs/gwei.png",
  },
  {
    title: "Real-World Applications",
    subtitle: "Solve local and global challenges",
    description: "Develop impactful solutions for real-world problems.",
    imageUrl: "/imgs/garden.png",
  },
];

function splitText(text: string) {
  const words = text.split(" ").map((word) => word.concat(" "));
  const characters = words.map((word) => word.split("")).flat(1);
  return { words, characters };
}

interface TextStaggerHoverProps {
  text: string;
  index: number;
  isActive: boolean;
  onMouseEnter: () => void;
  className?: string;
}

const TextStaggerHover: React.FC<TextStaggerHoverProps> = ({
  text,
  isActive,
  onMouseEnter,
  className,
}) => {
  const { characters } = splitText(text);

  return (
    <span
      className={`relative inline-block origin-bottom overflow-hidden cursor-pointer ${className ?? ""}`}
      onMouseEnter={onMouseEnter}
    >
      {characters.map((char, charIndex) => (
        <span
          key={`${char}-${charIndex}`}
          className="relative inline-block overflow-hidden"
        >
          <MotionConfig
            transition={{
              delay: charIndex * 0.025,
              duration: 0.3,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            <motion.span
              className="inline-block opacity-20"
              initial={{ y: "0%" }}
              animate={isActive ? { y: "-110%" } : { y: "0%" }}
            >
              {char}
              {char === " " && charIndex < characters.length - 1 && <>&nbsp;</>}
            </motion.span>
            <motion.span
              className="absolute left-0 top-0 inline-block opacity-100"
              initial={{ y: "110%" }}
              animate={isActive ? { y: "0%" } : { y: "110%" }}
            >
              {char}
            </motion.span>
          </MotionConfig>
        </span>
      ))}
    </span>
  );
};

const clipPathVariants = {
  visible: {
    clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
  },
  hidden: {
    clipPath: "polygon(0% 0%, 0% 0%, 0% 0%, 0% 0%)",
  },
};

export interface BrainProps {
  title?: string;
  focusLabel?: string;
  cards?: BrainCard[];
}

export function Brain({
  title = "Chile's Biggest Web3 Hackathon",
  focusLabel = "/ focus areas",
  cards = defaultCards,
}: BrainProps) {
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <section className="min-h-screen p-8 flex flex-col justify-center">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h2 className="text-4xl text-white font-semibold mb-8">{title}</h2>
        </div>

        <div className="mb-12">
          <h3 className="mb-6 text-blue-400 text-xs font-medium capitalize tracking-wide">
            {focusLabel}
          </h3>

          <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
            {/* Image Container */}
            <div className="relative w-full lg:w-1/2 flex justify-center">
              <div className="relative w-80 h-80 rounded-lg overflow-hidden grid [&>*]:col-start-1 [&>*]:col-end-1 [&>*]:row-start-1 [&>*]:row-end-1 [&>*]:size-full">
                {cards.map((card, index) => (
                  <motion.div
                    key={card.title}
                    className="relative cursor-pointer group"
                    onMouseEnter={() =>
                      setIsHovered(selectedIndex === index)
                    }
                    onMouseLeave={() => setIsHovered(false)}
                    variants={clipPathVariants}
                    animate={
                      selectedIndex === index ? "visible" : "hidden"
                    }
                    transition={{
                      ease: [0.33, 1, 0.68, 1],
                      duration: 0.8,
                    }}
                  >
                    <motion.img
                      src={card.imageUrl}
                      alt={card.title}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="eager"
                      decoding="async"
                    />

                    <motion.div
                      className="absolute inset-0 z-50 flex flex-col justify-end p-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{
                        duration: 0.4,
                        ease: "easeOut",
                      }}
                    >
                      <div className="text-white">
                        <motion.p
                          className="text-xl font-bold mb-2 text-shadow-lg"
                          initial={{ y: 20 }}
                          animate={{ y: 0 }}
                          transition={{ duration: 0.4 }}
                        >
                          {card.subtitle}
                        </motion.p>
                        <motion.p
                          className="text-sm text-gray-200 leading-relaxed text-shadow-lg"
                          initial={{ y: 20 }}
                          animate={{ y: 0 }}
                          transition={{ duration: 0.4, delay: 0.1 }}
                        >
                          {card.description}
                        </motion.p>
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Title List with TextStaggerHover Effect */}
            <div className="w-full lg:w-1/2 flex flex-col gap-4">
              {cards.map((card, i) => (
                <TextStaggerHover
                  key={i}
                  text={card.title}
                  index={i}
                  isActive={selectedIndex === i}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`${
                    card.title === "Regulatory Compliance" ||
                    card.title === "Real-World Applications"
                      ? "text-2xl"
                      : card.title === "AI & Web3 Integration"
                        ? "text-3xl"
                        : "text-4xl"
                  } font-bold uppercase tracking-tighter transition-colors ${
                    selectedIndex === i
                      ? "text-white hover:text-blue-400"
                      : "text-gray-500"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Brain;
