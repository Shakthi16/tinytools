import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Scale,
  Calculator,
  Receipt,
  FileSpreadsheet,
  MessageSquare,
  NotebookPen,
  Timer,
  Copy,
  Plus,
  Trash2,
  Printer,
  QrCode,
  Download,
  RotateCcw,
  Play,
  Pause,
  Flag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { copyText } from '@/components/tools/text-workspace';
import { downloadBlob } from '@/lib/tools/files';
import QRCode from 'qrcode';

export function BusinessWorkspace({ id }: { id: string }) {
  if (id === 'unit-converter') return <UnitConverterView />;
  if (id === 'loan-calculator') return <LoanCalculatorView />;
  if (id === 'sip-calculator') return <SipCalculatorView />;
  if (id === 'gst-calculator') return <GstCalculatorView />;
  if (id === 'bmi-calculator') return <BmiCalculatorView />;
  if (id === 'invoice-generator') return <InvoiceGeneratorView />;
  if (id === 'whatsapp-link') return <WhatsAppLinkView />;
  if (id === 'scratchpad') return <ScratchpadView />;
  if (id === 'stopwatch') return <StopwatchView />;

  return <UnitConverterView />;
}

// ---------------------------------------------------------------------------
// 1. UNIVERSAL UNIT CONVERTER
// ---------------------------------------------------------------------------
type UnitCategory = 'length' | 'weight' | 'temp' | 'data' | 'area';

const UNITS: Record<UnitCategory, { name: string; rates: Record<string, number> }> = {
  length: {
    name: 'Length',
    rates: { Meters: 1, Kilometers: 1000, Centimeters: 0.01, Millimeters: 0.001, Miles: 1609.344, Feet: 0.3048, Inches: 0.0254 },
  },
  weight: {
    name: 'Weight / Mass',
    rates: { Kilograms: 1, Grams: 0.001, Milligrams: 0.000001, Pounds: 0.453592, Ounces: 0.0283495 },
  },
  temp: {
    name: 'Temperature',
    rates: { Celsius: 1, Fahrenheit: 1, Kelvin: 1 },
  },
  data: {
    name: 'Digital Data',
    rates: { Bytes: 1, Kilobytes: 1024, Megabytes: 1024 ** 2, Gigabytes: 1024 ** 3, Terabytes: 1024 ** 4 },
  },
  area: {
    name: 'Area',
    rates: { 'Square Meters': 1, 'Square Kilometers': 1000000, 'Square Feet': 0.092903, Acres: 4046.86, Hectares: 10000 },
  },
};

function UnitConverterView() {
  const [cat, setCat] = useState<UnitCategory>('length');
  const [val, setVal] = useState<number>(100);
  const [fromUnit, setFromUnit] = useState('Meters');
  const [toUnit, setToUnit] = useState('Feet');

  useEffect(() => {
    const keys = Object.keys(UNITS[cat].rates);
    setFromUnit(keys[0] || '');
    setToUnit(keys[1] || keys[0] || '');
  }, [cat]);

  const convertedValue = useMemo(() => {
    if (isNaN(val)) return 0;
    if (cat === 'temp') {
      if (fromUnit === toUnit) return val;
      let c = val;
      if (fromUnit === 'Fahrenheit') c = ((val - 32) * 5) / 9;
      if (fromUnit === 'Kelvin') c = val - 273.15;

      if (toUnit === 'Celsius') return Number(c.toFixed(2));
      if (toUnit === 'Fahrenheit') return Number(((c * 9) / 5 + 32).toFixed(2));
      if (toUnit === 'Kelvin') return Number((c + 273.15).toFixed(2));
    }
    const fromRate = UNITS[cat].rates[fromUnit] ?? 1;
    const toRate = UNITS[cat].rates[toUnit] ?? 1;
    const base = val * fromRate;
    return Number((base / toRate).toFixed(4));
  }, [cat, val, fromUnit, toUnit]);

  return (
    <div className="tool-panel max-w-xl">
      <div className="control-row mb-4">
        {(Object.keys(UNITS) as UnitCategory[]).map((k) => (
          <Button
            key={k}
            variant={cat === k ? 'tool' : 'tab'}
            onClick={() => setCat(k)}
          >
            {UNITS[k].name}
          </Button>
        ))}
      </div>

      <div className="editor-grid">
        <div className="space-y-3">
          <label className="field">
            From:
            <select
              className="form-input"
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
            >
              {Object.keys(UNITS[cat].rates).map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </label>
          <input
            type="number"
            className="form-input text-2xl font-mono font-bold"
            value={val}
            onChange={(e) => setVal(Number(e.target.value))}
          />
        </div>

        <div className="space-y-3">
          <label className="field">
            To:
            <select
              className="form-input"
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
            >
              {Object.keys(UNITS[cat].rates).map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </label>
          <div className="form-input text-2xl font-mono font-bold bg-muted/40 flex items-center justify-between">
            <span>{convertedValue}</span>
            <Button variant="ghost" size="icon" onClick={() => void copyText(`${convertedValue} ${toUnit}`)}>
              <Copy size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. EMI & LOAN CALCULATOR
// ---------------------------------------------------------------------------
function LoanCalculatorView() {
  const [principal, setPrincipal] = useState(500000);
  const [rate, setRate] = useState(8.5);
  const [years, setYears] = useState(5);

  const calc = useMemo(() => {
    const monthlyRate = rate / 12 / 100;
    const totalMonths = years * 12;
    if (monthlyRate === 0 || totalMonths === 0) {
      return { emi: principal / (totalMonths || 1), totalInterest: 0, totalAmount: principal };
    }
    const emi =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
      (Math.pow(1 + monthlyRate, totalMonths) - 1);
    const totalAmount = emi * totalMonths;
    const totalInterest = totalAmount - principal;
    return {
      emi: Math.round(emi),
      totalInterest: Math.round(totalInterest),
      totalAmount: Math.round(totalAmount),
    };
  }, [principal, rate, years]);

  return (
    <div className="tool-panel max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <label className="field">
          Loan Amount
          <input
            type="number"
            className="form-input font-mono font-bold"
            value={principal}
            onChange={(e) => setPrincipal(Number(e.target.value))}
          />
        </label>
        <label className="field">
          Interest Rate (%)
          <input
            type="number"
            step="0.1"
            className="form-input font-mono"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
          />
        </label>
        <label className="field">
          Tenure (Years)
          <input
            type="number"
            className="form-input font-mono"
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="p-6 bg-background border-2 border-border rounded-lg shadow-[4px_4px_0_var(--foreground)] grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        <div>
          <span className="text-xs font-mono uppercase text-muted-foreground block">Monthly EMI</span>
          <strong className="text-3xl font-display text-primary-foreground">{calc.emi.toLocaleString()}</strong>
        </div>
        <div>
          <span className="text-xs font-mono uppercase text-muted-foreground block">Total Interest</span>
          <strong className="text-2xl font-display text-destructive">{calc.totalInterest.toLocaleString()}</strong>
        </div>
        <div>
          <span className="text-xs font-mono uppercase text-muted-foreground block">Total Payment</span>
          <strong className="text-2xl font-display">{calc.totalAmount.toLocaleString()}</strong>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. SIP & COMPOUND INTEREST
// ---------------------------------------------------------------------------
function SipCalculatorView() {
  const [monthly, setMonthly] = useState(5000);
  const [expectedRate, setExpectedRate] = useState(12);
  const [tenureYears, setTenureYears] = useState(10);

  const stats = useMemo(() => {
    const i = expectedRate / 12 / 100;
    const n = tenureYears * 12;
    const totalInvested = monthly * n;
    // SIP Formula: M * [( (1 + i)^n - 1 ) / i] * (1 + i)
    const totalValue = Math.round(monthly * ((Math.pow(1 + i, n) - 1) / i) * (1 + i));
    const estimatedReturns = Math.max(0, totalValue - totalInvested);

    return { totalInvested, estimatedReturns, totalValue };
  }, [monthly, expectedRate, tenureYears]);

  return (
    <div className="tool-panel max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <label className="field">
          Monthly Investment
          <input
            type="number"
            className="form-input font-mono font-bold"
            value={monthly}
            onChange={(e) => setMonthly(Number(e.target.value))}
          />
        </label>
        <label className="field">
          Expected Return (p.a %)
          <input
            type="number"
            step="0.5"
            className="form-input font-mono"
            value={expectedRate}
            onChange={(e) => setExpectedRate(Number(e.target.value))}
          />
        </label>
        <label className="field">
          Time Period (Years)
          <input
            type="number"
            className="form-input font-mono"
            value={tenureYears}
            onChange={(e) => setTenureYears(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="p-6 bg-background border-2 border-border rounded-lg shadow-[4px_4px_0_var(--foreground)] grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        <div>
          <span className="text-xs font-mono uppercase text-muted-foreground block">Total Invested</span>
          <strong className="text-2xl font-display">{stats.totalInvested.toLocaleString()}</strong>
        </div>
        <div>
          <span className="text-xs font-mono uppercase text-muted-foreground block">Est. Returns</span>
          <strong className="text-2xl font-display text-emerald-600">+{stats.estimatedReturns.toLocaleString()}</strong>
        </div>
        <div>
          <span className="text-xs font-mono uppercase text-muted-foreground block">Total Maturity Value</span>
          <strong className="text-3xl font-display">{stats.totalValue.toLocaleString()}</strong>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. GST & VAT TAX CALCULATOR
// ---------------------------------------------------------------------------
function GstCalculatorView() {
  const [amount, setAmount] = useState(1000);
  const [gstRate, setGstRate] = useState(18);
  const [mode, setMode] = useState<'exclusive' | 'inclusive'>('exclusive');

  const result = useMemo(() => {
    if (mode === 'exclusive') {
      const gstAmount = (amount * gstRate) / 100;
      const total = amount + gstAmount;
      return { base: amount, gst: gstAmount, total };
    } else {
      const base = (amount * 100) / (100 + gstRate);
      const gstAmount = amount - base;
      return { base: Number(base.toFixed(2)), gst: Number(gstAmount.toFixed(2)), total: amount };
    }
  }, [amount, gstRate, mode]);

  return (
    <div className="tool-panel max-w-xl">
      <div className="control-row mb-4">
        <Button
          variant={mode === 'exclusive' ? 'tool' : 'tab'}
          onClick={() => setMode('exclusive')}
        >
          Add GST (Exclusive)
        </Button>
        <Button
          variant={mode === 'inclusive' ? 'tool' : 'tab'}
          onClick={() => setMode('inclusive')}
        >
          Remove GST (Inclusive)
        </Button>
      </div>

      <div className="space-y-4">
        <label className="field">
          Initial Amount
          <input
            type="number"
            className="form-input font-mono text-xl font-bold"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </label>

        <div className="control-row">
          <span className="text-sm font-medium">Standard Slabs:</span>
          {[5, 12, 18, 28].map((r) => (
            <Button
              key={r}
              variant={gstRate === r ? 'tool' : 'tab'}
              onClick={() => setGstRate(r)}
            >
              {r}%
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-6 p-5 bg-background border-2 border-border rounded-lg shadow-[4px_4px_0_var(--foreground)] space-y-2 font-mono text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Net Base Amount:</span>
          <strong>{result.base.toLocaleString()}</strong>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">GST Tax ({gstRate}%):</span>
          <strong className="text-destructive">+{result.gst.toLocaleString()}</strong>
        </div>
        <div className="flex justify-between pt-2 border-t border-border text-base font-bold">
          <span>Gross Total:</span>
          <span>{result.total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5. BMI & DAILY CALORIE CALCULATOR
// ---------------------------------------------------------------------------
function BmiCalculatorView() {
  const [heightCm, setHeightCm] = useState(175);
  const [weightKg, setWeightKg] = useState(70);
  const [age, setAge] = useState(28);
  const [gender, setGender] = useState<'m' | 'f'>('m');

  const { bmi, category, bmr, tdee } = useMemo(() => {
    const hM = heightCm / 100;
    const bmiVal = Number((weightKg / (hM * hM)).toFixed(1));
    let cat = 'Normal weight';
    if (bmiVal < 18.5) cat = 'Underweight';
    else if (bmiVal >= 25 && bmiVal < 30) cat = 'Overweight';
    else if (bmiVal >= 30) cat = 'Obesity';

    // Mifflin-St Jeor formula for BMR
    let bmrVal = 10 * weightKg + 6.25 * heightCm - 5 * age + (gender === 'm' ? 5 : -161);
    let tdeeVal = Math.round(bmrVal * 1.375); // light activity

    return { bmi: bmiVal, category: cat, bmr: Math.round(bmrVal), tdee: tdeeVal };
  }, [heightCm, weightKg, age, gender]);

  return (
    <div className="tool-panel max-w-xl">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <label className="field">
          Height (cm)
          <input
            type="number"
            className="form-input font-mono font-bold"
            value={heightCm}
            onChange={(e) => setHeightCm(Number(e.target.value))}
          />
        </label>
        <label className="field">
          Weight (kg)
          <input
            type="number"
            className="form-input font-mono font-bold"
            value={weightKg}
            onChange={(e) => setWeightKg(Number(e.target.value))}
          />
        </label>
        <label className="field">
          Age
          <input
            type="number"
            className="form-input font-mono"
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
          />
        </label>
        <label className="field">
          Gender
          <select
            className="form-input"
            value={gender}
            onChange={(e) => setGender(e.target.value as 'm' | 'f')}
          >
            <option value="m">Male</option>
            <option value="f">Female</option>
          </select>
        </label>
      </div>

      <div className="p-6 bg-background border-2 border-border rounded-lg shadow-[4px_4px_0_var(--foreground)] grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        <div>
          <span className="text-xs font-mono uppercase text-muted-foreground block">BMI Score</span>
          <strong className="text-3xl font-display">{bmi}</strong>
          <span className="text-xs font-mono text-muted-foreground block mt-1">{category}</span>
        </div>
        <div>
          <span className="text-xs font-mono uppercase text-muted-foreground block">Basal Metabolic Rate</span>
          <strong className="text-2xl font-display">{bmr} kcal</strong>
          <span className="text-xs font-mono text-muted-foreground block mt-1">At rest</span>
        </div>
        <div>
          <span className="text-xs font-mono uppercase text-muted-foreground block">Maintenance (TDEE)</span>
          <strong className="text-2xl font-display text-emerald-600">{tdee} kcal</strong>
          <span className="text-xs font-mono text-muted-foreground block mt-1">Light active</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 6. INVOICE & QUOTE GENERATOR
// ---------------------------------------------------------------------------
interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

function InvoiceGeneratorView() {
  const [fromName, setFromName] = useState('My Studio / Freelancer');
  const [clientName, setClientName] = useState('Acme Corp');
  const [invoiceNo, setInvoiceNo] = useState(`INV-${new Date().getFullYear()}-001`);
  const [taxRate, setTaxRate] = useState(10);
  const [items, setItems] = useState<LineItem[]>([
    { id: '1', description: 'Web Application Development', quantity: 1, rate: 1200 },
    { id: '2', description: 'UI/UX Design & Branding', quantity: 1, rate: 600 },
  ]);

  function addItem() {
    setItems((prev) => [
      ...prev,
      { id: `${Date.now()}`, description: 'Consulting & Services', quantity: 1, rate: 100 },
    ]);
  }

  function updateItem(id: string, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const tax = (subtotal * taxRate) / 100;
  const total = subtotal + tax;

  return (
    <div className="tool-panel">
      <div className="control-row mb-6">
        <Button variant="tool" onClick={() => window.print()}>
          <Printer size={16} /> Print or Save as PDF
        </Button>
      </div>

      <div className="p-8 border-2 border-border rounded-lg bg-background shadow-[4px_4px_0_var(--foreground)] space-y-6">
        <div className="flex flex-wrap justify-between gap-6 pb-6 border-b-2 border-border">
          <div className="space-y-2 min-w-48">
            <span className="text-xs font-mono uppercase text-muted-foreground block">From</span>
            <input
              type="text"
              className="form-input font-bold"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
            />
          </div>
          <div className="space-y-2 min-w-48 text-right">
            <span className="text-xs font-mono uppercase text-muted-foreground block">Invoice #</span>
            <input
              type="text"
              className="form-input font-mono font-bold text-right"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2 max-w-sm">
          <span className="text-xs font-mono uppercase text-muted-foreground block">Bill To</span>
          <input
            type="text"
            className="form-input font-bold"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />
        </div>

        {/* Itemized table */}
        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-2 font-mono text-xs font-bold text-muted-foreground border-b pb-1">
            <span className="col-span-6">Description</span>
            <span className="col-span-2 text-center">Qty</span>
            <span className="col-span-2 text-right">Rate ($)</span>
            <span className="col-span-2 text-right">Amount ($)</span>
          </div>

          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
              <input
                type="text"
                className="col-span-6 form-input text-xs"
                value={item.description}
                onChange={(e) => updateItem(item.id, { description: e.target.value })}
              />
              <input
                type="number"
                min={1}
                className="col-span-2 form-input text-xs text-center font-mono"
                value={item.quantity}
                onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) })}
              />
              <input
                type="number"
                className="col-span-2 form-input text-xs text-right font-mono"
                value={item.rate}
                onChange={(e) => updateItem(item.id, { rate: Number(e.target.value) })}
              />
              <div className="col-span-2 flex items-center justify-end gap-1 font-mono text-sm font-bold">
                ${(item.quantity * item.rate).toLocaleString()}
                <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}

          <Button variant="paper" size="sm" onClick={addItem}>
            <Plus size={14} /> Add Line Item
          </Button>
        </div>

        {/* Totals */}
        <div className="border-t-2 border-border pt-4 flex justify-end">
          <div className="w-64 space-y-2 font-mono text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>${subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Tax ({taxRate}%):</span>
              <span>${tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
              <span>Total Due:</span>
              <span>${total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 7. WHATSAPP LINK & QR BUILDER
// ---------------------------------------------------------------------------
function WhatsAppLinkView() {
  const [phone, setPhone] = useState('15551234567');
  const [message, setMessage] = useState('Hi! I saw your profile and would love to chat.');
  const [qrUrl, setQrUrl] = useState('');

  const waLink = useMemo(() => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) return '';
    return `https://wa.me/${cleanPhone}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
  }, [phone, message]);

  useEffect(() => {
    if (!waLink) {
      setQrUrl('');
      return;
    }
    void (async () => {
      try {
        const url = await QRCode.toDataURL(waLink, { width: 300, margin: 2 });
        setQrUrl(url);
      } catch {
        setQrUrl('');
      }
    })();
  }, [waLink]);

  return (
    <div className="tool-panel">
      <div className="editor-grid">
        <div className="space-y-4">
          <label className="field">
            Phone Number (include country code, digits only)
            <input
              type="text"
              className="form-input font-mono font-bold"
              placeholder="e.g. 15551234567 or 919876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>

          <label className="field">
            Pre-filled Message
            <textarea
              className="editor min-h-[140px]"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hello! Can we schedule a quick call?"
            />
          </label>

          {waLink && (
            <div className="control-row">
              <Button variant="tool" onClick={() => void copyText(waLink, 'WhatsApp link copied!')}>
                <Copy size={16} /> Copy WhatsApp Link
              </Button>
              <Button asChild variant="paper">
                <a href={waLink} target="_blank" rel="noopener noreferrer">
                  Test Link
                </a>
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center justify-center p-6 border-2 border-border rounded-lg bg-background shadow-[4px_4px_0_var(--foreground)] text-center">
          {qrUrl ? (
            <div className="space-y-3">
              <img src={qrUrl} alt="WhatsApp QR code" className="size-48 object-contain rounded mx-auto" />
              <p className="text-xs text-muted-foreground font-mono">Scan to start WhatsApp chat directly</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Enter phone number to generate QR</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 8. PRIVATE AUTOSAVING SCRATCHPAD
// ---------------------------------------------------------------------------
const SCRATCH_KEY = 'tinytools.scratchpad.content.v1';

function ScratchpadView() {
  const [content, setContent] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SCRATCH_KEY);
      if (saved) setContent(saved);
    } catch {
      // localStorage unavailable
    }
  }, []);

  function handleChange(val: string) {
    setContent(val);
    try {
      localStorage.setItem(SCRATCH_KEY, val);
    } catch {
      // safe
    }
  }

  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const chars = content.length;

  return (
    <div className="tool-panel">
      <div className="control-row mb-3">
        <Button variant="paper" onClick={() => void copyText(content)}>
          <Copy size={16} /> Copy Notes
        </Button>
        <Button
          variant="ghost"
          onClick={() => downloadBlob(new Blob([content], { type: 'text/markdown' }), 'scratchpad.md')}
        >
          <Download size={16} /> Export as Markdown
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            if (confirm('Clear scratchpad?')) handleChange('');
          }}
          className="ml-auto text-destructive"
        >
          Clear
        </Button>
      </div>

      <textarea
        className="editor font-mono text-base min-h-[400px] leading-relaxed"
        placeholder="Type anything here… Automatically saved to your local browser storage."
        value={content}
        onChange={(e) => handleChange(e.target.value)}
      />

      <div className="mt-3 flex items-center justify-between text-xs font-mono text-muted-foreground">
        <span>Autosaved locally</span>
        <span>{words} words · {chars} characters</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 9. PRECISION STOPWATCH & LAP TIMER
// ---------------------------------------------------------------------------
function StopwatchView() {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [laps, setLaps] = useState<number[]>([]);
  const startRef = useRef(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning) {
      startRef.current = performance.now() - elapsedMs;
      intervalRef.current = window.setInterval(() => {
        setElapsedMs(performance.now() - startRef.current);
      }, 30);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  function handleStartPause() {
    setIsRunning(!isRunning);
  }

  function handleLap() {
    if (isRunning) setLaps((prev) => [elapsedMs, ...prev]);
  }

  function handleReset() {
    setIsRunning(false);
    setElapsedMs(0);
    setLaps([]);
  }

  const minutes = Math.floor(elapsedMs / 60000);
  const seconds = Math.floor((elapsedMs % 60000) / 1000);
  const ms = Math.floor((elapsedMs % 1000) / 10);

  return (
    <div className="tool-panel max-w-xl text-center">
      <div className="timer-face font-mono tracking-widest text-6xl sm:text-7xl font-bold py-10">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}.
        <span className="text-4xl sm:text-5xl text-muted-foreground">{String(ms).padStart(2, '0')}</span>
      </div>

      <div className="control-row justify-center gap-4">
        <Button variant="tool" className="text-base px-6 h-12" onClick={handleStartPause}>
          {isRunning ? <Pause /> : <Play />}
          {isRunning ? 'Pause' : 'Start'}
        </Button>
        <Button variant="paper" className="text-base px-6 h-12" disabled={!isRunning} onClick={handleLap}>
          <Flag /> Lap
        </Button>
        <Button variant="ghost" className="text-base px-6 h-12" onClick={handleReset}>
          <RotateCcw /> Reset
        </Button>
      </div>

      {laps.length > 0 && (
        <div className="mt-8 border-2 border-border rounded-lg bg-background p-4 max-h-56 overflow-y-auto space-y-2 shadow-[4px_4px_0_var(--foreground)]">
          <span className="font-mono text-xs font-bold uppercase text-muted-foreground block mb-2">
            Recorded Laps ({laps.length})
          </span>
          {laps.map((lap, i) => {
            const m = Math.floor(lap / 60000);
            const s = Math.floor((lap % 60000) / 1000);
            const milli = Math.floor((lap % 1000) / 10);
            return (
              <div key={i} className="flex justify-between font-mono text-xs border-b border-border/40 py-1">
                <span>Lap #{laps.length - i}</span>
                <strong>
                  {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}.{String(milli).padStart(2, '0')}
                </strong>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
