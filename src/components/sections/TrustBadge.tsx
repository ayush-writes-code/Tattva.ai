"use client";

import { motion } from "framer-motion";
import { Shield, Lock, Trash2, Brain } from "lucide-react";
import DecryptedText from "@/components/reactbits/DecryptedText";
import BorderGlow from "@/components/reactbits/BorderGlow";

const BADGES = [
  {
    icon: Shield,
    label: "Privacy First",
    description: "Your files are processed securely and never stored permanently.",
  },
  {
    icon: Lock,
    label: "Secure Processing",
    description: "End-to-end encrypted pipeline with isolated analysis containers.",
  },
  {
    icon: Trash2,
    label: "No Data Storage",
    description: "All uploaded files are automatically purged after analysis.",
  },
  {
    icon: Brain,
    label: "Trusted AI",
    description: "Powered by peer-reviewed, open-source detection models.",
  },
];

export default function TrustBadge() {
  return (
    <div className="w-full max-w-[900px] mx-auto mt-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {BADGES.map((badge, idx) => {
          const Icon = badge.icon;
          return (
            <BorderGlow
              key={idx}
              className="h-full"
              animated={true}
              glowColor="186 100% 74%"
              backgroundColor="#080A0F"
              borderRadius={0}
              glowRadius={30}
              glowIntensity={0.6}
              coneSpread={15}
            >
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * idx, duration: 0.4 }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="group relative flex flex-col items-center text-center p-5 border border-border/50 overflow-hidden h-full"
                style={{
                  background: "rgba(13, 17, 23, 0.6)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                }}
              >
                {/* Subtle glow on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: "radial-gradient(circle at center, rgba(237,237,234,0.03) 0%, transparent 70%)",
                  }}
                />

                <div className="w-10 h-10 border border-border bg-background flex items-center justify-center mb-3 relative z-10">
                  <Icon className="w-4.5 h-4.5 text-muted group-hover:text-primary transition-colors duration-300" />
                </div>

                <h4 className="text-xs font-medium text-primary mb-1.5 relative z-10">
                  <DecryptedText text={badge.label} speed={60} maxIterations={12} animateOn="hover" />
                </h4>

                <p className="text-[10px] text-faint leading-relaxed relative z-10">
                  {badge.description}
                </p>
              </motion.div>
            </BorderGlow>
          );
        })}
      </div>
    </div>
  );
}
