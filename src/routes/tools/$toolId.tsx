import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { ArrowLeft, ShieldCheck, Zap, BookOpen } from 'lucide-react';
import { tools, toolHead } from '@/lib/tools/catalog';
import { ToolIcon } from '@/components/tools/tool-icon';
import { TextWorkspace } from '@/components/tools/text-workspace';
import { MediaWorkspace } from '@/components/tools/media-workspace';
import { DeveloperWorkspace } from '@/components/tools/developer-workspace';
import { CalculatorWorkspace } from '@/components/tools/calculator-workspace';
import { ProductivityWorkspace } from '@/components/tools/productivity-workspace';
import { PdfWorkspace } from '@/components/tools/pdf-workspace';
import { DeveloperExtendedWorkspace } from '@/components/tools/developer-extended-workspace';
import { MediaExtendedWorkspace } from '@/components/tools/media-extended-workspace';
import { BusinessWorkspace } from '@/components/tools/business-workspace';
import { SiteFooter } from '@/components/site-header';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/tools/$toolId')({
  loader: ({ params }) => {
    const tool = tools.find((t) => t.id === params.toolId);
    if (!tool) throw notFound();
    return { tool };
  },
  head: ({ loaderData }) => {
    if (!loaderData?.tool) return toolHead('Tool not found', 'This tool does not exist.');
    return toolHead(loaderData.tool.name, loaderData.tool.description);
  },
  component: ToolPage,
});

function ToolPage() {
  const { tool } = Route.useLoaderData();

  return (
    <>
      <main className="workspace">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Button asChild variant="ghost" size="sm" className="gap-2 font-mono text-xs">
            <Link to="/">
              <ArrowLeft size={16} /> ALL TOOLS
            </Link>
          </Button>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-muted px-2.5 py-1 rounded border border-border/40">
            <ShieldCheck size={14} className="text-foreground" />
            <span>100% IN-BROWSER · NOTHING UPLOADED</span>
          </div>
        </div>

        <div className="workspace-title">
          <ToolIcon icon={tool.icon} color={tool.color} />
          <div>
            <div className="flex items-center gap-3">
              <span className="tag">{tool.category}</span>
              {tool.popular && <span className="popular-tag">POPULAR ↗</span>}
            </div>
            <h1 className="mt-1">{tool.name}</h1>
            <p>{tool.description}</p>
          </div>
        </div>

        {renderWorkspace(tool.id, tool.category)}

        {/* How to use section */}
        {tool.howToUse && tool.howToUse.length > 0 && (
          <div className="mt-10 p-5 bg-muted/40 border-2 border-border rounded-lg shadow-[3px_3px_0_var(--foreground)]">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={18} className="text-muted-foreground" />
              <span className="font-mono text-xs font-bold uppercase tracking-wide">How to use</span>
            </div>
            <ol className="space-y-3">
              {tool.howToUse.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="shrink-0 flex items-center justify-center size-6 rounded-full bg-foreground text-card font-mono font-bold text-xs mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-foreground/80 leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t-2 border-border pt-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Zap size={14} />
            <span>Instant & live · No sign-up required · Zero watermarks</span>
          </div>
          <Link to="/" className="font-mono underline hover:text-foreground">
            Explore other free tools →
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}


function renderWorkspace(id: string, category: string) {
  // 1. PDF & Documents
  if (category === 'PDF & documents') return <PdfWorkspace id={id} />;

  // 2. Security & Privacy
  if (category === 'Security & privacy') return <DeveloperExtendedWorkspace id={id} />;

  // 3. Extended Developer tools
  if (
    [
      'json-formatter',
      'base64-tool',
      'jwt-decoder',
      'diff-checker',
      'uuid-generator',
      'unix-timestamp',
    ].includes(id)
  ) {
    return <DeveloperExtendedWorkspace id={id} />;
  }

  // 4. Extended Media & Visual tools
  if (['image-compressor', 'qr-generator', 'passport-photo'].includes(id)) {
    return <MediaExtendedWorkspace id={id} />;
  }

  // 5. Business & Everyday tools
  if (category === 'Business & everyday') return <BusinessWorkspace id={id} />;

  // 6. Extended Calculators & Financial tools
  if (
    [
      'unit-converter',
      'loan-calculator',
      'sip-calculator',
      'gst-calculator',
      'bmi-calculator',
    ].includes(id)
  ) {
    return <BusinessWorkspace id={id} />;
  }

  // 7. Stopwatch
  if (id === 'stopwatch') return <BusinessWorkspace id={id} />;

  // 8. Base Calculators
  if (category === 'Calculators') return <CalculatorWorkspace id={id} />;

  // 9. Base Productivity
  if (category === 'Productivity') return <ProductivityWorkspace id={id} />;

  // 10. Base Image & media
  if (category === 'Image & media') return <MediaWorkspace id={id} />;

  // 11. Base Developer
  if (['border-radius', 'emoji-favicon'].includes(id)) return <DeveloperWorkspace id={id} />;

  // 12. Text & writing
  return <TextWorkspace id={id} />;
}
