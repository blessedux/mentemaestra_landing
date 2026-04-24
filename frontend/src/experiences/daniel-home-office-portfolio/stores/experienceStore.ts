import { create } from "zustand";

type ExperienceState = {
  isExperienceReady: boolean;
  setIsExperienceReady: () => void;
};

export const useExperienceStore = create<ExperienceState>((set) => ({
  isExperienceReady: true,
  setIsExperienceReady: () => set({ isExperienceReady: true }),
}));
