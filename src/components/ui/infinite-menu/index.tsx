// Refactored Infinite Menu Component
// Clean, modular React component using extracted modules

"use client";

import { FC, useRef, useState, useEffect, MutableRefObject } from "react";
import { InfiniteMenuProps, MenuItem } from "./types";
import { InfiniteGridMenu } from "./infinite-grid-menu";
import { projectsData } from "./projects-data";

const InfiniteMenuComponent: FC<InfiniteMenuProps> = ({ items = [] }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(
    null
  ) as MutableRefObject<HTMLCanvasElement | null>;
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);
  const [isMoving, setIsMoving] = useState<boolean>(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    let sketch: InfiniteGridMenu | null = null;
    
    // Use provided items, or always use our 27 projects data
    const currentItems = items.length ? items : projectsData;

    const handleActiveItem = (index: number) => {
      if (!currentItems.length) return;
      const itemIndex = index % currentItems.length;
      setActiveItem(currentItems[itemIndex]);
    };

    const handleResize = () => {
      if (sketch) {
        sketch.resize();
      }
    };

    if (canvas) {
      sketch = new InfiniteGridMenu(
        canvas,
        currentItems,
        handleActiveItem,
        setIsMoving,
        (sk) => sk.run()
      );
    }

    window.addEventListener("resize", handleResize);
    handleResize();

    // Initial active item set when component mounts
    if (currentItems.length > 0) {
      setActiveItem(currentItems[0]);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [items]); // Depend on `items` prop

  const handleButtonClick = () => {
    if (!activeItem?.link) return;
    if (activeItem.link.startsWith("http")) {
      window.open(activeItem.link, "_blank");
    } else {
      // internal route logic here
      console.log("Internal route:", activeItem.link);
    }
  };

  return (
    <div className="relative w-full h-full">
      <canvas
        id="infinite-grid-menu-canvas"
        ref={canvasRef}
        className="cursor-grab w-full h-full overflow-hidden relative outline-none active:cursor-grabbing"
      />

      {activeItem && (
        <>
          {/* Title with Glassmorphism Background - Centered above the blue arrow */}
          <div
            className={`
          absolute
          left-1/2
          transform
          -translate-x-1/2
          transition-all
          ease-[cubic-bezier(0.25,0.1,0.25,1.0)]
          ${
            isMoving
              ? "opacity-0 pointer-events-none duration-[100ms] bottom-[6.5em]"
              : "opacity-100 pointer-events-auto duration-[500ms] bottom-[6.5em]"
          }
        `}
          >
            {/* Glassmorphism Background */}
            <div className="
              bg-white/10 
              backdrop-blur-md 
              border border-white/20 
              rounded-full 
              px-6 py-3 
              shadow-lg
            ">
              <h2 className="
                select-none
                font-black
                text-[1.2rem]
                text-white
                text-center
                whitespace-nowrap
              ">
                {activeItem.title}
              </h2>
            </div>
          </div>

          {/* Action Button */}
          <div
            onClick={handleButtonClick}
            className={`
          absolute
          left-1/2
          z-10
          w-[60px]
          h-[60px]
          grid
          place-items-center
          bg-[#00ffff]
          border-[5px]
          border-black
          rounded-full
          cursor-pointer
          transition-all
          ease-[cubic-bezier(0.25,0.1,0.25,1.0)]
          ${
            isMoving
              ? "bottom-[-80px] opacity-0 pointer-events-none duration-[100ms] scale-0 -translate-x-1/2"
              : "bottom-[3.8em] opacity-100 pointer-events-auto duration-[500ms] scale-100 -translate-x-1/2"
          }
        `}
          >
            <p className="select-none relative text-[#060606] top-[2px] text-[26px]">
              ↗
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export const Component = InfiniteMenuComponent;
