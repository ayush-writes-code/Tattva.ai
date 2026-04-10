"use client";

import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import DecryptedText from "@/components/reactbits/DecryptedText";
import BorderGlow from "@/components/reactbits/BorderGlow";

const STEPS = [
  "Intercepting Payload",
  "Extracting Metadata Signatures",
  "Running Neural Ensemble (ViT/Swin)",
  "Cross-referencing Audio Spectrums",
  "Formulating Verdict",
];

export default function ProcessingTimeline() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <BorderGlow
      animated={true}
      glowColor="186 100% 74%"
      backgroundColor="#080A0F"
      borderRadius={0}
      glowRadius={30}
      glowIntensity={0.6}
      coneSpread={15}
      className="w-full max-w-xl mx-auto my-[40px]"
    >
      <div className="w-full h-full bg-surface p-[40px] border border-border">
        <h3 className="text-lg text-primary mb-8 flex items-center gap-2">
        <Loader2 className="w-5 h-5 text-primary animate-spin" />
        <DecryptedText text="Processing Neural Matrix" speed={60} maxIterations={15} animateOn="hover" />
      </h3>
      
      <div className="relative ml-[7px]">
        {/* Vertical line */}
        <div className="absolute left-0 top-0 bottom-0 w-px bg-border" />
        
        <div className="space-y-5">
          {STEPS.map((step, index) => {
            const isCompleted = index < currentStep;
            const isActive = index === currentStep;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative flex items-center"
              >
                {/* Circle indicator — centered on the vertical line */}
                <div 
                  className={cn(
                    "absolute -left-[7px] w-[14px] h-[14px] rounded-full flex items-center justify-center transition-all duration-300 shrink-0",
                    isCompleted 
                      ? "bg-[#EDEDEA] border-2 border-[#EDEDEA]" 
                      : isActive 
                        ? "bg-surface border-2 border-[#EDEDEA]" 
                        : "bg-surface border-2 border-border"
                  )}
                >
                  {isCompleted && <Check className="w-2 h-2 text-[#080A0F] stroke-[3]" />}
                </div>
                
                <p className={cn(
                  "text-sm transition-colors duration-300 pl-6",
                  isCompleted ? "text-muted" : isActive ? "text-primary font-medium" : "text-faint"
                )}>
                  <DecryptedText text={step} speed={60} maxIterations={15} animateOn="hover" />
                </p>
              </motion.div>
            );
          })}
        </div>
        </div>
      </div>
    </BorderGlow>
  );
}
