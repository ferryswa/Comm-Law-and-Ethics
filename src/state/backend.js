// Data access layer. Two implementations with the same API:
// - remote: Supabase (Auth, Postgres with RLS, Storage) — used when VITE_SUPABASE_URL/KEY are set
// - local: browser only (localStorage + IndexedDB) — used for offline previews (VITE_DATA_MODE=local)
import { createClient } from '@supabase/supabase-js';
import * as files from './files.js';

const SB_URL = import.meta.env.VITE_SUPABASE_URL;
const SB_KEY = import.meta.env.VITE_SUPABASE_KEY;
export const REMOTE = import.meta.env.VITE_DATA_MODE !== 'local' && !!SB_URL && !!SB_KEY;
export const sb = REMOTE ? createClient(SB_URL, SB_KEY, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'kompas-hub-auth' } }) : null;

const EMAIL_DOMAIN = 'kompas-hub.test';
const toEmail = (u) => (u.includes('@') ? u : `${u}@${EMAIL_DOMAIN}`);
const safeName = (n) => n.normalize('NFKD').replace(/[^\w.-]+/g, '_').slice(-120);
const fileMeta = (file, path) => ({ name: file.name, size: file.size, type: file.type, uploadedAt: new Date().toISOString(), ...(path ? { path } : {}) });

export async function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name || 'document';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/* ------------------------------- remote ------------------------------- */

const sessionFromUser = (user) => ({
  userId: user.id,
  username: user.user_metadata?.username || user.email.split('@')[0],
  name: user.user_metadata?.name || user.email,
  title: user.user_metadata?.title || '',
  role: user.app_metadata?.role === 'admin' ? 'admin' : 'learner',
  email: user.email,
});

const lessonFromRow = (r) => ({ id: r.id, title: r.title, minutes: r.minutes, competency: r.competency, summary: r.summary, refs: r.refs || [], chapters: r.chapters || [], video: r.video });
const lessonToRow = (l, position) => ({ id: l.id, position, title: l.title, minutes: l.minutes, competency: l.competency, summary: l.summary, refs: l.refs || [], chapters: l.chapters || [], video: l.video || null });
const docFromRow = (r) => ({
  id: r.id, short: r.short, title: r.title, category: r.category, topics: r.topics || [], date: r.date_text, year: r.year,
  description: r.description, keyPoints: r.key_points || [], source: r.source, url: r.url, status: r.status, note: r.note, file: r.file,
});
const docToRow = (d) => ({
  id: d.id, short: d.short, title: d.title, category: d.category, topics: d.topics || [], date_text: d.date || '', year: d.year,
  description: d.description || '', key_points: d.keyPoints || [], source: d.source || '', url: d.url || '', status: d.status, note: d.note || '', file: d.file || null,
});
const qFromRow = (r) => ({ id: r.id, comp: r.comp, q: r.q, options: r.options, answer: r.answer, why: r.why, ref: r.ref || '' });
const qToRow = (q, position) => ({ id: q.id, position, comp: q.comp, q: q.q, options: q.options, answer: q.answer, why: q.why || '', ref: q.ref || null });

function check(res) {
  if (res.error) throw new Error(res.error.message || 'Request failed');
  return res.data;
}

async function emptyBucket(bucket) {
  const top = check(await sb.storage.from(bucket).list('', { limit: 1000 }));
  for (const entry of top) {
    const inner = check(await sb.storage.from(bucket).list(entry.name, { limit: 1000 }));
    const paths = inner.filter((x) => x.id).map((x) => `${entry.name}/${x.name}`);
    if (paths.length) check(await sb.storage.from(bucket).remove(paths));
  }
}

const remote = {
  mode: 'supabase',
  async signIn(username, password) {
    const { data, error } = await sb.auth.signInWithPassword({ email: toEmail(username.trim().toLowerCase()), password });
    if (error) throw new Error(/invalid login/i.test(error.message) ? 'Incorrect username or password.' : error.message);
    return sessionFromUser(data.user);
  },
  async restore() {
    const { data } = await sb.auth.getSession();
    return data.session ? sessionFromUser(data.session.user) : null;
  },
  async signOut() {
    await sb.auth.signOut();
  },
  onAuthChange(cb) {
    const { data } = sb.auth.onAuthStateChange((event, session) => cb(event, session ? sessionFromUser(session.user) : null));
    return () => data.subscription.unsubscribe();
  },

  async loadContent() {
    const [l, d, q, s] = await Promise.all([
      sb.from('lessons').select('*').order('position'),
      sb.from('documents').select('*').order('year', { ascending: false }),
      sb.from('questions').select('*').order('position'),
      sb.from('settings').select('*').eq('id', 1).maybeSingle(),
    ]);
    return {
      version: 1,
      lessons: check(l).map(lessonFromRow),
      docs: check(d).map(docFromRow),
      questions: check(q).map(qFromRow),
      settings: { passingPct: check(s)?.passing_pct ?? 80 },
    };
  },

  async saveLesson(lesson, position) {
    check(await sb.from('lessons').upsert(lessonToRow(lesson, position)));
  },
  async saveLessonOrder(lessons) {
    if (lessons.length) check(await sb.from('lessons').upsert(lessons.map((l, i) => lessonToRow(l, i))));
  },
  async deleteLesson(lesson) {
    check(await sb.from('lessons').delete().eq('id', lesson.id));
    if (lesson.video?.path) await sb.storage.from('videos').remove([lesson.video.path]);
  },
  async uploadVideo(lesson, file) {
    const path = `${lesson.id}/${Date.now()}-${safeName(file.name)}`;
    check(await sb.storage.from('videos').upload(path, file, { contentType: file.type || 'video/mp4', upsert: false }));
    return fileMeta(file, path);
  },
  async removeVideo(lesson) {
    if (lesson?.video?.path) await sb.storage.from('videos').remove([lesson.video.path]);
  },
  async videoUrl(lesson) {
    if (!lesson.video?.path) return null;
    const data = check(await sb.storage.from('videos').createSignedUrl(lesson.video.path, 60 * 60 * 3));
    return data.signedUrl;
  },

  async saveDoc(doc) {
    check(await sb.from('documents').upsert(docToRow(doc)));
  },
  async deleteDoc(doc, content) {
    // detach references first
    for (const [i, l] of content.lessons.entries()) {
      if (l.refs.includes(doc.id)) await remote.saveLesson({ ...l, refs: l.refs.filter((r) => r !== doc.id) }, i);
    }
    const qs = content.questions.filter((q) => q.ref === doc.id);
    if (qs.length) check(await sb.from('questions').update({ ref: null }).in('id', qs.map((q) => q.id)));
    check(await sb.from('documents').delete().eq('id', doc.id));
    if (doc.file?.path) await sb.storage.from('documents').remove([doc.file.path]);
  },
  async uploadDocFile(doc, file) {
    const path = `${doc.id}/${Date.now()}-${safeName(file.name)}`;
    check(await sb.storage.from('documents').upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false }));
    return fileMeta(file, path);
  },
  async removeDocFile(doc) {
    if (doc?.file?.path) await sb.storage.from('documents').remove([doc.file.path]);
  },
  async docBlob(doc) {
    if (!doc.file?.path) return null;
    return check(await sb.storage.from('documents').download(doc.file.path));
  },

  async saveQuestion(q, position) {
    check(await sb.from('questions').upsert(qToRow(q, position)));
  },
  async deleteQuestion(id) {
    check(await sb.from('questions').delete().eq('id', id));
  },
  async saveSettings(settings) {
    check(await sb.from('settings').upsert({ id: 1, passing_pct: settings.passingPct }));
  },

  async loadProgress(userId) {
    const row = check(await sb.from('learner_progress').select('data').eq('user_id', userId).maybeSingle());
    return row?.data || null;
  },
  async saveProgress(userId, data) {
    check(await sb.from('learner_progress').upsert({ user_id: userId, data, updated_at: new Date().toISOString() }));
  },

  async resetContent(seed) {
    await emptyBucket('documents');
    await emptyBucket('videos');
    check(await sb.from('lessons').delete().neq('id', ''));
    check(await sb.from('questions').delete().neq('id', ''));
    check(await sb.from('documents').delete().neq('id', ''));
    check(await sb.from('documents').insert(seed.docs.map(docToRow)));
    check(await sb.from('lessons').insert(seed.lessons.map((l, i) => lessonToRow(l, i))));
    check(await sb.from('questions').insert(seed.questions.map((q, i) => qToRow(q, i))));
    await remote.saveSettings(seed.settings);
  },
};

/* ------------------------------- local ------------------------------- */

const LOCAL_USERS = [
  { username: 'admin', password: 'admin', name: 'Administrator', role: 'admin', title: 'LMS Administrator' },
  { username: 'learner', password: 'learner', name: 'Demo Learner', role: 'learner', title: 'Digital Desk Reporter' },
];
const noop = async () => {};

const local = {
  mode: 'local',
  async signIn(username, password) {
    const u = LOCAL_USERS.find((x) => x.username === username.trim().toLowerCase() && x.password === password);
    if (!u) throw new Error('Incorrect username or password.');
    const { password: _pw, ...rest } = u;
    return { ...rest, userId: `local-${u.username}` };
  },
  restore: async () => null,
  signOut: noop,
  onAuthChange: () => () => {},
  loadContent: async () => null,
  saveLesson: noop,
  saveLessonOrder: noop,
  async deleteLesson(lesson) {
    if (lesson.video?.kind === 'file') await files.deleteFile(files.videoFileKey(lesson.id));
  },
  async uploadVideo(lesson, file) {
    return files.putFile(files.videoFileKey(lesson.id), file);
  },
  async removeVideo(lesson) {
    await files.deleteFile(files.videoFileKey(lesson.id));
  },
  async videoUrl(lesson) {
    return files.objectUrl(files.videoFileKey(lesson.id));
  },
  saveDoc: noop,
  async deleteDoc(doc) {
    await files.deleteFile(files.docFileKey(doc.id));
  },
  async uploadDocFile(doc, file) {
    return files.putFile(files.docFileKey(doc.id), file);
  },
  async removeDocFile(doc) {
    await files.deleteFile(files.docFileKey(doc.id));
  },
  async docBlob(doc) {
    return (await files.getFile(files.docFileKey(doc.id)))?.blob || null;
  },
  saveQuestion: noop,
  deleteQuestion: noop,
  saveSettings: noop,
  loadProgress: async () => null,
  saveProgress: noop,
  async resetContent() {
    await files.clearFiles();
  },
};

export const api = REMOTE ? remote : local;
