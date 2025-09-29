"use client";

import React from "react";

export function NeoBubbles() {
  const bubbles = Array.from({ length: 14 });
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <svg className="absolute inset-0 w-full h-full opacity-30">
        <defs>
          <radialGradient id="g1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#27d3ff" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#27d3ff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="g2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6a5cff" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#6a5cff" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
      {bubbles.map((_, i) => (
        <div
          key={i}
          style={{
            left: `${(i * 7) % 100}%`,
            top: `${(i * 13) % 100}%`,
            width: 140 + ((i * 23) % 120),
            height: 140 + ((i * 17) % 150),
            animationDelay: `${(i * 0.7) % 8}s`,
            animationDuration: `${12 + (i % 6)}s`,
            background: `radial-gradient(circle, rgba(39,211,255,0.22), rgba(39,211,255,0) 60%)`,
          }}
          className="absolute rounded-full animate-[float-bubble_linear_infinite]"
        />
      ))}
    </div>
  );
}




