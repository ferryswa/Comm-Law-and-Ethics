import React, { useState } from 'react';
import { LayoutDashboard, BookOpen, Library, ClipboardCheck, Search, UserRound, Menu, X, RotateCcw, Info, Settings2, LogOut } from 'lucide-react';
import { useStore, REMOTE } from '../state/store.jsx';
import { api } from '../state/backend.js';

export const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, match: ['dashboard'] },
  { id: 'induction', label: 'Induction', icon: BookOpen, match: ['induction', 'quiz', 'essays'] },
  { id: 'repository', label: 'Legal Repository', icon: Library, match: ['repository'] },
  { id: 'assessment', label: 'Assessment & Achievement', icon: ClipboardCheck, match: ['assessment'] },
  { id: 'admin', label: 'Administration', icon: Settings2, match: ['admin', 'admin-repository', 'admin-quiz'], admin: true },
];

export function Header({ onMenu }) {
  const { state, dispatch } = useStore();
  const [q, setQ] = useState('');
  const submit = (e) => {
    e.preventDefault();
    dispatch({ type: 'ui/repoQuery', q });
    window.location.hash = 'repository';
  };
  return (
    <header className="bg-[#F3F4F6] border-b border-line">
      <div className="flex items-center gap-4 px-4 md:px-6 h-[72px]">
        <button
          type="button"
          className="md:hidden -ml-1 p-2 rounded-lg text-navy hover:bg-white"
          onClick={onMenu}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        <a href="#dashboard" className="flex flex-col leading-none select-none" aria-label="KOMPAS Journalism Learning Hub, go to dashboard">
          <span className="text-brand-red font-extrabold text-[22px] tracking-tight">KOMPAS</span>
          <span className="text-[10.5px] tracking-[0.14em] text-navy-500 font-semibold mt-1">JOURNALISM LEARNING HUB</span>
        </a>
        <form onSubmit={submit} className="hidden sm:flex items-center ml-auto w-full max-w-[340px]" role="search">
          <label htmlFor="global-search" className="sr-only">Search legal documents</label>
          <div className="relative w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" aria-hidden="true" />
            <input
              id="global-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search laws, articles, court rulings…"
              className="w-full h-10 rounded-lg border border-line bg-white pl-9 pr-3 text-[13.5px] placeholder:text-navy-300 focus:outline-none focus:border-navy-400"
            />
          </div>
        </form>
        <div className="flex items-center gap-3 ml-auto sm:ml-2">
          <div className="hidden lg:block text-right leading-tight">
            <div className="text-[13px] font-semibold text-ink">{state.session.name}</div>
            <div className="text-[11.5px] text-muted">
              {state.session.title}
              {state.session.role === 'admin' && <span className="ml-1.5 rounded bg-brand-red px-1.5 py-px text-[10px] font-bold text-white align-middle">ADMIN</span>}
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-navy text-white flex items-center justify-center" aria-label={`Signed in as ${state.session.name}`}>
            <UserRound size={18} aria-hidden="true" />
          </div>
          <button
            type="button"
            onClick={async () => {
              await api.signOut().catch(() => {});
              dispatch({ type: 'session/logout' });
            }}
            className="h-9 px-2.5 rounded-lg text-[13px] font-semibold text-navy-700 hover:bg-white inline-flex items-center gap-1.5"
            title="Sign out"
          >
            <LogOut size={16} aria-hidden="true" /> <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export function Sidebar({ route, open, onClose }) {
  const { d } = useStore();
  const items = NAV.filter((n) => !n.admin || d.isAdmin);
  const body = (
    <nav className="flex flex-col h-full bg-navy text-white" aria-label="Main menu">
      <div className="px-5 pt-6 pb-3 flex items-center justify-between">
        <span className="text-[12px] font-bold tracking-[0.12em] text-white/90">MENU</span>
        <button type="button" className="md:hidden p-1.5 rounded hover:bg-white/10" onClick={onClose} aria-label="Close menu">
          <X size={18} />
        </button>
      </div>
      <ul className="flex flex-col gap-1 px-3">
        {items.map((n, i) => {
          const active = n.match.includes(route);
          const Icon = n.icon;
          return (
            <li key={n.id}>
              {n.admin && i > 0 && <div className="mx-3 my-2 border-t border-white/10" aria-hidden="true" />}
              {n.admin && <div className="px-3 pb-1 text-[10.5px] font-bold tracking-[0.12em] text-white/45">ADMIN</div>}
              <a
                href={`#${n.id}`}
                onClick={onClose}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 h-11 text-[14px] font-medium transition-colors ${
                  active ? 'bg-navy-600 text-white shadow-[inset_3px_0_0_#D71920]' : 'text-white/75 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={18} aria-hidden="true" />
                {n.label}
              </a>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto m-3 rounded-lg bg-white/5 border border-white/10 p-3.5">
        <div className="text-[11px] uppercase tracking-wider text-white/60 font-semibold">Induction progress</div>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="tabular text-[22px] font-bold">{d.completionPct}%</span>
          <span className="text-[12px] text-white/60">· {d.modulesDone}/{d.lessonCount} modules</span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-white/15 overflow-hidden">
          <div className="h-full bg-brand-red rounded-full" style={{ width: `${d.completionPct}%` }} />
        </div>
        <div className="text-[11.5px] text-white/70 mt-2.5">
          Communication Law &amp; Ethics
          <br />
          <span className="text-white/50">One-week MVP · v0.1</span>
        </div>
      </div>
    </nav>
  );
  return (
    <>
      <aside className="hidden md:block w-[232px] shrink-0">{body}</aside>
      {open && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="w-[260px] h-full shadow-2xl">{body}</div>
          <button type="button" className="flex-1 bg-black/40" onClick={onClose} aria-label="Close menu" />
        </div>
      )}
    </>
  );
}

export function DemoBanner() {
  const { dispatch } = useStore();
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-navy-200 bg-navy-50 px-4 py-2.5 text-[12.5px] text-navy-700 mb-6">
      <Info size={16} className="shrink-0 text-navy-500" aria-hidden="true" />
      <span className="flex-1 min-w-[220px]">
        {REMOTE ? (
          <>
            <strong className="font-semibold">MVP prototype · Supabase.</strong> Your progress is saved to your account. Starting progress, scores, and essays are sample data, not an official Kompas system or employee record.
          </>
        ) : (
          <>
            <strong className="font-semibold">MVP prototype, offline demo.</strong> Progress, scores, and essays are sample data stored in this browser only. Not an official Kompas system or employee record.
          </>
        )}
      </span>
      {confirm ? (
        <span className="flex items-center gap-2">
          <span>Restore all data to the starting state?</span>
          <button
            type="button"
            className="font-semibold text-brand-red hover:underline"
            onClick={() => {
              dispatch({ type: 'reset' });
              setConfirm(false);
            }}
          >
            Yes, reset
          </button>
          <button type="button" className="font-semibold text-navy-600 hover:underline" onClick={() => setConfirm(false)}>
            Cancel
          </button>
        </span>
      ) : (
        <button type="button" onClick={() => setConfirm(true)} className="inline-flex items-center gap-1.5 font-semibold text-navy-700 hover:text-brand-red">
          <RotateCcw size={14} aria-hidden="true" /> Reset demo data
        </button>
      )}
    </div>
  );
}
