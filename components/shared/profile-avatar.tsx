"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ProfileAvatarProps {
  /**
   * User's full name - used to generate initials fallback
   */
  name?: string;
  /**
   * URL to the user's profile image
   */
  image?: string | null;
  /**
   * Alternative text for the avatar image
   */
  alt?: string;
  /**
   * Size of the avatar
   * @default "default"
   */
  size?: "xs" | "sm" | "default" | "lg" | "xl" | number;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Custom fallback text (overrides initials generation)
   */
  fallback?: string;
}

/**
 * Generates user initials from a name
 * @param name - Full name of the user
 * @returns Two-letter initials in uppercase
 */
const getUserInitials = (name?: string): string => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Gets the size class or style based on the size prop
 */
const getSizeClass = (
  size: ProfileAvatarProps["size"]
): {
  className?: string;
  style?: React.CSSProperties;
} => {
  if (typeof size === "number") {
    return {
      style: { width: size, height: size },
    };
  }

  const sizeMap = {
    xs: "size-6",
    sm: "size-8",
    default: "size-9",
    lg: "size-12",
    xl: "size-16",
  };

  return {
    className: sizeMap[size || "default"],
  };
};

/**
 * Universal ProfileAvatar component
 *
 * Displays a user's avatar with automatic fallback to initials.
 * Can be used throughout the application for consistent avatar display.
 *
 * @example
 * ```tsx
 * <ProfileAvatar name="John Doe" image={user.avatarUrl} />
 * <ProfileAvatar name="Jane Smith" size="lg" />
 * <ProfileAvatar name="Admin User" size={64} />
 * ```
 */
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
            : size === "xs"
            ? "text-xs"
            : "text-sm"
        }
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};

