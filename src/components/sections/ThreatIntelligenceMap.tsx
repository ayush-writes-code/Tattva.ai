"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DottedMap } from "@/components/magicui/dotted-map";
import { ShieldAlert, Info } from "lucide-react";
import { countries } from "countries-list";
import DecryptedText from "@/components/reactbits/DecryptedText";

interface FraudData {
  country: string;
  cases: number;
  lat: number;
  lng: number;
  code: string;
}

const fraudData: FraudData[] = [
  { country: "United States", cases: 12500, lat: 37.0902, lng: -95.7129, code: "us" },
  { country: "Canada", cases: 2100, lat: 56.1304, lng: -106.3468, code: "ca" },
  { country: "Mexico", cases: 3400, lat: 23.6345, lng: -102.5528, code: "mx" },
  { country: "Brazil", cases: 5800, lat: -14.2350, lng: -51.9253, code: "br" },
  { country: "Argentina", cases: 2700, lat: -38.4161, lng: -63.6167, code: "ar" },
  { country: "Belgium", cases: 1900, lat: 50.5039, lng: 4.4699, code: "be" },
  { country: "Slovakia", cases: 1200, lat: 48.6690, lng: 19.6990, code: "sk" },
  { country: "Romania", cases: 1600, lat: 45.9432, lng: 24.9668, code: "ro" },
  { country: "Algeria", cases: 1300, lat: 28.0339, lng: 1.6596, code: "dz" },
  { country: "South Africa", cases: 2900, lat: -30.5595, lng: 22.9375, code: "za" },
  { country: "UAE", cases: 4600, lat: 23.4241, lng: 53.8478, code: "ae" },
  { country: "Japan", cases: 6200, lat: 36.2048, lng: 138.2529, code: "jp" },
  { country: "Vietnam", cases: 7800, lat: 14.0583, lng: 108.2772, code: "vn" },
  { country: "Philippines", cases: 9400, lat: 12.8797, lng: 121.7740, code: "ph" },
  { country: "India", cases: 11200, lat: 20.5937, lng: 78.9629, code: "in" }
];

export default function ThreatIntelligenceMap() {
  const [hoveredMarker, setHoveredMarker] = useState<(FraudData & { x: number; y: number }) | null>(null);

  const markers = useMemo(() => {
    return fraudData.map((data) => ({
      lat: data.lat,
      lng: data.lng,
      size: Math.max(0.6, Math.sqrt(data.cases) / 60),
      pulse: true,
      originalData: data
    }));
  }, []);

  return (
    <section className="relative w-full overflow-hidden border-t border-border bg-background py-[100px] px-[24px] md:px-[48px]">
      
      {/* subtle radial glow behind the map */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,0,0,0.05)_0%,transparent_70%)] pointer-events-none z-0" />

      <div className="relative z-10 max-w-[1200px] mx-auto mb-10 flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <div className="inline-flex items-center gap-2 border border-border bg-surface px-4 py-2 rounded-full text-[10px] uppercase tracking-[0.1em] text-muted mb-6">
            <ShieldAlert className="w-3.5 h-3.5 text-[#FF0000]" />
            <DecryptedText text="Global Threat Intel" speed={60} maxIterations={15} animateOn="hover" />
          </div>
          <h2 className="text-3xl md:text-5xl text-primary mb-4 leading-tight">
            Global AI Fraud Cases Per Year
          </h2>
          <p className="text-muted max-w-xl text-lg">
            Visualizing the worldwide impact of AI-generated fraud and deepfakes across neural verification networks.
          </p>
        </div>
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto w-full mb-8">
        <div className="w-full aspect-video min-h-[400px] bg-surface border border-border rounded-xl overflow-hidden relative shadow-2xl">
          
          <DottedMap
            className="absolute inset-0 w-full h-full p-4 pointer-events-auto"
            dotColor="rgba(237, 237, 234, 0.15)"
            markerColor="#FF0000"
            markers={markers}
            renderMarkerOverlay={({ marker, x, y }) => {
              const data = (marker as { originalData: FraudData }).originalData;
              return (
                <g
                  key={data.code}
                  onMouseEnter={() => setHoveredMarker({ ...data, x, y })}
                  onMouseLeave={() => setHoveredMarker(null)}
                  className="cursor-pointer"
                  style={{ pointerEvents: 'auto' }}
                >
                  <circle cx={x} cy={y} r={2.5} fill="transparent" />
                </g>
              );
            }}
          />

          <AnimatePresence>
            {hoveredMarker && (
              <MapMarkerTooltip data={hoveredMarker as FraudData & { x: number; y: number }} />
            )}
          </AnimatePresence>

        </div>
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto flex items-center justify-center sm:justify-start gap-2 text-xs text-muted/70 px-4">
        <Info className="w-4 h-4 shrink-0" />
        <p>Data represents estimated annual cases based on industry reports and is intended for visualization purposes only.</p>
      </div>
      
    </section>
  );
}

const MapMarkerTooltip = ({ data }: { data: FraudData & { x: number; y: number } }) => {
  const countryInfo = (countries as unknown as Record<string, { emoji: string }>)[data.code.toUpperCase()];
  const emoji = countryInfo?.emoji || "🌐";
  
  // Map SVG coordinates (0-150, 0-75) to percentages within the SVG padding box
  const leftPct = (data.x / 150) * 100;
  const topPct = (data.y / 75) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute pointer-events-none z-50 flex flex-col justify-end items-center"
      style={{
        left: `calc(16px + (100% - 32px) * ${leftPct / 100})`,
        top: `calc(16px + (100% - 32px) * ${topPct / 100})`,
        transform: "translate(-50%, -100%)",
        marginTop: "-12px", // offset above the dot
      }}
    >
      <div className="bg-background/90 backdrop-blur-md border border-border text-white px-5 py-3 rounded-lg shadow-[0_0_15px_rgba(255,0,0,0.3)] min-w-[160px] text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-xl leading-none">{emoji}</span>
          <span className="font-semibold text-lg text-primary">{data.country}</span>
        </div>
        <div className="text-[#FF0000] font-mono text-base font-medium">
          {data.cases.toLocaleString()} cases
        </div>
      </div>
    </motion.div>
  );
};
