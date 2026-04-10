"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";

interface DecryptedTextProps {
  text: string;
  speed?: number; // kept for TS signature but ignored internally
  maxIterations?: number;
  characters?: string;
  className?: string;     // color for normal text
  parentClassName?: string;
  encryptedClassName?: string;
  animateOn?: "hover" | "view";
}

function DecryptedWord({
  word,
  speed,
  maxIterations,
  characters,
  className,
  encryptedClassName,
  animateOn,
}: {
  word: string;
  speed: number;
  maxIterations: number;
  characters: string;
  className: string;
  encryptedClassName: string;
  animateOn: "hover" | "view";
}) {
  const [displayText, setDisplayText] = useState(word);
  const [isHovered, setIsHovered] = useState(false);
  const [hasViewAnimated, setHasViewAnimated] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const iterationRef = useRef(0);
  const containerRef = useRef<HTMLSpanElement>(null);

  const availableChars = useMemo(() => characters.split(""), [characters]);

  const scramble = useCallback(
    (original: string) => {
      return original
        .split("")
        .map((char) => {
          if (char === " ") return " ";
          return availableChars[Math.floor(Math.random() * availableChars.length)];
        })
        .join("");
    },
    [availableChars]
  );

  const startScramble = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    iterationRef.current = 0;
    setDisplayText(scramble(word));

    intervalRef.current = setInterval(() => {
      iterationRef.current++;
      if (animateOn === "view" && iterationRef.current >= maxIterations) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplayText(word);
        return;
      }
      setDisplayText(scramble(word));
    }, speed);
  }, [word, speed, maxIterations, scramble, animateOn]);

  const stopScramble = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setDisplayText(word);
  }, [word]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    startScramble();
  }, [startScramble]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    stopScramble();
  }, [stopScramble]);

  useEffect(() => {
    if (animateOn !== "view" || hasViewAnimated) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasViewAnimated) {
            startScramble();
            setHasViewAnimated(true);
          }
        });
      },
      { threshold: 0.1 }
    );
    const el = containerRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, [animateOn, hasViewAnimated, startScramble]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const hoverProps =
    animateOn === "hover"
      ? { onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave }
      : {};

  const isScrambling = isHovered || (animateOn === "view" && displayText !== word);

  return (
    <span
      ref={containerRef}
      className={`relative inline-block ${className}`}
      {...hoverProps}
    >
      {/* Invisible layout lock: guarantees the container width/height never jumps */}
      <span className="opacity-0 pointer-events-none">{word}</span>
      
      {/* Absolutely positioned overlay for the scrambled text */}
      <span 
        aria-hidden="true" 
        className={`absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none whitespace-nowrap ${isScrambling ? 'text-[#ef4444]' : ''}`}
      >
        {displayText.split("").map((char, index) => {
          const isOriginal = char === word[index];
          return (
            <span
              key={index}
              className={isOriginal && !isHovered ? "" : encryptedClassName || ""}
              style={
                !isOriginal || isHovered
                  ? { opacity: 0.8, transition: "opacity 0.02s" }
                  : undefined
              }
            >
              {char}
            </span>
          );
        })}
      </span>
    </span>
  );
}

export default function DecryptedText({
  text,
  characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+{}[]<>~",
  className = "",
  parentClassName = "",
  encryptedClassName = "",
  animateOn = "hover",
}: DecryptedTextProps) {
  // Override to be extremely fast & flashy per word
  const actualSpeed = 25; // ms per tick
  const actualMaxIterations = 6; // Quick flash duration

  // Split safely by spaces so each word is independently wrapped
  const parts = typeof text === "string" ? text.split(/(\s+)/) : [];

  return (
    <span className={parentClassName || undefined}>
      {parts.map((part, index) => {
        if (/^\s+$/.test(part)) {
          // Preserve spaces exactly as they are mapped
          return <span key={index} className="whitespace-pre">{part}</span>;
        }
        return (
          <DecryptedWord
            key={index}
            word={part}
            speed={actualSpeed}
            maxIterations={actualMaxIterations}
            characters={characters}
            className={className}
            encryptedClassName={encryptedClassName}
            animateOn={animateOn}
          />
        );
      })}
    </span>
  );
}
