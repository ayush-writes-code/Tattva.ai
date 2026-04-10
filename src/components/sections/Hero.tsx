"use client";

import { useRef } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import Dither from "@/components/reactbits/Dither";
import TextType from "@/components/reactbits/TextType";
import DecryptedText from "@/components/reactbits/DecryptedText";
import { Shield, ArrowDown } from "lucide-react";

export default function Hero() {
  const textRef = useRef<HTMLDivElement>(null);
  useScrollAnimation(textRef);

  return (
    <div id="hero-section" className="relative w-full min-h-screen flex items-center justify-center overflow-hidden py-[140px]">
      {/* Dither WebGL Background (Monochrome) */}
      <div className="absolute inset-0 z-0 text-background">
        <Dither waveColor={[1.0, 1.0, 1.0]} waveSpeed={0.03} />
      </div>

      {/* Subtle radial gradient overlay (kept monochrome) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--color-background)_70%)] z-[1]" />

      {/* Content */}
      <div className="relative z-10 text-center max-w-[1200px] w-full mx-auto px-[48px]">
        <div ref={textRef} style={{ visibility: "hidden" }}>
          {/* Badge */}
          <div className="mb-8 flex justify-center">
            <div className="inline-flex items-center gap-2 border border-border bg-surface px-4 py-2 rounded-full text-[10px] uppercase tracking-[0.1em] text-muted">
              <Shield className="w-3.5 h-3.5" />
              <DecryptedText text="AI-Powered Deepfake Detection" speed={60} maxIterations={15} animateOn="hover" />
            </div>
          </div>

          {/* Main Heading with TextType rotating questions */}
          <h1 className="text-[clamp(52px,8vw,96px)] leading-[1.05] text-primary mb-[20px] min-h-[220px] md:min-h-[210px] flex items-center justify-center">
            <TextType 
              text={[
                "Protecting Truth In The Age of AI",
                "Are your digital assets truly authentic?",
                "Can you spot the difference?",
                "What is real and what is synthetic?",
                "Is your identity secure from generation?"
              ]}
              typingSpeed={20}
              deletingSpeed={10}
              pauseDuration={3000}
            />
          </h1>

          {/* Subtitle */}
          <div className="mb-12">
            <p className="text-lg md:text-xl max-w-2xl mx-auto text-[#EDEDEA]/70">
              Multi-modal neural verification across image, video, and audio — powered by state-of-the-art forensic ensembles.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="#upload"
              className="px-8 py-3.5 bg-[#EDEDEA] text-[#080A0F] rounded-full text-sm font-medium hover:bg-white transition-colors"
            >
              <DecryptedText text="Start Detection" speed={60} maxIterations={12} animateOn="hover" />
            </a>
            <a
              href="#how-it-works"
              className="px-8 py-3.5 border border-[#EDEDEA] text-[#EDEDEA] rounded-full text-sm font-medium hover:bg-[#EDEDEA] hover:text-[#080A0F] transition-colors"
            >
              <DecryptedText text="How It Works" speed={60} maxIterations={12} animateOn="hover" />
            </a>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <ArrowDown className="w-5 h-5 text-faint" />
      </div>
    </div>
  );
}
