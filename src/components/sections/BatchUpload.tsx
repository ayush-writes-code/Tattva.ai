"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, CheckCircle2, AlertTriangle, XCircle, FileWarning, Layers, Clock, Activity, RefreshCw } from "lucide-react";
import DecryptedText from "@/components/reactbits/DecryptedText";
import BorderGlow from "@/components/reactbits/BorderGlow";
import { detectBatch, BatchResponse, BatchResultItem } from "@/lib/api";

const VERDICT_COLORS: Record<string, string> = {
  AUTHENTIC: "#22c55e",
  SUSPICIOUS: "#eab308",
  DEEPFAKE: "#ef4444",
  ERROR: "#888888",
};

export default function BatchUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<BatchResponse | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setFiles((prev) => [...prev, ...droppedFiles]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const processBatch = async () => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    setError(null);
    setResults(null);

    try {
      const data = await detectBatch(files);
      setResults(data);
    } catch (err: any) {
      setError(err.message || "Batch processing failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setFiles([]);
    setResults(null);
    setError(null);
  };

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case "AUTHENTIC": return <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />;
      case "SUSPICIOUS": return <AlertTriangle className="w-4 h-4 text-[#eab308]" />;
      case "DEEPFAKE": return <XCircle className="w-4 h-4 text-[#ef4444]" />;
      default: return <FileWarning className="w-4 h-4 text-muted" />;
    }
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto my-[60px] px-6">
      
      {!results ? (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-medium text-primary mb-2">
              <DecryptedText text="Batch Media Analysis" speed={60} maxIterations={15} animateOn="hover" />
            </h2>
            <p className="text-muted">Upload multiple image, video, or audio files for parallel forensic analysis.</p>
          </div>

          <div
            className={`border border-dashed transition-colors duration-200 bg-surface/50 p-12 text-center relative
              ${dragActive ? "border-primary bg-surface" : "border-border hover:border-muted"}
              ${isProcessing ? "opacity-50 pointer-events-none" : "cursor-pointer"}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !isProcessing && document.getElementById("batch-upload")?.click()}
          >
            <input
              id="batch-upload"
              type="file"
              multiple
              className="hidden"
              onChange={handleFileInput}
              accept="image/*,video/*,audio/*"
            />
            
            <UploadCloud className="w-12 h-12 text-muted mx-auto mb-4" />
            <h3 className="text-lg text-primary mb-2">Drag and drop multiple files</h3>
            <p className="text-sm text-muted">or click to browse from your device</p>
          </div>

          <AnimatePresence>
            {files.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <div className="bg-surface border border-border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm uppercase tracking-widest text-muted">Selected Files ({files.length})</h4>
                    <button onClick={reset} disabled={isProcessing} className="text-xs text-muted hover:text-primary transition-colors disabled:opacity-50">
                      Clear All
                    </button>
                  </div>
                  
                  <div className="max-h-[300px] overflow-y-auto space-y-2 mb-6 pointer-events-auto">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-background border border-border">
                        <span className="text-sm font-mono truncate text-primary/80 mr-4">{f.name}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-muted">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                            disabled={isProcessing}
                            className="text-muted hover:text-[#ef4444] transition-colors disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {error && (
                    <div className="mb-6 p-4 border border-[#ef4444]/30 bg-[#ef4444]/10 text-[#ef4444] text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={(e) => { e.stopPropagation(); processBatch(); }}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#EDEDEA] text-[#080A0F] text-sm font-medium uppercase tracking-[0.1em] hover:bg-white transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Processing Batch...</span>
                      </>
                    ) : (
                      <>
                        <Layers className="w-4 h-4" />
                        <span>Run Batch Analysis</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-medium text-primary">Batch Analysis Results</h2>
            <button onClick={reset} className="text-xs uppercase tracking-widest text-muted hover:text-primary transition-colors inline-flex items-center gap-2 border border-border px-4 py-2 hover:bg-surface">
              <RefreshCw className="w-3 h-3" /> New Batch
            </button>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Files", val: results.summary.total_files, icon: Layers },
              { label: "Deepfakes Found", val: results.summary.deepfakes_detected, icon: AlertTriangle, color: "#ef4444" },
              { label: "Avg Confidence", val: `${results.summary.average_confidence}%`, icon: Activity },
              { label: "Process Time", val: `${results.summary.total_processing_time}s`, icon: Clock },
            ].map((m, i) => (
              <BorderGlow
                key={i}
                className="h-full"
                animated={true}
                glowColor="186 100% 74%"
                backgroundColor="#080A0F"
                borderRadius={0}
                glowRadius={30}
                glowIntensity={0.6}
                coneSpread={15}
              >
                <div className="h-full bg-surface border border-border p-6 flex flex-col items-center justify-center text-center">
                  <m.icon className="w-6 h-6 mb-3" style={{ color: m.color || "#4B5260" }} />
                  <div className="text-3xl font-medium mb-1" style={{ color: m.color || "#EDEDEA" }}>{m.val}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted">{m.label}</div>
                </div>
              </BorderGlow>
            ))}
          </div>

          {/* Results Table */}
          <div className="bg-surface border border-border overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background border-b border-border">
                  <th className="p-4 text-xs tracking-widest text-muted uppercase font-normal w-1/3">Filename</th>
                  <th className="p-4 text-xs tracking-widest text-muted uppercase font-normal">Type</th>
                  <th className="p-4 text-xs tracking-widest text-muted uppercase font-normal">Verdict</th>
                  <th className="p-4 text-xs tracking-widest text-muted uppercase font-normal text-right">Confidence</th>
                  <th className="p-4 text-xs tracking-widest text-muted uppercase font-normal text-right">Trust Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono text-sm">
                {results.results.map((item: BatchResultItem, idx: number) => (
                  <tr key={idx} className="hover:bg-background/50 transition-colors">
                    <td className="p-4 truncate max-w-[200px] text-primary/80" title={item.file_name}>{item.file_name}</td>
                    <td className="p-4 text-muted capitalize">{item.media_type}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getVerdictIcon(item.verdict)}
                        <span style={{ color: VERDICT_COLORS[item.verdict] || VERDICT_COLORS.ERROR }}>{item.verdict}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right text-muted">{item.confidence.toFixed(1)}%</td>
                    <td className="p-4 text-right">
                      <span className={item.authenticity_score > 60 ? "text-[#22c55e]" : item.authenticity_score < 30 ? "text-[#ef4444]" : "text-[#eab308]"}>
                        {item.authenticity_score.toFixed(1)}/100
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
