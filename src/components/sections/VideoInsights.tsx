"use client";

import { motion } from "framer-motion";
import { Brain, AlertCircle, ShieldAlert, ShieldCheck, Info } from "lucide-react";
import DecryptedText from "@/components/reactbits/DecryptedText";
import BorderGlow from "@/components/reactbits/BorderGlow";

interface AiInsight {
  category: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
}

interface AiInsightsData {
  ai_insights: AiInsight[];
  anomaly_score: number;
  risk_level: string;
  summary: string;
}

interface VideoInsightsProps {
  insights: AiInsightsData;
}

const SEVERITY_CONFIG: Record<string, { color: string; icon: React.ElementType; bg: string }> = {
  critical: { color: "#ef4444", icon: ShieldAlert, bg: "rgba(239,68,68,0.08)" },
  high: { color: "#ef4444", icon: AlertCircle, bg: "rgba(239,68,68,0.06)" },
  medium: { color: "#eab308", icon: Info, bg: "rgba(234,179,8,0.06)" },
  low: { color: "#22c55e", icon: ShieldCheck, bg: "rgba(34,197,94,0.06)" },
};

const RISK_COLORS: Record<string, string> = {
  Critical: "#ef4444",
  High: "#ef4444",
  Medium: "#eab308",
  Low: "#22c55e",
};

export default function VideoInsights({ insights }: VideoInsightsProps) {
  if (!insights || !insights.ai_insights || insights.ai_insights.length === 0) return null;

  const riskColor = RISK_COLORS[insights.risk_level] || "#4B5260";

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
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border border-border bg-background flex items-center justify-center shrink-0">
            <Brain className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h4 className="text-sm text-primary font-medium">
              <DecryptedText text="AI-Generated Insights" speed={60} maxIterations={15} animateOn="hover" />
            </h4>
            <p className="text-[10px] text-muted uppercase tracking-[0.1em]">
              Rule-based anomaly analysis
            </p>
          </div>
        </div>

        {/* Risk Level + Anomaly Score badges */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[9px] text-muted uppercase tracking-[0.1em]">Risk Level</div>
            <div className="text-sm font-medium" style={{ color: riskColor }}>
              {insights.risk_level}
            </div>
          </div>
          <div
            className="w-12 h-12 rounded-full border-2 flex items-center justify-center"
            style={{ borderColor: riskColor }}
          >
            <span className="text-xs font-mono font-medium" style={{ color: riskColor }}>
              {(insights.anomaly_score * 100).toFixed(0)}
            </span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="px-4 py-3 bg-background border-b border-border">
        <p className="text-xs text-muted leading-relaxed">{insights.summary}</p>
      </div>

      {/* Insight Cards */}
      <div className="p-4 space-y-3">
        {insights.ai_insights.map((insight, idx) => {
          const config = SEVERITY_CONFIG[insight.severity] || SEVERITY_CONFIG.medium;
          const Icon = config.icon;

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="flex gap-3 p-3 border border-border"
              style={{ backgroundColor: config.bg }}
            >
              <div className="shrink-0 mt-0.5">
                <Icon className="w-4 h-4" style={{ color: config.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-primary">{insight.category}</span>
                  <span
                    className="text-[9px] font-mono uppercase px-1.5 py-0.5 border"
                    style={{ color: config.color, borderColor: config.color + "44" }}
                  >
                    {insight.severity}
                  </span>
                </div>
                <p className="text-xs text-muted leading-relaxed">{insight.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
        </div>
      </BorderGlow>
    </motion.div>
  );
}
