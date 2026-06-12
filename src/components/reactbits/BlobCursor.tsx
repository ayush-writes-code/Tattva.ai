"use client";

import { useRef, useEffect, useCallback } from "react";
import gsap from "gsap";
import { useReducedMotion } from "framer-motion";

interface BlobCursorProps {
  fillColor?: string;
  trailCount?: number;
  sizes?: number[];
  opacities?: number[];
  fastDuration?: number;
  slowDuration?: number;
  zIndex?: number;
}

export default function BlobCursor({
  fillColor = "rgba(0, 229, 255, 0.5)",
  trailCount = 3,
  sizes = [20, 50, 35],
  opacities = [0.8, 0.4, 0.35],
  fastDuration = 0.08,
  slowDuration = 0.45,
  zIndex = 9999,
}: BlobCursorProps) {
  const blobsRef = useRef<(HTMLDivElement | null)[]>([]);
  const shouldReduceMotion = useReducedMotion();

  const handleMove = useCallback(
    (e: MouseEvent) => {
      blobsRef.current.forEach((el, i) => {
        if (!el) return;
        const isLead = i === 0;
        gsap.to(el, {
          x: e.clientX,
          y: e.clientY,
          duration: isLead ? fastDuration : slowDuration * (1 + i * 0.3),
          ease: isLead ? "power3.out" : "power2.out",
        });
      });
    },
    [fastDuration, slowDuration]
  );

  useEffect(() => {
    if (shouldReduceMotion) return;
    document.addEventListener("mousemove", handleMove);
    return () => document.removeEventListener("mousemove", handleMove);
  }, [handleMove, shouldReduceMotion]);

  if (shouldReduceMotion) return null;

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex }}>
      {Array.from({ length: trailCount }).map((_, i) => (
        <div
          key={i}
          ref={(el) => { blobsRef.current[i] = el; }}
          className="fixed top-0 left-0 rounded-full pointer-events-none mix-blend-screen"
          style={{
            width: sizes[i] || sizes[0] || 20,
            height: sizes[i] || sizes[0] || 20,
            backgroundColor: fillColor,
            opacity: opacities[i] || opacities[0] || 0.5,
            transform: "translate(-50%, -50%)",
            boxShadow: `0 0 ${(sizes[i] || sizes[0] || 20) * 1.5}px ${(sizes[i] || sizes[0] || 20) * 0.4}px ${fillColor}`,
            willChange: "transform",
          }}
        />
      ))}
    </div>
  );
}
