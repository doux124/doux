import { useLayoutEffect } from 'react';
import type { RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './motion';

gsap.registerPlugin(ScrollTrigger);

interface RevealOptions {
  y?: number;         // distance travelled on the way in
  stagger?: number;   // gap between neighbours entering together
  duration?: number;
  start?: string;     // ScrollTrigger start, e.g. "top 85%"
}

/**
 * Fades a scope's matching elements up as they scroll into view, in batches so
 * neighbours stagger rather than all firing at once.
 *
 * The hidden state is applied from JS, never from markup, so the content stays
 * visible for reduced-motion users, and if this never runs nothing is stranded
 * at opacity 0.
 */
export function useReveal(
  scopeRef: RefObject<HTMLElement | null>,
  selector: string,
  { y = 32, stagger = 0.09, duration = 0.6, start = 'top 85%' }: RevealOptions = {},
) {
  useLayoutEffect(() => {
    const scope = scopeRef.current;
    if (!scope || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const els = gsap.utils.toArray<HTMLElement>(selector);
      if (!els.length) return;
      gsap.set(els, { opacity: 0, y });
      ScrollTrigger.batch(els, {
        start,
        // Not `once`: scrolling back up above an element animates it out, so coming
        // down again replays the entrance rather than showing it already there.
        onEnter: (batch) =>
          gsap.to(batch, { opacity: 1, y: 0, duration, stagger, ease: 'power3.out', overwrite: true }),
        // Mirror of the entrance rather than a snap: same distance, duration and
        // stagger, with the easing inverted so it accelerates away as it fades.
        onLeaveBack: (batch) =>
          gsap.to(batch, { opacity: 0, y, duration, stagger, ease: 'power3.in', overwrite: true }),
      });
    }, scope);

    return () => ctx.revert();
  }, [scopeRef, selector, y, stagger, duration, start]);
}
