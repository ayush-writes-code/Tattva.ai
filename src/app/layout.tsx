import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";
import "./globals.css";
import IntrusionXNavbar from "@/components/layout/IntrusionXNavbar";
import Footer from "@/components/layout/Footer";
import SmoothScrollProvider from "@/providers/SmoothScrollProvider";
import BlobCursor from "@/components/reactbits/BlobCursor";
import GradualBlur from "@/components/reactbits/GradualBlur";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tattva-ai-prototype.vercel.app/"),
  title: "Tattva.ai | Deepfake Detection",
  description: "AI-Powered Deepfake Detection System with multi-modal neural network verifications.",
  icons: {
    icon: [
      { url: '/logo.png' }
    ]
  },
  openGraph: {
    title: "Tattva.ai | Deepfake Detection",
    description: "AI-Powered Deepfake Detection System with multi-modal neural network verifications.",
    url: "https://tattva-ai-prototype.vercel.app/",
    siteName: "Tattva.ai",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Tattva.ai Deepfake Detection System",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tattva.ai | Deepfake Detection",
    description: "AI-Powered Deepfake Detection System with multi-modal neural network verifications.",
    images: ["/logo.png"],
  },
};

import { Analytics } from "@vercel/analytics/react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${syne.variable} dark scroll-smooth`}>
      <body className="antialiased min-h-screen flex flex-col relative font-sans text-primary bg-background">
        <BlobCursor
          fillColor="rgba(237, 237, 234, 0.15)"
          sizes={[20, 50, 35]}
          opacities={[0.9, 0.4, 0.35]}
        />
        <SmoothScrollProvider>
          <IntrusionXNavbar />
          <div className="flex-1 mt-20">
            {children}
          </div>
          <Footer />
          <GradualBlur 
            position="bottom" 
            height="5rem" 
            strength={2.5} 
            target="page" 
            zIndex={50}
            curve="ease-out"
          />
        </SmoothScrollProvider>
        <Analytics />
      </body>
    </html>
  );
}
