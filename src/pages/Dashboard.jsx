import React, { useMemo } from 'react';
import { PlayCircle, Gauge, Layers, Target, Clock, ListChecks, PenLine, ArrowRight, CheckCircle2, Circle } from 'lucide-react';
import { useStore, dayKey } from '../state/store.jsx';
import { Card, CardHeader, Kpi, Progress, Donut, ActivityBars, Pill, DemoTag } from '../components/ui.jsx';
import hero from '../assets/hero.webp';

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const fmtHours = (h) => h.toLocaleString('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export default function Dashboard() {
  const { state, dispatch, d } = useStore();

  const activity = useMemo(() => {
    const out = [];
    for (let i = 6; i >= 0; i--) {
      const dt = new Date();
      dt.setDate(dt.getDate() - i);
      const key = dayKey(dt);
      const minutes = state.activity.filter((a) => dayKey(a.at) === key).reduce((s, a) => s + a.minutes, 0);
      out.push({
        key,
        minutes,
        short: i === 0 ? 'Today' : DAY_SHORT[dt.getDay()],
        label: dt.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }),
        today: i === 0,
      });
    }
    return out;
  }, [state.activity]);

  const next = d.nextLesson;
  const openLesson = (id) => {
    dispatch({ type: 'ui/lesson', id });
    window.location.hash = 'induction';
  };

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-line bg-white min-h-[300px] sm:min-h-[320px] flex items-center">
        <img src={hero} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover object-[78%_center]" />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/10 md:via-white/70 md:to-transparent" aria-hidden="true" />
        <div className="relative px-6 py-8 sm:px-9 max-w-[560px]">
          <div className="text-[11.5px] font-bold tracking-[0.16em] text-brand-red">LEARNING DASHBOARD · COMMUNICATION LAW &amp; ETHICS</div>
          <h1 className="text-[28px] sm:text-[34px] leading-[1.12] font-bold text-ink tracking-tight mt-3">
            Welcome back, {state.session.name}
          </h1>
          <p className="text-[14.5px] text-ink/75 mt-3 max-w-[46ch]">
            You have completed {d.completionPct}% of the induction path.{' '}
            {next ? (
              <>
                Next up: <strong className="text-ink">{next.title}</strong>.
              </>
            ) : (
              'All videos are done. Finish the quiz and essays to complete your assessment.'
            )}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => (next ? openLesson(next.id) : (window.location.hash = 'quiz'))}
              className="h-11 px-5 rounded-lg bg-brand-red text-white text-[14px] font-semibold hover:bg-brand-red-dark inline-flex items-center gap-2"
            >
              <PlayCircle size={18} aria-hidden="true" /> {next ? 'Continue learning' : 'Go to quiz'}
            </button>
            <a href="#assessment" className="h-11 px-5 rounded-lg border border-navy-200 bg-white/90 text-navy-700 text-[14px] font-semibold hover:border-navy inline-flex items-center">
              View assessment
            </a>
          </div>
          <div className="mt-5 flex items-center gap-2 text-[13px] text-muted">
            Pass status <Pill tone={d.overall.tone}>{d.overall.label}</Pill>
          </div>
        </div>
      </section>

      {/* KPI */}
      <Card className="p-5 sm:p-6 mt-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-6">
          <Kpi icon={Gauge} label="Completion" value={d.completionPct} unit="%" hint={`Video minutes watched out of ${d.totalMinutes}`} />
          <Kpi icon={Layers} label="Modules completed" value={`${d.modulesDone}/${d.lessonCount}`} hint={d.modulesDone === d.lessonCount ? 'All videos completed' : `${d.lessonCount - d.modulesDone} remaining`} />
          <Kpi
            icon={Target}
            label="Best quiz score"
            value={d.best ? d.best.pct : '–'}
            unit={d.best ? '%' : ''}
            hint={d.best ? `${d.best.correct}/${d.best.total} correct · pass mark ${d.passingPct}%` : `Pass mark ${d.passingPct}%`}
          />
          <Kpi icon={Clock} label="Learning hours" value={fmtHours(d.hours)} unit=" hrs" hint={`${Math.round(d.minutesTotal)} minutes logged`} />
        </div>
      </Card>

      {/* Continue learning */}
      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-[17px] font-bold text-ink">Continue Learning</h2>
        {next && <span className="text-[12.5px] text-muted">Module {next.no}</span>}
      </div>
      <div className="mt-3 grid gap-4 lg:grid-cols-3">
        {next ? (
          <button
            type="button"
            onClick={() => openLesson(next.id)}
            className="lg:col-span-2 text-left rounded-xl bg-navy text-white p-5 sm:p-6 hover:bg-navy-800 transition-colors group"
          >
            <div className="flex items-start gap-4">
              <PlayCircle size={40} strokeWidth={1.6} className="shrink-0 mt-0.5 group-hover:text-brand-red transition-colors" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="text-[19px] font-bold leading-snug">{next.title}</div>
                <div className="text-[13px] text-white/70 mt-1">
                  Resume from chapter {next.chapter + 1}: {next.chapters[next.chapter]?.title}
                </div>
              </div>
              <ArrowRight size={20} className="shrink-0 text-white/50 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </div>
            <div className="mt-5">
              <Progress value={next.pct} color="bg-brand-red" track="bg-white/20" label={`Progress: ${next.title}`} />
              <div className="flex justify-between text-[12px] text-white/65 mt-2 tabular">
                <span>{next.pct}% watched</span>
                <span>About {Math.max(1, Math.round(next.minutes - next.watched / 60))} min left</span>
              </div>
            </div>
          </button>
        ) : (
          <div className="lg:col-span-2 rounded-xl bg-navy text-white p-6 flex items-center gap-4">
            <CheckCircle2 size={36} className="text-white" aria-hidden="true" />
            <div>
              <div className="text-[18px] font-bold">All induction videos completed</div>
              <div className="text-[13px] text-white/70">Continue to the quiz and essays to complete the assessment.</div>
            </div>
          </div>
        )}
        <div className="grid gap-4">
          <a href="#quiz" className="rounded-xl border border-line bg-white p-4 hover:border-navy-300 transition-colors flex gap-3 items-start">
            <ListChecks size={20} className="text-navy-500 mt-0.5 shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-semibold text-ink">{d.questionCount}-question quiz</div>
              <div className="text-[12.5px] text-muted mt-0.5">
                {d.latest ? `Latest ${d.latest.pct}%` : 'Not attempted'} · pass ≥ {d.passingPct}%
              </div>
            </div>
            <Pill tone={d.quizPassed ? 'good' : 'warn'}>{d.quizPassed ? 'Passed' : 'Pending'}</Pill>
          </a>
          <a href="#essays" className="rounded-xl border border-line bg-white p-4 hover:border-navy-300 transition-colors flex gap-3 items-start">
            <PenLine size={20} className="text-navy-500 mt-0.5 shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-semibold text-ink">3 reflective essays</div>
              <div className="text-[12.5px] text-muted mt-0.5">
                {d.essaysApproved} approved · {d.essaysPending} awaiting review
              </div>
            </div>
            <Pill tone={d.essaysApproved === 3 ? 'good' : 'warn'}>{d.essaysApproved}/3</Pill>
          </a>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        {/* Learning progress */}
        <Card>
          <CardHeader title="Learning Progress" subtitle="Progress by induction video module" />
          <ul className="px-5 pt-4 grid gap-4">
            {d.lessonRows.map((l) => (
              <li key={l.id}>
                <button type="button" onClick={() => openLesson(l.id)} className="w-full text-left group">
                  <div className="flex items-center gap-2 text-[13.5px]">
                    {l.completed ? (
                      <CheckCircle2 size={16} className="text-good shrink-0" aria-label="Completed" />
                    ) : (
                      <Circle size={16} className="text-navy-300 shrink-0" aria-label="Not completed" />
                    )}
                    <span className="font-medium text-ink group-hover:text-brand-red truncate">
                      {l.no}. {l.title}
                    </span>
                    <span className="ml-auto tabular text-muted text-[12.5px] shrink-0">
                      {l.pct}% · {l.minutes} min
                    </span>
                  </div>
                  <div className="mt-2 pl-6">
                    <Progress value={l.pct} color={l.completed ? 'bg-chart' : 'bg-brand-red'} label={`Progress: ${l.title}`} />
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <div className="px-5 pt-6 pb-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13.5px] font-semibold text-ink">Learning minutes, last 7 days</h3>
              <DemoTag>Initial history = sample</DemoTag>
            </div>
            <ActivityBars data={activity} />
          </div>
        </Card>

        {/* Competency */}
        <Card>
          <CardHeader
            title="Competency Attainment"
            subtitle="50% video progress + 50% quiz accuracy per category (best attempt)"
          />
          <div className="p-5 flex flex-col sm:flex-row gap-6 sm:items-center">
            <Donut value={d.competencyAvg} label={d.competencyAvg >= 80 ? 'Ready' : 'Developing'} />
            <ul className="flex-1 grid gap-4 min-w-0">
              {d.competencies.map((c) => (
                <li key={c.id}>
                  <div className="flex justify-between text-[13.5px]">
                    <span className="text-ink font-medium">{c.label}</span>
                    <span className="tabular text-muted">{c.value}%</span>
                  </div>
                  <div className="mt-1.5">
                    <Progress value={c.value} label={`Competency: ${c.label}`} />
                  </div>
                  <div className="text-[11.5px] text-muted mt-1 tabular">
                    Video {c.videoPct}% · Quiz {c.quizPct}%
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="mx-5 mb-5 rounded-lg bg-paper px-4 py-3 text-[12.5px] text-muted">
            Lowest competency:{' '}
            <strong className="text-ink">
              {[...d.competencies].sort((a, b) => a.value - b.value)[0].label}
            </strong>
            . Finish the related video and retake the quiz to raise it.
          </div>
        </Card>
      </div>
    </>
  );
}
