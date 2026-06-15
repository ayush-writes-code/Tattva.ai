"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import UploadZone from "@/components/sections/UploadZone";
import ResultsPanel from "@/components/sections/ResultsPanel";
import BatchUpload from "@/components/sections/BatchUpload";
import ProcessingTimeline from "@/components/sections/ProcessingTimeline";
import TrustBadge from "@/components/sections/TrustBadge";
import DecryptedText from "@/components/reactbits/DecryptedText";
import ShapeGrid from "@/components/reactbits/ShapeGrid";
import { detectMedia, DetectionResponse, ForensicsData } from "@/lib/api";
import { createClient } from "@/utils/supabase/client";

const VerificationSection = React.memo(({
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
    <section id="upload" className="relative w-full flex flex-col items-center overflow-hidden py-16 md:py-[140px] px-6 md:px-[48px]">
      <div className="absolute inset-0 z-0 opacity-25 pointer-events-none">
        <ShapeGrid
          shape="square"
          borderColor="#3A3F4E"
          hoverFillColor="var(--primary)"
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
});

VerificationSection.displayName = "VerificationSection";

export default function ClientUploadSection() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<DetectionResponse | null>(null);
  const [forensics, setForensics] = useState<ForensicsData>({});
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"single" | "batch">("single");
  const router = useRouter();
  const supabase = createClient();

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    // Check auth first
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login?message=Please log in to use the deepfake scanner");
      return;
    }

    setIsProcessing(true);
    setResult(null);
    setForensics({});
    setUploadedFile(file);

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      const response = await detectMedia(file, abortControllerRef.current.signal);
      setResult(response);
      setForensics(response.forensics || {});
    } catch (error: any) {
      if (error.name === "CanceledError" || error.message?.includes("canceled")) {
        console.log("Request canceled");
        return;
      }
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
  }, []);

  return (
    <>
      <div className="w-full flex justify-center pt-12 pb-4 bg-background z-20">
        <div className="inline-flex items-center p-1 bg-surface border border-border rounded-full">
          <button
            onClick={() => setMode("single")}
            className={`px-6 py-2 rounded-full text-sm font-medium tracking-wide transition-all ${
              mode === "single" ? "bg-primary text-background" : "text-muted hover:text-primary"
            }`}
          >
            Single File Analysis
          </button>
          <button
            onClick={() => setMode("batch")}
            className={`px-6 py-2 rounded-full text-sm font-medium tracking-wide transition-all ${
              mode === "batch" ? "bg-primary text-background" : "text-muted hover:text-primary"
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
    </>
  );
}
