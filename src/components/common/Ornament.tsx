/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

/**
 * Section Divider with diamond finial (◆)
 */
export const SectionDivider: React.FC<{ className?: string }> = ({ className = "my-12" }) => {
  return (
    <div className={`flex items-center justify-center gap-4 w-full max-w-xl mx-auto ${className}`}>
      <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-gold/40 to-gold" />
      <span className="text-gold-text text-xs font-serif select-none transform rotate-45 inline-block">◆</span>
      <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-gold/40 to-gold" />
    </div>
  );
};

/**
 * Editorial Eyebrow Label with wide tracking
 * e.g., "01 · NEWS · ข่าวประชาสัมพันธ์"
 */
interface EyebrowProps {
  number?: string;
  enText?: string;
  thText: string;
  className?: string;
  light?: boolean;
}

export const SectionEyebrow: React.FC<EyebrowProps> = ({
  number,
  enText,
  thText,
  className = "",
  light = false
}) => {
  return (
    <div className={`flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-medium ${light ? 'text-anchor-gold' : 'text-gold-text'} ${className}`}>
      {number && (
        <span className="font-serif italic font-normal text-sm tracking-normal mr-1 opacity-90">
          {number}
        </span>
      )}
      {enText && (
        <>
          <span className="font-serif">{enText}</span>
          <span aria-hidden="true" className="opacity-40">·</span>
        </>
      )}
      <span className="tracking-widest">{thText}</span>
    </div>
  );
};

/**
 * Corner Gold Bracket Ornament for Cards
 */
export const CornerBracket: React.FC<{ position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }> = ({ position }) => {
  const getStyles = () => {
    switch (position) {
      case 'top-left':
        return 'top-0 left-0 border-t border-l';
      case 'top-right':
        return 'top-0 right-0 border-t border-r';
      case 'bottom-left':
        return 'bottom-0 left-0 border-b border-l';
      case 'bottom-right':
        return 'bottom-0 right-0 border-b border-r';
    }
  };

  return (
    <div
      aria-hidden="true"
      className={`absolute w-3 h-3 pointer-events-none border-gold/50 transition-all duration-500 ${getStyles()}`}
    />
  );
};

/**
 * Editorial Pushpin SVG Icon (replaces emoji pin)
 */
export const PinIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`shrink-0 ${className}`}
    aria-hidden="true"
  >
    <path d="M12 17v5" />
    <path
      d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"
      fill="currentColor"
      fillOpacity="0.18"
    />
  </svg>
);
