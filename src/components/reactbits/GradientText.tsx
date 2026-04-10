"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, useMotionValue, useAnimationFrame, useTransform } from "framer-motion";

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  colors?: string[];
  animationSpeed?: number;
  showBorder?: boolean;
}

export default function GradientText({
  children,
  className = "",
  colors = ["#00e5ff", "#1D9E75", "#00e5ff"],
  animationSpeed = 8,
  showBorder = false,
}: GradientTextProps) {
  const progress = useMotionValue(0);
  const elapsedRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const animationDuration = animationSpeed * 1000;

  useAnimationFrame((time) => {
    if (lastTimeRef.current === null) {
      lastTimeRef.current = time;
      return;
    }
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;
    elapsedRef.current += deltaTime;

    const fullCycle = animationDuration * 2;
    const cycleTime = elapsedRef.current % fullCycle;
    if (cycleTime < animationDuration) {
      progress.set((cycleTime / animationDuration) * 100);
    } else {
      progress.set(100 - ((cycleTime - animationDuration) / animationDuration) * 100);
    }
  });

  useEffect(() => {
    elapsedRef.current = 0;
    progress.set(0);
  }, [animationSpeed, progress]);

  const backgroundPosition = useTransform(progress, (p) => `${p}% 50%`);

  const gradientColors = [...colors, colors[0]].join(", ");
  const gradientStyle = {
    backgroundImage: `linear-gradient(to right, ${gradientColors})`,
    backgroundSize: "300% 100%",
    backgroundRepeat: "repeat" as const,
  };

  return (
    <motion.div
      className={`relative mx-auto flex max-w-fit flex-row items-center justify-center rounded-[1.25rem] font-medium backdrop-blur-[10px] overflow-hidden cursor-pointer ${showBorder ? "px-3 py-1.5" : ""} ${className}`}
    >
      {showBorder && (
        <motion.div
          className="absolute inset-0 rounded-[inherit] z-0 pointer-events-none before:content-[''] before:absolute before:inset-[1px] before:rounded-[inherit] before:bg-[#0f1115] before:z-[-1]"
          style={{ ...gradientStyle, backgroundPosition }}
        />
      )}
      <motion.div
        className="inline-block relative z-[2] bg-clip-text text-transparent"
        style={{
          ...gradientStyle,
          backgroundPosition,
          WebkitBackgroundClip: "text",
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
