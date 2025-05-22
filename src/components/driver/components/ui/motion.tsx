import React, { useEffect, useRef, useState } from "react";
import { cn } from "../../../../lib/utils";

type AnimationVariant = 
  | "fade-in" 
  | "fade-in-right" 
  | "fade-in-left" 
  | "scale-in" 
  | "slide-in-bottom";

interface MotionProps {
  children: React.ReactNode;
  className?: string;
  variant?: AnimationVariant;
  delay?: number;
  threshold?: number;
  once?: boolean;
}

export const Motion = ({
  children,
  className,
  variant = "fade-in",
  delay = 0,
  threshold = 0.1,
  once = true,
}: MotionProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once && ref.current) {
            observer.unobserve(ref.current);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold, once]);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-500 ease-out",
        isVisible ? `animate-${variant}` : "opacity-0",
        className
      )}
      style={{ 
        animationDelay: `${delay}ms`,
        animationFillMode: "forwards",
      }}
    >
      {children}
    </div>
  );
};

export default Motion;
