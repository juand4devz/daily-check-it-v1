// components/ui/marquee.tsx
"use client";

import { cn } from "@/lib/utils";
import React from "react";

// Definisikan tipe untuk props Marquee
interface MarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  direction?: "left" | "right";
  speed?: "slow" | "normal" | "fast";
  pauseOnHover?: boolean;
}

const Marquee = ({
  className,
  children,
  direction = "left",
  speed = "normal",
  pauseOnHover = false,
  ...props
}: MarqueeProps) => {
  // Peta untuk kecepatan animasi
  const speedMap = {
    slow: "duration-[60s]",
    normal: "duration-[40s]",
    fast: "duration-[20s]",
  };

  // Peta untuk arah animasi
  const directionMap = {
    left: "animate-marquee-left",
    right: "animate-marquee-right",
  };

  return (
    <div
      className={cn(
        "relative flex overflow-hidden [--duration:40s] [--gap:1rem]",
        className,
        { "marquee-container": pauseOnHover } // Menambahkan class 'marquee-container' jika pauseOnHover aktif
      )}
      {...props}
    >
      <div
        className={cn(
          "flex w-max animate-marquee",
          directionMap[direction],
          speedMap[speed],
          { "marquee-animated-content": pauseOnHover } // Menambahkan class 'marquee-animated-content' ke konten yang dianimasikan
        )}
      >
        {children}
        {children} {/* Duplikasi children untuk efek loop yang mulus */}
      </div>
    </div>
  );
};

export default Marquee;
