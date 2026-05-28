"use client";

import { useReducedMotion } from "motion/react";
import { useSyncExternalStore } from "react";

import {
  landingViewport,
  landingViewportEager,
} from "@/components/shared/scroll-reveal";

const COMPACT_QUERY = "(max-width: 767px)";

const subscribeCompact = (onStoreChange: () => void) => {
  const mq = window.matchMedia(COMPACT_QUERY);
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
};

const getCompactSnapshot = () => window.matchMedia(COMPACT_QUERY).matches;

type UseLandingMotionOptions = {
  /** First section below the hero — show content immediately on small screens. */
  belowHero?: boolean;
};

export const useLandingMotion = (options?: UseLandingMotionOptions) => {
  const reduced = useReducedMotion();
  const isCompact = useSyncExternalStore(
    subscribeCompact,
    getCompactSnapshot,
    () => Boolean(options?.belowHero),
  );

  const instant = Boolean(reduced) || Boolean(options?.belowHero && isCompact);

  return {
    instant,
    motionInitial: instant ? ("visible" as const) : ("hidden" as const),
    viewport: instant ? ({ once: true, amount: 1 } as const) : landingViewportEager,
    scrollViewport: instant ? ({ once: true, amount: 1 } as const) : landingViewport,
  };
};
