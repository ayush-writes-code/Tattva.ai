"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DottedMap, Marker } from "@/components/magicui/dotted-map";
import { ShieldAlert, TrendingUp } from "lucide-react";

interface FraudMarker extends Marker {
  country: string;
  code: string;
  count: number;
}

const fraudData: FraudMarker[] = [
  { country: "China", count: 152400, lat: 35.8617, lng: 104.1954, code: "cn", pulse: true },
  { country: "United States", count: 124500, lat: 37.0902, lng: -95.7129, code: "us", pulse: true },
  { country: "Vietnam", count: 88200, lat: 14.0583, lng: 108.2772, code: "vn", pulse: true },
  { country: "Philippines", count: 76800, lat: 12.8797, lng: 121.774, code: "ph", pulse: true },
  { country: "India", count: 62100, lat: 20.5937, lng: 78.9629, code: "in", pulse: true },
  { country: "Brazil", count: 54900, lat: -14.235, lng: -51.9253, code: "br" },
  { country: "Japan", count: 46200, lat: 36.2048, lng: 138.2529, code: "jp" },
  { country: "South Korea", count: 41800, lat: 35.9078, lng: 127.7669, code: "kr" },
  { country: "Germany", count: 39500, lat: 51.1657, lng: 10.4515, code: "de" },
  { country: "United Kingdom", count: 37200, lat: 55.3781, lng: -3.436, code: "gb" },
  { country: "Spain", count: 34100, lat: 40.4637, lng: -3.7492, code: "es" },
  { country: "Mexico", count: 31800, lat: 23.6345, lng: -102.5528, code: "mx" },
  { country: "Turkey", count: 28400, lat: 38.9637, lng: 35.2433, code: "tr" },
  { country: "South Africa", count: 24800, lat: -30.5595, lng: 22.9375, code: "za" },
  { country: "UAE", count: 21500, lat: 23.4241, lng: 53.8478, code: "ae" },
  { country: "Australia", count: 17900, lat: -25.2744, lng: 133.7751, code: "au" },
];

export default function AIFraudMap() {
  const [hoveredMarker, setHoveredMarker] = useState<FraudMarker | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  return (
    <section id="ai-fraud-map" className="relative py-24 pb-32 overflow-hidden bg-background">
      {/* Background Neon Gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[1200px] h-[800px] pointer-events-none z-0">
        <div className="absolute inset-0 bg-[#7AFAFA]/5 blur-[120px] rounded-full" />
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#00f0ff]/10 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[var(--primary)]/5 blur-[150px] rounded-full mix-blend-screen" />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--primary)]/20 bg-surface/50 backdrop-blur-sm mb-6">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <span className="text-xs font-semibold tracking-widest uppercase text-muted">Global Deepfake Distribution 2023-2024</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Total AI-Generated<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7AFAFA] via-white to-blue-500">
              Deepfake Incidents
            </span>
          </h2>
          <p className="text-lg text-faint max-w-2xl mx-auto">
            Annual volume of detected deepfake-related fraud and synthetic identity events across high-risk global jurisdictions.
          </p>
        </motion.div>

        {/* Glassmorphism Map Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="relative w-full rounded-3xl border border-border/50 bg-surface/60 backdrop-blur-xl p-4 md:p-8 shadow-2xl overflow-hidden flex justify-center items-center"
        >
          {/* Fallback pattern for context layer natively rendering in DottedMap component natively */}
          <div className="absolute inset-0 z-0 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

          <div className="relative w-full aspect-[2/1] z-10 flex">
            <DottedMap<FraudMarker>
              markers={fraudData}
              mapSamples={2000}
              dotRadius={0.6}
              dotColor="var(--faint)"
              markerColor="#ef4444"
              pulse={true}
              renderMarkerOverlay={({ marker, x, y }) => (
                <rect
                  x={x - 2}
                  y={y - 2}
                  width={4}
                  height={4}
                  fill="transparent"
                  className="cursor-pointer outline-none"
                  onMouseEnter={() => {
                    setHoveredMarker(marker);
                    setHoverPos({ x, y });
                  }}
                  onMouseLeave={() => setHoveredMarker(null)}
                />
              )}
            />
          </div>

          <AnimatePresence>
            {hoveredMarker && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: "absolute",
                  left: `calc(${(hoverPos.x / 150) * 100}%)`,
                  top: `calc(${(hoverPos.y / 75) * 100}%)`,
                  transform: "translate(-50%, -120%)",
                }}
                className="z-50 pointer-events-none"
              >
                <div className="flex flex-col gap-2 items-center min-w-[140px] px-4 py-3 rounded-xl border border-border bg-surface/90 backdrop-blur-md shadow-[0_0_20px_rgba(239,68,68,0.15)] relative">
                  <div className="flex items-center gap-2 w-full border-b border-border/50 pb-2 mb-1">
                    <img
                      src={`https://flagcdn.com/w40/${hoveredMarker.code}.png`}
                      alt={hoveredMarker.country}
                      className="w-5 h-auto rounded-[2px]"
                      loading="lazy"
                    />
                    <span className="text-sm font-semibold text-primary">{hoveredMarker.country}</span>
                  </div>
                  <div className="flex items-center gap-2 w-full justify-center">
                    <TrendingUp className="w-4 h-4 text-rose-400" />
                    <span className="text-xl font-bold tracking-tight text-white leading-none">
                      {hoveredMarker.count.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted uppercase font-bold tracking-wider">Cases / Year</span>
                  {/* Tooltip Triangle */}
                  <div className="absolute -bottom-2 md:left-1/2 left-1/4 -translate-x-1/2 border-[6px] border-transparent border-t-surface/90" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </div>
    </section>
  );
}
