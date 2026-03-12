import React from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { APP_NAME } from "@/constants/values";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
  textSize?: "sm" | "md" | "lg";
  showText?: boolean;
}

const Logo = ({ className, size = "md", textSize = "md", showText = true }: LogoProps) => {
  const sizeClass = {
    xs: "size-4",
    sm: "size-6",
    md: "size-8",
    lg: "size-10",
  };

  const textSizeClass = {
    xs: "text-sm",
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
  };

  return (
    <Link href={"/"} className="flex items-center gap-1">
      <Avatar className={cn("bg-primary mt-2.5 border-0", sizeClass[size])}>
        <AvatarImage src="/person-working.png" alt="logo" />
        <AvatarFallback className="font-brand -mt-[4px] bg-transparent text-2xl font-bold text-white">
          {APP_NAME.charAt(0)}
        </AvatarFallback>
      </Avatar>
      {showText && (
        <span className={cn("font-brand text-foreground", textSizeClass[textSize])}>
          {APP_NAME}
        </span>
      )}
    </Link>
  );
};

export default Logo;
