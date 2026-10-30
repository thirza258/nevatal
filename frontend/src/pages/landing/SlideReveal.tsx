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
 * SlideReveal component provides slide-in animation when scrolling.
 * Safe for SSR (Node.js) and testing environments (JSDOM) by defaulting to
 * visible whenever IntersectionObserver is unavailable.
 */
export const SlideReveal: React.FC<SlideRevealProps> = ({
  children,
  direction = 'up',
  delay = 0,
  duration = 750,
  className = '',
  triggerOnce = false,
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
      return 'opacity-100 translate-x-0 translate-y-0 scale-100 filter-none';
    }

    switch (direction) {
      case 'left':
        return 'opacity-0 -translate-x-12 sm:-translate-x-20 blur-[1px]';
      case 'right':
        return 'opacity-0 translate-x-12 sm:translate-x-20 blur-[1px]';
      case 'down':
        return 'opacity-0 -translate-y-12 sm:-translate-y-16 blur-[1px]';
      case 'scale':
        return 'opacity-0 scale-90 blur-[1px]';
      case 'up':
      default:
        return 'opacity-0 translate-y-12 sm:translate-y-20 scale-[0.97] blur-[1px]';
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

export default SlideReveal;
