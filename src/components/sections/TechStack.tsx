"use client";

import { useRef } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Eye, AudioLines, Search } from "lucide-react";
import DecryptedText from "@/components/reactbits/DecryptedText";
import Radar from "@/components/reactbits/Radar";
import BorderGlow from "@/components/reactbits/BorderGlow";

const MODELS = [
  {
    icon: Eye,
    name: "Vision Transformer (ViT)",
    tag: "Image Detection",
    desc: "Pre-trained on millions of real and synthetic images. Detects GAN artifacts, diffusion signatures, and face-swap inconsistencies at the patch level.",
    accuracy: "98.5%",
  },
  {
    icon: Eye,
    name: "Swin Transformer",
    tag: "Image Detection",
    desc: "Hierarchical vision model with shifted window attention. Excels at detecting AI-generated content from Midjourney, DALL·E, and Stable Diffusion.",
    accuracy: "96.2%",
  },
  {
    icon: AudioLines,
    name: "Wav2Vec2-XLSR",
    tag: "Audio Detection",
    desc: "Self-supervised speech model fine-tuned for voice cloning detection. Analyzes spectrograms, zero-crossing rates, and prosody anomalies.",
    accuracy: "97.9%",
  },
  {
    icon: Search,
    name: "Error Level Analysis",
    tag: "Forensic Layer",
    desc: "Pixel-level JPEG compression analysis. Identifies regions that have been modified, spliced, or generated at different compression ratios.",
    accuracy: "94.5%",
  },
];

export default function TechStack() {
  const sectionRef = useRef<HTMLElement>(null);
  useScrollAnimation(sectionRef);

  return (
    <section 
      ref={sectionRef} 
      className="relative w-full overflow-hidden" 
      style={{ visibility: "hidden" }}
    >
      {/* Tactical Radar Background */}
      <div className="absolute inset-0 z-0 opacity-20 mix-blend-screen pointer-events-none transform scale-[1.3] md:scale-[1.8]">
        <Radar 
          color="#FFFFFF"
          backgroundColor="#000000"
          scale={0.5}
          ringCount={8}
          spokeCount={12}
          sweepSpeed={1.0}
          brightness={0.8}
          enableMouseInteraction={true}
        />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto py-[140px] px-[48px]">
        <div className="text-center mb-[60px]">
          <p className="text-muted text-[10px] uppercase tracking-[0.1em] mb-[20px]">
            <DecryptedText text="Technology" speed={60} maxIterations={15} animateOn="hover" />
          </p>
          <h2 className="text-4xl md:text-5xl text-primary">
            <DecryptedText text="Neural Engine Stack" speed={60} maxIterations={15} animateOn="hover" />
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {MODELS.map((model) => (
            <BorderGlow
              key={model.name}
              className="h-full"
              animated={true}
              glowColor="0 0% 93%"
              backgroundColor="transparent"
              borderRadius={0}
              glowRadius={30}
              glowIntensity={0.6}
              coneSpread={15}
            >
              <div
                className="group relative h-full p-[40px] border border-border bg-surface/80 backdrop-blur-sm transition-all duration-500 hover:border-muted/50"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 border border-border bg-background flex items-center justify-center">
                      <model.icon className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-primary text-base tracking-tight font-medium">
                        <DecryptedText text={model.name} speed={60} maxIterations={15} animateOn="hover" />
                      </h3>
                      <p className="text-muted text-[10px] uppercase tracking-[0.1em] mt-0.5">
                        <DecryptedText text={model.tag} speed={60} maxIterations={15} animateOn="hover" />
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl text-primary font-medium">
                      <DecryptedText text={model.accuracy} speed={60} maxIterations={15} animateOn="hover" />
                    </div>
                    <div className="text-[10px] text-muted uppercase tracking-[0.1em]">
                      <DecryptedText text="Accuracy" speed={60} maxIterations={15} animateOn="hover" />
                    </div>
                  </div>
                </div>

                <p className="text-muted text-sm">
                  <DecryptedText text={model.desc} speed={60} maxIterations={15} animateOn="hover" />
                </p>
              </div>
            </BorderGlow>
          ))}
        </div>
      </div>
    </section>
  );
}
