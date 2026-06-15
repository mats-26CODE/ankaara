"use client";

import Lottie from "lottie-react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

import { LOTTIE_ASSETS } from "@/lib/lotties";
import { cn } from "@/lib/utils";

type SpinnerProps = {
  className?: string;
};

function Spinner({ className }: SpinnerProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const animationData = isDark ? LOTTIE_ASSETS.loadingSpinnerWhite : LOTTIE_ASSETS.loadingSpinner;

  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn("inline-flex size-16 shrink-0 items-center justify-center", className)}
    >
      <Lottie animationData={animationData} loop className="size-full scale-200" />
    </div>
  );
}

export { Spinner };
