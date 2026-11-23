import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  ArrowUpRight,
  Bot,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  FileUp,
  Kanban,
  Plus,
  Send,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react';
import { useATS } from '../context/ATSContext';
import type { NavModule } from '../types';

interface DashboardViewProps {
  onNavigate: (m: NavModule) => void;
  onInspectCandidate: (candidateId: string) => void;
}

export function DashboardView({ onNavigate, onInspectCandidate }: DashboardViewProps) {
  const { jobs, candidates, applications, interviews, notifications, markNotificationRead } = useATS();

  const kpis = useMemo(() => {
    const totalJobs = jobs.length;
    const activeJobs = jobs.filter((j) => j.status === 'Published').length;
    const totalApps = applications.length;
    const shortlisted = applications.filter((a) =>
      ['Shortlisted', 'Interview', 'Selected', 'Offer Sent', 'Hired'].includes(a.stage)
    ).length;
    const scheduledInterviews = interviews.filter((iv) => iv.status === 'Scheduled' || iv.status === 'Rescheduled').length;
    const offersSent = applications.filter((a) => a.stage === 'Offer Sent' || a.stage === 'Hired').length;
    const hired = applications.filter((a) => a.stage === 'Hired').length;

    return [
      { label: 'Total Jobs', value: totalJobs, icon: Briefcase, color: 'text-[#00D4FF]' },
      { label: 'Active Jobs', value: activeJobs, icon: CheckCircle2, color: 'text-[#14F195]' },
      { label: 'Applications', value: totalApps, icon: Users, color: 'text-white' },
      { label: 'Shortlisted', value: shortlisted, icon: Sparkles, color: 'text-[#6C63FF]' },
      { label: 'Interviews Scheduled', value: scheduledInterviews, icon: CalendarClock, color: 'text-[#00D4FF]' },
      { label: 'Offers Sent', value: offersSent, icon: Send, color: 'text-amber-400' },
      { label: 'Hired Candidates', value: hired, icon: UserCheck, color: 'text-[#14F195]' },
    ];
  }, [jobs, applications, interviews]);

  const appsPerJob = useMemo(() => {
    return jobs.map((j) => ({
      title: j.title.length > 22 ? `${j.title.slice(0, 22)}...` : j.title,
      count: applications.filter((a) => a.jobId === j.id).length,
    }));
  }, [jobs, applications]);

  const maxAppsPerJob = Math.max(1, ...appsPerJob.map((x) => x.count));

  const funnelStages = useMemo(() => {
    const stages = ['Applied', 'Screening', 'Shortlisted', 'Interview', 'Selected', 'Offer Sent', 'Hired'] as const;
    return stages.map((stage) => {
      const count = applications.filter((a) => a.stage === stage).length;
      return { stage, count };
    });
  }, [applications]);

  const maxFunnel = Math.max(1, ...funnelStages.map((s) => s.count));

  const skillDemand = useMemo(() => {
    const map = new Map<string, number>();
    jobs.forEach((j) => {
      j.requiredSkills.forEach((s) => map.set(s, (map.get(s) || 0) + 2));
    });
    candidates.forEach((c) => {
      c.skills.forEach((s) => map.set(s, (map.get(s) || 0) + 1));
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [jobs, candidates]);

  const maxSkillCount = Math.max(1, ...skillDemand.map((s) => s[1]));

  const monthlyTrend = [
    { month: 'Jun', applications: 18, hires: 3 },
    { month: 'Jul', applications: 24, hires: 4 },
    { month: 'Aug', applications: 31, hires: 6 },
    { month: 'Sep', applications: 29, hires: 5 },
    { month: 'Oct', applications: 38, hires: 8 },
    { month: 'Nov', applications: Math.max(42, applications.length * 8), hires: Math.max(9, applications.filter((a) => a.stage === 'Hired').length + 8) },
  ];

  const recentActivities = useMemo(() => {
    const items: { id: string; title: string; detail: string; time: string; candidateId?: string }[] = [];
    applications.slice(0, 4).forEach((app) => {
      const cand = candidates.find((c) => c.id === app.candidateId);
      const job = jobs.find((j) => j.id === app.jobId);
      items.push({
        id: app.id,
        title: `${cand?.fullName || 'Candidate'} moved to ${app.stage}`,
        detail: `${job?.title || 'Role'} · ${app.matchScore}% Match`,
        time: app.appliedAt,
        candidateId: cand?.id,
      });
    });
    interviews.slice(0, 2).forEach((iv) => {
      const cand = candidates.find((c) => c.id === iv.candidateId);
      items.push({
        id: iv.id,
        title: `Interview ${iv.status}: ${cand?.fullName || 'Candidate'}`,
        detail: `${iv.date} at ${iv.time} · ${iv.mode}`,
        time: iv.date,
        candidateId: cand?.id,
      });
    });
    return items.slice(0, 5);
  }, [applications, candidates, jobs, interviews]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Recruitment Command Center</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time pipeline health, AI candidate rankings, and active interview velocity.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('jobs')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00D4FF] text-slate-950 font-semibold text-xs sm:text-sm hover:bg-[#33ddff] transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Job
          </button>
          <button
            onClick={() => onNavigate('assistant')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-xs sm:text-sm hover:border-[#6C63FF] transition-colors whitespace-nowrap cursor-pointer"
          >
            <Bot className="w-4 h-4 text-[#6C63FF]" />
            Ask AI Assistant
          </button>
        </div>
      </div>

      {/* 7 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3.5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.03 }}
              className="bg-white dark:bg-[#1E293B]/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{kpi.label}</span>
                <Icon className={`w-4 h-4 shrink-0 ${kpi.color}`} />
              </div>
              <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-3">
                {kpi.value}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* AI Hiring Health Dashboard */}
      {(() => {
        const hiredApps = applications.filter((a) => a.stage === 'Hired');
        const offerApps = applications.filter((a) => a.stage === 'Offer Sent' || a.stage === 'Hired');
        const completedIvs = interviews.filter((iv) => iv.status === 'Completed');
        const interviewSuccessRate = interviews.length
          ? Math.round(
              ((applications.filter((a) => ['Selected', 'Offer Sent', 'Hired'].includes(a.stage)).length) /
                Math.max(1, completedIvs.length || interviews.length)) *
                100
            )
          : 74;
        const offerAcceptanceRate = offerApps.length
          ? Math.round((hiredApps.length / offerApps.length) * 100)
          : 82;
        const avgTimeToHire = hiredApps.length > 0 ? Math.max(14, 24 - Math.min(8, hiredApps.length)) : 19;

        const mostAppliedJobs = [...jobs]
          .map((j) => ({
            id: j.id,
            title: j.title,
            count: applications.filter((a) => a.jobId === j.id).length,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);

        const screeningBacklog = applications.filter((a) => a.stage === 'Screening' || a.stage === 'Applied').length;
        const interviewQueue = interviews.filter((iv) => iv.status === 'Scheduled' || iv.status === 'Rescheduled').length;
        const bottlenecks = [
          screeningBacklog > 15
            ? `Screening backlog: ${screeningBacklog} candidates awaiting triage`
            : `Screening throughput healthy (${screeningBacklog} in early stages)`,
          interviewQueue > 10
            ? `Panel capacity alert: ${interviewQueue} interviews pending completion`
            : `Interview panel SLA on track (${interviewQueue} scheduled)`,
        ];

        return (
          <div className="bg-white dark:bg-[#1E293B]/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">AI Hiring Health Dashboard</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Executive recruitment velocity, conversion rates, top demand, and pipeline bottleneck diagnostics.
                </p>
              </div>
              <button
                onClick={() => onNavigate('analytics')}
                className="text-xs font-semibold text-[#00D4FF] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                Deep Analytics <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800">
                <p className="text-[11px] text-slate-400">Avg. Time to Hire</p>
                <p className="text-xl font-bold font-mono tabular-nums text-[#00D4FF] mt-1">{avgTimeToHire} days</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800">
                <p className="text-[11px] text-slate-400">Interview Success Rate</p>
                <p className="text-xl font-bold font-mono tabular-nums text-[#14F195] mt-1">
                  {Math.min(96, interviewSuccessRate)}%
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800">
                <p className="text-[11px] text-slate-400">Offer Acceptance Rate</p>
                <p className="text-xl font-bold font-mono tabular-nums text-[#6C63FF] mt-1">
                  {Math.min(98, offerAcceptanceRate)}%
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800">
                <p className="text-[11px] text-slate-400">Most Applied Jobs</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1.5 leading-relaxed">
                  {mostAppliedJobs.map((j) => `${j.title.split(' ').slice(0, 2).join(' ')} (${j.count})`).join(' · ')}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800">
                <p className="text-[11px] text-slate-400">Top Skills in Demand</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1.5 leading-relaxed">
                  {skillDemand.slice(0, 4).map(([s]) => s).join(' · ')}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-amber-500/30">
                <p className="text-[11px] text-amber-400 font-semibold">Recruitment Bottlenecks</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                  {bottlenecks.join(' · ')}
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Applications Per Job */}
        <div className="bg-white dark:bg-[#1E293B]/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Applications Per Job</h2>
            <button
              onClick={() => onNavigate('applications')}
              className="text-xs text-[#00D4FF] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              View Pipeline <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-3.5">
            {appsPerJob.map((item) => (
              <div key={item.title} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 dark:text-slate-200 font-medium truncate">{item.title}</span>
                  <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">{item.count} applicants</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#00D4FF] to-[#6C63FF] transition-all duration-300"
                    style={{ width: `${Math.max(8, (item.count / maxAppsPerJob) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Hiring Trend */}
        <div className="bg-white dark:bg-[#1E293B]/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Monthly Hiring Trend</h2>
            <span className="text-xs text-slate-400">Applications vs. Hires</span>
          </div>
          <div className="h-48 flex items-end justify-between gap-3 pt-4">
            {monthlyTrend.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div className="w-full flex items-end justify-center gap-1.5 h-36">
                  <div
                    className="w-4 rounded-t-md bg-[#00D4FF]/80 transition-all"
                    style={{ height: `${Math.min(100, (m.applications / 45) * 100)}%` }}
                    title={`${m.applications} applications`}
                  />
                  <div
                    className="w-4 rounded-t-md bg-[#14F195]/85 transition-all"
                    style={{ height: `${Math.min(100, (m.hires / 12) * 100)}%` }}
                    title={`${m.hires} hires`}
                  />
                </div>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{m.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hiring Funnel */}
        <div className="bg-white dark:bg-[#1E293B]/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Hiring Funnel</h2>
            <span className="text-xs text-slate-400">Live stage distribution</span>
          </div>
          <div className="space-y-2.5">
            {funnelStages.map((s) => (
              <div key={s.stage} className="flex items-center gap-3 text-xs">
                <span className="w-24 text-slate-600 dark:text-slate-300 shrink-0">{s.stage}</span>
                <div className="flex-1 h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#6C63FF]"
                    style={{ width: `${Math.max(s.count > 0 ? 12 : 3, (s.count / maxFunnel) * 100)}%` }}
                  />
                </div>
                <span className="w-8 text-right font-mono tabular-nums text-slate-700 dark:text-slate-200">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Skill Demand Analysis */}
        <div className="bg-white dark:bg-[#1E293B]/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Skill Demand Analysis</h2>
            <span className="text-xs text-slate-400">Active requisitions & pool</span>
          </div>
          <div className="space-y-3">
            {skillDemand.map(([skill, weight]) => (
              <div key={skill} className="flex items-center gap-3 text-xs">
                <span className="w-24 font-medium text-slate-700 dark:text-slate-200 truncate shrink-0">{skill}</span>
                <div className="flex-1 h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#14F195]"
                    style={{ width: `${Math.max(15, (weight / maxSkillCount) * 100)}%` }}
                  />
                </div>
                <span className="w-10 text-right font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  {weight} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Activities + Quick Actions + Notifications */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Recent Activities Feed */}
        <div className="bg-white dark:bg-[#1E293B]/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Recent Activities</h2>
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {recentActivities.map((act) => (
              <div key={act.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                <div>
                  <button
                    onClick={() => act.candidateId && onInspectCandidate(act.candidateId)}
                    className="text-sm font-medium text-slate-900 dark:text-white hover:text-[#00D4FF] text-left cursor-pointer"
                  >
                    {act.title}
                  </button>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{act.detail}</p>
                </div>
                <span className="text-[11px] font-mono text-slate-400 shrink-0">{act.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-white dark:bg-[#1E293B]/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Post New Job', icon: Briefcase, module: 'jobs' as NavModule },
              { label: 'Parse Resumes', icon: FileUp, module: 'resume-parser' as NavModule },
              { label: 'Kanban Board', icon: Kanban, module: 'applications' as NavModule },
              { label: 'AI Rankings', icon: Sparkles, module: 'ai-recommendations' as NavModule },
              { label: 'Schedule Interview', icon: CalendarClock, module: 'interview-center' as NavModule },
              { label: 'Export Reports', icon: ArrowUpRight, module: 'reports' as NavModule },
            ].map((qa) => {
              const Icon = qa.icon;
              return (
                <button
                  key={qa.label}
                  onClick={() => onNavigate(qa.module)}
                  className="flex flex-col items-start gap-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-[#00D4FF]/60 transition-colors text-left cursor-pointer"
                >
                  <Icon className="w-4 h-4 text-[#00D4FF]" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{qa.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Notifications Widget */}
        <div className="bg-white dark:bg-[#1E293B]/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Notifications</h2>
            <span className="text-xs font-mono text-[#00D4FF]">
              {notifications.filter((n) => !n.read).length} unread
            </span>
          </div>
          <div className="space-y-2.5">
            {notifications.slice(0, 4).map((n) => (
              <button
                key={n.id}
                onClick={() => markNotificationRead(n.id)}
                className={`w-full text-left p-3 rounded-xl border transition-colors cursor-pointer ${
                  n.read
                    ? 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/70 dark:border-slate-800/60 opacity-70'
                    : 'bg-slate-50 dark:bg-slate-900/70 border-[#00D4FF]/30'
                }`}
              >
                <p className="text-[11px] font-semibold text-[#00D4FF]">{n.type}</p>
                <p className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5">{n.title}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{n.message}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
