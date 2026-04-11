"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { DetectionResponse, ForensicsData, generateReport, getReportDownloadUrl } from "@/lib/api";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";
import { CheckCircle2, AlertTriangle, XCircle, FileText, BadgeInfo, Scan, AudioLines, Waves, BarChart3, Play, Download, Loader2 } from "lucide-react";
import DecryptedText from "@/components/reactbits/DecryptedText";
import BorderGlow from "@/components/reactbits/BorderGlow";
import FrameGallery from "@/components/sections/FrameGallery";
import VideoInsights from "@/components/sections/VideoInsights";

const VERDICT_COLORS: Record<string, string> = {
  AUTHENTIC: "#22c55e",
  SUSPICIOUS: "#eab308",
  DEEPFAKE: "#ef4444",
  ERROR: "#4B5260",
};

const RING_BG = "#1A1F2E";

interface ResultsPanelProps {
  result: DetectionResponse;
  forensics?: ForensicsData;
  uploadedFile?: File | null;
}

/* ── Forensic Image Card ────────────────────────────────── */
const ForensicCard = ({
  title,
  description,
  imageSrc,
  icon: Icon,
}: {
  title: string;
  description: string;
  imageSrc: string;
  icon: React.ElementType;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
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
        <div className="border border-border bg-surface overflow-hidden h-full">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <div className="w-8 h-8 border border-border bg-background flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h4 className="text-sm text-primary font-medium">
                <DecryptedText text={title} speed={60} maxIterations={15} animateOn="hover" />
              </h4>
              <p className="text-[10px] text-muted uppercase tracking-[0.1em]">{description}</p>
            </div>
          </div>
          <div className="relative w-full overflow-hidden bg-background">
            <img src={imageSrc} alt={title} className="w-full h-auto block" />
          </div>
        </div>
      </BorderGlow>
    </motion.div>
  );
};

/* ── Temporal Confidence Chart (Video) ──────────────────── */
const TemporalChart = ({ timeline }: { timeline: { frame: number; timestamp: number; confidence: number; verdict: string }[] }) => {
  if (!timeline || timeline.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative h-64"
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
        <div className="border border-border bg-surface overflow-hidden h-full">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <div className="w-8 h-8 border border-border bg-background flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h4 className="text-sm text-primary font-medium">
                <DecryptedText text="Temporal Confidence Graph" speed={60} maxIterations={15} animateOn="hover" />
              </h4>
              <p className="text-[10px] text-muted uppercase tracking-[0.1em]">
                Per-frame manipulation score over video timeline
              </p>
            </div>
          </div>
          <div className="p-4 h-[calc(100%-80px)]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A1F2E" />
                <XAxis
                  dataKey="timestamp"
                  stroke="#4B5260"
                  fontSize={10}
                  tickFormatter={(v) => `${v}s`}
                  label={{ value: "Time (s)", position: "insideBottomRight", offset: -5, fill: "#4B5260", fontSize: 10 }}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="#4B5260"
                  fontSize={10}
                  label={{ value: "Fakeness %", angle: -90, position: "insideLeft", fill: "#4B5260", fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0D1117", border: "1px solid #1A1F2E", color: "#EDEDEA", fontSize: 12 }}
                  itemStyle={{ color: "#EDEDEA" }}
                  labelFormatter={(v) => `${v}s`}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, "Manipulation"]}
                />
                <ReferenceLine y={50} stroke="#ef4444" strokeDasharray="5 5" strokeWidth={1} label={{ value: "Threshold", fill: "#4B5260", fontSize: 9 }} />
                <Line
                  type="monotone"
                  dataKey="confidence"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    const color = payload.verdict === "DEEPFAKE" ? "#ef4444" : payload.verdict === "SUSPICIOUS" ? "#eab308" : "#22c55e";
                    return <circle cx={cx} cy={cy} r={4} fill={color} stroke={color} />;
                  }}
                  activeDot={{ r: 6, fill: "#ef4444" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </BorderGlow>
    </motion.div>
  );
};

/* ── Annotated Video Player ─────────────────────────────── */
const AnnotatedVideoPlayer = ({ videoSrc }: { videoSrc: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
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
        <div className="border border-border bg-surface overflow-hidden h-full">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <div className="w-8 h-8 border border-border bg-background flex items-center justify-center shrink-0">
              <Play className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h4 className="text-sm text-primary font-medium">
                <DecryptedText text="Annotated Detection Video" speed={60} maxIterations={15} animateOn="hover" />
              </h4>
              <p className="text-[10px] text-muted uppercase tracking-[0.1em]">
                Video with real-time verdict overlays and confidence bars
              </p>
            </div>
          </div>
          <div className="relative bg-background">
            <video
              src={videoSrc}
              controls
              className="w-full h-auto max-h-[500px] block"
              playsInline
            />
          </div>
        </div>
      </BorderGlow>
    </motion.div>
  );
};

/* ── EXIF Integrity Card ───────────────────────────────── */
const ExifIntegrityCard = ({ metadata, fileInfo }: { metadata: any; fileInfo: any }) => {
  const fields: { label: string; value: string; status: "ok" | "warn" | "error" }[] = [];

  if (fileInfo?.content_type) {
    fields.push({ label: "Content-Type", value: fileInfo.content_type, status: "ok" });
  }
  if (fileInfo?.size_bytes) {
    fields.push({ label: "File Size", value: `${(fileInfo.size_bytes / 1024 / 1024).toFixed(2)} MB`, status: "ok" });
  }
  if (metadata) {
    if (metadata.risk_score !== undefined) {
      const risk = metadata.risk_score;
      fields.push({ label: "Metadata Risk Score", value: `${risk}/100`, status: risk > 40 ? "error" : risk > 15 ? "warn" : "ok" });
    }
    
    if (metadata.has_exif !== undefined) {
      fields.push({ label: "EXIF Structure", value: metadata.has_exif ? "PRESENT" : "MISSING/STRIPPED", status: metadata.has_exif ? "ok" : "warn" });
    }

    if (metadata.ai_indicators && metadata.ai_indicators.length > 0) {
      metadata.ai_indicators.forEach((indicator: string) => {
        fields.push({ label: "⚠ AI Indicator", value: indicator, status: "error" });
      });
    }

    if (metadata.details && metadata.details.length > 0) {
      metadata.details.forEach((detail: string) => {
        // Skip some details if they are just repeating what we already have
        if (detail.includes("Found") && detail.includes("metadata fields")) return;
        
        fields.push({ 
          label: "Insight", 
          value: detail.replace("🚨", "").replace("📋", "").replace("📌", "").trim(), 
          status: detail.includes("🚨") || detail.includes("suspicious") || detail.includes("AI") ? "error" : "warn" 
        });
      });
    }
  }

  if (fields.length === 0) return null;

  const statusColors = { ok: "#4B5260", warn: "#eab308", error: "#ef4444" };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative h-full">
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
        <div className="border border-border bg-surface overflow-hidden h-full">
      <div className="p-4 border-b border-border flex items-center gap-3">
        <div className="w-8 h-8 border border-border bg-background flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h4 className="text-sm text-primary font-medium">
            <DecryptedText text="EXIF Forensic Integrity" speed={60} maxIterations={15} animateOn="hover" />
          </h4>
          <p className="text-[10px] text-muted uppercase tracking-[0.1em]">File structure & metadata consistency</p>
        </div>
      </div>
      <div className="p-4 space-y-0">
        {fields.map((field, idx) => (
          <div key={idx} className="flex items-center justify-between py-3 border-b border-border last:border-b-0 font-mono text-xs">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColors[field.status] }} />
              <span className="text-muted">{field.label}</span>
            </div>
            <span style={{ color: field.status !== "ok" ? statusColors[field.status] : "#EDEDEA" }}>{field.value}</span>
          </div>
        ))}
        </div>
      </div>
    </BorderGlow>
  </motion.div>
  );
};

/* ── Main Results Panel ────────────────────────────────── */
export default function ResultsPanel({ result, forensics = {}, uploadedFile }: ResultsPanelProps) {
  const isError = result.verdict === "ERROR";
  const verdictColor = VERDICT_COLORS[result.verdict] || VERDICT_COLORS.ERROR;
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const chartData = [
    { name: "Confidence", value: result.confidence },
    { name: "Remaining", value: 100 - result.confidence },
  ];

  const hasForensicImages = forensics?.heatmap || forensics?.noisemap || forensics?.spectrogram || forensics?.waveform;
  const hasSuspiciousFrames = forensics?.suspicious_frames && forensics.suspicious_frames.length > 0;
  const hasTimeline = forensics?.frame_confidence_timeline && forensics.frame_confidence_timeline.length > 0;
  const hasAnnotatedVideo = !!forensics?.annotated_video;
  const hasAiInsights = result.details?.ai_insights && result.details.ai_insights.ai_insights?.length > 0;
  const hasMetadata = result.details?.metadata || result.file_info;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[1200px] mx-auto my-[60px]">
      {/* ── Verdict Header ── */}
      <div className="bg-surface border border-border overflow-hidden relative mb-6">
        <div className="p-[40px] lg:flex lg:gap-12">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-background border border-border mb-6 text-[10px] uppercase tracking-[0.1em] text-muted">
              <FileText className="w-3.5 h-3.5 text-muted" />
              <span>{result.media_type.toUpperCase()} ANALYSIS</span>
            </div>

            <div className="mb-8">
              <div className="flex items-center gap-4 mb-[20px]">
                {result.verdict === "AUTHENTIC" && <CheckCircle2 className="w-10 h-10" style={{ color: verdictColor }} />}
                {result.verdict === "SUSPICIOUS" && <AlertTriangle className="w-10 h-10" style={{ color: verdictColor }} />}
                {result.verdict === "DEEPFAKE" && <XCircle className="w-10 h-10" style={{ color: verdictColor }} />}
                {isError && <AlertTriangle className="w-10 h-10" style={{ color: verdictColor }} />}
                <h2 className="text-4xl md:text-5xl capitalize" style={{ color: verdictColor }}>
                  {result.verdict.toLowerCase()}
                </h2>
              </div>
              <p className="text-muted max-w-md">
                Target file &quot;{result.file_info?.filename}&quot; successfully verified through neural analysis protocols.
              </p>

              {/* Download Report Button */}
              {uploadedFile && (
                <button
                  onClick={async () => {
                    if (isGeneratingReport) return;
                    setIsGeneratingReport(true);
                    try {
                      const report = await generateReport(uploadedFile);
                      const url = getReportDownloadUrl(report.download_url);
                      window.open(url, "_blank");
                    } catch (err) {
                      console.error("Report generation failed:", err);
                    } finally {
                      setIsGeneratingReport(false);
                    }
                  }}
                  disabled={isGeneratingReport}
                  className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 border border-[#EDEDEA] text-[#EDEDEA] text-xs font-medium uppercase tracking-[0.08em] hover:bg-[#EDEDEA] hover:text-[#080A0F] transition-colors disabled:opacity-50 disabled:cursor-wait"
                >
                  {isGeneratingReport ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating Report...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <DecryptedText text="Download Forensic Report" speed={60} maxIterations={12} animateOn="hover" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Confidence Ring */}
          <div className="w-full lg:w-64 h-64 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} startAngle={90} endAngle={-270} dataKey="value" stroke="none" animationDuration={1500}>
                  <Cell key="cell-0" fill={verdictColor} />
                  <Cell key="cell-1" fill={RING_BG} />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <div className="text-3xl font-medium" style={{ color: verdictColor }}>
                {result.confidence.toFixed(1)}%
              </div>
              <div className="text-[10px] uppercase tracking-[0.1em] text-muted mt-2">
                <DecryptedText text="Confidence" speed={60} maxIterations={15} animateOn="hover" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── AI Insights Panel ── */}
      {hasAiInsights && (
        <div className="mb-6">
          <VideoInsights insights={result.details.ai_insights!} />
        </div>
      )}

      {/* ── Forensic Visualizations Grid ── */}
      {(hasForensicImages || hasTimeline || hasSuspiciousFrames || hasAnnotatedVideo) && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Scan className="w-4 h-4 text-muted" />
            <h3 className="text-[10px] text-muted uppercase tracking-[0.1em]">
              <DecryptedText text="Forensic Visualizations" speed={60} maxIterations={15} animateOn="hover" />
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image forensics */}
            {forensics?.heatmap && <ForensicCard title="ELA Heatmap" description="Error level analysis — red = potential manipulation" imageSrc={forensics.heatmap} icon={Scan} />}
            {forensics?.noisemap && <ForensicCard title="Noise Variance Map" description="Sensor noise consistency — bright = anomalous" imageSrc={forensics.noisemap} icon={Scan} />}

            {/* Audio forensics */}
            {forensics?.spectrogram && <ForensicCard title="Mel-Spectrogram" description="Frequency content — check for comb artifacts" imageSrc={forensics.spectrogram} icon={AudioLines} />}
            {forensics?.waveform && <ForensicCard title="Audio Waveform" description="Amplitude — check for unnatural consistency" imageSrc={forensics.waveform} icon={Waves} />}

            {/* Video: temporal chart spans full width */}
            {hasTimeline && (
              <div className="md:col-span-2">
                <TemporalChart timeline={forensics.frame_confidence_timeline!} />
              </div>
            )}

            {/* Annotated video spans full width */}
            {hasAnnotatedVideo && (
              <div className="md:col-span-2">
                <AnnotatedVideoPlayer videoSrc={forensics.annotated_video!} />
              </div>
            )}

            {/* Frame gallery spans full width */}
            {hasSuspiciousFrames && (
              <div className="md:col-span-2">
                <FrameGallery frames={forensics.suspicious_frames!} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── EXIF & Metadata Integrity ── */}
      {hasMetadata && (
        <div className="mb-6">
          <ExifIntegrityCard metadata={result.details?.metadata} fileInfo={result.file_info} />
        </div>
      )}

      {/* ── Detection Telemetry ── */}
      <div className="bg-background border border-border p-[40px]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="text-[10px] text-muted uppercase tracking-[0.1em] mb-[20px]">
              <DecryptedText text="Detection Telemetry" speed={60} maxIterations={15} animateOn="hover" />
            </h4>
            <ul className="space-y-3">
              {result.details?.analysis?.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-primary">
                  <BadgeInfo className="w-4 h-4 text-muted shrink-0 mt-0.5" />
                  <span dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<span class="text-primary font-medium">$1</span>') }} />
                </li>
              ))}
            </ul>
          </div>
          {result.details?.metadata && (
            <div>
              <h4 className="text-[10px] text-muted uppercase tracking-[0.1em] mb-[20px]">
                <DecryptedText text="Media Metadata" speed={60} maxIterations={15} animateOn="hover" />
              </h4>
              <div className="space-y-2 bg-surface p-4 border border-border text-xs font-mono text-muted">
                <div className="flex justify-between border-b border-border pb-2 mb-2">
                  <span className="text-muted">Content Type</span>
                  <span className="text-primary">{result.file_info?.content_type || result.media_type}</span>
                </div>
                {result.file_info?.size_bytes && (
                  <div className="flex justify-between border-b border-border pb-2 mb-2">
                    <span className="text-muted">File Payload</span>
                    <span className="text-primary">{(result.file_info.size_bytes / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                )}
                {result.details.metadata.ai_indicators && (
                  <div className="flex justify-between">
                    <span className="text-muted">Hidden Signatures</span>
                    <span className="text-primary">{result.details.metadata.ai_indicators.length > 0 ? "DETECTED" : "CLEAR"}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
