import loadingSpinner from "@/assets/lotties/loading_spinner.json";
import loadingSpinnerWhite from "@/assets/lotties/loading_spinner_white.json";

export const LOTTIE_ASSETS = {
  loadingSpinner,
  loadingSpinnerWhite,
} as const;

export type LottieKind = keyof typeof LOTTIE_ASSETS;
