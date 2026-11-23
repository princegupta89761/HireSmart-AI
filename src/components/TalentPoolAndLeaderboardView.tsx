import React, { useMemo, useState } from 'react';
import { Award, Briefcase, CheckCircle2, RefreshCw, Sparkles, Star, Trophy } from 'lucide-react';
import { useATS } from '../context/ATSContext';
import { calculateCandidateMatch, getScoreColorClasses, runLocalSmartSearch } from '../lib/matchingEngine';

export function TalentPoolView({ onInspectCandidate }: { onInspectCandidate: (id: string) => void }) {
  const { candidates, jobs, applications, createApplication, addNotification } = useATS();
  const [query, setQuery] = useState('');
  const [targetJobId, setTargetJobId] = useState(jobs[0]?.id || '');
  const [reengagedId, setReengagedId] = useState<string | null>(null);

  const activeJob = jobs.find((j) => j.id === targetJobId) || jobs[0];

  const poolCandidates = useMemo(() => {
    const base = candidates.filter((c) => c.inTalentPool !== false);
    const matched = query.trim() ? runLocalSmartSearch(query, base) : base;
    return matched.slice(0, 36).map((cand) => {
      const bestMatch = activeJob ? calculateCandidateMatch(cand, activeJob) : null;
      const pastApp = applications.find((a) => a.candidateId === cand.id);
      return { cand, bestMatch, pastApp };
    });
  }, [candidates, query, activeJob, applications]);

  const handleRediscover = async (candId: string) => {
    if (!activeJob) return;
    const cand = candidates.find((c) => c.id === candId);
    if (!cand) return;
    const match = calculateCandidateMatch(cand, activeJob);
    await createApplication({
      jobId: activeJob.id,
      candidateId: cand.id,
      stage: 'Shortlisted',
      matchScore: match.overallScore,
      appliedAt: new Date().toISOString().slice(0, 10),
      aiExplanation: `Rediscovered from Talent Pool for ${activeJob.title}: ${match.recommendation}`,
    });
    await addNotification({
      type: 'Candidate Shortlisted',
      title: `Talent Pool Rediscovery: ${cand.fullName}`,
      message: `Matched at ${match.overallScore}% for ${activeJob.title}.`,
      read: false,
    });
    setReengagedId(candId);
    setTimeout(() => setReengagedId(null), 2500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Talent Pool Database</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Reusable archive of {candidates.length} past applicants with instant future-job recommendations and rediscovery.
          </p>
        </div>

        <select
          value={targetJobId}
          onChange={(e) => setTargetJobId(e.target.value)}
          className="px-4 py-2 rounded-xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 text-sm"
        >
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              Future Role Match: {j.title}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search past applicants (e.g. Find React developers with AWS from Mumbai)..."
          className="flex-1 min-w-[260px] px-4 py-2.5 rounded-xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 text-sm"
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {poolCandidates.map(({ cand, bestMatch, pastApp }) => {
          const score = bestMatch?.overallScore ?? cand.matchScore;
          const scoreStyle = getScoreColorClasses(score);
          return (
            <div
              key={cand.id}
              className="bg-white dark:bg-[#1E293B]/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <button
                    onClick={() => onInspectCandidate(cand.id)}
                    className="text-left group cursor-pointer"
                  >
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-[#00D4FF]">
                      {cand.fullName}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {cand.experienceYears} yrs · {cand.location}
                    </p>
                  </button>
                  <span className={`font-mono font-bold text-base tabular-nums ${scoreStyle.text}`}>{score}%</span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {cand.skills.slice(0, 5).join(' · ')}
                </p>

                <p className="text-[11px] text-slate-400">
                  Previous Stage: <span className="text-slate-200 font-medium">{pastApp?.stage || 'Archived'}</span> ·{' '}
                  {cand.previousCompanies.slice(0, 2).join(', ')}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => onInspectCandidate(cand.id)}
                  className="text-xs font-medium text-slate-500 dark:text-slate-300 hover:text-[#00D4FF] cursor-pointer"
                >
                  Inspect Profile
                </button>
                <button
                  onClick={() => handleRediscover(cand.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00D4FF]/15 border border-[#00D4FF]/40 text-[#00D4FF] text-xs font-semibold hover:bg-[#00D4FF]/25 cursor-pointer"
                >
                  {reengagedId === cand.id ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#14F195]" /> Shortlisted
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" /> Rediscover for Role
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type LeaderboardCategory =
  | 'match'
  | 'experience'
  | 'certifications'
  | 'interview'
  | 'recommended';

export function LeaderboardView({ onInspectCandidate }: { onInspectCandidate: (id: string) => void }) {
  const { candidates, feedback } = useATS();
  const [category, setCategory] = useState<LeaderboardCategory>('match');

  const ranked = useMemo(() => {
    const withRatings = candidates.map((c) => {
      const fbs = feedback.filter((f) => f.candidateId === c.id);
      const interviewRating = fbs.length
        ? Math.round(fbs.reduce((a, b) => a + b.overallScore, 0) / fbs.length)
        : 0;
      const compositeRecommendation = Math.round(
        c.matchScore * 0.5 + c.resumeScore * 0.25 + (interviewRating || c.matchScore) * 0.25
      );
      return { cand: c, interviewRating, compositeRecommendation };
    });

    return [...withRatings]
      .sort((a, b) => {
        if (category === 'match') return b.cand.matchScore - a.cand.matchScore;
        if (category === 'experience') return b.cand.experienceYears - a.cand.experienceYears;
        if (category === 'certifications') return b.cand.certifications.length - a.cand.certifications.length;
        if (category === 'interview') return b.interviewRating - a.interviewRating;
        return b.compositeRecommendation - a.compositeRecommendation;
      })
      .slice(0, 15);
  }, [candidates, feedback, category]);

  const categories: { id: LeaderboardCategory; label: string }[] = [
    { id: 'match', label: 'Highest Match Score' },
    { id: 'experience', label: 'Most Experienced' },
    { id: 'certifications', label: 'Most Certifications' },
    { id: 'interview', label: 'Highest Interview Rating' },
    { id: 'recommended', label: 'Top Recommended Candidate' },
  ];

  const topWinner = ranked[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Candidate Leaderboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Top-performing talent ranked across match scores, experience tenure, certifications, and interview evaluations.
        </p>
      </div>

      {/* Category Switcher */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-slate-200/70 dark:bg-[#1E293B] rounded-xl w-fit border border-slate-200 dark:border-slate-800">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              category === cat.id
                ? 'bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Top #1 Spotlight */}
      {topWinner && (
        <div className="bg-gradient-to-r from-[#1E293B] to-[#0F172A] border border-[#00D4FF]/40 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#00D4FF]/15 border border-[#00D4FF]/40 flex items-center justify-center text-[#00D4FF]">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#00D4FF]">
                #1 Ranked · {categories.find((c) => c.id === category)?.label}
              </p>
              <button
                onClick={() => onInspectCandidate(topWinner.cand.id)}
                className="text-xl font-bold text-white hover:text-[#00D4FF] cursor-pointer"
              >
                {topWinner.cand.fullName}
              </button>
              <p className="text-xs text-slate-400 mt-0.5">
                {topWinner.cand.skills.slice(0, 5).join(' · ')} · {topWinner.cand.experienceYears} years experience
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-right">
            <div>
              <p className="text-xs text-slate-400">Match</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-[#14F195]">{topWinner.cand.matchScore}%</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Certifications</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-white">
                {topWinner.cand.certifications.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Interview</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-[#00D4FF]">
                {topWinner.interviewRating ? `${topWinner.interviewRating}/100` : 'Pending'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Ranked List */}
      <div className="bg-white dark:bg-[#1E293B]/90 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {ranked.map(({ cand, interviewRating, compositeRecommendation }, idx) => (
            <div
              key={cand.id}
              onClick={() => onInspectCandidate(cand.id)}
              className="p-4 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer"
            >
              <div className="flex items-center gap-4 min-w-0">
                <span className="w-8 font-mono tabular-nums text-sm font-bold text-slate-400">
                  #{String(idx + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{cand.fullName}</p>
                    {cand.isFavorite && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-400 truncate">
                    {cand.skills.slice(0, 4).join(' · ')} · {cand.location}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 text-xs font-mono tabular-nums shrink-0">
                <span className="text-slate-400">
                  <Briefcase className="w-3.5 h-3.5 inline mr-1" />
                  {cand.experienceYears} yrs
                </span>
                <span className="text-slate-400">
                  <Award className="w-3.5 h-3.5 inline mr-1 text-[#6C63FF]" />
                  {cand.certifications.length} certs
                </span>
                <span className="text-slate-300">
                  Int: {interviewRating ? `${interviewRating}/100` : '—'}
                </span>
                <span className={`text-sm font-bold ${getScoreColorClasses(cand.matchScore).text}`}>
                  {category === 'recommended' ? `${compositeRecommendation}%` : `${cand.matchScore}%`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
