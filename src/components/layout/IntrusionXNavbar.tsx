"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion, useScroll, useMotionValueEvent, useReducedMotion } from "framer-motion";
import { Home, Cpu, UploadCloud, Activity, Code2 } from "lucide-react";
import PillNav from "@/components/reactbits/PillNav";
import { AnimatedThemeToggler } from "@/components/ui/AnimatedThemeToggler";
import UserMenu from "@/components/layout/UserMenu";

// Dynamic import for WebGL logo
const MetallicPaint = dynamic(
  () => import("@/components/reactbits/MetallicPaint"),
  {
    ssr: false,
    loading: () => (
      <div className="w-10 h-10 bg-surface border border-border rounded-xl" />
    ),
  }
);

export default function IntrusionXNavbar() {
  const [activeSegment, setActiveSegment] = useState("/");
  const [hidden, setHidden] = useState(false);
  const { scrollY } = useScroll();
  const shouldReduceMotion = useReducedMotion();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || "/";
      setActiveSegment(hash);
    };
    
    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navItems = [
    { label: <span className="flex items-center gap-2"><Home className="w-4 h-4" /><span className="hidden sm:inline">Home</span></span>, href: "/#home" },
    { label: <span className="flex items-center gap-2"><Cpu className="w-4 h-4" /><span className="hidden sm:inline">How It Works</span></span>, href: "#how-it-works" },
    { label: <span className="flex items-center gap-2"><UploadCloud className="w-4 h-4" /><span className="hidden sm:inline">Upload</span></span>, href: "#upload" },
    { label: <span className="flex items-center gap-2"><Activity className="w-4 h-4" /><span className="hidden sm:inline">System Telemetry</span></span>, href: "#telemetry" },
    { label: <span className="flex items-center gap-2"><Code2 className="w-4 h-4" /><span className="hidden sm:inline">GitHub Repo</span></span>, href: "https://github.com/ayushtomar/TattvaAI" },
  ];

  return (
    <motion.nav 
      aria-label="Main navigation"
      variants={{
        visible: { y: 0, opacity: 1 },
        hidden: { y: "-150%", opacity: 0 }
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: shouldReduceMotion ? 0 : 0.35, ease: "easeInOut" }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] drop-shadow-xl flex items-center gap-4"
    >
      <PillNav
        logo={
          <div className="w-[34px] h-[34px] rounded-full overflow-hidden relative border border-border/50 shadow-sm transition-colors duration-300">
            <MetallicPaint
              imageSrc="/logo-shield.svg"
              lightColor="var(--primary)"
              darkColor="var(--bg)"
              tintColor="var(--muted)"
              speed={0.2}
              scale={3}
              brightness={1.8}
              contrast={0.6}
              liquid={0.6}
              blur={0.01}
              refraction={0.015}
              fresnel={1.2}
              mouseAnimation={true}
            />
          </div>
        }
        items={navItems}
        activeHref={activeSegment}
        initialLoadAnimation={!shouldReduceMotion}

        baseColor="var(--surface)"
        pillColor="var(--surface)"
        pillTextColor="var(--primary)"
        hoveredPillTextColor="var(--surface)"
        hoverColor="var(--primary)"
        activePillColor="var(--primary)"
        activeTextColor="var(--surface)"
      />

      <UserMenu />
      <AnimatedThemeToggler 
        className="w-11 h-11 shrink-0 rounded-full bg-surface border border-border flex items-center justify-center transition-all hover:scale-110 shadow-sm" 
      />
    </motion.nav>
  );
}