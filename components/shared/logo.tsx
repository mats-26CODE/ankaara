import React from "react";
import Link from "next/link";
import { APP_NAME } from "@/constants/values";
import { cn } from "@/lib/utils";

const LOGO_FULL = "/ankaara_logo.png";
const LOGO_ICON = "/ankaara_logo_icon.png";

const SIZE_PX = {
  xs: 24,
  sm: 32,
  md: 64,
  lg: 96,
} as const;

interface LogoProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
  /** "full" = full logo (horizontal), "icon" = icon only */
  variant?: "full" | "icon";
  /** When false, renders a static logo (no navigation link). */
  linked?: boolean;
}

const Logo = ({ className, size = "md", variant = "full", linked = true }: LogoProps) => {
  const px = SIZE_PX[size];
  const src = variant === "full" ? LOGO_FULL : LOGO_ICON;
  const isIcon = variant === "icon";

  const image = (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt={APP_NAME}
      className="object-contain"
      style={{
        height: px,
        width: isIcon ? px : "auto",
      }}
      loading="eager"
    />
  );

  if (!linked) {
    return <span className={cn("inline-flex items-center", className)}>{image}</span>;
  }

  return (
    <Link href="/" className={cn("inline-flex items-center", className)}>
      {image}
    </Link>
  );
};

export default Logo;
