import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { RefObject } from "react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export function useScrollAnimation(ref: RefObject<HTMLElement | null>, options = {}) {
  useGSAP(() => {
    if (!ref.current) return;
    
    gsap.fromTo(
      ref.current,
      { autoAlpha: 0, y: 40 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ref.current,
          start: "top 85%",
          toggleActions: "play none none reverse",
          ...options
        }
      }
    );
  }, { scope: ref });
}
