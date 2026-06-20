"use client";

import * as React from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";

import { cn } from "@/lib/utils";

export const landingEase = [0.22, 1, 0.36, 1] as const;

/** Default scroll trigger — element must enter the viewport before animating. */
export const landingViewport = {
  once: true,
  amount: 0.22,
  margin: "0px 0px -72px 0px",
} as const;

/** Sections directly under the hero — reveal slightly earlier, but still on scroll. */
export const landingViewportEager = {
  once: true,
  amount: 0.18,
  margin: "0px 0px -48px 0px",
} as const;

export const landingStaggerParent: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
};

export const landingStaggerLoose: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.04,
    },
  },
};

export const landingFadeUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: landingEase },
  },
};

export const landingFadeUpTight: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.36, ease: landingEase },
  },
};

export const landingFadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.35, ease: landingEase },
  },
};

type ScrollRevealAs = "div" | "section" | "ul" | "li" | "h1" | "h2" | "h3" | "p";

const motionFor = (as: ScrollRevealAs) => {
  switch (as) {
    case "section":
      return motion.section;
    case "ul":
      return motion.ul;
    case "li":
      return motion.li;
    case "h1":
      return motion.h1;
    case "h2":
      return motion.h2;
    case "h3":
      return motion.h3;
    case "p":
      return motion.p;
    default:
      return motion.div;
  }
};

export type ScrollRevealProps = {
  children: React.ReactNode;
  className?: string;
  as?: ScrollRevealAs;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  distance?: number;
  duration?: number;
  eager?: boolean;
  /** Skip animation and show content immediately. */
  instant?: boolean;
};

export const ScrollReveal = ({
  children,
  className,
  as = "div",
  delay = 0,
  direction = "up",
  distance = 26,
  duration = 0.42,
  eager = false,
  instant = false,
}: ScrollRevealProps) => {
  const reduced = useReducedMotion();
  const skip = instant || Boolean(reduced);

  const initial =
    direction === "up"
      ? { opacity: 0, y: distance }
      : direction === "down"
        ? { opacity: 0, y: -distance }
        : direction === "left"
          ? { opacity: 0, x: distance }
          : { opacity: 0, x: -distance };

  const Motion = motionFor(as);
  const viewport = eager ? landingViewportEager : landingViewport;

  if (skip) {
    return <Motion className={cn(className)}>{children}</Motion>;
  }

  return (
    <Motion
      initial={initial}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={viewport}
      transition={{ duration, delay, ease: landingEase }}
      className={cn(className)}
    >
      {children}
    </Motion>
  );
};
