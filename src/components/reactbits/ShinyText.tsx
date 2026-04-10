"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useAnimationFrame, useTransform } from "framer-motion";

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
  color?: string;
  shineColor?: string;
  spread?: number;
}

export default function ShinyText({
  text,
  disabled = false,
  speed = 2,
  className = "",
  color = "#b5b5b5a0",
  shineColor = "#ffffff",
  spread = 120,
}: ShinyTextProps) {
  const progress = useMotionValue(0);
  const elapsedRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const animationDuration = speed * 1000;

  useAnimationFrame((time) => {
    if (disabled) {
      lastTimeRef.current = null;
      return;
    }
    if (lastTimeRef.current === null) {
      lastTimeRef.current = time;
      return;
    }
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;
    elapsedRef.current += deltaTime;

    const cycleTime = elapsedRef.current % (animationDuration + 1000);
    if (cycleTime < animationDuration) {
      progress.set((cycleTime / animationDuration) * 100);
    } else {
      progress.set(100);
    }
  });

  const backgroundPosition = useTransform(progress, (p) => `${150 - p * 2}% center`);

  const gradientStyle = {
    backgroundImage: `linear-gradient(${spread}deg, ${color} 0%, ${color} 35%, ${shineColor} 50%, ${color} 65%, ${color} 100%)`,
    backgroundSize: "200% auto",
    WebkitBackgroundClip: "text" as const,
    backgroundClip: "text" as const,
    WebkitTextFillColor: "transparent",
  };

  return (
    <motion.span
      className={`inline-block ${className}`}
      style={{ ...gradientStyle, backgroundPosition }}
    >
      {text}
    </motion.span>
  );
}
