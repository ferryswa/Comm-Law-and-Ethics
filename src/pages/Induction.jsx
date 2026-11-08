import React, { useEffect, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, RotateCw, CheckCircle2, Circle, Lock, Film, ListChecks, PenLine, BookMarked,
  ChevronLeft, ChevronRight, Send, Pencil, ChevronDown, XCircle,
} from 'lucide-react';
import { useStore } from '../state/store.jsx';
import { COMPETENCIES } from '../data/lessons.js';
import { api } from '../state/backend.js';
import { MIN_WORDS } from '../data/essays.js';
import { Card, PageTitle, Pill, Progress, Button, EssayStatus, DemoTag, DocActions } from '../components/ui.jsx';
import { wordCount } from '../state/store.jsx';

const SPEED = 20; // 1 real second = 20 video seconds (simulation)
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

const TABS = [
  { id: 'induction', label: 'Video Lessons', icon: Film },
  { id: 'quiz', label: 'Quiz · 15 questions', icon: ListChecks },
  { id: 'essays', label: 'Essays · 3 prompts', icon: PenLine },
];

export default function Induction({ tab }) {
  const { d } = useStore();
  return (
    <>
      <PageTitle
        title="Induction Learning"
        subtitle={`${d.lessonCount} core videos (${d.totalMinutes} minutes), an auto-scored multiple-choice quiz, and manually reviewed essays.`}
        right={<Pill tone="navy" icon={null}>{d.modulesDone}/{d.lessonCount} videos completed</Pill>}
      />
      <div role="tablist" aria-label="Induction sections" className="flex gap-1 border-b border-line mb-6 overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = t.id === tab;
          return (
            <a
              key={t.id}
              role="tab"
              aria-selected={active}
              href={`#${t.id}`}
              className={`flex items-center gap-2 px-4 h-11 text-[14px] font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
                active ? 'border-brand-red text-ink' : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              <Icon size={16} aria-hidden="true" />
              {t.label}
            </a>
          );
        })}
      </div>
      {tab === 'induction' && <VideoSection />}
      {tab === 'quiz' && <QuizSection />}
      {tab === 'essays' && <EssaySection />}
    </>
  );
}

/* ---------------------------------- VIDEO ---------------------------------- */

function VideoSection() {
  const { state, dispatch, d } = useStore();
  const lesson = d.lessonRows.find((l) => l.id === state.ui.lesson) || d.lessonRows[0];
  const selected = lesson?.id;
  if (!lesson) return <Card className="p-8 text-center text-muted">No induction materials yet. An administrator can add them under Administration.</Card>;
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {d.lessonRows.map((l) => {
          const active = l.id === selected;
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => dispatch({ type: 'ui/lesson', id: l.id })}
              aria-pressed={active}
              className={`text-left rounded-xl border p-3.5 transition-colors ${
                active ? 'border-navy bg-navy text-white' : 'border-line bg-white hover:border-navy-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[11.5px] font-bold tracking-wider ${active ? 'text-white/70' : 'text-navy-400'}`}>MODULE {l.no}</span>
                {l.completed ? (
                  <CheckCircle2 size={16} className={active ? 'text-white' : 'text-good'} aria-label="Completed" />
                ) : (
                  <span className={`tabular text-[11.5px] ${active ? 'text-white/70' : 'text-muted'}`}>{l.pct}%</span>
                )}
              </div>
              <div className="text-[13.5px] font-semibold leading-snug mt-1.5">{l.title}</div>
              <div className={`text-[12px] mt-1 ${active ? 'text-white/65' : 'text-muted'}`}>
                {l.minutes} minutes
              </div>
              <div className="mt-3">
                <Progress
                  value={l.pct}
                  height="h-1"
                  color={active ? 'bg-brand-red' : l.completed ? 'bg-chart' : 'bg-brand-red'}
                  track={active ? 'bg-white/20' : 'bg-chart-track'}
                  label={`Progress: ${l.title}`}
                />
              </div>
            </button>
          );
        })}
      </div>
      <Player key={lesson.id} lesson={lesson} />
    </div>
  );
}

function useVideoSrc(lesson) {
  const [src, setSrc] = useState(lesson.video?.kind === 'url' ? lesson.video.url : null);
  useEffect(() => {
    let alive = true;
    let objUrl = null;
    if (lesson.video?.kind === 'file') {
      api
        .videoUrl(lesson)
        .then((u) => {
          if (u && u.startsWith('blob:')) objUrl = u;
          if (alive) setSrc(u);
        })
        .catch(() => alive && setSrc(null));
    } else {
      setSrc(lesson.video?.kind === 'url' ? lesson.video.url : null);
    }
    return () => {
      alive = false;
      if (objUrl) URL.revokeObjectURL(objUrl);
    };
  }, [lesson.id, lesson.video?.kind, lesson.video?.url, lesson.video?.uploadedAt]); // eslint-disable-line react-hooks/exhaustive-deps
  return src;
}

function Player({ lesson }) {
  const { dispatch, d } = useStore();
  const total = Math.max(1, lesson.minutes * 60);
  const [pos, setPos] = useState(lesson.completed ? 0 : Math.min(lesson.watched, total));
  const [playing, setPlaying] = useState(false);
  const maxSeek = lesson.completed ? total : Math.max(lesson.watched, pos);
  const posRef = useRef(pos);
  const videoRef = useRef(null);
  const videoSrc = useVideoSrc(lesson);
  const real = !!videoSrc;

  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  // Simulated playback (placeholder video)
  useEffect(() => {
    if (!playing || real) return undefined;
    const timer = setInterval(() => {
      const np = Math.min(total, posRef.current + SPEED * 0.5);
      posRef.current = np;
      setPos(np);
      dispatch({ type: 'video/progress', id: lesson.id, position: np });
      if (np >= total) setPlaying(false);
    }, 500);
    return () => clearInterval(timer);
  }, [playing, real, total, lesson.id, dispatch]);

  // Real video: map media time to lesson time
  const scale = () => {
    const v = videoRef.current;
    return v && v.duration && Number.isFinite(v.duration) ? total / v.duration : 1;
  };
  const lastSent = useRef(0);
  const onTime = () => {
    const v = videoRef.current;
    if (!v) return;
    const lp = Math.min(total, v.currentTime * scale());
    setPos(lp);
    if (Math.abs(lp - lastSent.current) >= 2 || v.ended) {
      lastSent.current = lp;
      dispatch({ type: 'video/progress', id: lesson.id, position: v.ended ? total : lp });
    }
  };

  const chapters = lesson.chapters.length ? lesson.chapters : [{ t: 0, title: lesson.title, points: [] }];
  const chIndex = chapters.reduce((acc, c, i) => (pos >= c.t ? i : acc), 0);
  const ch = chapters[chIndex];
  const seek = (s) => {
    const target = Math.max(0, Math.min(maxSeek, s));
    if (real && videoRef.current) {
      videoRef.current.currentTime = target / scale();
      videoRef.current.play?.().catch(() => {});
    }
    setPos(target);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">
        {/* Screen */}
        {real ? (
          <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
            <video
              ref={videoRef}
              src={videoSrc}
              controls
              preload="metadata"
              className="w-full h-full"
              onTimeUpdate={onTime}
              onEnded={onTime}
              onLoadedMetadata={() => {
                if (videoRef.current && !lesson.completed) videoRef.current.currentTime = Math.min(lesson.watched, total) / scale();
              }}
            >
              <track kind="captions" />
            </video>
            <span className="absolute top-3 left-3 rounded bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white pointer-events-none">
              {lesson.video.kind === 'file' ? `Uploaded video · ${lesson.video.name}` : 'Video from URL'}
            </span>
          </div>
        ) : (
          <div className="relative aspect-video rounded-xl overflow-hidden bg-navy text-white">
            <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_100%_0%,#26365A_0%,#17243B_55%,#0F1828_100%)]" />
            <div className="absolute top-0 left-0 right-0 flex flex-wrap items-center gap-2 p-3 sm:p-4">
              <span className="rounded bg-brand-red px-2 py-0.5 text-[10.5px] font-bold tracking-wider">PLACEHOLDER VIDEO</span>
              <span className="text-[11.5px] text-white/70">Video not yet produced · simulated playback {SPEED}×</span>
            </div>
            <div className="absolute inset-0 flex flex-col justify-center px-5 sm:px-10 pt-10 pb-16">
              <div className="text-[11px] sm:text-[12px] font-semibold tracking-[0.14em] text-white/55">
                MODULE {lesson.no} · CHAPTER {chIndex + 1} OF {chapters.length}
              </div>
              <div className="text-[18px] sm:text-[26px] font-bold leading-tight mt-1.5 max-w-[30ch]">{ch.title}</div>
              <ul className="mt-3 sm:mt-4 grid gap-1.5 sm:gap-2 max-w-[62ch] text-[12px] sm:text-[14px] text-white/85">
                {ch.points.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-brand-red shrink-0" aria-hidden="true" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
            {!playing && pos === 0 && (
              <button
                type="button"
                onClick={() => setPlaying(true)}
                className="absolute inset-0 flex items-center justify-center bg-navy-950/40 hover:bg-navy-950/30 transition-colors"
                aria-label="Play simulated video"
              >
                <span className="w-16 h-16 rounded-full bg-brand-red flex items-center justify-center shadow-xl">
                  <Play size={28} fill="currentColor" className="ml-1" />
                </span>
              </button>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 sm:px-4 pt-6 pb-3">
              <label htmlFor={`scrub-${lesson.id}`} className="sr-only">Video position</label>
              <div className="relative h-1.5 rounded-full bg-white/20">
                <div className="absolute inset-y-0 left-0 rounded-full bg-white/35" style={{ width: `${(maxSeek / total) * 100}%` }} />
                <div className="absolute inset-y-0 left-0 rounded-full bg-brand-red" style={{ width: `${(pos / total) * 100}%` }} />
                {chapters.slice(1).map((c) => (
                  <span key={c.t} className="absolute top-0 bottom-0 w-[2px] bg-navy" style={{ left: `${(c.t / total) * 100}%` }} aria-hidden="true" />
                ))}
                <input
                  id={`scrub-${lesson.id}`}
                  type="range"
                  min={0}
                  max={total}
                  step={1}
                  value={pos}
                  onChange={(e) => seek(Number(e.target.value))}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-1 sm:gap-2 mt-2">
                <button type="button" onClick={() => setPlaying((p) => !p)} className="p-2 rounded hover:bg-white/10" aria-label={playing ? 'Pause' : 'Play'}>
                  {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                </button>
                <button type="button" onClick={() => seek(pos - 30)} className="p-2 rounded hover:bg-white/10" aria-label="Back 30 seconds">
                  <RotateCcw size={16} />
                </button>
                <button type="button" onClick={() => seek(pos + 30)} className="p-2 rounded hover:bg-white/10" aria-label="Forward 30 seconds (up to the part already watched)">
                  <RotateCw size={16} />
                </button>
                <span className="tabular text-[12.5px] text-white/85 ml-1">
                  {fmt(pos)} / {fmt(total)}
                </span>
                <span className="ml-auto text-[11.5px] text-white/60 hidden sm:inline">Skipping ahead is limited to the part already watched</span>
              </div>
            </div>
          </div>
        )}

        {/* About */}
        <Card className="mt-5 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[12px] font-semibold text-muted">
                Module {lesson.no} · {lesson.minutes} minutes
              </div>
              <h2 className="text-[18px] font-bold text-ink mt-0.5">{lesson.title}</h2>
            </div>
            {lesson.completed ? (
              <Pill tone="good">Completed</Pill>
            ) : (
              <Button variant="outline" size="sm" onClick={() => dispatch({ type: 'video/complete', id: lesson.id })}>
                <CheckCircle2 size={15} /> Mark complete (demo)
              </Button>
            )}
          </div>
          <p className="text-[14px] text-ink/85 mt-2 max-w-[70ch] leading-relaxed">{lesson.summary}</p>
          {lesson.refs.length > 0 && (
            <div className="mt-5">
              <h3 className="text-[12.5px] font-semibold text-muted flex items-center gap-1.5">
                <BookMarked size={14} aria-hidden="true" /> References
              </h3>
              <ul className="mt-2 divide-y divide-line rounded-lg border border-line">
                {lesson.refs.map((r) => {
                  const doc = d.docMap[r];
                  if (!doc) return null;
                  return (
                    <li key={r} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3.5 py-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="text-[12px] font-bold text-brand-red">{doc.short}</div>
                        <div className="text-[13px] text-ink leading-snug truncate" title={doc.title}>{doc.title}</div>
                      </div>
                      <DocActions doc={doc} size="sm" />
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </Card>
      </div>

      {/* Chapters */}
      <Card className="self-start">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-ink">Chapters</h2>
          <span className="tabular text-[12.5px] text-muted">{lesson.pct}% watched</span>
        </div>
        <ol className="pb-3">
          {chapters.map((c, i) => {
            const end = chapters[i + 1]?.t ?? total;
            const done = maxSeek >= end - 1;
            const locked = c.t > maxSeek;
            const active = i === chIndex;
            return (
              <li key={`${c.t}-${i}`}>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => seek(c.t)}
                  title={locked ? 'Watch the previous chapter first' : `Jump to ${fmt(c.t)}`}
                  className={`w-full flex gap-3 px-5 py-3 text-left transition-colors ${
                    active ? 'bg-navy-50 shadow-[inset_3px_0_0_#D71920]' : 'hover:bg-paper'
                  } disabled:cursor-not-allowed`}
                >
                  <span className="mt-0.5 shrink-0">
                    {done ? (
                      <CheckCircle2 size={17} className="text-good" aria-label="Completed" />
                    ) : locked ? (
                      <Lock size={16} className="text-navy-300" aria-label="Locked" />
                    ) : (
                      <Circle size={17} className="text-navy-400" aria-label="Not completed" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-[13.5px] font-semibold leading-snug ${locked ? 'text-muted' : 'text-ink'}`}>
                      {i + 1}. {c.title}
                    </span>
                    <span className="tabular block text-[12px] text-muted mt-0.5">
                      {fmt(c.t)} – {fmt(end)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        {real && (
          <p className="px-5 pb-4 -mt-1 text-[11.5px] text-muted">Key points for each chapter appear in the placeholder view; with a real video, use the chapter list to jump.</p>
        )}
      </Card>
    </div>
  );
}

/* ---------------------------------- QUIZ ---------------------------------- */

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const compLabel = (id) => COMPETENCIES.find((c) => c.id === id)?.label;

function QuizSection() {
  const { state, d } = useStore();
  const hasDraft = Object.keys(state.quiz.draft).length > 0;
  const [mode, setMode] = useState(hasDraft ? 'taking' : 'intro');
  const [showReview, setShowReview] = useState(null); // attempt id

  if (mode === 'taking') return <QuizTaking onDone={(id) => { setShowReview(id); setMode('intro'); }} />;

  const attempt = (showReview && d.attempts.find((a) => a.id === showReview)) || d.latest;
  return (
    <div className="grid gap-6">
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex-1 min-w-[240px]">
            <h2 className="text-[18px] font-bold text-ink">Law & Ethics Knowledge Quiz</h2>
            <p className="text-[13.5px] text-muted mt-1 max-w-[60ch]">
              {d.questionCount} multiple-choice questions across the induction modules, scored automatically. The pass mark is <strong className="text-ink">{d.passingPct}%</strong> (at least {d.minCorrect} correct). Attempts are unlimited; your best score counts toward passing.
            </p>
          </div>
          <Button onClick={() => setMode('taking')}>
            <ListChecks size={17} /> {hasDraft ? 'Resume quiz' : d.attempts.length ? 'Start a new attempt' : 'Start quiz'}
          </Button>
        </div>
      </Card>
      {attempt && <QuizResult attempt={attempt} />}
    </div>
  );
}

function QuizTaking({ onDone }) {
  const { state, dispatch, d } = useStore();
  const QUESTIONS = state.content.questions;
  const idx = Math.min(state.quiz.current, Math.max(0, QUESTIONS.length - 1));
  const q = QUESTIONS[idx];
  const [confirm, setConfirm] = useState(false);
  if (!q) return <Card className="p-8 text-center text-muted">The quiz bank is empty. An administrator can add questions under Administration.</Card>;
  const chosen = state.quiz.draft[q.id];
  const allAnswered = d.quizAnswered === QUESTIONS.length;

  const submit = () => {
    dispatch({ type: 'quiz/submit' });
    onDone(null);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
      <Card className="p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <span className="text-[12.5px] font-semibold text-muted tabular">
            Question {idx + 1} of {QUESTIONS.length}
          </span>
          <Pill tone="navy" icon={null}>{compLabel(q.comp)}</Pill>
        </div>
        <div className="mt-3">
          <Progress value={((idx + 1) / QUESTIONS.length) * 100} height="h-1" color="bg-navy" label="Question position" />
        </div>
        <fieldset className="mt-6">
          <legend className="text-[17px] sm:text-[18px] font-semibold text-ink leading-snug max-w-[62ch]">{q.q}</legend>
          <div className="mt-5 grid gap-2.5">
            {q.options.map((o, i) => {
              const sel = chosen === i;
              return (
                <label
                  key={o}
                  className={`flex items-start gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
                    sel ? 'border-navy bg-navy-50' : 'border-line hover:border-navy-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={q.id}
                    id={`${q.id}-${i}`}
                    checked={sel}
                    onChange={() => dispatch({ type: 'quiz/answer', qid: q.id, option: i })}
                    className="sr-only"
                  />
                  <span
                    className={`w-7 h-7 shrink-0 rounded-full border flex items-center justify-center text-[12.5px] font-bold ${
                      sel ? 'bg-navy border-navy text-white' : 'border-navy-200 text-navy-500'
                    }`}
                    aria-hidden="true"
                  >
                    {LETTERS[i]}
                  </span>
                  <span className="text-[14.5px] text-ink pt-0.5">{o}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Button variant="outline" disabled={idx === 0} onClick={() => dispatch({ type: 'quiz/goto', index: idx - 1 })}>
            <ChevronLeft size={16} /> Previous
          </Button>
          {idx < QUESTIONS.length - 1 ? (
            <Button variant="navy" onClick={() => dispatch({ type: 'quiz/goto', index: idx + 1 })}>
              Next <ChevronRight size={16} />
            </Button>
          ) : null}
          <div className="ml-auto flex items-center gap-3">
            {confirm ? (
              <>
                <span className="text-[13px] text-muted">Submit your answers? The score is calculated immediately.</span>
                <Button variant="outline" size="sm" onClick={() => setConfirm(false)}>Cancel</Button>
                <Button size="sm" onClick={submit}>
                  <Send size={14} /> Yes, submit
                </Button>
              </>
            ) : (
              <Button disabled={!allAnswered} onClick={() => setConfirm(true)} title={allAnswered ? '' : 'Answer every question first'}>
                <Send size={16} /> Submit answers
              </Button>
            )}
          </div>
        </div>
      </Card>
      <Card className="p-5 self-start">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-bold text-ink">Question navigator</h2>
          <span className="tabular text-[12.5px] text-muted">
            {d.quizAnswered}/{QUESTIONS.length} answered
          </span>
        </div>
        <div className="grid grid-cols-5 gap-2 mt-4">
          {QUESTIONS.map((qq, i) => {
            const answered = state.quiz.draft[qq.id] !== undefined;
            const cur = i === idx;
            return (
              <button
                key={qq.id}
                type="button"
                onClick={() => dispatch({ type: 'quiz/goto', index: i })}
                aria-label={`Question ${i + 1}${answered ? ', answered' : ''}`}
                aria-current={cur ? 'step' : undefined}
                className={`tabular h-9 rounded-md text-[13px] font-semibold border transition-colors ${
                  cur ? 'border-brand-red text-brand-red bg-white ring-1 ring-brand-red' : answered ? 'bg-navy text-white border-navy' : 'border-line text-muted hover:border-navy-300'
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
        <p className="text-[12px] text-muted mt-4">Answers save automatically. You can leave and resume later.</p>
      </Card>
    </div>
  );
}

function QuizResult({ attempt }) {
  const { state, d } = useStore();
  const QUESTIONS = attempt.questions || state.content.questions;
  const passMark = attempt.passingPct ?? d.passingPct;
  const [open, setOpen] = useState(false);
  const passed = attempt.pct >= passMark;
  const date = new Date(attempt.at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
  return (
    <Card>
      <div className="p-5 sm:p-6 flex flex-wrap gap-6 items-center">
        <div className={`w-[92px] h-[92px] rounded-full flex flex-col items-center justify-center shrink-0 border-[6px] ${passed ? 'border-good' : 'border-bad'}`}>
          <span className="tabular text-[24px] font-bold text-ink leading-none">{attempt.pct}%</span>
          <span className="text-[11px] text-muted mt-1 tabular">{attempt.correct}/{attempt.total}</span>
        </div>
        <div className="flex-1 min-w-[220px]">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[16px] font-bold text-ink">Latest attempt result</h2>
            <Pill tone={passed ? 'good' : 'bad'}>{passed ? 'Passed' : 'Not passed'}</Pill>
            {attempt.sample && <DemoTag />}
          </div>
          <p className="text-[13px] text-muted mt-1">
            {date} · pass mark {passMark}%
          </p>
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5 mt-4">
            {COMPETENCIES.filter((c) => attempt.byComp[c.id]?.total).map((c) => {
              const b = attempt.byComp[c.id];
              return (
                <div key={c.id}>
                  <div className="flex justify-between text-[12.5px]">
                    <span className="text-ink">{c.label}</span>
                    <span className="tabular text-muted">{b.correct}/{b.total}</span>
                  </div>
                  <div className="mt-1">
                    <Progress value={(b.correct / b.total) * 100} height="h-1.5" label={`Accuracy: ${c.label}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between border-t border-line px-5 sm:px-6 h-12 text-[13.5px] font-semibold text-navy-700 hover:bg-paper"
      >
        Review answers and explanations
        <ChevronDown size={18} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ol className="border-t border-line divide-y divide-line">
          {QUESTIONS.map((q, i) => {
            const a = attempt.answers[q.id];
            const ok = a === q.answer;
            const doc = d.docMap[q.ref];
            return (
              <li key={q.id} className="px-5 sm:px-6 py-4">
                <div className="flex gap-3">
                  {ok ? <CheckCircle2 size={18} className="text-good shrink-0 mt-0.5" aria-label="Correct" /> : <XCircle size={18} className="text-bad shrink-0 mt-0.5" aria-label="Incorrect" />}
                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold text-ink">
                      {i + 1}. {q.q}
                    </div>
                    <div className="text-[13px] mt-1.5 grid gap-0.5">
                      <span className={ok ? 'text-good' : 'text-bad'}>
                        Your answer: {a === undefined ? '—' : `${LETTERS[a]}. ${q.options[a]}`}
                      </span>
                      {!ok && <span className="text-good">Correct answer: {LETTERS[q.answer]}. {q.options[q.answer]}</span>}
                    </div>
                    <p className="text-[13px] text-muted mt-1.5 max-w-[75ch]">{q.why}</p>
                    {doc && (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-[12px] font-semibold text-muted">Source: {doc.short}</span>
                        <DocActions doc={doc} size="sm" />
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}

/* ---------------------------------- ESSAYS ---------------------------------- */

function EssaySection() {
  const { d } = useStore();
  return (
    <div className="grid gap-6">
      <div className="rounded-lg border border-line bg-paper px-4 py-3 text-[13px] text-muted flex flex-wrap items-center gap-x-4 gap-y-1">
        <span>
          At least <strong className="text-ink">{MIN_WORDS} words</strong> per essay. Essays are reviewed manually by a newsroom reviewer; the status changes to <em>Awaiting manual review</em> once submitted.
        </span>
        <span className="tabular ml-auto">
          {d.essaysApproved}/3 approved · {d.essaysPending} awaiting
        </span>
      </div>
      {d.essayRows.map((e, i) => (
        <EssayCard key={e.id} essay={e} index={i} />
      ))}
    </div>
  );
}

function EssayCard({ essay, index }) {
  const { dispatch } = useStore();
  const [rubric, setRubric] = useState(false);
  const [confirmEdit, setConfirmEdit] = useState(false);
  const locked = essay.status === 'pending' || essay.status === 'approved';
  const words = wordCount(essay.text);
  const canSubmit = !locked && words >= MIN_WORDS;
  const fmtDate = (s) => (s ? new Date(s).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '');

  return (
    <Card>
      <div className="px-5 sm:px-6 pt-5 flex flex-wrap items-start gap-3 justify-between">
        <div className="min-w-0">
          <div className="text-[12px] font-semibold text-muted">
            Essay {index + 1} · {compLabel(essay.comp)}
          </div>
          <h2 className="text-[16px] font-bold text-ink mt-0.5">{essay.title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {essay.sample && <DemoTag />}
          <EssayStatus status={essay.status} />
        </div>
      </div>
      <p className="px-5 sm:px-6 mt-3 text-[14px] text-ink/85 leading-relaxed max-w-[78ch]">{essay.prompt}</p>
      <div className="px-5 sm:px-6 mt-2">
        <button type="button" onClick={() => setRubric((r) => !r)} aria-expanded={rubric} className="text-[12.5px] font-semibold text-navy-600 hover:text-brand-red inline-flex items-center gap-1">
          Assessment criteria <ChevronDown size={14} className={`transition-transform ${rubric ? 'rotate-180' : ''}`} />
        </button>
        {rubric && (
          <ul className="mt-2 grid gap-1 text-[13px] text-muted list-disc pl-5">
            {essay.rubric.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        )}
      </div>
      <div className="px-5 sm:px-6 mt-4">
        <label htmlFor={`essay-${essay.id}`} className="sr-only">
          Essay answer {index + 1}
        </label>
        <textarea
          id={`essay-${essay.id}`}
          value={essay.text}
          readOnly={locked}
          onChange={(e) => dispatch({ type: 'essay/edit', id: essay.id, text: e.target.value })}
          rows={8}
          placeholder="Write your answer here…"
          className={`w-full rounded-lg border px-4 py-3 text-[14px] leading-relaxed text-ink placeholder:text-navy-300 focus:outline-none focus:border-navy-400 resize-y ${
            locked ? 'bg-paper border-line text-ink/80' : 'bg-white border-line'
          }`}
        />
      </div>
      {essay.note && (essay.status === 'approved' || essay.status === 'revise') && (
        <div className={`mx-5 sm:mx-6 mt-3 rounded-lg px-4 py-3 text-[13px] ${essay.status === 'approved' ? 'bg-good-soft text-good' : 'bg-bad-soft text-bad'}`}>
          <strong className="font-semibold">{essay.reviewer}:</strong> {essay.note}
        </div>
      )}
      <div className="px-5 sm:px-6 py-4 mt-3 border-t border-line flex flex-wrap items-center gap-3">
        <span className={`tabular text-[12.5px] ${words >= MIN_WORDS ? 'text-good' : 'text-muted'}`}>
          {words} / {MIN_WORDS} words
        </span>
        <span className="text-[12px] text-muted">
          {essay.status === 'pending' && `Submitted ${fmtDate(essay.submittedAt)}`}
          {essay.status === 'approved' && `Approved ${fmtDate(essay.reviewedAt)}`}
          {essay.status === 'draft' && 'Draft saved automatically'}
          {essay.status === 'revise' && 'Revise and resubmit'}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {locked ? (
            confirmEdit ? (
              <>
                <span className="text-[12.5px] text-muted">The essay will return to draft and must be resubmitted.</span>
                <Button variant="outline" size="sm" onClick={() => setConfirmEdit(false)}>Cancel</Button>
                <Button
                  variant="navy"
                  size="sm"
                  onClick={() => {
                    dispatch({ type: 'essay/edit', id: essay.id, text: essay.text });
                    setConfirmEdit(false);
                  }}
                >
                  Yes, edit
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setConfirmEdit(true)}>
                <Pencil size={14} /> Edit answer
              </Button>
            )
          ) : (
            <Button size="sm" disabled={!canSubmit} onClick={() => dispatch({ type: 'essay/submit', id: essay.id })} title={canSubmit ? '' : `At least ${MIN_WORDS} words`}>
              <Send size={14} /> Submit for review
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

