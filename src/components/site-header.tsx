import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Coffee, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TinyToolsLogo } from '@/components/tiny-tools-logo';
import { CreativeFooter } from '@/components/creative-footer';
import { TeaSnacksModal } from '@/components/tea-snacks-modal';

export function SiteHeader() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <header className="site-header">
        <Link to="/" className="brand" aria-label="Tiny Tools Home">
          <TinyToolsLogo size={22} withGlow />
          <span>
            tiny tools<span className="text-primary">.</span>
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/" className="header-tools text-sm font-medium hover:underline">
            All tools
          </Link>

          {/* Fun Tea & Snacks Tipping Button with Message sending */}
          <Button
            variant="tool"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 font-bold shadow-[3px_3px_0_var(--foreground)]"
            title="Buy the developer tea & snacks"
          >
            <Coffee size={16} />
            <span className="hidden sm:inline">Buy me tea & snacks</span>
            <span className="sm:hidden">Tip</span>
            <Sparkles size={14} className="text-foreground fill-primary" />
          </Button>
        </div>
      </header>

      <TeaSnacksModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}

export function SiteFooter() {
  return <CreativeFooter />;
}
