import { Link, useNavigate } from '@tanstack/react-router';
import {
  Zap,
  Cpu,
  Shuffle,
  Terminal,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { tools } from '@/lib/tools/catalog';
import { TinyToolsLogo } from '@/components/tiny-tools-logo';

export function CreativeFooter() {
  const navigate = useNavigate();

  // Pick a random tool from the catalog
  function pickRandomTool() {
    const randomTool = tools[Math.floor(Math.random() * tools.length)];
    if (randomTool) {
      void navigate({
        to: '/tools/$toolId',
        params: { toolId: randomTool.id },
      });
    }
  }

  // Filter tools by category for clean columns
  const pdfTools = tools.filter((t) => t.category === 'PDF & documents');
  const textTools = tools.filter((t) => t.category === 'Text & writing');
  const devAndSecurityTools = tools.filter(
    (t) => t.category === 'Developer' || t.category === 'Security & privacy'
  );
  const mediaTools = tools.filter((t) => t.category === 'Image & media');
  const calcTools = tools.filter((t) => t.category === 'Calculators');
  const businessAndSocialTools = tools.filter(
    (t) =>
      t.category === 'Business & everyday' ||
      t.category === 'Social media' ||
      t.category === 'Productivity'
  );

  return (
    <footer className="creative-footer-section relative w-full overflow-hidden border-t-2 border-border bg-background">
      {/* ------------------------------------------------------------- */}
      {/* 1. MEMPHIS NEO-BRUTALIST CREATIVE PLAYGROUND (Image 2 style)  */}
      {/* ------------------------------------------------------------- */}
      <div className="memphis-stage relative w-full py-16 px-4 sm:px-6 lg:px-8 border-b-2 border-border overflow-hidden">
        {/* Animated Memphis decorative vector shapes in background */}
        <div className="memphis-decorations pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          {/* Memphis 3D Step-Stairs (top left) */}
          <div className="absolute -top-4 left-6 sm:left-16 opacity-85 hover:opacity-100 transition-opacity">
            <svg width="120" height="90" viewBox="0 0 120 90" fill="none">
              <path d="M10 80 L35 80 L35 55 L60 55 L60 30 L85 30 L85 10 L110 10" stroke="#1b1c1e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <rect x="10" y="60" width="25" height="20" fill="#fef08a" stroke="#1b1c1e" strokeWidth="3" />
              <rect x="35" y="40" width="25" height="20" fill="#a3e635" stroke="#1b1c1e" strokeWidth="3" />
              <rect x="60" y="20" width="25" height="20" fill="#f472b6" stroke="#1b1c1e" strokeWidth="3" />
            </svg>
          </div>

          {/* Neo-brutalist Wavy Squiggle (top right) */}
          <div className="absolute top-8 right-8 sm:right-24 hidden sm:block">
            <svg width="140" height="40" viewBox="0 0 140 40" fill="none">
              <path
                d="M10 20 Q 25 5, 40 20 T 70 20 T 100 20 T 130 20"
                stroke="#0ea5e9"
                strokeWidth="6"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M10 26 Q 25 11, 40 26 T 70 26 T 100 26 T 130 26"
                stroke="#1b1c1e"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>

          {/* Memphis 3D Isometric Cube / Hexagon (bottom left) */}
          <div className="absolute bottom-6 left-8 hidden md:block">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <polygon points="40,10 70,26 40,42 10,26" fill="#fef08a" stroke="#1b1c1e" strokeWidth="3" />
              <polygon points="10,26 40,42 40,74 10,58" fill="#a7f3d0" stroke="#1b1c1e" strokeWidth="3" />
              <polygon points="70,26 40,42 40,74 70,58" fill="#f472b6" stroke="#1b1c1e" strokeWidth="3" />
            </svg>
          </div>

          {/* Memphis Donut & Pill (bottom right) */}
          <div className="absolute bottom-8 right-12 hidden md:block">
            <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
              <circle cx="45" cy="45" r="32" fill="#38bdf8" stroke="#1b1c1e" strokeWidth="3.5" />
              <circle cx="45" cy="45" r="14" fill="#ffffff" stroke="#1b1c1e" strokeWidth="3.5" />
              <circle cx="70" cy="20" r="4" fill="#1b1c1e" />
              <circle cx="78" cy="28" r="3" fill="#1b1c1e" />
            </svg>
          </div>

          {/* Floating neo-brutalist asterisks & sparkles */}
          <div className="absolute top-1/2 left-3 text-2xl select-none font-bold animate-pulse text-foreground/40 hidden lg:block">
            ✳
          </div>
          <div className="absolute top-1/3 right-4 text-3xl select-none font-bold text-pink-500/60 hidden lg:block">
            ★
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 2. FLOATING DARK CALLOUT CARD (Image 1 style)                  */}
        {/* ------------------------------------------------------------- */}
        <div className="relative mx-auto max-w-4xl z-10">
          <div className="cta-banner-card bg-foreground text-card border-3 border-border rounded-xl p-8 sm:p-12 shadow-[8px_8px_0_var(--border)] transition-transform hover:-translate-y-1">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded border-2 border-card/40 bg-card/10 font-mono text-xs uppercase tracking-wider text-card">
                <Zap size={14} className="text-yellow-300 fill-yellow-300" />
                <span>Zero-friction tools · 100% in-browser</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px] text-card/70">
                <Cpu size={14} className="text-emerald-400" />
                <span>Runs on your local CPU / WebAssembly</span>
              </div>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight text-card leading-tight">
              Build faster. Think lighter<span className="text-yellow-300">.</span>
            </h2>

            <p className="mt-4 text-base sm:text-lg text-card/80 max-w-2xl leading-relaxed">
              No accounts. No subscriptions. No wait-lists or upload limits. All utilities process
              PDFs, text, media, and calculations right here on your device.
            </p>

            {/* Quick action bar */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button
                asChild
                variant="tool"
                className="bg-primary text-foreground border-2 border-border shadow-[4px_4px_0_#000] hover:bg-primary/90 font-bold"
              >
                <Link to="/">
                  <Zap size={18} fill="currentColor" />
                  Explore all tools
                </Link>
              </Button>

              <Button
                variant="paper"
                onClick={pickRandomTool}
                className="bg-card text-foreground border-2 border-border shadow-[4px_4px_0_#000] hover:bg-muted font-medium"
              >
                <Shuffle size={16} />
                Surprise me (Random tool)
              </Button>

              <span className="inline-flex items-center gap-2 font-mono text-xs text-card/70 ml-auto hidden sm:inline-flex">
                <Terminal size={14} />
                <span>Press </span>
                <kbd className="px-1.5 py-0.5 rounded bg-card/20 text-card font-mono text-[11px] border border-card/30">
                  /
                </kbd>
                <span> to search anytime</span>
              </span>
            </div>

            {/* Memphis badge strip */}
            <div className="mt-8 pt-6 border-t border-card/20 flex flex-wrap items-center gap-4 text-xs font-mono text-card/70">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-400" />
                Zero cloud uploads
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-400" />
                No watermark ever
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-400" />
                Instant live results
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-400" />
                Open web standards
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. MULTI-COLUMN STRUCTURED DIRECTORY (Image 1 style)           */}
      {/* ------------------------------------------------------------- */}
      <div className="footer-directory-container max-w-7xl mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-10">
          {/* Column 1: PDF & Documents */}
          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground mb-4 flex items-center gap-1.5">
              <span className="size-2 bg-pink-400 rounded-sm inline-block" />
              PDF & Docs
            </h3>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              {pdfTools.map((t) => (
                <li key={t.id}>
                  <Link
                    to="/tools/$toolId"
                    params={{ toolId: t.id }}
                    className="hover:text-foreground hover:underline transition-colors block truncate"
                    title={t.name}
                  >
                    {t.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Text & Writing */}
          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground mb-4 flex items-center gap-1.5">
              <span className="size-2 bg-yellow-400 rounded-sm inline-block" />
              Text & Writing
            </h3>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              {textTools.map((t) => (
                <li key={t.id}>
                  <Link
                    to="/tools/$toolId"
                    params={{ toolId: t.id }}
                    className="hover:text-foreground hover:underline transition-colors block truncate"
                    title={t.name}
                  >
                    {t.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Dev & Security */}
          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground mb-4 flex items-center gap-1.5">
              <span className="size-2 bg-sky-400 rounded-sm inline-block" />
              Dev & Security
            </h3>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              {devAndSecurityTools.map((t) => (
                <li key={t.id}>
                  <Link
                    to="/tools/$toolId"
                    params={{ toolId: t.id }}
                    className="hover:text-foreground hover:underline transition-colors block truncate"
                    title={t.name}
                  >
                    {t.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Image & Media */}
          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground mb-4 flex items-center gap-1.5">
              <span className="size-2 bg-lime-400 rounded-sm inline-block" />
              Image & Media
            </h3>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              {mediaTools.map((t) => (
                <li key={t.id}>
                  <Link
                    to="/tools/$toolId"
                    params={{ toolId: t.id }}
                    className="hover:text-foreground hover:underline transition-colors block truncate"
                    title={t.name}
                  >
                    {t.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: Calculators */}
          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground mb-4 flex items-center gap-1.5">
              <span className="size-2 bg-emerald-400 rounded-sm inline-block" />
              Calculators
            </h3>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              {calcTools.map((t) => (
                <li key={t.id}>
                  <Link
                    to="/tools/$toolId"
                    params={{ toolId: t.id }}
                    className="hover:text-foreground hover:underline transition-colors block truncate"
                    title={t.name}
                  >
                    {t.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 6: Business, Social & Productivity */}
          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground mb-4 flex items-center gap-1.5">
              <span className="size-2 bg-primary rounded-sm inline-block" />
              Work & Daily
            </h3>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              {businessAndSocialTools.map((t) => (
                <li key={t.id}>
                  <Link
                    to="/tools/$toolId"
                    params={{ toolId: t.id }}
                    className="hover:text-foreground hover:underline transition-colors block truncate"
                    title={t.name}
                  >
                    {t.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 4. BOTTOM BAR WITH STATUS & SYSTEM BADGE                      */}
        {/* ------------------------------------------------------------- */}
        <div className="mt-14 pt-8 border-t-2 border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <Link to="/" className="brand flex items-center gap-1.5 text-sm font-bold">
              <TinyToolsLogo size={16} />
              <span>tiny tools.</span>
            </Link>
            <span>·</span>
            <span>All tools run 100% on your device</span>
            <span>·</span>
            <span className="font-mono text-[11px]">MADE FOR MAKERS ✳</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-muted text-[11px] font-mono border border-border/50">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All engines client-side</span>
            </div>
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="font-mono text-[11px] underline hover:text-foreground"
            >
              Back to top ↑
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
