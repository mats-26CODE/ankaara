import type { TemplateBusinessInfo } from "@/lib/invoice-templates/types";

type BusinessLogoProps = {
  business: TemplateBusinessInfo | null;
  /** Optional class for the image (e.g. h-10 w-auto). Default: h-10 w-auto */
  imageClassName?: string;
  /** Optional class for the text/name fallback */
  textClassName?: string;
  /** When true, image uses brightness-0 invert (for use on dark/colored backgrounds) */
  invertImage?: boolean;
};

/**
 * Renders business branding in invoice templates.
 * Priority: image logo (logo_url) → text logo (logo_text) → business name.
 */
export const BusinessLogo = ({
  business,
  imageClassName = "h-10 w-auto",
  textClassName = "text-xl font-bold text-gray-900",
  invertImage = false,
}: BusinessLogoProps) => {
  if (!business) return null;

  if (business.logo_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={business.logo_url}
        alt={business.name}
        className={`${imageClassName} ${invertImage ? "brightness-0 invert" : ""}`.trim()}
      />
    );
  }

  if (business.logo_text) {
    return <p className={textClassName}>{business.logo_text}</p>;
  }

  return <p className={textClassName}>{business.name}</p>;
};
