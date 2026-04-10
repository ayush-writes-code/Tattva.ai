"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Activity, ShieldCheck, Zap } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import DecryptedText from "@/components/reactbits/DecryptedText";
import ShapeGrid from "@/components/reactbits/ShapeGrid";

const DATA = [
  { name: "ViT Core", accuracy: 98.5 },
  { name: "Swin Trans", accuracy: 96.2 },
  { name: "Wav2Vec2", accuracy: 97.9 },
  { name: "ELA Forensics", accuracy: 94.5 },
];

export default function MetricsDashboard() {
  const sectionRef = useRef<HTMLElement>(null);
  useScrollAnimation(sectionRef);

  return (
    <section 
      ref={sectionRef} 
      className="relative w-full overflow-hidden border-t border-border" 
      style={{ visibility: "hidden" }}
    >
      {/* ShapeGrid Background */}
      <div className="absolute inset-0 z-0 opacity-25 pointer-events-none">
        <ShapeGrid 
          shape="triangle"
          borderColor="#3A3F4E"
          hoverFillColor="#EDEDEA"
          speed={0.4}
          squareSize={50}
        />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto py-[140px] px-[48px]">
        <div className="flex flex-col md:flex-row justify-between items-end mb-[60px]">
          <div>
            <h2 className="text-3xl text-primary mb-[20px]">
              <DecryptedText text="System Telemetry" speed={60} maxIterations={15} animateOn="hover" />
            </h2>
            <p className="text-muted">
              <DecryptedText text="Real-time inference engine accuracy metrics" speed={60} maxIterations={15} animateOn="hover" />
            </p>
          </div>
          <div className="flex gap-4 mt-6 md:mt-0">
            <div className="flex items-center gap-2 text-sm text-primary">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <DecryptedText text="Ensembles Active" speed={60} maxIterations={15} animateOn="hover" />
            </div>
            <div className="flex items-center gap-2 text-sm text-primary">
              <Zap className="w-4 h-4 text-primary" />
              <DecryptedText text="24ms p99 Latency" speed={60} maxIterations={15} animateOn="hover" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="col-span-1 md:col-span-2 p-[40px] border border-border bg-surface/80 backdrop-blur-sm h-80 flex flex-col"
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-[10px] text-muted uppercase tracking-[0.1em]">
                <DecryptedText text="Model Accuracy Benchmarks (%)" speed={60} maxIterations={15} animateOn="hover" />
              </h3>
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={DATA} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#4B5260" />
                  <XAxis type="number" domain={[80, 100]} stroke="#EDEDEA" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="#EDEDEA" fontSize={12} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#1A1F2E' }}
                    contentStyle={{ backgroundColor: '#0D1117', border: '1px solid #4B5260', borderRadius: '0', color: '#EDEDEA' }}
                    itemStyle={{ color: '#EDEDEA' }}
                  />
                  <Bar dataKey="accuracy" fill="#EDEDEA" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="col-span-1 flex flex-col gap-6"
          >
            <div className="p-[40px] border border-border bg-surface/80 backdrop-blur-sm flex-1 flex flex-col justify-center">
              <div className="text-5xl text-primary mb-2">
                <DecryptedText text="240K+" speed={60} maxIterations={15} animateOn="hover" />
              </div>
              <div className="text-[10px] text-muted uppercase tracking-[0.1em]">
                <DecryptedText text="Deepfakes Identified" speed={60} maxIterations={15} animateOn="hover" />
              </div>
            </div>
            <div className="p-[40px] border border-border bg-surface/80 backdrop-blur-sm flex-1 flex flex-col justify-center">
              <div className="text-5xl text-primary mb-2">
                <DecryptedText text="98.5%" speed={60} maxIterations={15} animateOn="hover" />
              </div>
              <div className="text-[10px] text-muted uppercase tracking-[0.1em]">
                <DecryptedText text="Peak Confidence Score" speed={60} maxIterations={15} animateOn="hover" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
