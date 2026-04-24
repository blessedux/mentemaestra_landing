import { create } from "zustand";

function readIsMobile() {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768;
}

type ResponsiveState = {
  isMobile: boolean;
  screenWidth: number;
  screenHeight: number;
  updateDimensions: () => void;
};

export const useResponsiveStore = create<ResponsiveState>((set) => ({
  isMobile: false,
  screenWidth: 0,
  screenHeight: 0,
  updateDimensions: () =>
    set({
      isMobile: readIsMobile(),
      screenWidth: typeof window !== "undefined" ? window.innerWidth : 0,
      screenHeight: typeof window !== "undefined" ? window.innerHeight : 0,
    }),
}));
