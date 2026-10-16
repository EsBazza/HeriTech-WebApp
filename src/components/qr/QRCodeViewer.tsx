"use client";

import React from "react";
import { QRCodeSVG } from "qrcode.react";

interface QRCodeViewerProps {
  value: string;
  size?: number;
  label?: string;
  sublabel?: string;
  className?: string;
}

export function QRCodeViewer({ value, size = 180, label, sublabel, className = "" }: QRCodeViewerProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="p-2 bg-white rounded-md border border-line">
        <QRCodeSVG value={value} size={size} level="H" fgColor="#14281e" marginSize={1} />
      </div>

      {label && <p className="mt-3 font-mono-data text-sm font-medium text-ink text-center">{label}</p>}

      {sublabel && <p className="text-xs text-ink-3 text-center mt-1 max-w-[220px]">{sublabel}</p>}
    </div>
  );
}
