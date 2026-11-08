import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { LESSONS, COMPETENCIES } from '../data/lessons.js';
import { QUESTIONS, SAMPLE_ATTEMPT_ANSWERS, scoreAnswers, PASSING_PCT } from '../data/quiz.js';
import { ESSAYS, SAMPLE_ESSAY_TEXT, MIN_WORDS } from '../data/essays.js';
import { DOCS } from '../data/legal.js';
import { api, REMOTE } from './backend.js';

const KEYS = { progress: 'kompas-hub-progress-v3', content: 'kompas-hub-content-v1', session: 'kompas-hub-session-v1' };
const QUIZ_MINUTES = 15;
const ESSAY_MINUTES = 20;

export { REMOTE };

const dayKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
};
export const uid = (prefix) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
export const wordCount = (t) => (t.trim() ? t.trim().split(/\s+/).length : 0);
const snapshotQuestions = (qs) => qs.map(({ id, comp, q, options, answer, why, ref }) => ({ id, comp, q, options, answer, why, ref }));

// ---------------- Seeds ----------------
export function seedContent() {
  return {
    version: 1,
    lessons: LESSONS.map(({ no, ...l }) => ({ ...l, video: null })),
    questions: QUESTIONS.map((q) => ({ ...q })),
    docs: DOCS.map((d) => ({ ...d, file: null })),
    settings: { passingPct: PASSING_PCT },
  };
}

export function seedProgress() {
  const sampleScore = scoreAnswers(SAMPLE_ATTEMPT_ANSWERS, QUESTIONS, PASSING_PCT);
  return {
    version: 3,
    lessons: {
      l1: { watched: 15 * 60, completed: true, chapter: 3 },
      l2: { watched: 20 * 60, completed: true, chapter: 3 },
      l3: { watched: 20 * 60, completed: true, chapter: 3 },
      l4: { watched: 5 * 60, completed: false, chapter: 0 },
    },
    quiz: {
      draft: {},
      current: 0,
      attempts: [
        { id: 'seed-1', at: daysAgo(2), answers: SAMPLE_ATTEMPT_ANSWERS, questions: snapshotQuestions(QUESTIONS), ...sampleScore, sample: true },
      ],
    },
    essays: {
      e1: {
        text: SAMPLE_ESSAY_TEXT.e1,
        status: 'approved',
        submittedAt: daysAgo(4),
        reviewedAt: daysAgo(3),
        reviewer: 'Newsroom reviewer (sample)',
        note: 'Correct analysis of the verification exception. Sample demo data.',
        sample: true,
      },
      e2: { text: SAMPLE_ESSAY_TEXT.e2, status: 'pending', submittedAt: daysAgo(1), sample: true },
      e3: { text: '', status: 'draft' },
    },
    activity: [
      { at: daysAgo(6), minutes: 15, label: 'Video 01 completed', sample: true },
      { at: daysAgo(5), minutes: 20, label: 'Video 02 completed', sample: true },
      { at: daysAgo(4), minutes: 20, label: 'Essay 1 submitted', sample: true },
      { at: daysAgo(3), minutes: 20, label: 'Video 03 completed', sample: true },
      { at: daysAgo(2), minutes: 15, label: 'Quiz attempt 1', sample: true },
      { at: daysAgo(1), minutes: 20, label: 'Essay 2 submitted', sample: true },
      { at: daysAgo(1), minutes: 5, label: 'Video 04 started', sample: true },
    ],
    ui: { repoQuery: '', lesson: 'l4' },
  };
}

function read(key, check) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const v = JSON.parse(raw);
      if (check(v)) return v;
    }
  } catch {
    /* storage unavailable */
  }
  return null;
}
function write(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function load() {
  if (REMOTE) {
    // Supabase: session, content and progress arrive asynchronously
    return { boot: 'loading', ready: false, syncError: null, session: null, content: seedContent(), ...seedProgress() };
  }
  return {
    boot: 'done',
    ready: true,
    syncError: null,
    session: read(KEYS.session, (v) => v && v.username),
    content: read(KEYS.content, (v) => v && v.version === 1) || seedContent(),
    ...(read(KEYS.progress, (v) => v && v.version === 3) || seedProgress()),
  };
}

const progressOf = (state) => ({ version: 3, lessons: state.lessons, quiz: state.quiz, essays: state.essays, activity: state.activity, ui: state.ui });

function logActivity(state, minutes, label) {
  if (minutes <= 0) return state.activity;
  const today = dayKey(new Date());
  const last = state.activity[state.activity.length - 1];
  if (last && !last.sample && dayKey(last.at) === today && last.label === label) {
    return [...state.activity.slice(0, -1), { ...last, minutes: last.minutes + minutes }];
  }
  return [...state.activity, { at: new Date().toISOString(), minutes, label }];
}

const lessonProgress = (state, id) => state.lessons[id] || { watched: 0, completed: false, chapter: 0 };
const upsert = (list, item) => (list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item]);
const setContent = (state, patch) => ({ ...state, content: { ...state.content, ...patch } });

function reducer(state, action) {
  switch (action.type) {
    // ---- session ----
    case 'session/login':
      return { ...state, session: action.session, ready: !REMOTE, syncError: null };
    case 'session/logout':
      return { ...state, session: null, ready: !REMOTE };
    case 'boot/done':
      return { ...state, boot: 'done', session: action.session || null };
    case 'remote/loaded':
      return { ...state, content: action.content, ...(action.progress?.version === 3 ? action.progress : seedProgress()), ready: true, syncError: null };
    case 'sync/error':
      return { ...state, syncError: action.message };
    case 'content/replace':
      return { ...state, content: action.content };

    // ---- learner progress ----
    case 'video/progress': {
      const lesson = state.content.lessons.find((l) => l.id === action.id);
      if (!lesson) return state;
      const total = lesson.minutes * 60;
      const prev = lessonProgress(state, action.id);
      const watched = Math.min(total, Math.max(prev.watched, action.position));
      const completed = prev.completed || watched >= total * 0.95;
      const chapter = lesson.chapters.reduce((acc, c, i) => (action.position >= c.t ? i : acc), 0);
      const idx = state.content.lessons.indexOf(lesson);
      return {
        ...state,
        lessons: { ...state.lessons, [action.id]: { watched, completed, chapter } },
        activity: logActivity(state, (watched - prev.watched) / 60, `Watched video ${String(idx + 1).padStart(2, '0')}`),
      };
    }
    case 'video/complete': {
      const lesson = state.content.lessons.find((l) => l.id === action.id);
      if (!lesson) return state;
      const total = lesson.minutes * 60;
      const prev = lessonProgress(state, action.id);
      const idx = state.content.lessons.indexOf(lesson);
      return {
        ...state,
        lessons: { ...state.lessons, [action.id]: { ...prev, watched: total, completed: true } },
        activity: logActivity(state, Math.max(0, total - prev.watched) / 60, `Watched video ${String(idx + 1).padStart(2, '0')}`),
      };
    }
    case 'quiz/answer':
      return { ...state, quiz: { ...state.quiz, draft: { ...state.quiz.draft, [action.qid]: action.option } } };
    case 'quiz/goto':
      return { ...state, quiz: { ...state.quiz, current: action.index } };
    case 'quiz/submit': {
      const qs = state.content.questions;
      const result = scoreAnswers(state.quiz.draft, qs, state.content.settings.passingPct);
      const attempt = { id: uid('a'), at: new Date().toISOString(), answers: state.quiz.draft, questions: snapshotQuestions(qs), ...result };
      return {
        ...state,
        quiz: { draft: {}, current: 0, attempts: [...state.quiz.attempts, attempt] },
        activity: logActivity(state, QUIZ_MINUTES, `Quiz attempt ${state.quiz.attempts.length + 1}`),
      };
    }
    case 'essay/edit': {
      const prev = state.essays[action.id];
      return { ...state, essays: { ...state.essays, [action.id]: { text: action.text, status: 'draft', revisedFrom: prev.status !== 'draft' ? prev.status : prev.revisedFrom } } };
    }
    case 'essay/submit': {
      const prev = state.essays[action.id];
      return {
        ...state,
        essays: { ...state.essays, [action.id]: { ...prev, status: 'pending', submittedAt: new Date().toISOString(), note: undefined, reviewer: undefined, sample: false } },
        activity: logActivity(state, ESSAY_MINUTES, `Essay ${action.id.slice(1)} submitted`),
      };
    }
    case 'essay/review': {
      const prev = state.essays[action.id];
      return {
        ...state,
        essays: { ...state.essays, [action.id]: { ...prev, status: action.decision, reviewedAt: new Date().toISOString(), reviewer: action.reviewer, note: action.note } },
      };
    }
    case 'ui/repoQuery':
      return { ...state, ui: { ...state.ui, repoQuery: action.q } };
    case 'ui/lesson':
      return { ...state, ui: { ...state.ui, lesson: action.id } };
    case 'reset':
      return { ...state, ...seedProgress() };

    // ---- admin content ----
    case 'content/lesson/save':
      return setContent(state, { lessons: upsert(state.content.lessons, action.lesson) });
    case 'content/lesson/delete':
      return setContent(state, { lessons: state.content.lessons.filter((l) => l.id !== action.id) });
    case 'content/lesson/move': {
      const list = [...state.content.lessons];
      const i = list.findIndex((l) => l.id === action.id);
      const j = i + action.dir;
      if (i < 0 || j < 0 || j >= list.length) return state;
      [list[i], list[j]] = [list[j], list[i]];
      return setContent(state, { lessons: list });
    }
    case 'content/doc/save':
      return setContent(state, { docs: upsert(state.content.docs, action.doc) });
    case 'content/doc/file':
      return setContent(state, { docs: state.content.docs.map((d) => (d.id === action.id ? { ...d, file: action.file } : d)) });
    case 'content/doc/delete':
      return setContent(state, {
        docs: state.content.docs.filter((d) => d.id !== action.id),
        lessons: state.content.lessons.map((l) => ({ ...l, refs: l.refs.filter((r) => r !== action.id) })),
        questions: state.content.questions.map((q) => (q.ref === action.id ? { ...q, ref: '' } : q)),
      });
    case 'content/question/save':
      return setContent(state, { questions: upsert(state.content.questions, action.question) });
    case 'content/question/delete':
      return setContent(state, { questions: state.content.questions.filter((q) => q.id !== action.id) });
    case 'content/settings':
      return setContent(state, { settings: { ...state.content.settings, ...action.settings } });
    case 'content/reset':
      return { ...state, content: seedContent() };
    default:
      return state;
  }
}

// ---------- Selectors: single source of truth for every module ----------
export function derive(state) {
  const { content } = state;
  const passingPct = content.settings.passingPct;
  const docMap = Object.fromEntries(content.docs.map((d) => [d.id, d]));

  const lessonRows = content.lessons.map((l, i) => {
    const s = lessonProgress(state, l.id);
    const total = Math.max(1, l.minutes * 60);
    const watched = Math.min(s.watched, total);
    const chapter = Math.min(s.chapter || 0, Math.max(0, l.chapters.length - 1));
    return { ...l, ...s, watched, chapter, no: String(i + 1).padStart(2, '0'), pct: Math.round((watched / total) * 100) };
  });
  const lessonCount = lessonRows.length;
  const totalMinutes = lessonRows.reduce((a, l) => a + l.minutes, 0);
  const watchedMin = lessonRows.reduce((a, l) => a + l.watched / 60, 0);
  const completionPct = totalMinutes ? Math.round((watchedMin / totalMinutes) * 100) : 0;
  const modulesDone = lessonRows.filter((l) => l.completed).length;

  const attempts = state.quiz.attempts;
  const latest = attempts[attempts.length - 1] || null;
  const best = attempts.reduce((b, a) => (!b || a.pct > b.pct ? a : b), null);
  const quizPassed = !!best && best.pct >= passingPct;
  const questionCount = content.questions.length;
  const minCorrect = Math.ceil((questionCount * passingPct) / 100);

  const minutesTotal = state.activity.reduce((acc, a) => acc + a.minutes, 0);
  const hours = minutesTotal / 60;

  const essayRows = ESSAYS.map((e) => ({ ...e, ...state.essays[e.id], words: wordCount(state.essays[e.id].text) }));
  const essaysApproved = essayRows.filter((e) => e.status === 'approved').length;
  const essaysPending = essayRows.filter((e) => e.status === 'pending').length;

  // Competency = average of (video progress of related lessons) and (best-attempt quiz accuracy in that category)
  const competencies = COMPETENCIES.map((c) => {
    const ls = lessonRows.filter((l) => l.competency === c.id);
    const videoPct = ls.length ? Math.round(ls.reduce((a, l) => a + l.pct, 0) / ls.length) : null;
    const bc = best?.byComp?.[c.id];
    const quizPct = bc && bc.total ? Math.round((bc.correct / bc.total) * 100) : null;
    const parts = [videoPct, quizPct].filter((x) => x !== null);
    const value = parts.length ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length) : 0;
    return { ...c, videoPct: videoPct ?? 0, quizPct: quizPct ?? 0, value };
  });
  const competencyAvg = Math.round(competencies.reduce((a, c) => a + c.value, 0) / competencies.length);

  const criteria = [
    { id: 'modules', label: `Complete all ${lessonCount} induction videos`, met: lessonCount > 0 && modulesDone === lessonCount, detail: `${modulesDone}/${lessonCount} modules` },
    { id: 'quiz', label: `Quiz score of at least ${passingPct}%`, met: quizPassed, detail: best ? `Best score ${best.pct}%` : 'Not attempted' },
    { id: 'essays', label: `${ESSAYS.length} essays approved by a reviewer`, met: essaysApproved === ESSAYS.length, detail: `${essaysApproved}/${ESSAYS.length} approved` },
  ];
  let overall;
  if (criteria.every((c) => c.met)) overall = { key: 'pass', label: 'Passed', tone: 'good' };
  else if (latest && !quizPassed) overall = { key: 'fail', label: 'Not Passed', tone: 'bad', reason: `Quiz score below ${passingPct}%` };
  else if (modulesDone < lessonCount) overall = { key: 'progress', label: 'In Progress', tone: 'warn', reason: 'Induction videos incomplete' };
  else overall = { key: 'review', label: 'Awaiting Review', tone: 'warn', reason: 'Essays awaiting manual approval' };

  const nextLesson = lessonRows.find((l) => !l.completed) || null;
  const qids = new Set(content.questions.map((q) => q.id));
  const quizAnswered = Object.keys(state.quiz.draft).filter((k) => qids.has(k)).length;

  return {
    passingPct, docMap, lessonRows, lessonCount, totalMinutes, completionPct, modulesDone, attempts, latest, best, quizPassed,
    questionCount, minCorrect, hours, minutesTotal, essayRows, essaysApproved, essaysPending, competencies, competencyAvg,
    criteria, overall, nextLesson, quizAnswered, MIN_WORDS, isAdmin: state.session?.role === 'admin',
  };
}

const StoreCtx = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  const { session, content } = state;
  const userId = session?.userId;

  // ---- local mode: persist everything in this browser ----
  useEffect(() => {
    if (!REMOTE) write(KEYS.session, session);
  }, [session]);
  useEffect(() => {
    if (!REMOTE) write(KEYS.content, content);
  }, [content]);
  useEffect(() => {
    if (!REMOTE) write(KEYS.progress, progressOf(state));
  }, [state.lessons, state.quiz, state.essays, state.activity, state.ui]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Supabase mode: restore session, load content + progress, save progress ----
  useEffect(() => {
    if (!REMOTE) return undefined;
    api.restore().then((s) => dispatch({ type: 'boot/done', session: s })).catch(() => dispatch({ type: 'boot/done', session: null }));
    return api.onAuthChange((event) => {
      if (event === 'SIGNED_OUT') dispatch({ type: 'session/logout' });
    });
  }, []);

  const [reloadKey, setReloadKey] = React.useState(0);
  useEffect(() => {
    if (!REMOTE || !userId) return undefined;
    let alive = true;
    Promise.all([api.loadContent(), api.loadProgress(userId)])
      .then(([c, p]) => alive && dispatch({ type: 'remote/loaded', content: c, progress: p }))
      .catch((e) => alive && dispatch({ type: 'sync/error', message: e.message }));
    return () => {
      alive = false;
    };
  }, [userId, reloadKey]);

  const saveTimer = useRef(null);
  useEffect(() => {
    if (!REMOTE || !userId || !state.ready) return undefined;
    clearTimeout(saveTimer.current);
    const snapshot = progressOf(state);
    saveTimer.current = setTimeout(() => {
      api.saveProgress(userId, snapshot).catch((e) => dispatch({ type: 'sync/error', message: `Progress not saved: ${e.message}` }));
    }, 1200);
    return () => clearTimeout(saveTimer.current);
  }, [userId, state.ready, state.lessons, state.quiz, state.essays, state.activity]); // eslint-disable-line react-hooks/exhaustive-deps

  const reload = () => setReloadKey((k) => k + 1);
  const d = useMemo(() => derive(state), [state]);
  return <StoreCtx.Provider value={{ state, dispatch, d, reload }}>{children}</StoreCtx.Provider>;
}

export const useStore = () => useContext(StoreCtx);
export { dayKey };
