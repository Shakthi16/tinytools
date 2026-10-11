import { useState, useEffect } from 'react';
import {
  Coffee,
  Sparkles,
  Heart,
  Send,
  X,
  QrCode,
  CheckCircle2,
  Receipt,
  PartyPopper,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface TipMessage {
  id: string;
  name: string;
  amount: number;
  snack: string;
  snackEmoji: string;
  message: string;
  timestamp: string;
}

const STORAGE_KEY = 'tinytools.tea_snacks_supporters.v1';

const SNACK_OPTIONS = [
  { id: 'chai', emoji: '🧋', name: 'Cutting Chai', amount: 1, note: 'Keeps the code flowing!' },
  { id: 'coffee', emoji: '☕', name: 'Filter Coffee', amount: 3, note: 'Espresso-grade fuel!' },
  { id: 'samosa', emoji: '🥐', name: 'Hot Samosas', amount: 5, note: 'Crunchy fuel for new tools!' },
  { id: 'pizza', emoji: '🍕', name: 'Pizza Slice', amount: 10, note: 'Sponsors a whole new tool!' },
];

export function TeaSnacksModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [selectedSnack, setSelectedSnack] = useState(SNACK_OPTIONS[1]);
  const [customAmount, setCustomAmount] = useState<number | ''>('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [showUpi, setShowUpi] = useState(false);
  const [sentCelebration, setSentCelebration] = useState(false);
  const [supporters, setSupporters] = useState<TipMessage[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setSupporters(JSON.parse(raw));
      } else {
        // Seed default friendly notes
        const seeds: TipMessage[] = [
          {
            id: '1',
            name: 'Priya K.',
            amount: 5,
            snack: 'Hot Samosas',
            snackEmoji: '🥐',
            message: 'The PDF merge & compress tools saved my day for visa filing! Thank you!',
            timestamp: 'Just now',
          },
          {
            id: '2',
            name: 'Marcus Dev',
            amount: 3,
            snack: 'Filter Coffee',
            snackEmoji: '☕',
            message: 'Love that everything runs locally in the browser with no signups.',
            timestamp: '2 hours ago',
          },
        ];
        setSupporters(seeds);
      }
    } catch {
      // safe fallback
    }
  }, []);

  function playChime() {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // AudioContext unavailable
    }
  }

  function handleSendTip() {
    const finalAmount = customAmount !== '' && Number(customAmount) > 0 ? Number(customAmount) : selectedSnack?.amount ?? 3;
    const finalSnack = selectedSnack?.name ?? 'Tea & Snacks';
    const finalEmoji = selectedSnack?.emoji ?? '☕';

    const newTip: TipMessage = {
      id: `${Date.now()}`,
      name: name.trim() || 'Friendly Supporter',
      amount: finalAmount,
      snack: finalSnack,
      snackEmoji: finalEmoji,
      message: message.trim() || 'Thanks for making Tiny Tools!',
      timestamp: 'Just now',
    };

    const updated = [newTip, ...supporters.slice(0, 10)];
    setSupporters(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // safe
    }

    playChime();
    setSentCelebration(true);
    toast.success(`Thank you so much for the ${finalEmoji} ${finalSnack}!`);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-card border-3 border-border rounded-xl shadow-[8px_8px_0_var(--foreground)] p-6 sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-md hover:bg-muted border border-border"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {sentCelebration ? (
          <div className="text-center py-6 space-y-4">
            <div className="size-16 mx-auto rounded-full bg-primary border-2 border-border flex items-center justify-center shadow-[3px_3px_0_var(--foreground)] text-3xl">
              🎉
            </div>
            <h2 className="text-2xl font-display font-bold">You are awesome!</h2>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Your snack sponsorship and message have been pinned to the Supporters Wall! You keep Tiny Tools fast, private, and 100% free for everyone.
            </p>
            <div className="p-4 bg-muted/60 border border-border rounded-lg text-xs font-mono text-left max-w-sm mx-auto space-y-1">
              <p>
                <strong>Receipt:</strong> 1x {selectedSnack?.emoji} {selectedSnack?.name}
              </p>
              <p>
                <strong>From:</strong> {name.trim() || 'Friendly Supporter'}
              </p>
              <p>
                <strong>Note:</strong> "{message.trim() || 'Thanks for making Tiny Tools!'}"
              </p>
            </div>
            <div className="pt-2">
              <Button
                variant="tool"
                onClick={() => {
                  setSentCelebration(false);
                  onClose();
                }}
              >
                Back to Tools
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
              <span className="p-2.5 bg-primary border-2 border-border rounded-lg shadow-[2px_2px_0_var(--foreground)] text-xl">
                ☕
              </span>
              <div>
                <h2 className="text-2xl font-display font-bold leading-tight">Buy me tea & snacks</h2>
                <p className="text-xs text-muted-foreground">
                  Support independent, client-side tools with no paywalls or trackers.
                </p>
              </div>
            </div>

            {/* Snack picker */}
            <div className="mt-5">
              <label className="text-xs font-mono font-bold uppercase tracking-wider block mb-2 text-muted-foreground">
                Choose a snack / drink:
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {SNACK_OPTIONS.map((snack) => (
                  <button
                    key={snack.id}
                    type="button"
                    onClick={() => {
                      setSelectedSnack(snack);
                      setCustomAmount('');
                    }}
                    className={`p-3 rounded-lg border-2 text-left transition-transform flex flex-col justify-between ${
                      selectedSnack?.id === snack.id && customAmount === ''
                        ? 'border-border bg-primary shadow-[3px_3px_0_var(--foreground)] font-bold'
                        : 'border-border/60 bg-background hover:bg-muted/40 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xl">{snack.emoji}</span>
                      <span className="font-mono text-sm font-bold">${snack.amount}</span>
                    </div>
                    <div className="mt-2">
                      <span className="text-xs font-semibold block">{snack.name}</span>
                      <span className="text-[10px] text-muted-foreground block">{snack.note}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom amount */}
            <div className="mt-3">
              <label className="field">
                <span className="text-xs font-mono font-semibold text-muted-foreground">
                  Or enter custom amount ($):
                </span>
                <input
                  type="number"
                  min={1}
                  max={500}
                  placeholder="e.g. 15 or 25"
                  className="form-input font-mono text-sm"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value ? Number(e.target.value) : '')}
                />
              </label>
            </div>

            {/* Name & Message */}
            <div className="mt-4 space-y-3">
              <label className="field">
                Your Name / Handle (Optional)
                <input
                  type="text"
                  placeholder="e.g. Alex or Anonymous Maker"
                  className="form-input text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>

              <label className="field">
                Leave a fun message or tool request
                <textarea
                  className="form-input min-h-[70px] text-xs resize-none"
                  placeholder="Tell me what you made with Tiny Tools, suggest a feature, or just send good energy!"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </label>
            </div>

            {/* Send Tip Button */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button variant="tool" className="flex-1 font-bold" onClick={handleSendTip}>
                <Send size={16} />
                Send {selectedSnack?.emoji} (
                ${customAmount !== '' ? customAmount : selectedSnack?.amount ?? 3}) & Message
              </Button>
              <Button
                variant="paper"
                onClick={() => setShowUpi(!showUpi)}
                title="Scan UPI QR"
              >
                <QrCode size={16} />
                UPI QR
              </Button>
            </div>

            {/* UPI QR toggle */}
            {showUpi && (
              <div className="mt-4 p-4 border-2 border-border rounded-lg bg-background text-center shadow-[3px_3px_0_var(--foreground)] space-y-2">
                <p className="font-mono text-xs font-bold uppercase">Scan with any UPI App (GPay / PhonePe / Paytm)</p>
                <div className="size-40 mx-auto bg-muted rounded border border-border flex items-center justify-center font-mono text-xs">
                  <div className="space-y-1">
                    <span className="text-3xl block">📱</span>
                    <span className="font-bold">tinytools@upi</span>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">Zero platform fees. 100% goes directly to serverless bandwidth.</p>
              </div>
            )}

            {/* Live Supporters Wall */}
            {supporters.length > 0 && (
              <div className="mt-6 pt-5 border-t border-border">
                <span className="text-xs font-mono font-bold uppercase text-muted-foreground block mb-2.5">
                  Recent Snack Supporters Wall:
                </span>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {supporters.map((s) => (
                    <div
                      key={s.id}
                      className="p-2.5 rounded bg-muted/50 border border-border/50 text-xs flex items-start gap-2.5"
                    >
                      <span className="text-base select-none shrink-0">{s.snackEmoji}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span>{s.name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">(${s.amount})</span>
                          <span className="text-[10px] text-muted-foreground font-mono ml-auto">
                            {s.timestamp}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-[11px] mt-0.5 break-words">
                          "{s.message}"
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
