"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useSyncExternalStore } from "react";

interface BusinessStoreState {
  currentBusinessId: string | null;
  setCurrentBusiness: (id: string | null) => void;
}

const createBusinessStore = () => {
  return create<BusinessStoreState>()(
    persist(
      (set) => ({
        currentBusinessId: null,
        setCurrentBusiness: (id: string | null) => set({ currentBusinessId: id }),
      }),
      {
        name: "business-store",
        storage: createJSONStorage(() => localStorage),
      }
    )
  );
};

export const useBusinessStore = createBusinessStore();

export const useCurrentBusinessId = () => {
  const currentBusinessId = useSyncExternalStore(
    useBusinessStore.subscribe,
    () => useBusinessStore.getState().currentBusinessId,
    () => null
  );
  const setCurrentBusiness = useBusinessStore(
    (state) => state.setCurrentBusiness
  );

  return { currentBusinessId, setCurrentBusiness };
};
