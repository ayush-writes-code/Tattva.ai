"use client";

import { Shield } from "lucide-react";
import Link from "next/link";
import DecryptedText from "@/components/reactbits/DecryptedText";

export default function Footer() {
  return (
    <footer className="w-full border-t border-border bg-background">
      <div className="max-w-[1200px] w-full mx-auto px-6 md:px-[48px] py-16 md:py-[140px]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo.png" alt="Tattva.ai Logo" className="w-8 h-8 object-contain" />
              <span className="text-lg tracking-tight text-primary">
                <DecryptedText text="Tattva.ai" speed={60} maxIterations={15} animateOn="hover" />
              </span>
            </div>
            <p className="text-muted text-sm leading-relaxed max-w-sm">
              <DecryptedText text="AI-powered multi-modal deepfake detection system. Protecting digital realities through advanced forensic neural ensembles." speed={60} maxIterations={15} animateOn="hover" />
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-[10px] text-muted uppercase tracking-[0.1em] mb-[20px]">
              <DecryptedText text="Platform" speed={60} maxIterations={15} animateOn="hover" />
            </h4>
            <ul className="space-y-3">
              <li><Link href="#how-it-works" className="text-sm text-muted hover:text-primary transition-colors"><DecryptedText text="How It Works" speed={60} maxIterations={15} animateOn="hover" /></Link></li>
              <li><Link href="#upload" className="text-sm text-muted hover:text-primary transition-colors"><DecryptedText text="Detection" speed={60} maxIterations={15} animateOn="hover" /></Link></li>
              <li><a href={process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/docs` : "http://localhost:8000/docs"} target="_blank" rel="noopener noreferrer" className="text-sm text-muted hover:text-primary transition-colors"><DecryptedText text="API Docs" speed={60} maxIterations={15} animateOn="hover" /></a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-[10px] text-muted uppercase tracking-[0.1em] mb-[20px]">
              <DecryptedText text="Stack" speed={60} maxIterations={15} animateOn="hover" />
            </h4>
            <ul className="space-y-3">
              <li><span className="text-sm text-muted"><DecryptedText text="Vision Transformer" speed={60} maxIterations={15} animateOn="hover" /></span></li>
              <li><span className="text-sm text-muted"><DecryptedText text="Swin Transformer" speed={60} maxIterations={15} animateOn="hover" /></span></li>
              <li><span className="text-sm text-muted"><DecryptedText text="Wav2Vec2-XLSR" speed={60} maxIterations={15} animateOn="hover" /></span></li>
              <li><span className="text-sm text-muted"><DecryptedText text="ELA Forensics" speed={60} maxIterations={15} animateOn="hover" /></span></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-[40px] border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-faint text-xs">
            <DecryptedText text={`© ${new Date().getFullYear()} Tattva.ai. Built for digital integrity.`} speed={60} maxIterations={15} animateOn="hover" />
          </p>
          <div className="flex flex-wrap justify-center sm:justify-end gap-6">
            <Link href="/privacy" className="text-faint text-xs hover:text-muted transition-colors">
              <DecryptedText text="Privacy Policy" speed={60} maxIterations={15} animateOn="hover" />
            </Link>
            <Link href="/terms" className="text-faint text-xs hover:text-muted transition-colors">
              <DecryptedText text="Terms of Service" speed={60} maxIterations={15} animateOn="hover" />
            </Link>
            <a href="https://github.com/ayushtomar/TattvaAI" target="_blank" rel="noopener noreferrer" className="text-faint text-xs hover:text-muted transition-colors">
              <DecryptedText text="GitHub" speed={60} maxIterations={15} animateOn="hover" />
            </a>
            <span className="text-faint text-xs">
              <DecryptedText text="v3.0.0" speed={60} maxIterations={15} animateOn="hover" />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
