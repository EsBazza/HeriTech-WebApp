"use client";

import React from "react";
import { QRCodeSVG } from "qrcode.react";

interface QRCodeViewerProps {
  value: string;
  size?: number;
  label?: string;
  sublabel?: string;
  /** Error-correction level. Lower levels give fewer, larger modules that scan more easily. */
  level?: "L" | "M" | "Q" | "H";
  className?: string;
}

export function QRCodeViewer({ value, size = 180, label, sublabel, level = "H", className = "" }: QRCodeViewerProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="p-2 bg-white rounded-md border border-line">
        <QRCodeSVG value={value} size={size} level={level} fgColor="#14172b" marginSize={1} />
      </div>

      {label && <p className="mt-3 font-mono-data text-sm font-medium text-ink text-center">{label}</p>}

      {sublabel && <p className="text-xs text-ink-3 text-center mt-1 max-w-[220px]">{sublabel}</p>}
    </div>
  );
}
