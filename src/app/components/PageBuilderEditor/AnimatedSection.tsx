import React, { useEffect, useRef, useState } from 'react';

interface AnimatedSectionProps {
  animation?: string;  // e.g. 'fadeIn', 'fadeInUp', 'zoomIn', etc.
  speed?: 'slow' | 'normal' | 'fast';
  children: React.ReactNode;
}

const AnimatedSection: React.FC<AnimatedSectionProps> = ({ animation, speed = 'normal', children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!animation || animation === 'none') return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [animation]);

  if (!animation || animation === 'none') {
    return <>{children}</>;
  }

  return (
    <div
      ref={ref}
      className={`pb-animate${visible ? ` pb-visible pb-anim-${animation} pb-speed-${speed}` : ''}`}
    >
      {children}
    </div>
  );
};

export default AnimatedSection;
