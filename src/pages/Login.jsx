import React, { useState } from 'react';
import { LogIn, Eye, EyeOff, ShieldCheck, GraduationCap } from 'lucide-react';
import { useStore } from '../state/store.jsx';
import { api } from '../state/backend.js';
import hero from '../assets/hero.webp';

export default function Login() {
  const { dispatch } = useStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Enter your username and password.');
      return;
    }
    setBusy(true);
    try {
      const session = await api.signIn(username, password);
      dispatch({ type: 'session/login', session: { ...session, at: new Date().toISOString() } });
      if (!window.location.hash) window.location.hash = 'dashboard';
    } catch (err) {
      setError(err.message || 'Sign-in failed. Check your connection and try again.');
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-full flex items-center bg-white overflow-hidden">
      <img src={hero} alt="" className="absolute inset-0 w-full h-full object-cover object-right" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-white/0 md:via-white/70" aria-hidden="true" />
      <div className="relative w-full max-w-[1180px] mx-auto px-5 sm:px-10 py-10">
        <div className="w-full max-w-[420px]">
          <div className="leading-none select-none">
            <div className="text-brand-red font-extrabold text-[30px] tracking-tight">KOMPAS</div>
            <div className="text-[11.5px] tracking-[0.16em] text-navy-500 font-semibold mt-1.5">JOURNALISM LEARNING HUB</div>
          </div>
          <h1 className="text-[30px] sm:text-[34px] leading-[1.12] font-bold text-ink tracking-tight mt-8">
            Communication Law &amp; Ethics for the newsroom
          </h1>
          <p className="text-[14.5px] text-muted mt-3 max-w-[38ch]">
            Induction videos, a verified legal repository, and assessments in one place.
          </p>

          <form onSubmit={submit} className="mt-8 rounded-2xl bg-white/95 backdrop-blur border border-line shadow-xl p-6 grid gap-4" noValidate>
            <div className="grid gap-1.5">
              <label htmlFor="login-user" className="text-[12.5px] font-semibold text-ink">Username</label>
              <input
                id="login-user"
                autoComplete="username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                className="h-11 rounded-lg border border-line px-3.5 text-[14.5px] focus:outline-none focus:border-navy-400"
                placeholder="admin"
              />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="login-pass" className="text-[12.5px] font-semibold text-ink">Password</label>
              <div className="relative">
                <input
                  id="login-pass"
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  className="w-full h-11 rounded-lg border border-line pl-3.5 pr-11 text-[14.5px] focus:outline-none focus:border-navy-400"
                  placeholder="••••••"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded text-muted hover:text-ink"
                  aria-label={show ? 'Hide password' : 'Show password'}
                >
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            {error && (
              <div role="alert" className="rounded-lg bg-bad-soft text-bad text-[13px] px-3 py-2">
                {error}
              </div>
            )}
            <button type="submit" disabled={busy} className="h-11 rounded-lg bg-brand-red text-white font-semibold text-[14.5px] hover:bg-brand-red-dark disabled:opacity-60 inline-flex items-center justify-center gap-2">
              <LogIn size={17} /> {busy ? 'Signing in…' : 'Sign in'}
            </button>
            <div className="rounded-lg bg-navy-50 border border-navy-100 px-3.5 py-3 text-[12.5px] text-navy-700 grid gap-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <ShieldCheck size={14} aria-hidden="true" /> Demo accounts
              </div>
              <div>
                <code className="font-semibold">admin / admin</code> · administrator (all modules + Admin)
              </div>
              <div>
                <code className="font-semibold">learner / learner</code> · learner view only
              </div>
            </div>
          </form>
          <p className="mt-4 flex gap-1.5 text-[12px] text-muted max-w-[420px]">
            <GraduationCap size={14} className="shrink-0 mt-px" aria-hidden="true" />
            This Web Site is intended solely for academic purposes as part of the Communication Law and Ethics coursework at the University of Queensland.
          </p>
        </div>
      </div>
    </div>
  );
}
