import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen, Library, ListChecks, Plus, Pencil, Trash2, ArrowUp, ArrowDown, Upload, Eye, FileText, Film, RotateCcw,
  Search, CheckCircle2, X, Save, AlertTriangle,
} from 'lucide-react';
import { useStore, uid } from '../state/store.jsx';
import { COMPETENCIES } from '../data/lessons.js';
import { CATEGORIES, TOPICS, STATUS } from '../data/legal.js';
import { putFile, deleteFile, clearFiles, objectUrl, docFileKey, videoFileKey, formatBytes } from '../state/files.js';
import { Card, PageTitle, Pill, Button, Modal, Field, inputCls, DocActions, Empty } from '../components/ui.jsx';

const TABS = [
  { id: 'admin', label: 'Induction Materials', icon: BookOpen },
  { id: 'admin-repository', label: 'Legal Repository', icon: Library },
  { id: 'admin-quiz', label: 'Quiz Bank', icon: ListChecks },
];
const DOC_MAX = 25 * 1024 * 1024;
const VIDEO_MAX = 300 * 1024 * 1024;
const DOC_ACCEPT = '.pdf,.doc,.docx,.odt,.rtf,.txt';
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const parseTime = (v) => {
  const m = String(v).trim().match(/^(\d{1,3})(?::([0-5]?\d))?$/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2] || 0);
};
const compLabel = (id) => COMPETENCIES.find((c) => c.id === id)?.label || id;
const lines = (t) => t.split('\n').map((x) => x.trim()).filter(Boolean);

export default function Admin({ tab }) {
  const { state, dispatch } = useStore();
  const [confirmReset, setConfirmReset] = useState(false);
  const c = state.content;
  return (
    <>
      <PageTitle
        title="Administration"
        subtitle="Manage induction materials, legal repository documents, and the quiz bank. Changes are saved in this browser (prototype, no server)."
        right={
          confirmReset ? (
            <div className="flex flex-wrap items-center gap-2 text-[13px]">
              <span className="text-muted">Restore default content and delete uploaded files?</span>
              <Button size="sm" variant="outline" onClick={() => setConfirmReset(false)}>Cancel</Button>
              <Button
                size="sm"
                onClick={async () => {
                  await clearFiles();
                  dispatch({ type: 'content/reset' });
                  setConfirmReset(false);
                }}
              >
                Restore defaults
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setConfirmReset(true)}>
              <RotateCcw size={14} /> Restore default content
            </Button>
          )
        }
      />
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Count icon={BookOpen} label="Lessons" value={c.lessons.length} />
        <Count icon={Library} label="Documents" value={`${c.docs.length}`} hint={`${c.docs.filter((x) => x.file).length} with uploaded file`} />
        <Count icon={ListChecks} label="Quiz questions" value={c.questions.length} hint={`Pass mark ${c.settings.passingPct}%`} />
      </div>
      <div role="tablist" aria-label="Administration sections" className="flex gap-1 border-b border-line mb-6 overflow-x-auto">
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
      {tab === 'admin' && <MaterialsAdmin />}
      {tab === 'admin-repository' && <RepositoryAdmin />}
      {tab === 'admin-quiz' && <QuizAdmin />}
    </>
  );
}

function Count({ icon: Icon, label, value, hint }) {
  return (
    <Card className="p-4 flex items-center gap-3">
      <span className="w-10 h-10 rounded-lg bg-navy-50 text-navy-600 flex items-center justify-center shrink-0">
        <Icon size={19} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <div className="tabular text-[22px] font-bold text-ink leading-none">{value}</div>
        <div className="text-[12px] text-muted mt-1 truncate">
          {label}
          {hint && <span className="hidden sm:inline"> · {hint}</span>}
        </div>
      </div>
    </Card>
  );
}

function ConfirmInline({ text, onYes, onNo, yes = 'Delete' }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-2 text-[12.5px]">
      <span className="text-bad font-medium">{text}</span>
      <button type="button" className="font-semibold text-muted hover:text-ink" onClick={onNo}>Cancel</button>
      <button type="button" className="font-semibold text-bad hover:underline" onClick={onYes}>{yes}</button>
    </span>
  );
}

function IconBtn({ label, onClick, children, disabled, tone = 'navy' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`w-8 h-8 inline-flex items-center justify-center rounded-lg border border-line bg-white disabled:opacity-35 ${
        tone === 'bad' ? 'text-bad hover:border-bad/40 hover:bg-bad-soft' : 'text-navy-600 hover:border-navy-300 hover:bg-navy-50'
      }`}
    >
      {children}
    </button>
  );
}

/* ============================ INDUCTION MATERIALS ============================ */

function MaterialsAdmin() {
  const { dispatch, d } = useStore();
  const [editing, setEditing] = useState(null);
  const [del, setDel] = useState(null);
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13.5px] text-muted">
          {d.lessonCount} lessons · {d.totalMinutes} minutes total. Order here is the order learners see.
        </p>
        <Button onClick={() => setEditing('new')}>
          <Plus size={16} /> Add lesson
        </Button>
      </div>
      {d.lessonRows.length === 0 ? (
        <Card><Empty icon={BookOpen} title="No lessons yet">Add the first induction lesson.</Empty></Card>
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-line">
            {d.lessonRows.map((l, i) => (
              <li key={l.id} className="p-4 sm:px-5 flex flex-wrap items-start gap-4">
                <span className="tabular w-10 h-10 rounded-lg bg-navy text-white font-bold text-[13px] flex items-center justify-center shrink-0">{l.no}</span>
                <div className="min-w-0 flex-1 basis-[260px]">
                  <div className="text-[14.5px] font-bold text-ink">{l.title}</div>
                  <p className="text-[12.5px] text-muted mt-0.5 line-clamp-2">{l.summary}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <Pill tone="navy" icon={null}>{compLabel(l.competency)}</Pill>
                    <Pill tone="plain" icon={null}>{l.minutes} min</Pill>
                    <Pill tone="plain" icon={null}>{l.chapters.length} chapters</Pill>
                    <Pill tone={l.video ? 'good' : 'plain'} icon={Film}>
                      {l.video ? (l.video.kind === 'file' ? `File · ${l.video.name}` : 'Video URL') : 'Placeholder'}
                    </Pill>
                    <Pill tone="plain" icon={null}>{l.refs.length} references</Pill>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 ml-auto">
                  {del === l.id ? (
                    <ConfirmInline
                      text="Delete this lesson?"
                      onNo={() => setDel(null)}
                      onYes={async () => {
                        if (l.video?.kind === 'file') await deleteFile(videoFileKey(l.id));
                        dispatch({ type: 'content/lesson/delete', id: l.id });
                        setDel(null);
                      }}
                    />
                  ) : (
                    <>
                      <IconBtn label="Move up" disabled={i === 0} onClick={() => dispatch({ type: 'content/lesson/move', id: l.id, dir: -1 })}><ArrowUp size={15} /></IconBtn>
                      <IconBtn label="Move down" disabled={i === d.lessonRows.length - 1} onClick={() => dispatch({ type: 'content/lesson/move', id: l.id, dir: 1 })}><ArrowDown size={15} /></IconBtn>
                      <Button size="sm" variant="outline" onClick={() => setEditing(l)}><Pencil size={14} /> Edit</Button>
                      <IconBtn label="Delete lesson" tone="bad" onClick={() => setDel(l.id)}><Trash2 size={15} /></IconBtn>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {editing && <LessonEditor lesson={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function LessonEditor({ lesson, onClose }) {
  const { state, dispatch } = useStore();
  const isNew = !lesson;
  const [f, setF] = useState(() => ({
    id: lesson?.id || uid('l'),
    title: lesson?.title || '',
    minutes: lesson?.minutes || 15,
    competency: lesson?.competency || COMPETENCIES[0].id,
    summary: lesson?.summary || '',
    refs: lesson?.refs ? [...lesson.refs] : [],
    chapters: (lesson?.chapters?.length ? lesson.chapters : [{ t: 0, title: '', points: [] }]).map((c) => ({ time: fmt(c.t), title: c.title, points: c.points.join('\n') })),
    videoMode: lesson?.video?.kind || 'none',
    videoUrl: lesson?.video?.kind === 'url' ? lesson.video.url : '',
  }));
  const [videoFile, setVideoFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const setCh = (i, k, v) => setF((p) => ({ ...p, chapters: p.chapters.map((c, j) => (j === i ? { ...c, [k]: v } : c)) }));
  const moveCh = (i, dir) =>
    setF((p) => {
      const list = [...p.chapters];
      const j = i + dir;
      if (j < 0 || j >= list.length) return p;
      [list[i], list[j]] = [list[j], list[i]];
      return { ...p, chapters: list };
    });

  const validate = () => {
    const e = {};
    if (!f.title.trim()) e.title = 'Enter a title.';
    const min = Number(f.minutes);
    if (!Number.isFinite(min) || min < 1 || min > 600) e.minutes = 'Duration must be 1–600 minutes.';
    if (!f.summary.trim()) e.summary = 'Enter a short summary.';
    let prev = -1;
    f.chapters.forEach((c, i) => {
      const t = parseTime(c.time);
      if (t === null) e[`ch${i}`] = 'Use mm:ss, e.g. 4:30.';
      else if (i === 0 && t !== 0) e[`ch${i}`] = 'The first chapter must start at 0:00.';
      else if (t <= prev) e[`ch${i}`] = 'Start times must increase.';
      else if (t >= min * 60) e[`ch${i}`] = 'Start time must be within the lesson duration.';
      else if (!c.title.trim()) e[`ch${i}`] = 'Enter a chapter title.';
      if (t !== null) prev = t;
    });
    if (!f.chapters.length) e.chapters = 'Add at least one chapter.';
    if (f.videoMode === 'url' && !/^https?:\/\/\S+$/i.test(f.videoUrl.trim())) e.video = 'Enter a direct video URL starting with https://';
    if (f.videoMode === 'file' && !videoFile && lesson?.video?.kind !== 'file') e.video = 'Choose a video file to upload.';
    if (videoFile && videoFile.size > VIDEO_MAX) e.video = `The file is larger than ${formatBytes(VIDEO_MAX)}.`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    let video = null;
    if (f.videoMode === 'url') video = { kind: 'url', url: f.videoUrl.trim() };
    if (f.videoMode === 'file') {
      if (videoFile) video = { kind: 'file', ...(await putFile(videoFileKey(f.id), videoFile)) };
      else video = lesson.video;
    }
    if (f.videoMode !== 'file' && lesson?.video?.kind === 'file') await deleteFile(videoFileKey(f.id));
    dispatch({
      type: 'content/lesson/save',
      lesson: {
        id: f.id,
        title: f.title.trim(),
        minutes: Number(f.minutes),
        competency: f.competency,
        summary: f.summary.trim(),
        refs: f.refs.filter((r) => state.content.docs.some((d) => d.id === r)),
        chapters: f.chapters.map((c) => ({ t: parseTime(c.time), title: c.title.trim(), points: lines(c.points) })),
        video,
      },
    });
    setSaving(false);
    onClose();
  };

  return (
    <Modal
      wide
      title={isNew ? 'Add lesson' : `Edit lesson: ${lesson.title}`}
      subtitle="Lesson details, video source, chapters with key points, and repository references."
      onClose={onClose}
      footer={
        <>
          {Object.keys(errors).length > 0 && (
            <span className="mr-auto text-[12.5px] text-bad flex items-center gap-1.5"><AlertTriangle size={14} /> Fix the highlighted fields.</span>
          )}
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}><Save size={15} /> {saving ? 'Saving…' : 'Save lesson'}</Button>
        </>
      }
    >
      <div className="grid gap-5">
        <div className="grid sm:grid-cols-[1fr_140px_220px] gap-4">
          <Field label="Title" htmlFor="l-title" error={errors.title}>
            <input id="l-title" className={inputCls} value={f.title} onChange={(e) => set('title', e.target.value)} />
          </Field>
          <Field label="Duration (minutes)" htmlFor="l-min" error={errors.minutes}>
            <input id="l-min" type="number" min={1} max={600} className={inputCls} value={f.minutes} onChange={(e) => set('minutes', e.target.value)} />
          </Field>
          <Field label="Competency" htmlFor="l-comp">
            <select id="l-comp" className={inputCls} value={f.competency} onChange={(e) => set('competency', e.target.value)}>
              {COMPETENCIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Summary" htmlFor="l-sum" error={errors.summary}>
          <textarea id="l-sum" rows={3} className={inputCls} value={f.summary} onChange={(e) => set('summary', e.target.value)} />
        </Field>

        <fieldset className="rounded-xl border border-line p-4 grid gap-3">
          <legend className="px-1 text-[13px] font-bold text-ink">Video source</legend>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Video source">
            {[
              { id: 'none', label: 'Placeholder (no video yet)' },
              { id: 'url', label: 'Video URL (.mp4/.webm)' },
              { id: 'file', label: 'Upload video file' },
            ].map((o) => (
              <label key={o.id} className={`cursor-pointer rounded-full border px-3.5 h-9 inline-flex items-center gap-2 text-[13px] font-semibold ${f.videoMode === o.id ? 'bg-navy text-white border-navy' : 'bg-white text-navy-700 border-line hover:border-navy-300'}`}>
                <input type="radio" name="vmode" className="sr-only" checked={f.videoMode === o.id} onChange={() => set('videoMode', o.id)} />
                {o.label}
              </label>
            ))}
          </div>
          {f.videoMode === 'url' && (
            <Field label="Direct video URL" htmlFor="l-vurl" hint="A direct link to a video file. YouTube page links do not play in the built-in player." error={errors.video}>
              <input id="l-vurl" className={inputCls} placeholder="https://…/lesson.mp4" value={f.videoUrl} onChange={(e) => set('videoUrl', e.target.value)} />
            </Field>
          )}
          {f.videoMode === 'file' && (
            <Field
              label="Video file"
              htmlFor="l-vfile"
              hint={lesson?.video?.kind === 'file' && !videoFile ? `Current: ${lesson.video.name} (${formatBytes(lesson.video.size)}). Choose a file to replace it.` : `MP4 or WebM, up to ${formatBytes(VIDEO_MAX)}.`}
              error={errors.video}
            >
              <input id="l-vfile" type="file" accept="video/*" className="text-[13px]" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} />
            </Field>
          )}
          {f.videoMode !== 'none' && <p className="text-[12px] text-muted">Set chapter start times to match the video. Learner progress follows the video’s actual playback.</p>}
        </fieldset>

        <fieldset className="rounded-xl border border-line p-4 grid gap-3">
          <legend className="px-1 text-[13px] font-bold text-ink">Chapters</legend>
          {errors.chapters && <span className="text-[12px] text-bad">{errors.chapters}</span>}
          {f.chapters.map((c, i) => (
            <div key={i} className={`rounded-lg border p-3 grid gap-2.5 ${errors[`ch${i}`] ? 'border-bad/50 bg-bad-soft/40' : 'border-line bg-paper/50'}`}>
              <div className="grid sm:grid-cols-[96px_1fr_auto] gap-2.5 items-end">
                <Field label={`Start #${i + 1}`} htmlFor={`ch-t-${i}`}>
                  <input id={`ch-t-${i}`} className={`${inputCls} tabular`} value={c.time} onChange={(e) => setCh(i, 'time', e.target.value)} placeholder="0:00" />
                </Field>
                <Field label="Chapter title" htmlFor={`ch-ti-${i}`}>
                  <input id={`ch-ti-${i}`} className={inputCls} value={c.title} onChange={(e) => setCh(i, 'title', e.target.value)} />
                </Field>
                <div className="flex gap-1.5 pb-0.5">
                  <IconBtn label="Move chapter up" disabled={i === 0} onClick={() => moveCh(i, -1)}><ArrowUp size={15} /></IconBtn>
                  <IconBtn label="Move chapter down" disabled={i === f.chapters.length - 1} onClick={() => moveCh(i, 1)}><ArrowDown size={15} /></IconBtn>
                  <IconBtn label="Remove chapter" tone="bad" disabled={f.chapters.length === 1} onClick={() => setF((p) => ({ ...p, chapters: p.chapters.filter((_, j) => j !== i) }))}><Trash2 size={15} /></IconBtn>
                </div>
              </div>
              <Field label="Key points (one per line)" htmlFor={`ch-p-${i}`} error={errors[`ch${i}`]}>
                <textarea id={`ch-p-${i}`} rows={3} className={inputCls} value={c.points} onChange={(e) => setCh(i, 'points', e.target.value)} />
              </Field>
            </div>
          ))}
          <div>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setF((p) => {
                  const last = parseTime(p.chapters[p.chapters.length - 1]?.time) ?? 0;
                  return { ...p, chapters: [...p.chapters, { time: fmt(Math.min(last + 120, Number(p.minutes) * 60 - 1)), title: '', points: '' }] };
                })
              }
            >
              <Plus size={14} /> Add chapter
            </Button>
          </div>
        </fieldset>

        <fieldset className="rounded-xl border border-line p-4">
          <legend className="px-1 text-[13px] font-bold text-ink">References from the Legal Repository</legend>
          <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5 mt-1 max-h-[220px] overflow-y-auto scroll-thin">
            {state.content.docs.map((doc) => (
              <label key={doc.id} className="flex items-start gap-2 text-[13px] py-1 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 accent-[#17243B]"
                  checked={f.refs.includes(doc.id)}
                  onChange={(e) => set('refs', e.target.checked ? [...f.refs, doc.id] : f.refs.filter((r) => r !== doc.id))}
                />
                <span><strong className="text-brand-red">{doc.short}</strong> <span className="text-muted">{doc.title}</span></span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </Modal>
  );
}

/* ============================ LEGAL REPOSITORY ============================ */

function RepositoryAdmin() {
  const { state, dispatch } = useStore();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [del, setDel] = useState(null);
  const [msg, setMsg] = useState(null);
  const fileRef = useRef(null);
  const target = useRef(null);
  const docs = state.content.docs;
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? docs.filter((d) => `${d.short} ${d.title} ${d.source}`.toLowerCase().includes(t)) : docs;
  }, [docs, q]);

  const pick = (id) => {
    target.current = id;
    fileRef.current.value = '';
    fileRef.current.click();
  };
  const onFile = async (e) => {
    const file = e.target.files?.[0];
    const id = target.current;
    if (!file || !id) return;
    if (file.size > DOC_MAX) {
      setMsg({ tone: 'bad', text: `“${file.name}” is larger than ${formatBytes(DOC_MAX)}.` });
      return;
    }
    const meta = await putFile(docFileKey(id), file);
    dispatch({ type: 'content/doc/file', id, file: meta });
    setMsg({ tone: 'good', text: `Uploaded “${file.name}” to ${docs.find((x) => x.id === id)?.short}.` });
  };

  return (
    <div className="grid gap-4">
      <input ref={fileRef} type="file" accept={DOC_ACCEPT} className="hidden" onChange={onFile} aria-hidden="true" tabIndex={-1} />
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <label htmlFor="adm-doc-q" className="sr-only">Search documents</label>
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" aria-hidden="true" />
          <input id="adm-doc-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search documents" className={`${inputCls} pl-9 h-10`} />
        </div>
        <Button onClick={() => setEditing('new')}><Plus size={16} /> Add document</Button>
      </div>
      {msg && (
        <div className={`rounded-lg px-4 py-2.5 text-[13px] flex items-center gap-2 ${msg.tone === 'good' ? 'bg-good-soft text-good' : 'bg-bad-soft text-bad'}`} role="status">
          {msg.tone === 'good' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
          <span className="flex-1">{msg.text}</span>
          <button type="button" onClick={() => setMsg(null)} aria-label="Dismiss"><X size={15} /></button>
        </div>
      )}
      <p className="text-[12.5px] text-muted">
        Upload PDF, DOC, or DOCX (max {formatBytes(DOC_MAX)}). Learners get a <strong>Unduh Dokumen</strong> button next to <strong>Sumber Asli</strong> on each reference. Repository content is kept in Bahasa Indonesia (master).
      </p>
      <Card className="overflow-x-auto">
        <table className="w-full text-[13.5px] min-w-[820px]">
          <thead>
            <tr className="text-left text-[12px] text-muted border-b border-line bg-paper">
              <th className="font-semibold px-5 py-2.5">Document</th>
              <th className="font-semibold px-3 py-2.5">Category</th>
              <th className="font-semibold px-3 py-2.5">Verification</th>
              <th className="font-semibold px-3 py-2.5">Uploaded file</th>
              <th className="font-semibold px-5 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((doc) => (
              <tr key={doc.id} className="border-b border-line last:border-b-0 align-top">
                <td className="px-5 py-3 max-w-[340px]">
                  <div className="text-[12px] font-bold text-brand-red">{doc.short}</div>
                  <div className="text-ink font-medium leading-snug">{doc.title}</div>
                </td>
                <td className="px-3 py-3 text-muted whitespace-nowrap">{CATEGORIES.find((c) => c.id === doc.category)?.label}</td>
                <td className="px-3 py-3"><Pill tone={STATUS[doc.status].tone}>{STATUS[doc.status].label}</Pill></td>
                <td className="px-3 py-3">
                  {doc.file ? (
                    <div className="text-[12.5px]">
                      <div className="flex items-center gap-1.5 text-ink font-medium"><FileText size={14} className="text-navy-400" /> <span className="truncate max-w-[180px]" title={doc.file.name}>{doc.file.name}</span></div>
                      <div className="text-muted tabular">{formatBytes(doc.file.size)}</div>
                    </div>
                  ) : (
                    <span className="text-[12.5px] text-muted">—</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    {del === doc.id ? (
                      <ConfirmInline
                        text="Delete document?"
                        onNo={() => setDel(null)}
                        onYes={async () => {
                          await deleteFile(docFileKey(doc.id));
                          dispatch({ type: 'content/doc/delete', id: doc.id });
                          setDel(null);
                        }}
                      />
                    ) : (
                      <>
                        <IconBtn label="View document" onClick={() => setViewing(doc)}><Eye size={15} /></IconBtn>
                        <Button size="sm" variant="outline" onClick={() => pick(doc.id)}><Upload size={14} /> {doc.file ? 'Replace' : 'Upload'}</Button>
                        <IconBtn label="Edit document" onClick={() => setEditing(doc)}><Pencil size={15} /></IconBtn>
                        <IconBtn label="Delete document" tone="bad" onClick={() => setDel(doc.id)}><Trash2 size={15} /></IconBtn>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <Empty icon={Library} title="No documents match">Try another search or add a document.</Empty>}
      </Card>
      {editing && <DocEditor doc={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
      {viewing && <DocViewer id={viewing.id} onClose={() => setViewing(null)} onUpload={() => pick(viewing.id)} />}
    </div>
  );
}

function DocViewer({ id, onClose, onUpload }) {
  const { state, dispatch } = useStore();
  const doc = state.content.docs.find((d) => d.id === id);
  const [url, setUrl] = useState(null);
  const [confirmRm, setConfirmRm] = useState(false);
  useEffect(() => {
    let u = null;
    let alive = true;
    if (doc?.file) objectUrl(docFileKey(id)).then((x) => { u = x; if (alive) setUrl(x); });
    else setUrl(null);
    return () => { alive = false; if (u) URL.revokeObjectURL(u); };
  }, [id, doc?.file?.uploadedAt]);
  if (!doc) return null;
  const isPdf = doc.file && (doc.file.type === 'application/pdf' || /\.pdf$/i.test(doc.file.name));
  const st = STATUS[doc.status];
  return (
    <Modal wide title={doc.short} subtitle={doc.title} onClose={onClose} footer={<Button variant="outline" onClick={onClose}>Close</Button>}>
      <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <dl className="grid gap-3 text-[13px] content-start">
          <Meta k="Category" v={CATEGORIES.find((c) => c.id === doc.category)?.label} />
          <Meta k="Date" v={doc.date} />
          <Meta k="Verification" v={<Pill tone={st.tone}>{st.label}</Pill>} />
          <Meta k="Source" v={doc.source} />
          <Meta k="Note" v={doc.note} />
          <Meta
            k="Uploaded file"
            v={
              doc.file ? (
                <span>
                  {doc.file.name} · {formatBytes(doc.file.size)}
                  <br />
                  <span className="text-muted">{new Date(doc.file.uploadedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </span>
              ) : (
                'None'
              )
            }
          />
          <div className="grid gap-2 pt-1">
            <DocActions doc={doc} lang="id" />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={onUpload}><Upload size={14} /> {doc.file ? 'Replace file' : 'Upload file'}</Button>
              {doc.file &&
                (confirmRm ? (
                  <ConfirmInline
                    text="Remove file?"
                    yes="Remove"
                    onNo={() => setConfirmRm(false)}
                    onYes={async () => {
                      await deleteFile(docFileKey(doc.id));
                      dispatch({ type: 'content/doc/file', id: doc.id, file: null });
                      setConfirmRm(false);
                    }}
                  />
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => setConfirmRm(true)}><Trash2 size={14} /> Remove file</Button>
                ))}
            </div>
          </div>
        </dl>
        <div className="rounded-xl border border-line bg-paper min-h-[360px] overflow-hidden flex">
          {isPdf && url ? (
            <iframe title={`Preview ${doc.short}`} src={url} className="w-full min-h-[520px] bg-white" />
          ) : (
            <div className="m-auto text-center px-6 py-10 max-w-sm">
              <FileText size={30} className="mx-auto text-navy-300" aria-hidden="true" />
              <div className="font-semibold text-ink mt-3">{doc.file ? 'Preview not available for this file type' : 'No document uploaded yet'}</div>
              <p className="text-[13px] text-muted mt-1">
                {doc.file ? 'Use Unduh Dokumen to open it.' : 'Upload the official PDF so learners can download it from the repository.'}
              </p>
              <p className="text-[13px] text-ink/80 mt-4 text-left">{doc.description}</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function Meta({ k, v }) {
  return (
    <div>
      <dt className="text-[11.5px] font-semibold uppercase tracking-wide text-muted">{k}</dt>
      <dd className="text-ink mt-0.5">{v}</dd>
    </div>
  );
}

function DocEditor({ doc, onClose }) {
  const { state, dispatch } = useStore();
  const isNew = !doc;
  const [f, setF] = useState(() => ({
    id: doc?.id || '',
    short: doc?.short || '',
    title: doc?.title || '',
    category: doc?.category || 'uu',
    topics: doc?.topics ? [...doc.topics] : [],
    date: doc?.date || '',
    year: doc?.year || new Date().getFullYear(),
    description: doc?.description || '',
    keyPoints: (doc?.keyPoints || []).join('\n'),
    source: doc?.source || '',
    url: doc?.url || '',
    status: doc?.status || 'unverified',
    note: doc?.note || '',
  }));
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const save = async () => {
    const e = {};
    if (!f.short.trim()) e.short = 'Enter a short code, e.g. UU 40/1999.';
    if (!f.title.trim()) e.title = 'Enter the full title.';
    if (!f.description.trim()) e.description = 'Enter a description.';
    if (f.url && !/^https?:\/\/\S+$/i.test(f.url.trim())) e.url = 'Enter a link starting with https://';
    const yr = Number(f.year);
    if (!Number.isInteger(yr) || yr < 1900 || yr > 2100) e.year = 'Enter a 4-digit year.';
    if (file && file.size > DOC_MAX) e.file = `The file is larger than ${formatBytes(DOC_MAX)}.`;
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    let id = f.id;
    if (isNew) {
      const base = f.short.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'doc';
      id = state.content.docs.some((x) => x.id === base) ? uid(base) : base;
    }
    let fileMeta = doc?.file || null;
    if (file) fileMeta = await putFile(docFileKey(id), file);
    dispatch({
      type: 'content/doc/save',
      doc: {
        id,
        short: f.short.trim(),
        title: f.title.trim(),
        category: f.category,
        topics: f.topics,
        date: f.date.trim() || String(yr),
        year: yr,
        description: f.description.trim(),
        keyPoints: lines(f.keyPoints),
        source: f.source.trim(),
        url: f.url.trim(),
        status: f.status,
        note: f.note.trim(),
        file: fileMeta,
      },
    });
    setSaving(false);
    onClose();
  };

  return (
    <Modal
      wide
      title={isNew ? 'Add document' : `Edit ${doc.short}`}
      subtitle="Repository entries are written in Bahasa Indonesia. Mark the verification status honestly."
      onClose={onClose}
      footer={
        <>
          {Object.keys(errors).length > 0 && <span className="mr-auto text-[12.5px] text-bad flex items-center gap-1.5"><AlertTriangle size={14} /> Fix the highlighted fields.</span>}
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}><Save size={15} /> {saving ? 'Saving…' : 'Save document'}</Button>
        </>
      }
    >
      <div className="grid gap-4">
        <div className="grid sm:grid-cols-[200px_1fr] gap-4">
          <Field label="Short code" htmlFor="d-short" error={errors.short}>
            <input id="d-short" className={inputCls} value={f.short} onChange={(e) => set('short', e.target.value)} placeholder="UU 40/1999" />
          </Field>
          <Field label="Full title" htmlFor="d-title" error={errors.title}>
            <input id="d-title" className={inputCls} value={f.title} onChange={(e) => set('title', e.target.value)} />
          </Field>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Category" htmlFor="d-cat">
            <select id="d-cat" className={inputCls} value={f.category} onChange={(e) => set('category', e.target.value)}>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </Field>
          <Field label="Date (as written)" htmlFor="d-date">
            <input id="d-date" className={inputCls} value={f.date} onChange={(e) => set('date', e.target.value)} placeholder="23 September 1999" />
          </Field>
          <Field label="Year (for sorting)" htmlFor="d-year" error={errors.year}>
            <input id="d-year" type="number" className={inputCls} value={f.year} onChange={(e) => set('year', e.target.value)} />
          </Field>
        </div>
        <fieldset className="grid gap-1.5">
          <legend className="text-[12.5px] font-semibold text-ink mb-1.5">Topics</legend>
          <div className="flex flex-wrap gap-3">
            {TOPICS.map((t) => (
              <label key={t.id} className="flex items-center gap-2 text-[13px]">
                <input type="checkbox" className="accent-[#17243B]" checked={f.topics.includes(t.id)} onChange={(e) => set('topics', e.target.checked ? [...f.topics, t.id] : f.topics.filter((x) => x !== t.id))} />
                {t.label}
              </label>
            ))}
          </div>
        </fieldset>
        <Field label="Description" htmlFor="d-desc" error={errors.description}>
          <textarea id="d-desc" rows={3} className={inputCls} value={f.description} onChange={(e) => set('description', e.target.value)} />
        </Field>
        <Field label="Key points (one per line)" htmlFor="d-kp">
          <textarea id="d-kp" rows={3} className={inputCls} value={f.keyPoints} onChange={(e) => set('keyPoints', e.target.value)} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Source name" htmlFor="d-src">
            <input id="d-src" className={inputCls} value={f.source} onChange={(e) => set('source', e.target.value)} placeholder="JDIH BPK RI (peraturan.bpk.go.id)" />
          </Field>
          <Field label="Original source URL (Sumber Asli)" htmlFor="d-url" error={errors.url}>
            <input id="d-url" className={inputCls} value={f.url} onChange={(e) => set('url', e.target.value)} placeholder="https://" />
          </Field>
        </div>
        <div className="grid sm:grid-cols-[220px_1fr] gap-4">
          <Field label="Verification status" htmlFor="d-st">
            <select id="d-st" className={inputCls} value={f.status} onChange={(e) => set('status', e.target.value)}>
              {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </Field>
          <Field label="Verification note" htmlFor="d-note">
            <input id="d-note" className={inputCls} value={f.note} onChange={(e) => set('note', e.target.value)} />
          </Field>
        </div>
        <Field
          label="Document file (Unduh Dokumen)"
          htmlFor="d-file"
          error={errors.file}
          hint={doc?.file && !file ? `Current: ${doc.file.name} (${formatBytes(doc.file.size)}). Choose a file to replace it.` : `PDF, DOC, or DOCX up to ${formatBytes(DOC_MAX)}.`}
        >
          <input id="d-file" type="file" accept={DOC_ACCEPT} className="text-[13px]" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </Field>
      </div>
    </Modal>
  );
}

/* ============================ QUIZ BANK ============================ */

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

function QuizAdmin() {
  const { state, dispatch, d } = useStore();
  const [comp, setComp] = useState('all');
  const [editing, setEditing] = useState(null);
  const [del, setDel] = useState(null);
  const [pass, setPass] = useState(state.content.settings.passingPct);
  const [saved, setSaved] = useState(false);
  const qs = state.content.questions;
  const list = comp === 'all' ? qs : qs.filter((q) => q.comp === comp);
  const passValid = Number.isInteger(Number(pass)) && Number(pass) >= 1 && Number(pass) <= 100;

  return (
    <div className="grid gap-5">
      <Card className="p-5 flex flex-wrap items-end gap-4">
        <Field label="Pass mark (%)" htmlFor="q-pass" error={passValid ? null : 'Enter a whole number from 1 to 100.'} className="w-[160px]">
          <input id="q-pass" type="number" min={1} max={100} className={`${inputCls} tabular`} value={pass} onChange={(e) => { setPass(e.target.value); setSaved(false); }} />
        </Field>
        <Button
          variant="navy"
          disabled={!passValid || Number(pass) === state.content.settings.passingPct}
          onClick={() => {
            dispatch({ type: 'content/settings', settings: { passingPct: Number(pass) } });
            setSaved(true);
          }}
        >
          <Save size={15} /> Save pass mark
        </Button>
        {saved && <span className="text-[12.5px] text-good flex items-center gap-1"><CheckCircle2 size={14} /> Saved</span>}
        <p className="text-[12.5px] text-muted basis-full sm:basis-auto sm:ml-auto max-w-[46ch]">
          {qs.length} questions · learners need at least {d.minCorrect} correct. Edits apply to new attempts; past results keep the questions they were scored on.
        </p>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        {[{ id: 'all', label: 'All', n: qs.length }, ...COMPETENCIES.map((c) => ({ id: c.id, label: c.label, n: qs.filter((q) => q.comp === c.id).length }))].map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={comp === c.id}
            onClick={() => setComp(c.id)}
            className={`h-9 rounded-full px-3.5 text-[13px] font-semibold border ${comp === c.id ? 'bg-navy text-white border-navy' : 'bg-white text-navy-700 border-line hover:border-navy-300'}`}
          >
            {c.label} <span className={`tabular ml-1 ${comp === c.id ? 'text-white/70' : 'text-muted'}`}>{c.n}</span>
          </button>
        ))}
        <Button className="ml-auto" onClick={() => setEditing('new')}><Plus size={16} /> Add question</Button>
      </div>

      {list.length === 0 ? (
        <Card><Empty icon={ListChecks} title="No questions in this category">Add a question to get started.</Empty></Card>
      ) : (
        <ol className="grid gap-3">
          {list.map((q) => {
            const n = qs.indexOf(q) + 1;
            const doc = d.docMap[q.ref];
            return (
              <li key={q.id}>
                <Card className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-start gap-3">
                    <span className="tabular text-[12px] font-bold text-white bg-navy rounded-md px-2 py-1 shrink-0">Q{n}</span>
                    <div className="min-w-0 flex-1 basis-[300px]">
                      <div className="flex flex-wrap items-center gap-2">
                        <Pill tone="navy" icon={null}>{compLabel(q.comp)}</Pill>
                        {doc && <span className="text-[12px] font-semibold text-brand-red">{doc.short}</span>}
                      </div>
                      <p className="text-[14px] font-semibold text-ink mt-1.5">{q.q}</p>
                      <ul className="mt-2 grid sm:grid-cols-2 gap-1.5">
                        {q.options.map((o, i) => (
                          <li key={i} className={`text-[12.5px] rounded-md px-2.5 py-1.5 border ${i === q.answer ? 'border-good/30 bg-good-soft text-good font-semibold' : 'border-line text-muted'}`}>
                            {LETTERS[i]}. {o} {i === q.answer && <CheckCircle2 size={13} className="inline -mt-0.5 ml-1" aria-label="Correct answer" />}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex items-center gap-1.5 ml-auto">
                      {del === q.id ? (
                        <ConfirmInline text="Delete question?" onNo={() => setDel(null)} onYes={() => { dispatch({ type: 'content/question/delete', id: q.id }); setDel(null); }} />
                      ) : (
                        <>
                          <Button size="sm" variant="outline" onClick={() => setEditing(q)}><Pencil size={14} /> Edit</Button>
                          <IconBtn label="Delete question" tone="bad" onClick={() => setDel(q.id)}><Trash2 size={15} /></IconBtn>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ol>
      )}
      {editing && <QuestionEditor question={editing === 'new' ? null : editing} defaultComp={comp === 'all' ? COMPETENCIES[0].id : comp} onClose={() => setEditing(null)} />}
    </div>
  );
}

function QuestionEditor({ question, defaultComp, onClose }) {
  const { state, dispatch } = useStore();
  const isNew = !question;
  const [f, setF] = useState(() => ({
    id: question?.id || uid('q'),
    comp: question?.comp || defaultComp,
    q: question?.q || '',
    options: question?.options ? [...question.options] : ['', '', '', ''],
    answer: question?.answer ?? 0,
    why: question?.why || '',
    ref: question?.ref || '',
  }));
  const [errors, setErrors] = useState({});
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const save = () => {
    const e = {};
    if (!f.q.trim()) e.q = 'Enter the question.';
    const opts = f.options.map((o) => o.trim());
    if (opts.some((o) => !o)) e.options = 'Fill in every option or remove empty ones.';
    if (opts.length < 2) e.options = 'Add at least two options.';
    if (f.answer < 0 || f.answer >= opts.length) e.options = 'Mark the correct answer.';
    if (!f.why.trim()) e.why = 'Explain why the answer is correct.';
    setErrors(e);
    if (Object.keys(e).length) return;
    dispatch({ type: 'content/question/save', question: { id: f.id, comp: f.comp, q: f.q.trim(), options: opts, answer: f.answer, why: f.why.trim(), ref: f.ref } });
    onClose();
  };

  const removeOpt = (i) =>
    setF((p) => ({ ...p, options: p.options.filter((_, j) => j !== i), answer: p.answer === i ? 0 : p.answer > i ? p.answer - 1 : p.answer }));

  return (
    <Modal
      title={isNew ? 'Add question' : 'Edit question'}
      subtitle="Multiple choice with one correct answer, an explanation, and a repository source."
      onClose={onClose}
      footer={
        <>
          {Object.keys(errors).length > 0 && <span className="mr-auto text-[12.5px] text-bad flex items-center gap-1.5"><AlertTriangle size={14} /> Fix the highlighted fields.</span>}
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save}><Save size={15} /> Save question</Button>
        </>
      }
    >
      <div className="grid gap-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Competency" htmlFor="qe-comp">
            <select id="qe-comp" className={inputCls} value={f.comp} onChange={(e) => set('comp', e.target.value)}>
              {COMPETENCIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </Field>
          <Field label="Source document" htmlFor="qe-ref">
            <select id="qe-ref" className={inputCls} value={f.ref} onChange={(e) => set('ref', e.target.value)}>
              <option value="">No source</option>
              {state.content.docs.map((d) => <option key={d.id} value={d.id}>{d.short}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Question" htmlFor="qe-q" error={errors.q}>
          <textarea id="qe-q" rows={3} className={inputCls} value={f.q} onChange={(e) => set('q', e.target.value)} />
        </Field>
        <fieldset className="grid gap-2">
          <legend className="text-[12.5px] font-semibold text-ink mb-1">Options · select the correct answer</legend>
          {f.options.map((o, i) => (
            <div key={i} className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ${f.answer === i ? 'border-good/40 bg-good-soft/60' : 'border-line'}`}>
              <input type="radio" name="qe-answer" id={`qe-a-${i}`} checked={f.answer === i} onChange={() => set('answer', i)} className="accent-[#1E7A4C]" aria-label={`Option ${LETTERS[i]} is correct`} />
              <label htmlFor={`qe-o-${i}`} className="text-[12.5px] font-bold text-navy-500 w-4">{LETTERS[i]}</label>
              <input id={`qe-o-${i}`} className="flex-1 bg-transparent text-[14px] py-1 focus:outline-none" value={o} onChange={(e) => setF((p) => ({ ...p, options: p.options.map((x, j) => (j === i ? e.target.value : x)) }))} placeholder={`Option ${LETTERS[i]}`} />
              <IconBtn label={`Remove option ${LETTERS[i]}`} tone="bad" disabled={f.options.length <= 2} onClick={() => removeOpt(i)}><X size={14} /></IconBtn>
            </div>
          ))}
          {errors.options && <span className="text-[12px] text-bad">{errors.options}</span>}
          <div>
            <Button size="sm" variant="outline" disabled={f.options.length >= 6} onClick={() => set('options', [...f.options, ''])}><Plus size={14} /> Add option</Button>
          </div>
        </fieldset>
        <Field label="Explanation shown after submission" htmlFor="qe-why" error={errors.why}>
          <textarea id="qe-why" rows={3} className={inputCls} value={f.why} onChange={(e) => set('why', e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
