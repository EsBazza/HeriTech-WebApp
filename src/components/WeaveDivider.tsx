import React from "react";

interface WeaveDividerProps {
  bgColor?: string;
  height?: number;
  className?: string;
}

export function WeaveDivider({
  bgColor = "#2C1A0E",
  height = 24,
  className = "",
}: WeaveDividerProps) {
  const patternId = React.useId().replace(/:/g, "_");

  return (
    <div
      className={`w-full overflow-hidden flex items-center select-none ${className}`}
      style={{
        backgroundColor: bgColor,
        height: `${height}px`,
      }}
      role="separator"
      aria-hidden="true"
    >
      <svg
        width="100%"
        height={height}
        className="w-full h-full block"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id={`hand-weave-${patternId}`}
            width="32"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            {/* Background Weave Shading */}
            <rect width="32" height="24" fill={bgColor} />

            {/* Horizontal Weft Thread Blocks (Alternating Mahogany & Forest) */}
            {/* Row 1 (y=2, height=4) */}
            <rect x="0" y="2" width="14" height="4" fill="#6B4226" opacity="0.9" rx="0.5" />
            <rect x="16" y="2" width="14" height="4" fill="#4A6741" opacity="0.9" rx="0.5" />

            {/* Row 2 (y=8, height=4) */}
            <rect x="2" y="8" width="14" height="4" fill="#4A6741" opacity="0.9" rx="0.5" />
            <rect x="18" y="8" width="14" height="4" fill="#6B4226" opacity="0.9" rx="0.5" />

            {/* Row 3 (y=14, height=4) */}
            <rect x="0" y="14" width="14" height="4" fill="#6B4226" opacity="0.9" rx="0.5" />
            <rect x="16" y="14" width="14" height="4" fill="#4A6741" opacity="0.9" rx="0.5" />

            {/* Row 4 (y=20, height=4) */}
            <rect x="2" y="20" width="14" height="4" fill="#4A6741" opacity="0.9" rx="0.5" />
            <rect x="18" y="20" width="14" height="4" fill="#6B4226" opacity="0.9" rx="0.5" />

            {/* Vertical Gold Warp Threads (at x=0, x=12, x=24) */}
            <rect x="0" y="0" width="4" height="24" fill="#C9A96E" opacity="0.55" />
            <rect x="12" y="0" width="4" height="24" fill="#C9A96E" opacity="0.55" />
            <rect x="24" y="0" width="4" height="24" fill="#C9A96E" opacity="0.55" />

            {/* Gold Intersection Highlight Nodes where warp meets weft */}
            <rect x="0" y="2" width="4" height="4" fill="#E0C48A" opacity="0.85" />
            <rect x="12" y="8" width="4" height="4" fill="#E0C48A" opacity="0.85" />
            <rect x="24" y="2" width="4" height="4" fill="#E0C48A" opacity="0.85" />
            <rect x="0" y="14" width="4" height="4" fill="#E0C48A" opacity="0.85" />
            <rect x="12" y="20" width="4" height="4" fill="#E0C48A" opacity="0.85" />
            <rect x="24" y="14" width="4" height="4" fill="#E0C48A" opacity="0.85" />
          </pattern>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill={`url(#hand-weave-${patternId})`}
        />
      </svg>
    </div>
  );
}

export default WeaveDivider;
