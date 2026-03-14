import dayjs, { Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

// -> Extend dayjs with necessary plugins
dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Returns a greeting message based on the current time of day
 * @returns A greeting string with emoji (e.g., "Good Morning 🌅")
 *
 * @example
 * ```ts
 * const greeting = getGreeting(); // "Good Morning 🌅" (if it's morning)
 * ```
 */
export function getGreeting(): string {
  const hour = dayjs().hour();

  if (hour >= 5 && hour < 12) {
    return "Good Morning 🌅";
  } else if (hour >= 12 && hour < 17) {
    return "Good Afternoon ☀️";
  } else if (hour >= 17 && hour < 21) {
    return "Good Evening 🌆";
  } else {
    return "Good Night 🌙";
  }
}

/**
 * Returns a casual greeting message based on the current time of day
 * @returns A casual greeting string with emoji (e.g., "Hi, Good Morning 🌅")
 *
 * @example
 * ```ts
 * const greeting = getCasualGreeting(); // "Hi, Good Morning 🌅" (if it's morning)
 * ```
 */
export function getCasualGreeting(): string {
  return `${getGreeting()}`;
}

/**
 * Formats phone number for display (shows 0XXXXXXXXX format)
 * @param phoneNumber - The phone number
 * @returns Display formatted phone number
 */
export function formatPhoneForDisplay(phoneNumber: string): string {
  const cleanNumber = phoneNumber.replace(/\D/g, "");

  // If it starts with 255, convert to 0XXXXXXXXX format
  if (cleanNumber.startsWith("255") && cleanNumber.length === 12) {
    return `0${cleanNumber.slice(3)}`;
  }

  // If it's 9 digits, add 0 prefix
  if (cleanNumber.length === 9) {
    return `0${cleanNumber}`;
  }

  // Return as is if it already has 0 prefix
  if (cleanNumber.startsWith("0") && cleanNumber.length === 10) {
    return cleanNumber;
  }

  return cleanNumber;
}

/**
 * Streamlined currency formatter, fully compatible with web and mobile with optional compact notation K,M,B,T.
 * It uses Intl.NumberFormat for web and a simplified fallback for mobile.
 */
export const formatCurrency = (
  amount: number,
  config: CurrencyConfig = {},
  locale: string = navigator.language,
): string => {
  const {
    code,
    symbol,
    decimalDigits = 2,
    symbolPosition = "left",
    spaceBetween = false,
    compact = false,
    compactThreshold = 1_000,
  } = config;

  if (!Number.isFinite(amount)) {
    return symbol ? `${symbol}–` : "–";
  }

  if (compact && Math.abs(amount) >= compactThreshold) {
    return formatCompact(amount, {
      code,
      symbol,
      decimalDigits,
      symbolPosition,
      spaceBetween,
      locale,
    });
  }

  const options: Intl.NumberFormatOptions = {
    minimumFractionDigits: decimalDigits,
    maximumFractionDigits: decimalDigits,
  };

  if (code) {
    options.style = "currency";
    options.currency = code;
    options.currencyDisplay = "narrowSymbol";
  } else {
    options.style = "decimal";
  }

  try {
    const formatter = new Intl.NumberFormat(locale, options);
    let result = formatter.format(amount);

    // -> Handle custom symbol positioning
    if (symbol && !code) {
      result = result.replace(/[^\d.,-]/g, "").trim();
      const space = spaceBetween ? " " : "";
      return symbolPosition === "left"
        ? `${symbol}${space}${result}`
        : `${result}${space}${symbol}`;
    }

    // -> Handle right position for currency codes
    if (code && symbolPosition === "right") {
      const currencySymbol = new Intl.NumberFormat(locale, {
        style: "currency",
        currency: code,
        currencyDisplay: "symbol",
      })
        .format(0)
        .replace(/[0.,]/g, "")
        .trim();

      return `${result.replace(currencySymbol, "").trim()}${
        spaceBetween ? " " : ""
      }${currencySymbol}`;
    }

    return result;
  } catch (error) {
    return simpleFormat(amount, {
      symbol: symbol || (code ? getSymbolFromCode(code) : ""),
      decimalDigits,
      symbolPosition,
      spaceBetween,
    });
  }
};

// -> Simplified fallback formatter
const simpleFormat = (
  amount: number,
  {
    symbol,
    decimalDigits,
    symbolPosition,
    spaceBetween,
  }: {
    symbol: string;
    decimalDigits: number;
    symbolPosition: "left" | "right";
    spaceBetween: boolean;
  },
): string => {
  const fixed = amount.toFixed(decimalDigits);
  const space = spaceBetween ? " " : "";
  return symbolPosition === "left" ? `${symbol}${space}${fixed}` : `${fixed}${space}${symbol}`;
};

// -> Minimal currency symbol lookup (unchanged)
const getSymbolFromCode = (code: string): string => {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    CAD: "$",
    AUD: "$",
    CNY: "¥",
    INR: "₹",
  };
  return symbols[code] || code;
};

/**
 * Handles compact notation (K/M/B/T)
 */
export const formatCompact = (
  amount: number,
  config?: {
    code?: string;
    symbol?: string;
    decimalDigits: number;
    symbolPosition: "left" | "right";
    spaceBetween: boolean;
    locale: string;
  },
): string => {
  const { value, suffix } = getCompactValueAndSuffix(amount);

  if (config) {
    // -> Get the currency symbol (prefer explicit symbol, fallback to code symbol)
    const currencySymbol = config.symbol || (config.code ? getSymbolFromCode(config.code) : "");

    // -> Format the base numeric value (without currency symbols)
    const formattedValue = value.toFixed(config.decimalDigits);

    // -> Always place symbol on left for compact format
    return `${currencySymbol}${config.spaceBetween ? " " : ""}${formattedValue}${suffix}`;
  } else {
    // -> Format the base numeric value (without currency symbols)
    const formattedValue = value.toFixed(1);
    return `${formattedValue}${suffix}`;
  }
};

/**
 * Format a number with thousands separators (commas).
 * Example: formatNumber(200000) -> "200,000"
 * @param value number to format
 * @param decimals number of decimal places to include (default 0)
 */
export function formatNumberAddCommas(value: number | null | undefined, decimals = 0): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "0";
  // Use toFixed to normalize decimal places, then add comma separators
  const parts = value.toFixed(decimals).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

/**
 * Determines the appropriate compact suffix
 */
const getCompactValueAndSuffix = (
  amount: number,
): {
  value: number;
  suffix: string;
} => {
  const absAmount = Math.abs(amount);

  if (absAmount >= 1_000_000_000_000) {
    return { value: amount / 1_000_000_000_000, suffix: "T" };
  }
  if (absAmount >= 1_000_000_000) {
    return { value: amount / 1_000_000_000, suffix: "B" };
  }
  if (absAmount >= 1_000_000) {
    return { value: amount / 1_000_000, suffix: "M" };
  }
  if (absAmount >= 1_000) {
    return { value: amount / 1_000, suffix: "K" };
  }
  return { value: amount, suffix: "" };
};

export const formatMap: Record<string, string> = {
  DB_TIMESTAMP: "YYYY-MM-DD HH:mm:ss",
  SHORT_DATE: "MM/DD/YYYY",
  SHORT_DATE_DM: "DD/MM/YYYY",
  LONG_DATE: "MMMM D, YYYY",
  DATE_TIME: "MM/DD/YYYY h:mm A",
  TIME_12HR: "h:mm A",
  ISO8601: "", // -> dayjs will use ISO format automatically
  HUMAN_READABLE: "MMM D, YYYY [at] h:mm A",
  CALENDAR_DAY: "dddd, MMMM D",
};

/**
 * Formats dates from database timestamps or other sources
 * @param dateInput Date string, timestamp, or Date object
 * @param format Preset or custom dayjs format string
 * @param options Additional formatting options
 */
export const formatDate = (
  dateInput: string | number | Date | null | Dayjs | undefined,
  format: DateFormatPreset = "HUMAN_READABLE",
  options: FormatDateOptions = {},
): string => {
  const { inputFormat, timezone = "UTC", fallback = "Invalid date" } = options;

  if (!dateInput) return fallback;

  // -> Map presets to dayjs format strings

  try {
    let date = dayjs(dateInput, inputFormat);

    // -> Handle database timestamps that might be UTC
    if (inputFormat === "DB_TIMESTAMP" || !inputFormat) {
      date = date.utc();
    }

    // -> Apply timezone conversion if specified
    if (timezone !== "UTC") {
      date = date.tz(timezone);
    }

    // -> Use mapped format or custom string
    const formatString = formatMap[format] || format;
    return date.isValid() ? date.format(formatString) : fallback;
  } catch (error) {
    console.warn("Date formatting error:", error);
    return fallback;
  }
};

export const formatTime = (time: dayjs.Dayjs) => {
  const hours = time.format("HH");
  const minutes = time.format("mm");
  return { hours, minutes };
};

export function capitalize(str: string): string {
  if (!str) return str;
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Validates a phone number to ensure it's numeric and starts with 0
 * @param phoneNumber - The phone number to validate
 * @returns An object with isValid boolean and error message if invalid
 */
export function validatePhoneNumber(phoneNumber: string): {
  isValid: boolean;
  error?: string;
} {
  // Remove any whitespace
  const cleaned = phoneNumber.trim();

  // Check if empty
  if (!cleaned) {
    return {
      isValid: false,
      error: "Phone number is required",
    };
  }

  // Check if it's numeric (only digits)
  if (!/^\d+$/.test(cleaned)) {
    return {
      isValid: false,
      error: "Phone number must contain only numbers",
    };
  }

  // Check if it starts with 0
  if (!cleaned.startsWith("0")) {
    return {
      isValid: false,
      error: "Phone number must start with 0",
    };
  }

  // Check minimum length (should be at least 10 digits: 0XXXXXXXXX)
  if (cleaned.length < 10) {
    return {
      isValid: false,
      error: "Phone number must be at least 10 digits",
    };
  }

  return { isValid: true };
}

/**
 * Adds the Tanzania country code (+255) to a phone number if it doesn't already have it.
 * @param phoneNumber - The phone number to process (e.g., "0767XXXXXX" or "+255767XXXXXX").
 * @returns The phone number with the country code included (e.g., "+255767XXXXXX").
 */
export function addCountryCode(phoneNumber: string): string {
  // Remove any whitespace or non-numeric characters except the plus sign
  const cleanedNumber = phoneNumber.replace(/[^0-9+]/g, "");

  // Check if the number already starts with the country code
  if (cleanedNumber.startsWith("255")) {
    return cleanedNumber;
  }

  // If the number starts with '0', remove it and add the country code
  if (cleanedNumber.startsWith("0")) {
    return "255" + cleanedNumber.slice(1);
  }

  // If no leading zero or country code, assume it's a local number and add country code
  return "255" + cleanedNumber;
}
