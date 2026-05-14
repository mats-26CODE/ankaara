/**
 * Defer client navigation until after the current gesture / paint cycle.
 * Helps iOS Safari and other mobile browsers where `router.push` in the same
 * tick as `touch`/`click` can start navigation before auth/storage is settled.
 */
export const deferNavigation = (run: () => void) => {
  if (typeof window === "undefined") {
    run();
    return;
  }
  requestAnimationFrame(() => {
    requestAnimationFrame(run);
  });
};
