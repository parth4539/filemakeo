/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const DiamondLogoIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 28,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="fileMakeO Diamond Emblem"
    >
      <defs>
        {/* Modern multi-facet diamond gradients */}
        <linearGradient id="facetTop" x1="24" y1="4" x2="24" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="facetLeft" x1="6" y1="18" x2="24" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <linearGradient id="facetCenter" x1="24" y1="18" x2="24" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="facetRight" x1="42" y1="18" x2="24" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="sparkleCore" x1="24" y1="14" x2="24" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.3" />
        </linearGradient>
      </defs>

      {/* Unique multi-faceted geometric cut */}
      {/* Top Table Facet */}
      <polygon points="15,5 33,5 29,17 19,17" fill="url(#facetTop)" />
      
      {/* Top Left Crown Facet */}
      <polygon points="6,17 15,5 19,17" fill="#60a5fa" />
      
      {/* Top Right Crown Facet */}
      <polygon points="33,5 42,17 29,17" fill="#818cf8" />

      {/* Central Upper Triangle */}
      <polygon points="19,17 29,17 24,25" fill="url(#sparkleCore)" />

      {/* Lower Left Pavilion */}
      <polygon points="6,17 19,17 24,25 24,44" fill="url(#facetLeft)" />

      {/* Lower Right Pavilion */}
      <polygon points="42,17 29,17 24,25 24,44" fill="url(#facetRight)" />

      {/* Center Refraction Diamond Spire */}
      <polygon points="24,25 19,17 24,14 29,17" fill="#bfdbfe" opacity="0.9" />

      {/* Accent Facet Highlight Stroke */}
      <polyline
        points="15,5 19,17 24,44 29,17 33,5"
        stroke="#ffffff"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.45"
      />
      <line
        x1="6"
        y1="17"
        x2="42"
        y2="17"
        stroke="#ffffff"
        strokeWidth="1.2"
        strokeOpacity="0.4"
      />
    </svg>
  );
};

export const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true, className = '' }) => {
  const iconSize = size === 'sm' ? 22 : size === 'lg' ? 36 : 28;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-800 p-1.5 flex items-center justify-center shadow-md shadow-blue-500/20 ring-1 ring-blue-500/30">
        <DiamondLogoIcon size={iconSize} />
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              file<span className="text-blue-600 dark:text-blue-400 font-black">MakeO</span>
            </span>
            <span className="hidden sm:inline-block text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40">
              Studio
            </span>
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden md:block">
            By Parth Prajapati
          </span>
        </div>
      )}
    </div>
  );
};
