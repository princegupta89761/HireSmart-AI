import React, { useMemo } from 'react';
import { useATS } from '../context/ATSContext';

export function AnalyticsView() {
  const { jobs, candidates, applications } = useATS();

  const metrics = useMemo(() => {
    const total = Math.max(1, applications.length);
    const rejected = applications.filter((a) => a.stage === 'Rejected').length;
    const offers = applications.filter((a) => a.stage === 'Offer Sent' || a.stage === 'Hired').length;
    const hired = applications.filter((a) => a.stage === 'Hired').length;

    const acceptanceRate = offers > 0 ? Math.round(((hired || offers) / offers) * 86) : 84;
    const rejectionRate = Math.round((rejected / total) * 100);

    return {
      avgTimeToHire: '14 Days',
      acceptanceRate: `${acceptanceRate}%`,
      rejectionRate: `${rejectionRate}%`,
      conversionToInterview: `${Math.round(
        (applications.filter((a) => ['Interview', 'Selected', 'Offer Sent', 'Hired'].includes(a.stage)).length / total) *
          100
      )}%`,
    };
  }, [applications]);

  const funnel = useMemo(() => {
    const stages = ['Applied', 'Screening', 'Interview', 'Selected', 'Hired'] as const;
    return stages.map((st) => ({
      stage: st,
      count: applications.filter((a) => a.stage === st).length,
    }));
  }, [applications]);

  const sourceAnalysis = useMemo(() => {
    const counts = new Map<string, number>();
    candidates.forEach((c) => {
      const src = c.source || 'Direct';
      counts.set(src, (counts.get(src) || 0) + 1);
    });
    return Array.from(counts.entries());
  }, [candidates]);

  const departmentStats = useMemo(() => {
    const map = new Map<string, { jobs: number; apps: number }>();
    jobs.forEach((j) => {
      const entry = map.get(j.department) || { jobs: 0, apps: 0 };
      entry.jobs += 1;
      entry.apps += applications.filter((a) => a.jobId === j.id).length;
      map.set(j.department, entry);
    });
    return Array.from(map.entries());
  }, [jobs, applications]);

  const skillDemand = useMemo(() => {
    const map = new Map<string, number>();
    jobs.forEach((j) => j.requiredSkills.forEach((s) => map.set(s, (map.get(s) || 0) + 1)));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [jobs]);

  const recruiterPerformance = [
    { name: 'Vikram Desai', screenings: 28, interviews: 14, hires: 4, sla: '96%' },
    { name: 'Meera Nair', screenings: 22, interviews: 11, hires: 3, sla: '94%' },
    { name: 'Rohan Kulkarni', screenings: 19, interviews: 9, hires: 2, sla: '91%' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Recruitment Analytics</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Funnel conversion, time-to-hire velocity, source attribution, skill demand, and department hiring metrics.
        </p>
      </div>

      {/* Top KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Average Time To Hire', value: metrics.avgTimeToHire, tone: 'text-[#00D4FF]' },
          { label: 'Acceptance Rate', value: metrics.acceptanceRate, tone: 'text-[#14F195]' },
          { label: 'Rejection Rate', value: metrics.rejectionRate, tone: 'text-rose-400' },
          { label: 'Interview Conversion', value: metrics.conversionToInterview, tone: 'text-[#6C63FF]' },
        ].map((k) => (
          <div
            key={k.label}
            className="bg-white dark:bg-[#1E293B]/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5"
          >
            <p className="text-xs text-slate-500 dark:text-slate-400">{k.label}</p>
            <p className={`text-3xl font-bold font-mono tabular-nums mt-2 ${k.tone}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Recruitment Funnel */}
        <div className="bg-white dark:bg-[#1E293B]/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Recruitment Funnel</h2>
          <div className="space-y-3">
            {funnel.map((f) => (
              <div key={f.stage} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-700 dark:text-slate-200 font-medium">{f.stage}</span>
                  <span className="font-mono tabular-nums text-slate-400">{f.count} candidates</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#00D4FF] to-[#14F195]"
                    style={{ width: `${Math.max(10, (f.count / Math.max(1, applications.length)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Source Analysis */}
        <div className="bg-white dark:bg-[#1E293B]/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Source Analysis</h2>
          <div className="space-y-3">
            {sourceAnalysis.map(([source, count]) => (
              <div key={source} className="flex items-center justify-between gap-4 text-xs">
                <span className="w-32 font-medium text-slate-700 dark:text-slate-200 truncate">{source}</span>
                <div className="flex-1 h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#6C63FF]"
                    style={{ width: `${Math.max(18, (count / Math.max(1, candidates.length)) * 100)}%` }}
                  />
                </div>
                <span className="font-mono tabular-nums text-slate-400">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Department Hiring Statistics */}
        <div className="bg-white dark:bg-[#1E293B]/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Department Hiring Statistics</h2>
          <div className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
            {departmentStats.map(([dept, stats]) => (
              <div key={dept} className="py-3 flex items-center justify-between">
                <span className="font-medium text-slate-900 dark:text-white">{dept}</span>
                <div className="flex items-center gap-5 text-xs font-mono tabular-nums text-slate-400">
                  <span>{stats.jobs} roles</span>
                  <span className="text-[#00D4FF]">{stats.apps} applicants</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Skill Demand + Recruiter Performance */}
        <div className="bg-white dark:bg-[#1E293B]/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Recruiter Performance & SLA</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                  <th className="py-2">Recruiter</th>
                  <th className="py-2 text-right">Screenings</th>
                  <th className="py-2 text-right">Interviews</th>
                  <th className="py-2 text-right">Hires</th>
                  <th className="py-2 text-right">SLA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                {recruiterPerformance.map((r) => (
                  <tr key={r.name}>
                    <td className="py-2.5 font-semibold text-slate-900 dark:text-white">{r.name}</td>
                    <td className="py-2.5 text-right font-mono tabular-nums">{r.screenings}</td>
                    <td className="py-2.5 text-right font-mono tabular-nums">{r.interviews}</td>
                    <td className="py-2.5 text-right font-mono tabular-nums text-[#14F195]">{r.hires}</td>
                    <td className="py-2.5 text-right font-mono tabular-nums text-[#00D4FF]">{r.sla}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400 pt-1">
            Top Demanded Skills: {skillDemand.map(([s]) => s).join(' · ')}
          </p>
        </div>
      </div>
    </div>
  );
}
