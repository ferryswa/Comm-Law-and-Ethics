import React, { useState } from 'react';
import { CheckCircle2, XCircle, Circle, ListChecks, PenLine, Film, ChevronDown, FlaskConical, ArrowRight } from 'lucide-react';
import { useStore } from '../state/store.jsx';
import { COMPETENCIES } from '../data/lessons.js';
import { Card, CardHeader, PageTitle, Pill, Progress, EssayStatus, DemoTag, Button } from '../components/ui.jsx';

const fmtDate = (s) => new Date(s).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

export default function Assessment() {
  const { state, d } = useStore();
  const toneBorder = { good: 'border-good', warn: 'border-warn', bad: 'border-bad' }[d.overall.tone];

  return (
    <>
      <PageTitle title="Assessment & Achievement" subtitle="Quiz results, essay review status, individual progress, and pass status." />

      {/* Status */}
      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <Card className={`p-5 sm:p-6 border-l-4 ${toneBorder}`}>
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <div className="text-[12.5px] font-semibold text-muted">Pass status · {state.session.name}</div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[28px] font-bold text-ink leading-tight">{d.overall.label}</span>
                <Pill tone={d.overall.tone}>{d.overall.key === 'pass' ? 'All requirements met' : d.overall.reason}</Pill>
              </div>
            </div>
          </div>
          <ul className="mt-5 grid gap-3">
            {d.criteria.map((c) => (
              <li key={c.id} className="flex items-start gap-3">
                {c.met ? (
                  <CheckCircle2 size={19} className="text-good shrink-0 mt-px" aria-label="Met" />
                ) : (
                  <Circle size={19} className="text-navy-300 shrink-0 mt-px" aria-label="Not met" />
                )}
                <div className="min-w-0 flex-1 flex flex-wrap justify-between gap-x-3">
                  <span className="text-[14px] text-ink">{c.label}</span>
                  <span className="tabular text-[13px] text-muted">{c.detail}</span>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-[12px] text-muted mt-5">
            Rules: the quiz is passed when the best score is ≥ {d.passingPct}%. Essays require manual approval by a reviewer. Passing requires all three.
          </p>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <Stat icon={Film} value={`${d.modulesDone}/${d.lessonCount}`} label="Videos completed" />
            <Stat icon={ListChecks} value={d.best ? `${d.best.pct}%` : '–'} label="Best quiz score" />
            <Stat icon={PenLine} value={`${d.essaysApproved}/3`} label="Essays approved" />
          </div>
          <div className="mt-6">
            <div className="flex justify-between text-[12.5px] text-muted">
              <span>Best score vs pass mark</span>
              <span className="tabular">{d.best ? d.best.pct : 0}% / {d.passingPct}%</span>
            </div>
            <div className="relative mt-2">
              <Progress value={d.best ? d.best.pct : 0} height="h-3" color={d.quizPassed ? 'bg-good' : 'bg-bad'} label="Best quiz score" />
              <span className="absolute -top-1 bottom-[-4px] w-[2px] bg-ink" style={{ left: `${d.passingPct}%` }} aria-hidden="true" />
            </div>
            <div className="relative h-4 mt-1 text-[11px] text-muted">
              <span className="absolute -translate-x-1/2 tabular" style={{ left: `${d.passingPct}%` }}>pass mark {d.passingPct}%</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Quiz results */}
      <Card className="mt-6">
        <CardHeader
          title="Quiz Results"
          subtitle="All attempts, scored automatically"
          right={
            <a href="#quiz" className="inline-flex items-center gap-1 text-[13px] font-semibold text-navy-600 hover:text-brand-red">
              Take the quiz <ArrowRight size={14} />
            </a>
          }
        />
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-[13.5px] min-w-[620px]">
            <thead>
              <tr className="text-left text-[12px] text-muted border-y border-line bg-paper">
                <th className="font-semibold px-5 py-2.5">Attempt</th>
                <th className="font-semibold px-3 py-2.5">Date</th>
                <th className="font-semibold px-3 py-2.5 text-right">Correct</th>
                <th className="font-semibold px-3 py-2.5 text-right">Score</th>
                {COMPETENCIES.map((c) => (
                  <th key={c.id} className="font-semibold px-3 py-2.5 text-right whitespace-nowrap" title={c.label}>
                    {c.short}
                  </th>
                ))}
                <th className="font-semibold px-5 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {[...d.attempts].reverse().map((a, i) => {
                const n = d.attempts.length - i;
                const passed = a.pct >= d.passingPct;
                return (
                  <tr key={a.id} className="border-b border-line last:border-b-0">
                    <td className="px-5 py-3 font-semibold text-ink whitespace-nowrap">
                      #{n} {a.sample && <span className="ml-1"><DemoTag /></span>}
                    </td>
                    <td className="px-3 py-3 text-muted whitespace-nowrap">{fmtDate(a.at)}</td>
                    <td className="px-3 py-3 text-right tabular">{a.correct}/{a.total}</td>
                    <td className="px-3 py-3 text-right tabular font-semibold text-ink">{a.pct}%</td>
                    {COMPETENCIES.map((c) => (
                      <td key={c.id} className="px-3 py-3 text-right tabular text-muted">
                        {a.byComp[c.id] ? `${a.byComp[c.id].correct}/${a.byComp[c.id].total}` : '–'}
                      </td>
                    ))}
                    <td className="px-5 py-3">
                      <Pill tone={passed ? 'good' : 'bad'}>{passed ? 'Passed' : 'Not passed'}</Pill>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        {/* Essays */}
        <Card>
          <CardHeader
            title="Essay Review Status"
            subtitle="Manual approval by a newsroom reviewer"
            right={
              <a href="#essays" className="inline-flex items-center gap-1 text-[13px] font-semibold text-navy-600 hover:text-brand-red">
                Open essays <ArrowRight size={14} />
              </a>
            }
          />
          <ul className="mt-3 divide-y divide-line">
            {d.essayRows.map((e, i) => (
              <li key={e.id} className="px-5 py-3.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-semibold text-ink">
                    {i + 1}. {e.title}
                  </div>
                  <div className="text-[12px] text-muted tabular mt-0.5">
                    {e.words} words
                    {e.status === 'pending' && e.submittedAt && ` · submitted ${fmtDate(e.submittedAt)}`}
                    {(e.status === 'approved' || e.status === 'revise') && e.reviewedAt && ` · reviewed ${fmtDate(e.reviewedAt)}`}
                  </div>
                </div>
                {e.sample && <DemoTag />}
                <EssayStatus status={e.status} />
              </li>
            ))}
          </ul>
          {d.isAdmin && <ReviewerSimulator />}
        </Card>

        {/* Individual progress */}
        <Card>
          <CardHeader title="Individual Progress" subtitle="Induction videos and competencies" />
          <ul className="px-5 mt-4 grid gap-3.5">
            {d.lessonRows.map((l) => (
              <li key={l.id}>
                <div className="flex items-center gap-2 text-[13.5px]">
                  {l.completed ? <CheckCircle2 size={15} className="text-good" aria-label="Completed" /> : <Circle size={15} className="text-navy-300" aria-label="Not completed" />}
                  <span className="text-ink font-medium truncate">{l.no}. {l.title}</span>
                  <span className="ml-auto tabular text-[12.5px] text-muted shrink-0">
                    {Math.round(Math.min(l.watched, l.minutes * 60) / 60)}/{l.minutes} min
                  </span>
                </div>
                <div className="mt-1.5 pl-[23px]">
                  <Progress value={l.pct} color={l.completed ? 'bg-chart' : 'bg-brand-red'} label={`Progress: ${l.title}`} />
                </div>
              </li>
            ))}
          </ul>
          <div className="px-5 pt-6 pb-5">
            <h3 className="text-[13.5px] font-semibold text-ink mb-3">Competencies</h3>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
              {d.competencies.map((c) => (
                <div key={c.id}>
                  <div className="flex justify-between text-[12.5px]">
                    <span className="text-ink">{c.label}</span>
                    <span className="tabular text-muted">{c.value}%</span>
                  </div>
                  <div className="mt-1">
                    <Progress value={c.value} height="h-1.5" label={`Competency: ${c.label}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

function Stat({ icon: Icon, value, label }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <Icon size={18} className="text-navy-400" aria-hidden="true" />
      <span className="tabular text-[24px] font-bold text-ink leading-none mt-1">{value}</span>
      <span className="text-[12px] text-muted">{label}</span>
    </div>
  );
}

// Admin-only: manual essay approval (prototype; no separate reviewer workflow).
function ReviewerSimulator() {
  const { state, dispatch, d } = useStore();
  const [open, setOpen] = useState(false);
  const pending = d.essayRows.filter((e) => e.status === 'pending');
  return (
    <div className="border-t border-line">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 px-5 h-11 text-[12.5px] font-semibold text-muted hover:bg-paper"
      >
        <FlaskConical size={15} aria-hidden="true" /> Review essays (admin)
        <ChevronDown size={15} className={`ml-auto transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-5">
          <p className="text-[12px] text-muted mb-3">
            As administrator you can approve an essay or return it for revision. The decision is recorded with your name.
          </p>
          {pending.length === 0 ? (
            <div className="text-[12.5px] text-muted rounded-lg bg-paper px-3 py-2.5">No essays are awaiting review. Submit an essay from the Essays tab first.</div>
          ) : (
            <ul className="grid gap-2">
              {pending.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-navy-200 px-3 py-2">
                  <span className="text-[13px] text-ink flex-1 min-w-[160px]">{e.title}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => dispatch({ type: 'essay/review', id: e.id, decision: 'revise', reviewer: state.session.name, note: 'Strengthen the legal references and concrete steps.' })}
                  >
                    <XCircle size={14} /> Request revision
                  </Button>
                  <Button
                    size="sm"
                    variant="navy"
                    onClick={() => dispatch({ type: 'essay/review', id: e.id, decision: 'approved', reviewer: state.session.name, note: 'The analysis meets the criteria.' })}
                  >
                    <CheckCircle2 size={14} /> Approve
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
