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
}

const Logo = ({ className, size = "md", variant = "full" }: LogoProps) => {
  const px = SIZE_PX[size];
  const src = variant === "full" ? LOGO_FULL : LOGO_ICON;
  const isIcon = variant === "icon";

  return (
    <Link href="/" className={cn("inline-flex items-center", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
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
    </Link>
  );
};

export default Logo;
