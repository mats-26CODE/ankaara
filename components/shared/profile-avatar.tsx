"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ProfileAvatarProps {
  name?: string;
  image?: string | null;
  alt?: string;
  size?: "sm" | "default" | "lg" | "xl" | number;
  className?: string;
  fallback?: string;
}

const getUserInitials = (name?: string): string => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getSizeClass = (
  size: ProfileAvatarProps["size"]
): { className?: string; style?: React.CSSProperties } => {
  if (typeof size === "number") {
    return { style: { width: size, height: size } };
  }
  const sizeMap = {
    sm: "size-8",
    default: "size-9",
    lg: "size-12",
    xl: "size-16",
  };
  return { className: sizeMap[size || "default"] };
};

export const ProfileAvatar = ({
  name,
  image,
  alt,
  size = "default",
  className,
  fallback,
}: ProfileAvatarProps) => {
  const sizeStyles = getSizeClass(size);
  const initials = fallback || getUserInitials(name);
  const avatarAlt = alt || name || "User avatar";

  return (
    <Avatar
      className={cn(sizeStyles.className, className)}
      style={sizeStyles.style}
    >
      <AvatarImage src={image || undefined} alt={avatarAlt} />
      <AvatarFallback
        className={
          typeof size === "number" && size > 40
            ? "text-base"
            : size === "xl" || size === "lg"
            ? "text-base"
            : "text-xs"
        }
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};
