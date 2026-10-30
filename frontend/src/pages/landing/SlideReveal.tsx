import React, { useEffect, useRef, useState } from 'react';

export type SlideDirection = 'up' | 'down' | 'left' | 'right' | 'scale';

export interface SlideRevealProps {
  children: React.ReactNode;
  direction?: SlideDirection;
  delay?: number; // milliseconds
  duration?: number; // milliseconds
  className?: string;
  triggerOnce?: boolean;
  threshold?: number;
}

/**
 * SlideReveal: Used exclusively on major landing page sections for a clean,
 * cohesive presentation reveal as sections enter the viewport.
 */
export const SlideReveal: React.FC<SlideRevealProps> = ({
  children,
  direction = 'up',
  delay = 0,
  duration = 700,
  className = '',
  triggerOnce = true,
  threshold = 0.08,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(() => {
    // In SSR, Node, or environments without IntersectionObserver (e.g. tests),
    // always render visible so content is immediately rendered and indexable.
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      return true;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [triggerOnce, threshold]);

  const getTransformClasses = () => {
    if (isVisible) {
      return 'opacity-100 translate-x-0 translate-y-0 scale-100';
    }

    switch (direction) {
      case 'left':
        return 'opacity-0 -translate-x-8 sm:-translate-x-12';
      case 'right':
        return 'opacity-0 translate-x-8 sm:translate-x-12';
      case 'down':
        return 'opacity-0 -translate-y-8 sm:-translate-y-12';
      case 'scale':
        return 'opacity-0 scale-95';
      case 'up':
      default:
        return 'opacity-0 translate-y-8 sm:translate-y-12';
    }
  };

  return (
    <div
      ref={ref}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      }}
      className={`transition-all ease-[cubic-bezier(0.16,1,0.3,1)] transform will-change-[transform,opacity] ${getTransformClasses()} ${className}`}
    >
      {children}
    </div>
  );
};

export interface ScrollMoveCardProps {
  children: React.ReactNode;
  index?: number;
  from?: 'bottom' | 'left' | 'right' | 'angled-left' | 'angled-right';
  className?: string;
  distance?: number;
  stagger?: boolean;
}

/**
 * ScrollMoveCard: Dynamically moves a card into its designated place
 * based on the user's mouse scrolling movement.
 * As the user scrolls, the card physically translates, scales, and settles
 * directly in response to scroll progression.
 */
export const ScrollMoveCard: React.FC<ScrollMoveCardProps> = ({
  children,
  index = 0,
  from = 'bottom',
  className = '',
  distance = 48,
  stagger = true,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(1); // 1 = fully in place

  useEffect(() => {
    // In SSR, Node, or environments without IntersectionObserver (e.g. tests),
    // keep progress at 1 (fully in place).
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      setProgress(1);
      return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setProgress(1);
      return;
    }

    let rafId: number | null = null;

    const updateProgress = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const windowH = window.innerHeight;

      // Calculate arrival zone based on viewport height and optional index stagger
      const staggerOffset = stagger ? (index % 4) * 28 : 0;
      const startY = windowH + staggerOffset;
      const endY = windowH * 0.70;

      if (rect.top >= startY) {
        setProgress(0);
      } else if (rect.top <= endY) {
        setProgress(1);
      } else {
        const p = (startY - rect.top) / (startY - endY);
        setProgress(Math.max(0, Math.min(1, p)));
      }
    };

    const onScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        updateProgress();
        rafId = null;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    updateProgress(); // Initial check on mount

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [index, stagger]);

  // Compute transform based on scroll progress (0 = displaced, 1 = in place)
  const computeStyle = (): React.CSSProperties => {
    // If fully in place, return clean styles to allow native hover transforms
    if (progress >= 0.999) {
      return {
        opacity: 1,
        transform: 'none',
        transition: 'transform 200ms ease-out, opacity 200ms ease-out',
      };
    }

    const remaining = 1 - progress; // from 1 (displaced) to 0 (in place)
    const opacity = 0.2 + progress * 0.8;
    const scale = 0.96 + progress * 0.04;

    let translateX = 0;
    let translateY = remaining * distance;
    let rotate = 0;

    switch (from) {
      case 'left':
        translateX = -remaining * distance;
        translateY = remaining * (distance * 0.4);
        break;
      case 'right':
        translateX = remaining * distance;
        translateY = remaining * (distance * 0.4);
        break;
      case 'angled-left':
        translateX = -remaining * (distance * 0.6);
        translateY = remaining * distance;
        rotate = -remaining * 2;
        break;
      case 'angled-right':
        translateX = remaining * (distance * 0.6);
        translateY = remaining * distance;
        rotate = remaining * 2;
        break;
      case 'bottom':
      default:
        // Even cards lean slightly left, odd cards lean slightly right
        rotate = (index % 2 === 0 ? -1 : 1) * remaining * 1.5;
        break;
    }

    return {
      opacity,
      transform: `translate3d(${translateX.toFixed(1)}px, ${translateY.toFixed(1)}px, 0) scale(${scale.toFixed(3)}) rotate(${rotate.toFixed(2)}deg)`,
      transition: 'transform 90ms ease-out, opacity 90ms ease-out',
      willChange: 'transform, opacity',
    };
  };

  return (
    <div
      ref={ref}
      style={computeStyle()}
      className={`h-full ${className}`}
    >
      {children}
    </div>
  );
};

export default SlideReveal;
