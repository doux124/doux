import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { X, ExternalLink } from 'lucide-react';
import { prefersReducedMotion } from '../../../../lib/motion';

export interface Testimonial {
  label: string;
  href: string;
}

/**
 * Slides a testimonial PDF in from the right instead of navigating away.
 * `item` drives it: set it to open, null it to close. The panel stays mounted
 * through the exit tween so the slide-out is actually seen.
 */
const TestimonialPanel: React.FC<{ item: Testimonial | null; onClose: () => void }> = ({
  item,
  onClose,
}) => {
  const [shown, setShown] = useState<Testimonial | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  // Opening: remember where focus came from, then mount.
  useEffect(() => {
    if (item) {
      returnFocusRef.current = document.activeElement as HTMLElement | null;
      setShown(item);
    }
  }, [item]);

  // Enter tween (and the instant path for reduced motion).
  useLayoutEffect(() => {
    if (!item || !shown) return;
    const panel = panelRef.current;
    const backdrop = backdropRef.current;
    if (!panel || !backdrop) return;

    if (prefersReducedMotion()) {
      gsap.set(backdrop, { opacity: 1 });
      gsap.set(panel, { xPercent: 0 });
      return;
    }
    const ctx = gsap.context(() => {
      gsap.set(backdrop, { opacity: 0 });
      gsap.set(panel, { xPercent: 100 });
      gsap
        .timeline()
        .to(backdrop, { opacity: 1, duration: 0.3, ease: 'power2.out' })
        .to(panel, { xPercent: 0, duration: 0.5, ease: 'power3.out' }, 0);
    });
    return () => ctx.revert();
  }, [item, shown]);

  // Exit tween: item cleared but still mounted, so play out then unmount.
  useEffect(() => {
    if (item || !shown) return;
    const panel = panelRef.current;
    const backdrop = backdropRef.current;
    if (!panel || !backdrop || prefersReducedMotion()) {
      setShown(null);
      return;
    }
    const tl = gsap
      .timeline({ onComplete: () => setShown(null) })
      .to(panel, { xPercent: 100, duration: 0.35, ease: 'power3.in' })
      .to(backdrop, { opacity: 0, duration: 0.25, ease: 'power2.in' }, 0.1);
    return () => {
      tl.kill();
    };
  }, [item, shown]);

  // While open: lock scroll, hide the floating menu button, close on Escape, and
  // move focus in and back out again.
  useEffect(() => {
    if (!shown || !item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.dataset.overlayOpen = 'true';
    document.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      delete document.body.dataset.overlayOpen;
      document.removeEventListener('keydown', onKey);
      returnFocusRef.current?.focus?.();
    };
  }, [shown, item, onClose]);

  if (!shown) return null;

  return createPortal(
    // Above the floating menu button, which sits at z-index 10000 (see Menu/action.css)
    <div className="fixed inset-0 z-[10050]">
      <div
        ref={backdropRef}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={shown.label}
        className="absolute right-0 top-0 h-full w-full sm:w-[min(92vw,900px)] flex flex-col border-l border-amber-400/25 bg-gray-950 shadow-2xl shadow-black/60"
      >
        <div className="flex items-start gap-4 border-b border-white/10 px-5 py-4">
          <h2 className="flex-1 text-sm font-semibold text-amber-200">{shown.label}</h2>
          <a
            href={shown.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:border-white/30 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            Open PDF
          </a>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close testimonial"
            className="rounded-full border border-white/15 p-1.5 text-gray-300 hover:text-white hover:border-white/30 transition-colors"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <iframe
          src={`${shown.href}#view=FitH`}
          title={shown.label}
          className="flex-1 w-full bg-gray-900"
        />
      </div>
    </div>,
    document.body,
  );
};

export default TestimonialPanel;
