"use client";

import { create } from "zustand";

interface OnboardingStoreState {
  skipped: boolean;
  setSkipped: (value: boolean) => void;
}

export const useOnboardingStore = create<OnboardingStoreState>()((set) => ({
  skipped: false,
  setSkipped: (value: boolean) => set({ skipped: value }),
}));
