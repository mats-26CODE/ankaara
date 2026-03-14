import React from "react";
import Link from "next/link";
import Image from "next/image";
import { APP_NAME } from "@/constants/values";
import { cn } from "@/lib/utils";

const LOGO_ICON = "/ankaara_logo_icon.png";
const LOGO_FULL = "/ankaara_logo.png";

interface LogoProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
  showText?: boolean;
}

const Logo = ({ className, size = "md", showText = true }: LogoProps) => {
  const iconSize = {
    xs: 16,
    sm: 24,
    md: 32,
    lg: 40,
  };

  const px = iconSize[size];

  return (
    <Link href="/" className={cn("flex items-center gap-2", className)}>
      {showText ? (
        <Image
          src={LOGO_FULL}
          alt={APP_NAME}
          width={px * 3}
          height={px}
          className="h-auto w-auto object-contain"
          style={{ height: px }}
          priority
        />
      ) : (
        <Image
          src={LOGO_ICON}
          alt={APP_NAME}
          width={px}
          height={px}
          className="object-contain"
          priority
        />
      )}
    </Link>
  );
};

export default Logo;
