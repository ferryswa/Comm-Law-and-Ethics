import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Clock3, FileEdit, ExternalLink, Download, X } from 'lucide-react';
import { downloadFile, docFileKey } from '../state/files.js';

export function Card({ className = '', children, as: Tag = 'section', ...rest }) {
  return (
    <Tag className={`bg-white border border-line rounded-xl shadow-card ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

export function CardHeader({ title, subtitle, right, className = '' }) {
  return (
    <div className={`flex flex-wrap items-start justify-between gap-3 px-5 pt-5 ${className}`}>
      <div className="min-w-0">
        <h2 className="text-[15px] font-bold text-ink">{title}</h2>
        {subtitle && <p className="text-[13px] text-muted mt-0.5">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function PageTitle({ title, subtitle, right }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="text-[26px] leading-tight font-bold text-ink tracking-tight">{title}</h1>
        {subtitle && <p className="text-[14px] text-muted mt-1">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

const toneCls = {
  good: 'bg-good-soft text-good border-good/20',
  warn: 'bg-warn-soft text-warn border-warn/20',
  bad: 'bg-bad-soft text-bad border-bad/20',
  navy: 'bg-navy-50 text-navy-700 border-navy-200',
  red: 'bg-brand-red-soft text-brand-red-dark border-brand-red/20',
  plain: 'bg-white text-muted border-line',
};
const toneIcon = { good: CheckCircle2, warn: AlertTriangle, bad: XCircle };

export function Pill({ tone = 'navy', icon, children, className = '' }) {
  const Icon = icon === undefined ? toneIcon[tone] : icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[12px] font-semibold whitespace-nowrap ${toneCls[tone]} ${className}`}>
      {Icon && <Icon size={13} strokeWidth={2.4} aria-hidden="true" />}
      {children}
    </span>
  );
}

export function DemoTag({ children = 'Sample data' }) {
  return (
    <span className="inline-flex items-center rounded border border-dashed border-navy-300 bg-navy-50 px-1.5 py-px text-[10.5px] font-semibold uppercase tracking-wide text-navy-500">
      {children}
    </span>
  );
}

export const ESSAY_STATUS = {
  draft: { label: 'Draft', tone: 'plain', icon: FileEdit },
  pending: { label: 'Awaiting manual review', tone: 'warn', icon: Clock3 },
  approved: { label: 'Approved', tone: 'good' },
  revise: { label: 'Needs revision', tone: 'bad' },
};

export function EssayStatus({ status }) {
  const s = ESSAY_STATUS[status];
  return (
    <Pill tone={s.tone} icon={s.icon}>
      {s.label}
    </Pill>
  );
}

export function Progress({ value, color = 'bg-chart', track = 'bg-chart-track', height = 'h-2', label }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      className={`w-full ${track} ${height} rounded-full overflow-hidden`}
      role="progressbar"
      aria-valuenow={v}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className={`${color} h-full rounded-full transition-[width] duration-500`} style={{ width: `${v}%` }} />
    </div>
  );
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...rest }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:opacity-45 disabled:cursor-not-allowed';
  const sizes = { sm: 'h-8 px-3 text-[13px]', md: 'h-10 px-4 text-[14px]' };
  const variants = {
    primary: 'bg-brand-red text-white hover:bg-brand-red-dark',
    navy: 'bg-navy text-white hover:bg-navy-700',
    outline: 'border border-line bg-white text-ink hover:border-navy-300 hover:bg-navy-50',
    ghost: 'text-navy-700 hover:bg-navy-50',
  };
  return (
    <button type="button" className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function Kpi({ value, unit, label, hint, icon: Icon }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <div className="flex items-center gap-2 text-muted text-[12.5px] font-medium">
        {Icon && <Icon size={15} aria-hidden="true" className="text-navy-400" />}
        {label}
      </div>
      <div className="tabular text-[30px] leading-none font-bold text-ink">
        {value}
        {unit && <span className="text-[16px] font-semibold text-muted ml-0.5">{unit}</span>}
      </div>
      {hint && <div className="text-[12px] text-muted">{hint}</div>}
    </div>
  );
}

// Donut: satu nilai (0–100), satu hue
export function Donut({ value, size = 128, stroke = 14, label = 'Ready' }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, value)) / 100);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Average competency ${value}%`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E7EBF1" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#2C5E9E"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset .6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tabular text-[26px] font-bold text-ink leading-none">{value}%</span>
        <span className="text-[11px] text-muted mt-1">{label}</span>
      </div>
    </div>
  );
}

// Grafik batang menit belajar per hari, dengan tooltip hover
export function ActivityBars({ data, height = 150 }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(30, ...data.map((d) => d.minutes));
  const niceMax = Math.ceil(max / 15) * 15;
  const ticks = [0, niceMax / 2, niceMax];
  return (
    <div className="relative">
      <div className="flex gap-3">
        <div className="flex flex-col justify-between text-[11px] text-muted tabular text-right w-7" style={{ height }}>
          {[...ticks].reverse().map((t) => (
            <span key={t} className="leading-none -translate-y-1">{Math.round(t)}</span>
          ))}
        </div>
        <div className="relative flex-1" style={{ height }}>
          {ticks.map((t) => (
            <div key={t} className="absolute left-0 right-0 border-t border-dashed border-line" style={{ bottom: `${(t / niceMax) * 100}%` }} />
          ))}
          <div className="absolute inset-0 flex items-end gap-[6px] px-1">
            {data.map((d, i) => (
              <div
                key={d.key}
                className="flex-1 h-full flex items-end justify-center cursor-default"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                tabIndex={0}
                aria-label={`${d.label}: ${Math.round(d.minutes)} minutes`}
              >
                <div
                  className={`w-full max-w-[34px] rounded-t-[4px] transition-colors ${d.today ? 'bg-brand-red' : 'bg-chart'} ${hover === i ? 'opacity-80' : ''}`}
                  style={{ height: `${Math.max(d.minutes > 0 ? 3 : 0, (d.minutes / niceMax) * 100)}%` }}
                />
              </div>
            ))}
          </div>
          {hover !== null && (
            <div
              className="absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-md bg-navy px-2.5 py-1.5 text-[12px] text-white shadow-lg pointer-events-none whitespace-nowrap"
              style={{ left: `${((hover + 0.5) / data.length) * 100}%` }}
            >
              <div className="font-semibold">{data[hover].label}</div>
              <div className="tabular">{Math.round(data[hover].minutes)} learning minutes</div>
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-[6px] pl-10 pr-1 mt-2">
        {data.map((d) => (
          <div key={d.key} className={`flex-1 text-center text-[11px] ${d.today ? 'text-brand-red font-semibold' : 'text-muted'}`}>
            {d.short}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Empty({ icon: Icon, title, children }) {
  return (
    <div className="flex flex-col items-center text-center py-12 px-6">
      {Icon && <Icon size={28} className="text-navy-300 mb-3" aria-hidden="true" />}
      <div className="font-semibold text-ink">{title}</div>
      <div className="text-[13px] text-muted mt-1 max-w-sm">{children}</div>
    </div>
  );
}

// ---------- Reference capsules: original source + uploaded document ----------
export function DocActions({ doc, lang = 'en', size = 'md' }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const t = lang === 'id'
    ? { src: 'Sumber Asli', dl: 'Unduh Dokumen', none: 'Belum ada dokumen yang diunggah admin', fail: 'Unduhan diblokir di tampilan ini. Buka situs pages.dev.' }
    : { src: 'Original source', dl: 'Download doc', none: 'No document uploaded by admin yet', fail: 'Download blocked in this preview. Open the pages.dev site.' };
  const h = size === 'sm' ? 'h-7 px-2.5 text-[11.5px]' : 'h-8 px-3 text-[12.5px]';
  const onDownload = async () => {
    setErr('');
    setBusy(true);
    try {
      const ok = await downloadFile(docFileKey(doc.id), doc.file?.name);
      if (!ok) setErr(t.none);
    } catch {
      setErr(t.fail);
    }
    setBusy(false);
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {doc.url ? (
        <a
          href={doc.url}
          target="_blank"
          rel="noreferrer"
          className={`inline-flex items-center gap-1.5 rounded-full border border-navy-200 bg-white ${h} font-semibold text-navy-700 hover:border-navy hover:bg-navy hover:text-white transition-colors`}
        >
          <ExternalLink size={13} aria-hidden="true" /> {t.src}
        </a>
      ) : null}
      <button
        type="button"
        onClick={onDownload}
        disabled={!doc.file || busy}
        title={doc.file ? `${doc.file.name}` : t.none}
        className={`inline-flex items-center gap-1.5 rounded-full ${h} font-semibold transition-colors ${
          doc.file ? 'bg-brand-red text-white hover:bg-brand-red-dark' : 'bg-paper text-navy-300 border border-line cursor-not-allowed'
        }`}
      >
        <Download size={13} aria-hidden="true" /> {t.dl}
        {doc.file && <span className="font-medium opacity-80">· {doc.file.name.split('.').pop().toUpperCase()}</span>}
      </button>
      {err && <span className="text-[11.5px] text-bad">{err}</span>}
    </div>
  );
}

// ---------- In-page modal (no browser dialogs) ----------
export function Modal({ title, subtitle, onClose, children, footer, wide = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-navy-950/50 p-3 sm:p-6 overflow-y-auto" role="dialog" aria-modal="true" aria-label={title}>
      <div className={`w-full ${wide ? 'max-w-[980px]' : 'max-w-[720px]'} rounded-xl bg-white shadow-2xl my-auto flex flex-col max-h-[calc(100vh-24px)] sm:max-h-[calc(100vh-48px)]`}>
        <div className="flex items-start gap-4 px-5 sm:px-6 py-4 border-b border-line">
          <div className="min-w-0 flex-1">
            <h2 className="text-[17px] font-bold text-ink">{title}</h2>
            {subtitle && <p className="text-[12.5px] text-muted mt-0.5">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-muted hover:bg-paper hover:text-ink" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 sm:px-6 py-5 overflow-y-auto scroll-thin flex-1">{children}</div>
        {footer && <div className="px-5 sm:px-6 py-3.5 border-t border-line flex flex-wrap items-center justify-end gap-2 bg-paper/60 rounded-b-xl">{footer}</div>}
      </div>
    </div>
  );
}

export function Field({ label, htmlFor, hint, error, children, className = '' }) {
  return (
    <div className={`grid gap-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="text-[12.5px] font-semibold text-ink">
        {label}
      </label>
      {children}
      {error ? <span className="text-[12px] text-bad">{error}</span> : hint ? <span className="text-[12px] text-muted">{hint}</span> : null}
    </div>
  );
}

export const inputCls =
  'w-full rounded-lg border border-line bg-white px-3 py-2 text-[14px] text-ink placeholder:text-navy-300 focus:outline-none focus:border-navy-400';
