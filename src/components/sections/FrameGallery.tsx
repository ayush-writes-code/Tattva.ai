"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Film, Eye, EyeOff, AlertTriangle, XCircle } from "lucide-react";
import DecryptedText from "@/components/reactbits/DecryptedText";
import BorderGlow from "@/components/reactbits/BorderGlow";

interface SuspiciousFrame {
  frame_index: number;
  timestamp: number;
  confidence: number;
  verdict: string;
  image: string;
  heatmap: string | null;
}

interface FrameGalleryProps {
  frames: SuspiciousFrame[];
}

const VERDICT_COLORS: Record<string, string> = {
  DEEPFAKE: "#ef4444",
  SUSPICIOUS: "#eab308",
  AUTHENTIC: "#22c55e",
};

export default function FrameGallery({ frames }: FrameGalleryProps) {
  const [selectedFrame, setSelectedFrame] = useState<SuspiciousFrame | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);

  if (!frames || frames.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative h-full"
    >
      <BorderGlow
        animated={true}
        glowColor="186 100% 74%"
        backgroundColor="#080A0F"
        borderRadius={0}
        glowRadius={30}
        glowIntensity={0.6}
        coneSpread={15}
        className="w-full h-full"
      >
        <div className="border border-border bg-surface overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center gap-3">
        <div className="w-8 h-8 border border-border bg-background flex items-center justify-center shrink-0">
          <Film className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h4 className="text-sm text-primary font-medium">
            <DecryptedText text="Suspicious Frame Gallery" speed={60} maxIterations={15} animateOn="hover" />
          </h4>
          <p className="text-[10px] text-muted uppercase tracking-[0.1em]">
            {frames.length} frame{frames.length !== 1 ? "s" : ""} flagged for review
          </p>
        </div>
      </div>

      {/* Thumbnail Grid */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {frames.map((frame, idx) => {
          const color = VERDICT_COLORS[frame.verdict] || "#4B5260";
          const isSelected = selectedFrame?.frame_index === frame.frame_index;

          return (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setSelectedFrame(frame);
                setShowHeatmap(false);
              }}
              className={`relative border-2 overflow-hidden transition-all ${
                isSelected ? "ring-2 ring-offset-2 ring-offset-background" : ""
              }`}
              style={{ borderColor: color, ...(isSelected ? { ringColor: color } : {}) }}
            >
              <img
                src={frame.image}
                alt={`Frame #${frame.frame_index}`}
                className="w-full aspect-video object-cover"
              />

              {/* Frame overlay badge */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-white font-mono">
                    #{frame.frame_index} • {frame.timestamp.toFixed(1)}s
                  </span>
                  <span
                    className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: color + "22", color }}
                  >
                    {frame.confidence.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Verdict icon */}
              <div className="absolute top-2 right-2">
                {frame.verdict === "DEEPFAKE" && <XCircle className="w-4 h-4" style={{ color }} />}
                {frame.verdict === "SUSPICIOUS" && <AlertTriangle className="w-4 h-4" style={{ color }} />}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Expanded Frame View */}
      {selectedFrame && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="border-t border-border p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted font-mono">
                Frame #{selectedFrame.frame_index} at {selectedFrame.timestamp.toFixed(1)}s
              </span>
              <span
                className="text-xs font-mono font-medium px-2 py-0.5"
                style={{
                  color: VERDICT_COLORS[selectedFrame.verdict] || "#4B5260",
                  borderColor: VERDICT_COLORS[selectedFrame.verdict] || "#4B5260",
                  border: "1px solid",
                }}
              >
                {selectedFrame.verdict} • {selectedFrame.confidence.toFixed(1)}%
              </span>
            </div>

            {selectedFrame.heatmap && (
              <button
                onClick={() => setShowHeatmap(!showHeatmap)}
                className="flex items-center gap-2 text-xs text-muted hover:text-primary transition-colors border border-border px-3 py-1.5"
              >
                {showHeatmap ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Hide Heatmap</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Show Heatmap</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="relative max-w-[600px] mx-auto border border-border overflow-hidden">
            <img
              src={showHeatmap && selectedFrame.heatmap ? selectedFrame.heatmap : selectedFrame.image}
              alt={`Frame #${selectedFrame.frame_index} ${showHeatmap ? "Heatmap" : "Original"}`}
              className="w-full h-auto block"
            />
            <div className="absolute top-2 left-2 text-[9px] font-mono text-white bg-black/60 px-2 py-1">
              {showHeatmap ? "ELA HEATMAP" : "ORIGINAL"}
            </div>
          </div>
        </motion.div>
      )}
        </div>
      </BorderGlow>
    </motion.div>
  );
}
