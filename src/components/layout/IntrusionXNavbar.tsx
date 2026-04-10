"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Home, Cpu, UploadCloud, Activity, Code2 } from "lucide-react";
import PillNav from "@/components/reactbits/PillNav";
import { AnimatedThemeToggler } from "@/components/ui/AnimatedThemeToggler";

// Dynamic import for WebGL logo to avoid SSR mismatch
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

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    
    // Hide navbar if scrolling down and past the very top
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  // Minimal logic to highlight exact routes hash matches during scrolling
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || "/";
      setActiveSegment(hash);
    };
    
    // Set initial
    handleHashChange();
    
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navItems = [
    {
      label: (
        <span className="flex items-center gap-2">
          <Home className="w-4 h-4" />
          <span className="hidden sm:inline">Home</span>
        </span>
      ),
      href: "/#home",
    },
    {
      label: (
        <span className="flex items-center gap-2">
          <Cpu className="w-4 h-4" />
          <span className="hidden sm:inline">How It Works</span>
        </span>
      ),
      href: "#how-it-works",
    },
    {
      label: (
        <span className="flex items-center gap-2">
          <UploadCloud className="w-4 h-4" />
          <span className="hidden sm:inline">Upload</span>
        </span>
      ),
      href: "#upload",
    },
    {
      label: (
        <span className="flex items-center gap-2">
          <Activity className="w-4 h-4" />
          <span className="hidden sm:inline">System Telemetry</span>
        </span>
      ),
      href: "#telemetry",
    },
    {
      label: (
        <span className="flex items-center gap-2">
          <Code2 className="w-4 h-4" />
          <span className="hidden sm:inline">GitHub Repo</span>
        </span>
      ),
      href: "https://github.com/ayushtomar",
    },
  ];

  return (
    <motion.div 
      variants={{
        visible: { y: 0, opacity: 1 },
        hidden: { y: "-150%", opacity: 0 }
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
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
        initialLoadAnimation={true}
        baseColor="var(--bg)" // The color of the hover explosion circle
        pillColor="var(--primary)" // Surface color of the unhovered pill
        pillTextColor="var(--surface)" // Text color of unhovered pill
        hoveredPillTextColor="var(--primary)" // Text color when hovered inside the white circle
      />
      <AnimatedThemeToggler className="w-11 h-11 shrink-0 rounded-full bg-[var(--primary)] border border-border/10 flex items-center justify-center transition-transform hover:scale-110 shadow-sm" />
    </motion.div>
  );
}
