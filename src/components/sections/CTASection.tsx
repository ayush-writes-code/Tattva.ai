"use client";

import { useRef } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Zap } from "lucide-react";
import DecryptedText from "@/components/reactbits/DecryptedText";
import ShapeGrid from "@/components/reactbits/ShapeGrid";

export default function CTASection() {
  const sectionRef = useRef<HTMLElement>(null);
  useScrollAnimation(sectionRef);

  return (
    <section 
      ref={sectionRef} 
      className="relative w-full overflow-hidden" 
      style={{ visibility: "hidden" }}
    >
      {/* ShapeGrid Background */}
      <div className="absolute inset-0 z-0 opacity-25 pointer-events-none">
        <ShapeGrid 
          shape="hexagon"
          borderColor="#3A3F4E"
          hoverFillColor="#EDEDEA"
          speed={0.7}
          squareSize={40}
        />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto py-[140px] px-[48px] text-center">
        <div className="p-[40px] md:p-[60px] border border-border bg-surface/80 backdrop-blur-sm relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-14 h-14 border border-border bg-background flex items-center justify-center mx-auto mb-8">
              <Zap className="w-6 h-6 text-primary" />
            </div>

            <h2 className="text-3xl md:text-4xl text-primary mb-[20px]">
              <DecryptedText text="Ready to verify authenticity?" speed={60} maxIterations={15} animateOn="hover" />
            </h2>
            <p className="text-muted text-lg max-w-lg mx-auto mb-10">
              <DecryptedText text="Upload any media file and get an instant AI-powered forensic verdict with full confidence scoring." speed={60} maxIterations={15} animateOn="hover" />
            </p>

            <a
              href="#upload"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#EDEDEA] text-[#080A0F] rounded-full text-sm font-medium hover:bg-white transition-colors"
            >
              <DecryptedText text="Start Detection" speed={60} maxIterations={12} animateOn="hover" />
              <Zap className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
