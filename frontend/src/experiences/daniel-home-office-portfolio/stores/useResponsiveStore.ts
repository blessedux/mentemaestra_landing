import { create } from "zustand";

function readIsMobile() {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768;
}

/** Landing / About “compact” layout (video + embed controls) — matches Tailwind `max-[980px]`. */
function readIsNarrowViewport() {
  if (typeof window === "undefined") return false;
  return window.innerWidth <= 980;
}

type ResponsiveState = {
  isMobile: boolean;
  isNarrowViewport: boolean;
  screenWidth: number;
  screenHeight: number;
  updateDimensions: () => void;
};

export const useResponsiveStore = create<ResponsiveState>((set) => ({
  isMobile: false,
  isNarrowViewport: false,
  screenWidth: 0,
  screenHeight: 0,
  updateDimensions: () =>
    set({
      isMobile: readIsMobile(),
      isNarrowViewport: readIsNarrowViewport(),
      screenWidth: typeof window !== "undefined" ? window.innerWidth : 0,
      screenHeight: typeof window !== "undefined" ? window.innerHeight : 0,
    }),
}));
