'use client';

import React from 'react';

interface WatermarkProps {
  name: string;
  email: string;
}

export default function Watermark({ name, email }: WatermarkProps) {
  const watermarkText = `${name} - ${email}`;

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden select-none">
      {/* Dynamic Watermark Grid Pattern */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-12 gap-y-24 p-6 w-full h-full opacity-[0.06] dark:opacity-[0.03]">
        {Array.from({ length: 24 }).map((_, idx) => (
          <div
            key={idx}
            className="text-[10px] md:text-xs font-mono font-bold tracking-widest text-slate-400 rotate-[-30deg] text-center select-none uppercase whitespace-nowrap"
          >
            {watermarkText}
          </div>
        ))}
      </div>
    </div>
  );
}
