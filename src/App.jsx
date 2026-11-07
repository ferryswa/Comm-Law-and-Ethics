import React, { useEffect, useRef, useState } from 'react';
import { Header, Sidebar, DemoBanner } from './components/Layout.jsx';
import { useStore } from './state/store.jsx';
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
  const { state, d } = useStore();
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

  if (!state.session) return <Login />;

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
