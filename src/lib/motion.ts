// Single source of truth for the user's motion preference.
// Canvas backgrounds call this at effect start; if reduced motion is requested they
// paint one static frame and never start their requestAnimationFrame loop.
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
