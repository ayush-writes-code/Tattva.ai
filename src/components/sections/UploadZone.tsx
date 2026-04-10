"use client";

import { useCallback, useState, useRef } from "react";
import { motion } from "framer-motion";
import { UploadCloud, FileVideo, Image as ImageIcon, Waves } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import DecryptedText from "@/components/reactbits/DecryptedText";
import MagicRings from "@/components/reactbits/MagicRings";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

export default function UploadZone({ onFileSelect, isProcessing }: UploadZoneProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  useScrollAnimation(containerRef);

  const validateAndSelect = (file: File) => {
    setErrorMsg(null);
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      setErrorMsg("Payload exceeds maximum capacity (100MB)");
      return;
    }
    onFileSelect(file);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsHovered(false);
    if (isProcessing) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  }, [isProcessing]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isProcessing) return;
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelect(e.target.files[0]);
    }
  };

  return (
    <div ref={containerRef} className="w-full max-w-[1200px] mx-auto px-[48px] relative group" style={{ visibility: "hidden" }}>
      <div 
        className={cn(
          "w-full rounded-none bg-surface/50 border border-border transition-all duration-300 relative z-10 overflow-hidden",
          isHovered ? "border-[#7AFAFA]/50 shadow-[0_0_30px_rgba(122,250,250,0.1)]" : "hover:border-muted",
          isProcessing && "opacity-50 pointer-events-none"
        )}
        onDragOver={(e) => { e.preventDefault(); setIsHovered(true); }}
        onDragLeave={() => setIsHovered(false)}
        onDrop={onDrop}
      >
        <div className="absolute inset-0 z-0 pointer-events-none opacity-50">
          <MagicRings 
            color="#2A3143"
            colorTwo="#7AFAFA"
            baseRadius={1}
            radiusStep={0.2}
            opacity={0.8}
            followMouse={true}
          />
        </div>
        <label className="flex flex-col items-center justify-center p-[40px] cursor-pointer relative z-20 h-full w-full">
          <input type="file" className="hidden" onChange={onChange} disabled={isProcessing} />
          
          <div className="mb-6 p-4 border border-border rounded-none bg-background group-hover:bg-surface transition-colors">
            <UploadCloud className={cn("w-8 h-8 transition-colors", isHovered ? "text-primary" : "text-muted")} />
          </div>
          
          <h3 className="text-2xl text-primary tracking-tight mb-2">
            <DecryptedText text="Drop Media to Verify" speed={60} maxIterations={15} animateOn="hover" />
          </h3>
          <p className="text-muted text-sm mb-6 text-center max-w-sm">
            <DecryptedText text="Support for Images (JPG, PNG), Video (MP4, MOV), and Audio (MP3, WAV) up to 100MB." speed={60} maxIterations={15} animateOn="hover" />
          </p>
          
          <div className="flex gap-4 mb-8">
            <div className="p-2 border border-border bg-background"><ImageIcon className="w-4 h-4 text-faint" /></div>
            <div className="p-2 border border-border bg-background"><FileVideo className="w-4 h-4 text-faint" /></div>
            <div className="p-2 border border-border bg-background"><Waves className="w-4 h-4 text-faint" /></div>
          </div>
          
          <div className="px-6 py-2 border border-border bg-surface hover:bg-background text-sm transition-colors text-primary">
            <DecryptedText text="Browse Files" speed={60} maxIterations={12} animateOn="hover" />
          </div>
        </label>
      </div>

      {errorMsg && (
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-primary text-sm text-center mt-4"
        >
          {errorMsg}
        </motion.p>
      )}
    </div>
  );
}
