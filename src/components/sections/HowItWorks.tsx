"use client";

import { useRef } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { UploadCloud, Cpu, ShieldCheck } from "lucide-react";
import DecryptedText from "@/components/reactbits/DecryptedText";
import BorderGlow from "@/components/reactbits/BorderGlow";
import LetterGlitch from "@/components/reactbits/LetterGlitch";

const STEPS = [
  {
    num: "01",
    icon: UploadCloud,
    title: "Upload Media",
    desc: "Drag and drop any image, video, or audio file. We support all major formats up to 100MB.",
  },
  {
    num: "02",
    icon: Cpu,
    title: "Neural Analysis",
    desc: "Our ensemble of ViT, Swin Transformer, and Wav2Vec2 models dissect the media across multiple forensic dimensions.",
  },
  {
    num: "03",
    icon: ShieldCheck,
    title: "Instant Verdict",
    desc: "Receive a confidence-scored verdict — AUTHENTIC, SUSPICIOUS, or DEEPFAKE — with full telemetry breakdown.",
  },
];

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  useScrollAnimation(sectionRef);

  return (
    <section 
      id="how-it-works" 
      ref={sectionRef} 
      className="relative w-full overflow-hidden" 
      style={{ visibility: "hidden" }}
    >
      {/* LetterGlitch Background */}
      <div className="absolute inset-0 z-0 opacity-[0.15] pointer-events-none">
        <LetterGlitch
          glitchSpeed={50}
          centerVignette={false}
          outerVignette={true}
          smooth={true}
        />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto py-[140px] px-[48px]">
        <div className="text-center mb-[60px]">
          <p className="text-muted text-[10px] uppercase tracking-[0.1em] mb-[20px]">
            <DecryptedText text="Process" speed={60} maxIterations={15} animateOn="hover" />
          </p>
          <h2 className="text-4xl md:text-5xl text-primary">
            <DecryptedText text="How It Works" speed={60} maxIterations={15} animateOn="hover" />
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((step) => (
            <BorderGlow
              key={step.num}
              className="h-full"
              animated={true}
              glowColor="186 100% 74%"
              backgroundColor="#080A0F"
              borderRadius={0}
              glowRadius={30}
              glowIntensity={0.6}
              coneSpread={15}
            >
              <div
                className="group relative h-full p-[40px] border border-border bg-surface/80 backdrop-blur-sm transition-all duration-500 hover:border-muted/50"
              >
                <div className="text-[80px] font-bold leading-none text-border absolute top-4 right-6 select-none transition-colors duration-500">
                  {step.num}
                </div>

                <div className="relative z-10">
                  <div className="w-12 h-12 border border-border bg-background flex items-center justify-center mb-6 transition-colors duration-300">
                    <step.icon className="w-5 h-5 text-primary" />
                  </div>

                  <h3 className="text-xl text-primary mb-3">
                    <DecryptedText text={step.title} speed={60} maxIterations={15} animateOn="hover" />
                  </h3>
                  <p className="text-muted text-sm">
                    <DecryptedText text={step.desc} speed={60} maxIterations={15} animateOn="hover" />
                  </p>
                </div>
              </div>
            </BorderGlow>
          ))}
        </div>
      </div>
    </section>
  );
}
