"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Hero from "@/components/sections/Hero";
import StatsBar from "@/components/StatsBar";
import HowItWorks from "@/components/sections/HowItWorks";
import UploadZone from "@/components/sections/UploadZone";
import ResultsPanel from "@/components/sections/ResultsPanel";
import BatchUpload from "@/components/sections/BatchUpload";
import ProcessingTimeline from "@/components/sections/ProcessingTimeline";
import TrustBadge from "@/components/sections/TrustBadge";
import TechStack from "@/components/sections/TechStack";
import MetricsChart from "@/components/sections/MetricsChart";
import CTASection from "@/components/sections/CTASection";
import DecryptedText from "@/components/reactbits/DecryptedText";
import ShapeGrid from "@/components/reactbits/ShapeGrid";
import { detectMedia, getForensics, DetectionResponse, ForensicsData } from "@/lib/api";

const VerificationSection = ({
  onFileSelect,
  isProcessing,
  result,
  forensics,
  uploadedFile,
}: {
  onFileSelect: (file: File) => Promise<void>;
  isProcessing: boolean;
  result: DetectionResponse | null;
  forensics: ForensicsData;
  uploadedFile: File | null;
}) => {
  return (
    <section id="upload" className="relative w-full flex flex-col items-center overflow-hidden py-[140px] px-[48px]">
      {/* ShapeGrid Background */}
      <div className="absolute inset-0 z-0 opacity-25 pointer-events-none">
        <ShapeGrid
          shape="square"
          borderColor="#3A3F4E"
          hoverFillColor="#EDEDEA"
          speed={0.2}
          squareSize={40}
        />
      </div>

      <div className="relative z-10 w-full flex flex-col items-center">
        <div className="text-center mb-[60px]">
          <p className="text-[10px] text-muted uppercase tracking-[0.1em] mb-[20px]">
            <DecryptedText text="Detection" speed={60} maxIterations={15} animateOn="hover" />
          </p>
          <h2 className="text-4xl md:text-5xl text-primary">
            <DecryptedText text="Verify Your Media" speed={60} maxIterations={15} animateOn="hover" />
          </h2>
        </div>

        <UploadZone onFileSelect={onFileSelect} isProcessing={isProcessing} />

        {/* Trust Badge — below upload zone */}
        {!isProcessing && !result && <TrustBadge />}

        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full"
          >
            <ProcessingTimeline />
          </motion.div>
        )}

        <div id="results" className="w-full">
          {!isProcessing && result && <ResultsPanel result={result} forensics={forensics} uploadedFile={uploadedFile} />}
        </div>
      </div>
    </section>
  );
};

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<DetectionResponse | null>(null);
  const [forensics, setForensics] = useState<ForensicsData>({});
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"single" | "batch">("single");

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setResult(null);
    setForensics({});
    setUploadedFile(file);

    try {
      // Run detection and forensics generation in parallel
      const [response, forensicData] = await Promise.all([
        detectMedia(file),
        getForensics(file),
      ]);

      setResult(response);
      setForensics(forensicData);
    } catch (error) {
      console.error(error);
      setResult({
        media_type: "unknown",
        verdict: "ERROR",
        confidence: 0,
        details: { analysis: ["Processing failed. Please check the backend connection."] },
      });
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  return (
    <div className="flex flex-col w-full overflow-x-hidden relative">
      <Hero />
      <StatsBar />
      <HowItWorks />
      
      {/* Mode Switcher */}
      <div className="w-full flex justify-center pt-12 pb-4 bg-background z-20">
        <div className="inline-flex items-center p-1 bg-surface border border-border rounded-full">
          <button
            onClick={() => setMode("single")}
            className={`px-6 py-2 rounded-full text-sm font-medium tracking-wide transition-all ${
              mode === "single" ? "bg-[#EDEDEA] text-[#080A0F]" : "text-muted hover:text-primary"
            }`}
          >
            Single File Analysis
          </button>
          <button
            onClick={() => setMode("batch")}
            className={`px-6 py-2 rounded-full text-sm font-medium tracking-wide transition-all ${
              mode === "batch" ? "bg-[#EDEDEA] text-[#080A0F]" : "text-muted hover:text-primary"
            }`}
          >
            Batch Analysis
          </button>
        </div>
      </div>

      {mode === "single" ? (
        <VerificationSection
          onFileSelect={handleFileUpload}
          isProcessing={isProcessing}
          result={result}
          forensics={forensics}
          uploadedFile={uploadedFile}
        />
      ) : (
        <BatchUpload />
      )}
      
      <TechStack />
      <MetricsChart />
      <CTASection />
    </div>
  );
}
