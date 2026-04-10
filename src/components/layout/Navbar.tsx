"use client";

import { Code2 } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import DecryptedText from "@/components/reactbits/DecryptedText";

import PillNav from "@/components/reactbits/PillNav";

// Dynamic import to avoid SSR issues with WebGL
const MetallicPaint = dynamic(() => import("@/components/reactbits/MetallicPaint"), {
  ssr: false,
  loading: () => <div className="w-10 h-10 bg-surface border border-border rounded-xl" />
});

export default function Navbar() {
  const navItems = [
    { label: "Upload & Verify", href: "/" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Batch Analysis", href: "#batch-analysis" },
    { label: "Github Repo", href: "https://github.com" },
  ];

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] drop-shadow-xl">
      <PillNav
        logo={
          <div className="w-[42px] h-[42px] rounded-full overflow-hidden relative border border-border/50">
            <MetallicPaint
              imageSrc="/logo-shield.svg"
              lightColor="#EDEDEA"
              darkColor="#080A0F"
              tintColor="#4B5260"
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
        baseColor="#EDEDEA" // The color of the hover explosion circle
        pillColor="#0D1117" // Surface color of the unhovered pill
        pillTextColor="#EDEDEA" // Text color of unhovered pill
        hoveredPillTextColor="#080A0F" // Text color when hovered inside the white circle
      />
    </div>
  );
}
