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

export function QRCodeViewer({
  value,
  size = 180,
  label,
  sublabel,
  className = "",
}: QRCodeViewerProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-gray-200 shadow-sm ${className}`}>
      <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-inner">
        <QRCodeSVG
          value={value}
          size={size}
          level="H"
          includeMargin={true}
        />
      </div>

      {label && (
        <p className="mt-3 font-mono-data text-xs font-bold text-gray-900 tracking-wider text-center">
          {label}
        </p>
      )}

      {sublabel && (
        <p className="text-[10px] text-gray-500 text-center mt-0.5 max-w-[200px]">
          {sublabel}
        </p>
      )}
    </div>
  );
}
