import React, { useEffect, useRef, useState } from 'react';
import { Header, Sidebar, DemoBanner } from './components/Layout.jsx';
import { useStore } from './state/store.jsx';
import { api } from './state/backend.js';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Induction from './pages/Induction.jsx';
import Repository from './pages/Repository.jsx';
import Assessment from './pages/Assessment.jsx';
import Admin from './pages/Admin.jsx';

const VALID = ['dashboard', 'induction', 'quiz', 'essays', 'repository', 'assessment', 'admin', 'admin-repository', 'admin-quiz'];
const readRoute = () => {
  const h = (window.location.hash || '').replace('#', '');
  return VALID.includes(h) ? h : 'dashboard';
};

export default function App() {
  const { state, d, dispatch, reload } = useStore();
  const [route, setRoute] = useState(readRoute);
  const [menu, setMenu] = useState(false);
  const mainRef = useRef(null);

  useEffect(() => {
    const on = () => {
      setRoute(readRoute());
      mainRef.current?.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  if (state.boot === 'loading') return <Splash text="Connecting to the learning hub…" />;
  if (!state.session) return <Login />;
  if (!state.ready) {
    return state.syncError ? (
      <Splash
        error={state.syncError}
        onRetry={reload}
        onSignOut={async () => {
          await api.signOut().catch(() => {});
          dispatch({ type: 'session/logout' });
        }}
      />
    ) : (
      <Splash text="Loading materials, repository, and your progress…" />
    );
  }

  const adminRoute = route.startsWith('admin');
  let page;
  if (route === 'dashboard') page = <Dashboard />;
  else if (route === 'induction' || route === 'quiz' || route === 'essays') page = <Induction tab={route} />;
  else if (route === 'repository') page = <Repository />;
  else if (adminRoute) page = d.isAdmin ? <Admin tab={route} /> : <NoAccess />;
  else page = <Assessment />;

  return (
    <div className="h-full flex flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-2">
        Skip to content
      </a>
      <Header onMenu={() => setMenu(true)} />
      <div className="flex flex-1 min-h-0">
        <Sidebar route={route} open={menu} onClose={() => setMenu(false)} />
        <main id="main" ref={mainRef} className="flex-1 min-w-0 overflow-y-auto bg-white scroll-thin">
          <div className="max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            {state.syncError && (
              <div role="alert" className="mb-4 flex items-center gap-3 rounded-lg border border-bad/30 bg-bad-soft px-4 py-2.5 text-[13px] text-bad">
                <span className="flex-1">{state.syncError}</span>
                <button type="button" className="font-semibold hover:underline" onClick={() => dispatch({ type: 'sync/error', message: null })}>
                  Dismiss
                </button>
              </div>
            )}
            {!adminRoute && <DemoBanner />}
            {page}
            <footer className="mt-10 pt-5 border-t border-line text-[12px] text-muted flex flex-wrap gap-x-4 gap-y-1 justify-between">
              <span>Illustrative dashboard data, not actual employee records.</span>
              <span>Legal summaries are for learning, not legal advice. Always refer to the official text.</span>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}

function NoAccess() {
  return (
    <div className="rounded-xl border border-line bg-paper p-8 text-center">
      <h1 className="text-[20px] font-bold text-ink">Administrator access required</h1>
      <p className="text-[14px] text-muted mt-2">Sign in with the admin account to manage materials, the repository, and the quiz bank.</p>
      <a href="#dashboard" className="inline-block mt-4 text-[14px] font-semibold text-brand-red hover:underline">
        Back to dashboard
      </a>
    </div>
  );
}

function Splash({ text, error, onRetry, onSignOut }) {
  return (
    <div className="h-full flex items-center justify-center bg-white px-6">
      <div className="text-center max-w-sm">
        <div className="text-brand-red font-extrabold text-[26px] tracking-tight">KOMPAS</div>
        <div className="text-[10.5px] tracking-[0.16em] text-navy-500 font-semibold mt-1">JOURNALISM LEARNING HUB</div>
        {error ? (
          <>
            <p className="mt-6 text-[14px] text-bad">Could not load data: {error}</p>
            <div className="mt-4 flex justify-center gap-3">
              <button type="button" onClick={onRetry} className="h-10 px-4 rounded-lg bg-brand-red text-white text-[14px] font-semibold">Try again</button>
              <button type="button" onClick={onSignOut} className="h-10 px-4 rounded-lg border border-line text-[14px] font-semibold text-navy-700">Sign out</button>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto mt-6 h-1 w-40 overflow-hidden rounded-full bg-navy-100">
              <div className="h-full w-1/3 rounded-full bg-brand-red animate-[slide_1.1s_ease-in-out_infinite]" />
            </div>
            <p className="mt-4 text-[13px] text-muted">{text}</p>
          </>
        )}
      </div>
    </div>
  );
}
