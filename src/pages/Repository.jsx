import React, { useMemo, useState } from 'react';
import { Languages, Search, ExternalLink, ShieldCheck, ShieldAlert, ShieldQuestion, FileSearch, X, Scale, ScrollText, Gavel } from 'lucide-react';
import { useStore } from '../state/store.jsx';
import { DOCS, CATEGORIES, TOPICS, STATUS, CHECKED_ON } from '../data/legal.js';
import { PageTitle, Pill, Empty } from '../components/ui.jsx';

const CAT_ICON = { uu: Scale, etik: ScrollText, mk: Gavel };
const STATUS_ICON = { verified: ShieldCheck, partial: ShieldAlert, unverified: ShieldQuestion };
const norm = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');

export default function Repository() {
  const { state, dispatch } = useStore();
  const query = state.ui.repoQuery || '';
  const setQuery = (q) => dispatch({ type: 'ui/repoQuery', q });
  const [cat, setCat] = useState('all');
  const [topic, setTopic] = useState('all');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('new');

  const results = useMemo(() => {
    const terms = norm(query).split(/\s+/).filter(Boolean);
    let list = DOCS.filter((d) => {
      if (cat !== 'all' && d.category !== cat) return false;
      if (topic !== 'all' && !d.topics.includes(topic)) return false;
      if (status !== 'all' && d.status !== status) return false;
      if (!terms.length) return true;
      const hay = norm([d.short, d.title, d.description, d.source, d.date, ...d.keyPoints].join(' '));
      return terms.every((t) => hay.includes(t));
    });
    list = [...list].sort((a, b) => {
      if (sort === 'new') return b.year - a.year;
      if (sort === 'old') return a.year - b.year;
      return a.title.localeCompare(b.title, 'id');
    });
    return list;
  }, [query, cat, topic, status, sort]);

  const counts = useMemo(() => Object.fromEntries(CATEGORIES.map((c) => [c.id, DOCS.filter((d) => d.category === c.id).length])), []);
  const filtered = query || cat !== 'all' || topic !== 'all' || status !== 'all';

  return (
    <>
      <PageTitle
        title="Repositori Hukum"
        subtitle="Undang-undang, kode etik, pedoman Dewan Pers, dan putusan Mahkamah Konstitusi yang relevan bagi kerja redaksi."
        right={
          <Pill tone="navy" icon={Languages}>
            Master content: Bahasa Indonesia · English version pending
          </Pill>
        }
      />

      <div className="rounded-xl border border-line bg-paper p-4 sm:p-5">
        <div className="text-[13px] text-ink/85 max-w-[90ch]">
          Ringkasan disusun untuk pembelajaran, <strong>bukan nasihat hukum</strong>. Setiap kartu menautkan sumber aslinya dan menandai tingkat verifikasinya (dicek {CHECKED_ON}). Konten bertanda merah belum diverifikasi dan tidak boleh dikutip sebelum dicek ke sumber resmi.
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3 text-[12.5px] text-muted">
          <span className="flex items-center gap-2"><Pill tone="good" icon={ShieldCheck}>Terverifikasi</Pill> dicek langsung di situs resmi</span>
          <span className="flex items-center gap-2"><Pill tone="warn" icon={ShieldAlert}>Sebagian</Pill> nomor/isi terkonfirmasi, naskah belum dibaca langsung</span>
          <span className="flex items-center gap-2"><Pill tone="bad" icon={ShieldQuestion}>Belum diverifikasi</Pill> hanya sumber pihak ketiga</span>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-6 grid gap-3">
        <div className="relative">
          <label htmlFor="repo-search" className="sr-only">Cari dokumen</label>
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" aria-hidden="true" />
          <input
            id="repo-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari judul, nomor, pasal, atau kata kunci (mis. hak jawab, 27A, kerusuhan)"
            className="w-full h-12 rounded-xl border border-line bg-white pl-11 pr-10 text-[14.5px] placeholder:text-navy-300 focus:outline-none focus:border-navy-400"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded text-muted hover:text-ink" aria-label="Hapus pencarian">
              <X size={16} />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter kategori">
            {[{ id: 'all', label: 'Semua', n: DOCS.length }, ...CATEGORIES.map((c) => ({ ...c, n: counts[c.id] }))].map((c) => {
              const active = cat === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCat(c.id)}
                  className={`h-9 rounded-full px-3.5 text-[13px] font-semibold border transition-colors ${
                    active ? 'bg-navy text-white border-navy' : 'bg-white text-navy-700 border-line hover:border-navy-300'
                  }`}
                >
                  {c.label} <span className={`tabular ml-1 ${active ? 'text-white/70' : 'text-muted'}`}>{c.n}</span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            <Select id="f-topic" label="Topik" value={topic} onChange={setTopic} options={[{ id: 'all', label: 'Semua topik' }, ...TOPICS]} />
            <Select
              id="f-status"
              label="Status"
              value={status}
              onChange={setStatus}
              options={[{ id: 'all', label: 'Semua status' }, ...Object.entries(STATUS).map(([id, s]) => ({ id, label: s.label }))]}
            />
            <Select
              id="f-sort"
              label="Urutkan"
              value={sort}
              onChange={setSort}
              options={[
                { id: 'new', label: 'Terbaru' },
                { id: 'old', label: 'Terlama' },
                { id: 'az', label: 'Judul A–Z' },
              ]}
            />
          </div>
        </div>
        <div className="flex items-center justify-between text-[13px] text-muted">
          <span className="tabular" aria-live="polite">
            Menampilkan {results.length} dari {DOCS.length} dokumen
          </span>
          {filtered && (
            <button
              type="button"
              className="font-semibold text-navy-600 hover:text-brand-red"
              onClick={() => {
                setQuery('');
                setCat('all');
                setTopic('all');
                setStatus('all');
              }}
            >
              Hapus semua filter
            </button>
          )}
        </div>
      </div>

      {results.length === 0 ? (
        <Empty icon={FileSearch} title="Tidak ada dokumen yang cocok">
          Coba kata kunci lain, misalnya nomor UU atau nama pasal, atau hapus filter.
        </Empty>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {results.map((d) => (
            <DocCard key={d.id} doc={d} />
          ))}
        </div>
      )}
    </>
  );
}

function Select({ id, label, value, onChange, options }) {
  return (
    <div className="flex items-center">
      <label htmlFor={id} className="sr-only">{label}</label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-lg border border-line bg-white pl-3 pr-8 text-[13px] font-medium text-navy-700 focus:outline-none focus:border-navy-400"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function DocCard({ doc }) {
  const CatIcon = CAT_ICON[doc.category];
  const st = STATUS[doc.status];
  const StIcon = STATUS_ICON[doc.status];
  const catLabel = CATEGORIES.find((c) => c.id === doc.category).label;
  const unverified = doc.status === 'unverified';
  return (
    <article
      className={`flex flex-col rounded-xl bg-white shadow-card border ${
        unverified ? 'border-bad/40 border-dashed' : 'border-line'
      }`}
    >
      <div className="p-5 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-navy-50 px-2 py-1 text-[11.5px] font-semibold text-navy-700">
            <CatIcon size={13} aria-hidden="true" /> {catLabel}
          </span>
          <Pill tone={st.tone} icon={StIcon}>{st.label}</Pill>
          <span className="ml-auto tabular text-[12px] text-muted">{doc.date}</span>
        </div>
        <div className="mt-3 text-[12px] font-bold tracking-wide text-brand-red">{doc.short}</div>
        <h3 className="text-[15.5px] font-bold text-ink leading-snug mt-0.5">{doc.title}</h3>
        <p className="text-[13.5px] text-ink/80 mt-2 leading-relaxed">{doc.description}</p>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {doc.keyPoints.map((k) => (
            <li key={k} className="rounded-md border border-line bg-paper px-2 py-0.5 text-[12px] text-navy-700">
              {k}
            </li>
          ))}
        </ul>
        <div className={`mt-4 rounded-lg px-3 py-2 text-[12px] ${unverified ? 'bg-bad-soft text-bad' : 'bg-paper text-muted'}`}>
          <strong className="font-semibold">Catatan verifikasi:</strong> {doc.note}
        </div>
      </div>
      <div className="border-t border-line px-5 py-3 flex flex-wrap items-center gap-3">
        <span className="text-[12px] text-muted min-w-0 flex-1">
          <span className="font-semibold text-ink/80">Sumber:</span> {doc.source}
        </span>
        <a
          href={doc.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 h-8 text-[12.5px] font-semibold text-navy-700 hover:border-navy-300 hover:text-brand-red"
        >
          Buka sumber <ExternalLink size={13} aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}
