import Hero from "@/components/sections/Hero";
import StatsBar from "@/components/StatsBar";
import HowItWorks from "@/components/sections/HowItWorks";
import ClientUploadSection from "@/components/sections/ClientUploadSection";
import TechStack from "@/components/sections/TechStack";
import MetricsChart from "@/components/sections/MetricsChart";
import ThreatIntelligenceMap from "@/components/sections/ThreatIntelligenceMap";

export default function Home() {
  return (
    <div className="flex flex-col w-full overflow-x-hidden relative">
      <Hero />
      <StatsBar />
      <HowItWorks />
      <ClientUploadSection />
      <TechStack />
      <ThreatIntelligenceMap />
    </div>
  );
}
