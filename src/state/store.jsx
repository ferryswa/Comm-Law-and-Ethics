import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { LESSONS, COMPETENCIES, TOTAL_MINUTES } from '../data/lessons.js';
import { QUESTIONS, SAMPLE_ATTEMPT_ANSWERS, scoreAnswers, PASSING_PCT } from '../data/quiz.js';
import { ESSAYS, SAMPLE_ESSAY_TEXT, MIN_WORDS } from '../data/essays.js';

const STORAGE_KEY = 'kompas-hub-demo-v2';
const QUIZ_MINUTES = 15;
const ESSAY_MINUTES = 20;

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

export const wordCount = (t) => (t.trim() ? t.trim().split(/\s+/).length : 0);

function seedState() {
  const sampleScore = scoreAnswers(SAMPLE_ATTEMPT_ANSWERS);
  return {
    version: 2,
    learner: { name: 'Demo Learner', role: 'Digital Desk Reporter' },
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
        { id: 'seed-1', at: daysAgo(2), answers: SAMPLE_ATTEMPT_ANSWERS, ...sampleScore, sample: true },
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
    // Learning-minute log (basis for learning hours and the activity chart)
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

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === 2) return parsed;
    }
  } catch {
    /* storage unavailable: run in memory */
  }
  return seedState();
}

function logActivity(state, minutes, label) {
  if (minutes <= 0) return state.activity;
  const today = dayKey(new Date());
  const last = state.activity[state.activity.length - 1];
  // gabungkan menit video berturut-turut pada hari & label yang sama
  if (last && !last.sample && dayKey(last.at) === today && last.label === label) {
    return [...state.activity.slice(0, -1), { ...last, minutes: last.minutes + minutes }];
  }
  return [...state.activity, { at: new Date().toISOString(), minutes, label }];
}

function reducer(state, action) {
  switch (action.type) {
    case 'video/progress': {
      const { id, position } = action; // seconds
      const lesson = LESSONS.find((l) => l.id === id);
      const total = lesson.minutes * 60;
      const prev = state.lessons[id];
      const watched = Math.min(total, Math.max(prev.watched, position));
      const gainedSec = watched - prev.watched;
      const completed = prev.completed || watched >= total * 0.95;
      const chapter = lesson.chapters.reduce((acc, c, i) => (position >= c.t ? i : acc), 0);
      return {
        ...state,
        lessons: { ...state.lessons, [id]: { watched: completed ? Math.max(watched, prev.watched) : watched, completed, chapter } },
        activity: logActivity(state, gainedSec / 60, `Watched video ${lesson.no}`),
      };
    }
    case 'video/complete': {
      const lesson = LESSONS.find((l) => l.id === action.id);
      const total = lesson.minutes * 60;
      const prev = state.lessons[action.id];
      return {
        ...state,
        lessons: { ...state.lessons, [action.id]: { ...prev, watched: total, completed: true } },
        activity: logActivity(state, (total - prev.watched) / 60, `Watched video ${lesson.no}`),
      };
    }
    case 'quiz/answer':
      return { ...state, quiz: { ...state.quiz, draft: { ...state.quiz.draft, [action.qid]: action.option } } };
    case 'quiz/goto':
      return { ...state, quiz: { ...state.quiz, current: action.index } };
    case 'quiz/submit': {
      const result = scoreAnswers(state.quiz.draft);
      const attempt = { id: `a-${Date.now()}`, at: new Date().toISOString(), answers: state.quiz.draft, ...result };
      return {
        ...state,
        quiz: { draft: {}, current: 0, attempts: [...state.quiz.attempts, attempt] },
        activity: logActivity(state, QUIZ_MINUTES, `Quiz attempt ${state.quiz.attempts.length + 1}`),
      };
    }
    case 'essay/edit': {
      const prev = state.essays[action.id];
      // Mengedit esai yang sudah dikirim/disetujui mengembalikannya ke draf (perlu dikirim ulang)
      return {
        ...state,
        essays: { ...state.essays, [action.id]: { text: action.text, status: 'draft', revisedFrom: prev.status !== 'draft' ? prev.status : prev.revisedFrom } },
      };
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
        essays: {
          ...state.essays,
          [action.id]: { ...prev, status: action.decision, reviewedAt: new Date().toISOString(), reviewer: 'Simulated reviewer (demo)', note: action.note },
        },
      };
    }
    case 'ui/repoQuery':
      return { ...state, ui: { ...state.ui, repoQuery: action.q } };
    case 'ui/lesson':
      return { ...state, ui: { ...state.ui, lesson: action.id } };
    case 'reset':
      return seedState();
    default:
      return state;
  }
}

// ---------- Selectors: satu sumber kebenaran untuk semua modul ----------
export function derive(state) {
  const lessonRows = LESSONS.map((l) => {
    const s = state.lessons[l.id];
    const total = l.minutes * 60;
    const pct = Math.round((Math.min(s.watched, total) / total) * 100);
    return { ...l, ...s, pct };
  });
  const watchedMin = lessonRows.reduce((acc, l) => acc + Math.min(l.watched, l.minutes * 60) / 60, 0);
  const completionPct = Math.round((watchedMin / TOTAL_MINUTES) * 100);
  const modulesDone = lessonRows.filter((l) => l.completed).length;

  const attempts = state.quiz.attempts;
  const latest = attempts[attempts.length - 1] || null;
  const best = attempts.reduce((b, a) => (!b || a.pct > b.pct ? a : b), null);

  const minutesTotal = state.activity.reduce((acc, a) => acc + a.minutes, 0);
  const hours = minutesTotal / 60;

  const essayRows = ESSAYS.map((e) => ({ ...e, ...state.essays[e.id], words: wordCount(state.essays[e.id].text) }));
  const essaysApproved = essayRows.filter((e) => e.status === 'approved').length;
  const essaysPending = essayRows.filter((e) => e.status === 'pending').length;

  // Kompetensi = 50% progres video terkait + 50% akurasi kuis kategori (percobaan terbaik)
  const competencies = COMPETENCIES.map((c) => {
    const lesson = lessonRows.find((l) => l.id === c.lesson);
    const bc = best?.byComp?.[c.id];
    const quizPct = bc ? Math.round((bc.correct / bc.total) * 100) : 0;
    return { ...c, videoPct: lesson.pct, quizPct, value: Math.round(lesson.pct * 0.5 + quizPct * 0.5) };
  });
  const competencyAvg = Math.round(competencies.reduce((a, c) => a + c.value, 0) / competencies.length);

  const quizPassed = !!best && best.pct >= PASSING_PCT;
  const criteria = [
    { id: 'modules', label: 'Complete all 4 induction videos', met: modulesDone === LESSONS.length, detail: `${modulesDone}/${LESSONS.length} modules` },
    { id: 'quiz', label: `Quiz score of at least ${PASSING_PCT}%`, met: quizPassed, detail: best ? `Best score ${best.pct}%` : 'Not attempted' },
    { id: 'essays', label: '3 essays approved by a reviewer', met: essaysApproved === ESSAYS.length, detail: `${essaysApproved}/${ESSAYS.length} approved` },
  ];
  let overall;
  if (criteria.every((c) => c.met)) overall = { key: 'pass', label: 'Passed', tone: 'good' };
  else if (latest && !quizPassed) overall = { key: 'fail', label: 'Not Passed', tone: 'bad', reason: `Quiz score below ${PASSING_PCT}%` };
  else if (modulesDone < LESSONS.length) overall = { key: 'progress', label: 'In Progress', tone: 'warn', reason: 'Induction videos incomplete' };
  else overall = { key: 'review', label: 'Awaiting Review', tone: 'warn', reason: 'Essays awaiting manual approval' };

  const nextLesson = lessonRows.find((l) => !l.completed) || null;

  return {
    lessonRows, completionPct, modulesDone, attempts, latest, best, hours, minutesTotal,
    essayRows, essaysApproved, essaysPending, competencies, competencyAvg, criteria, overall, nextLesson,
    quizAnswered: Object.keys(state.quiz.draft).length, totalQuestions: QUESTIONS.length, MIN_WORDS,
  };
}

const StoreCtx = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);
  const d = useMemo(() => derive(state), [state]);
  return <StoreCtx.Provider value={{ state, dispatch, d }}>{children}</StoreCtx.Provider>;
}

export const useStore = () => useContext(StoreCtx);
export { dayKey };
