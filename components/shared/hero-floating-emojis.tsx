"use client";

import { motion, useReducedMotion } from "motion/react";

import { landingEase } from "@/components/shared/scroll-reveal";
import { cn } from "@/lib/utils";

type FloatingEmojiConfig = {
  emoji: string;
  top: string;
  left: string;
  sizeClass: string;
  delay: number;
  duration: number;
  floatY: number;
  floatX: number;
  rotate: number;
};

const HERO_FLOATING_EMOJIS: FloatingEmojiConfig[] = [
  {
    emoji: "😊",
    top: "11%",
    left: "19%",
    sizeClass: "text-2xl sm:text-3xl",
    delay: 0.15,
    duration: 5.2,
    floatY: 12,
    floatX: 6,
    rotate: 10,
  },
  {
    emoji: "🚀",
    top: "12%",
    left: "45%",
    sizeClass: "text-2xl sm:text-3xl",
    delay: 0.15,
    duration: 4.8,
    floatY: 14,
    floatX: -8,
    rotate: 8,
  },
  {
    emoji: "🏪",
    top: "10%",
    left: "71%",
    sizeClass: "text-2xl sm:text-4xl",
    delay: 0.35,
    duration: 4.8,
    floatY: 14,
    floatX: -8,
    rotate: 8,
  },
  {
    emoji: "🛒",
    top: "31%",
    left: "12%",
    sizeClass: "text-xl sm:text-3xl",
    delay: 0.5,
    duration: 5.5,
    floatY: 10,
    floatX: 7,
    rotate: 12,
  },
  {
    emoji: "💰",
    top: "24%",
    left: "84%",
    sizeClass: "text-xl sm:text-3xl",
    delay: 0.25,
    duration: 4.6,
    floatY: 11,
    floatX: -5,
    rotate: 9,
  },
  {
    emoji: "📦",
    top: "47%",
    left: "38%",
    sizeClass: "text-xl sm:text-2xl",
    delay: 0.65,
    duration: 5.8,
    floatY: 9,
    floatX: 4,
    rotate: 7,
  },
  {
    emoji: "✨",
    top: "42%",
    left: "63%",
    sizeClass: "text-lg sm:text-2xl",
    delay: 0.45,
    duration: 4.4,
    floatY: 8,
    floatX: -6,
    rotate: 14,
  },
  {
    emoji: "📈",
    top: "58%",
    left: "27%",
    sizeClass: "text-xl sm:text-2xl",
    delay: 0.8,
    duration: 5,
    floatY: 10,
    floatX: 5,
    rotate: 6,
  },
  {
    emoji: "🧾",
    top: "54%",
    left: "76%",
    sizeClass: "text-xl sm:text-2xl",
    delay: 0.55,
    duration: 5.4,
    floatY: 11,
    floatX: -7,
    rotate: 8,
  },
  {
    emoji: "🛍️",
    top: "69%",
    left: "52%",
    sizeClass: "text-lg sm:text-2xl",
    delay: 0.7,
    duration: 5.1,
    floatY: 9,
    floatX: 6,
    rotate: 11,
  },
  {
    emoji: "💳",
    top: "78%",
    left: "16%",
    sizeClass: "text-lg sm:text-xl",
    delay: 0.4,
    duration: 4.9,
    floatY: 8,
    floatX: -4,
    rotate: 9,
  },
  {
    emoji: "📊",
    top: "82%",
    left: "88%",
    sizeClass: "text-lg sm:text-2xl",
    delay: 0.6,
    duration: 5.6,
    floatY: 10,
    floatX: 5,
    rotate: 7,
  },
];

const HeroFloatingEmojis = () => {
  const reduced = useReducedMotion();

  if (reduced) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {HERO_FLOATING_EMOJIS.map((item) => (
        <motion.span
          key={`${item.emoji}-${item.top}-${item.left}`}
          className={cn(
            "absolute -translate-x-1/2 -translate-y-1/2 drop-shadow-sm select-none",
            item.sizeClass,
          )}
          style={{ top: item.top, left: item.left }}
          initial={{ opacity: 0, scale: 0.55, y: 12 }}
          animate={{
            opacity: 0.68,
            y: [0, -item.floatY, 0, item.floatY * 0.55, 0],
            x: [0, item.floatX, 0, -item.floatX * 0.6, 0],
            rotate: [-item.rotate, item.rotate, -item.rotate],
            scale: 1,
          }}
          transition={{
            opacity: { duration: 0.55, delay: item.delay, ease: landingEase },
            scale: { duration: 0.55, delay: item.delay, ease: landingEase },
            y: {
              duration: item.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: item.delay + 0.35,
            },
            x: {
              duration: item.duration * 1.08,
              repeat: Infinity,
              ease: "easeInOut",
              delay: item.delay + 0.35,
            },
            rotate: {
              duration: item.duration * 1.15,
              repeat: Infinity,
              ease: "easeInOut",
              delay: item.delay + 0.35,
            },
          }}
        >
          {item.emoji}
        </motion.span>
      ))}
    </div>
  );
};

export { HeroFloatingEmojis };
