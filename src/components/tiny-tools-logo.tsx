import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  withGlow?: boolean;
}

/**
 * Official Tiny Tools Neo-Brutalist Lightning Logo.
 * Expresses the brand's fast, zero-friction, client-side identity.
 */
export function TinyToolsLogo({ size = 22, className = '', withGlow = false }: LogoProps) {
  return (
    <span
      className={`brand-mark group relative inline-flex items-center justify-center select-none ${className}`}
      aria-label="Tiny Tools lightning logo"
      style={{
        width: Math.max(32, size + 14),
        height: Math.max(32, size + 14),
      }}
    >
      {/* Neo-brutalist lightning bolt icon */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className="transition-transform duration-200 group-hover:scale-115 group-hover:rotate-[-6deg]"
      >
        {/* Main lightning bolt polygon */}
        <polygon
          points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"
          stroke="#1b1c1e"
          strokeWidth="2.2"
          strokeLinejoin="round"
          strokeLinecap="round"
          fill="#1b1c1e"
        />
        {/* Inner bright yellow energy slash */}
        <polygon
          points="12.5 4.5 5.5 13.5 11.5 13.5 11 18.5 17.5 11.5 12 11.5 12.5 4.5"
          fill="#fef08a"
        />
      </svg>
      {withGlow && (
        <span
          className="pointer-events-none absolute inset-0 -z-10 rounded-md opacity-40 blur-sm bg-primary"
          aria-hidden="true"
        />
      )}
    </span>
  );
}

/**
 * Compact inline lightning badge for labels and headers
 */
export function LightningBadge({ text = 'SMALL BUT MIGHTY' }: { text?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider bg-primary text-foreground border-1.5 border-border rounded shadow-[2px_2px_0_var(--foreground)]">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
      {text}
    </span>
  );
}
