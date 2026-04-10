"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import DecryptedText from "@/components/reactbits/DecryptedText";
import ShapeGrid from "@/components/reactbits/ShapeGrid";

const MARQUEE_ITEMS = [
  "ViT Core",
  "Wav2Vec2-XLSR",
  "Swin Transformer",
  "ELA Forensics",
  "GaryStefford Model",
  "Neural Ensemble",
  "Spectrogram Analysis",
  "Zero-Crossing Rate"
];

export default function StatsBar() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [count1, setCount1] = useState("0K+");
  const [count2, setCount2] = useState("0.0%");
  const [count3, setCount3] = useState("0ms");

  useGSAP(() => {
    if (!containerRef.current) return;

    ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top 80%",
      once: true,
      onEnter: () => {
        const proxy = { c1: 0, c2: 0, c3: 0 };
        gsap.to(proxy, { c1: 240, duration: 2, ease: "power2.out", onUpdate: () => setCount1(`${Math.round(proxy.c1)}K+`) });
        gsap.to(proxy, { c2: 98.5, duration: 2, ease: "power2.out", onUpdate: () => setCount2(`${proxy.c2.toFixed(1)}%`) });
        gsap.to(proxy, { c3: 24, duration: 1.2, ease: "power3.out", onUpdate: () => setCount3(`${Math.round(proxy.c3)}ms`) });
      }
    });
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="relative w-full flex flex-col font-sans overflow-hidden">
      {/* ShapeGrid Background */}
      <div className="absolute inset-0 z-0 opacity-25 pointer-events-none">
        <ShapeGrid 
          shape="square"
          borderColor="#3A3F4E"
          hoverFillColor="#EDEDEA"
          speed={0.5}
          squareSize={50}
        />
      </div>

      <div className="relative z-10 w-full flex flex-col pt-[20px]">
        {/* Stats Counters Row */}
        <div className="w-full py-[80px]">
          <div className="max-w-[1200px] mx-auto px-[48px] grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0">
            
            <div className="flex flex-col items-center justify-center text-center">
              <div className="text-primary text-[clamp(48px,5vw,72px)] leading-tight mb-2">
                {count1}
              </div>
              <div className="text-muted text-[10px] uppercase tracking-[0.1em]">
                <DecryptedText text="Deepfakes Identified" speed={60} maxIterations={15} animateOn="hover" />
              </div>
            </div>

            <div className="flex flex-col items-center justify-center text-center md:border-l md:border-r border-border">
              <div className="text-primary text-[clamp(48px,5vw,72px)] leading-tight mb-2">
                {count2}
              </div>
              <div className="text-muted text-[10px] uppercase tracking-[0.1em]">
                <DecryptedText text="Peak Confidence Score" speed={60} maxIterations={15} animateOn="hover" />
              </div>
            </div>

            <div className="flex flex-col items-center justify-center text-center">
              <div className="text-primary text-[clamp(48px,5vw,72px)] leading-tight mb-2">
                {count3}
              </div>
              <div className="text-muted text-[10px] uppercase tracking-[0.1em]">
                <DecryptedText text="p99 Latency" speed={60} maxIterations={15} animateOn="hover" />
              </div>
            </div>
            
          </div>
        </div>

        {/* Marquee Strip */}
        <div className="w-full bg-background overflow-hidden border-t border-b border-border py-4">
          <div className="flex w-max animate-infinite-scroll hover:animation-play-state-running">
            {[...Array(2)].map((_, arrayIdx) => (
              <div key={`marquee-group-${arrayIdx}`} className="flex items-center">
                {MARQUEE_ITEMS.map((item, idx) => (
                  <div key={`${arrayIdx}-${idx}`} className="flex items-center px-6">
                    <span className="text-muted text-[10px] tracking-[0.1em] uppercase whitespace-nowrap">
                      <DecryptedText text={item} speed={60} maxIterations={15} animateOn="hover" />
                    </span>
                    <div className="w-[4px] h-[4px] rounded-full bg-faint ml-12" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
